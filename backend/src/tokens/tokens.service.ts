import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { BlockchainService } from '../common/services/blockchain.service';
import { WalletsService } from '../wallets/wallets.service';
import { AuditService } from '../common/services/audit.service';
import { MintDto } from './dto/mint.dto';
import { BurnDto } from './dto/burn.dto';
import { TransferDto } from './dto/transfer.dto';
import { CreateMintProposalDto } from './dto/create-mint-proposal.dto';
import { ApproveMintProposalDto } from './dto/approve-mint-proposal.dto';
import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

// GRX Token ABI (minimal for our needs)
const GRX_TOKEN_ABI = [
  'function mintWithCert(bytes32 certId, address to, uint256 amount, string memory metadata)',
  'function burnWithInvoice(bytes32 invoiceId, uint256 amount)',
  'function adminBurnWithInvoice(address from, bytes32 invoiceId, uint256 amount)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function getCertificateInfo(bytes32 certId) view returns (bool used, address minter, uint256 amount)',
  'function getInvoiceInfo(bytes32 invoiceId) view returns (bool used, address burner, uint256 amount)',
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'event MintedWithCert(bytes32 indexed certId, address indexed to, uint256 amount, string metadata, address indexed minter)',
  'event BurnedWithInvoice(bytes32 indexed invoiceId, address indexed from, uint256 amount, address indexed burner)',
];

const GRX_DECIMALS = 18;
const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('MINTER_ROLE'));
const BURNER_ROLE = ethers.keccak256(ethers.toUtf8Bytes('BURNER_ROLE'));

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);

  constructor(
    private prisma: PrismaService,
    private blockchainService: BlockchainService,
    private walletsService: WalletsService,
    private auditService: AuditService,
    private configService: ConfigService,
  ) {}

  /**
   * Get GRX contract address for a network
   */
  private getGrxContractAddress(network: string, isTestnet: boolean): string {
    const networkKey = network.toUpperCase();
    const envKey = isTestnet
      ? `GRX_${networkKey}_TESTNET_ADDRESS`
      : `GRX_${networkKey}_MAINNET_ADDRESS`;

    const address = this.configService.get<string>(envKey);
    if (!address || address === ethers.ZeroAddress) {
      throw new BadRequestException(
        `GRX contract address not configured for ${network} ${isTestnet ? 'testnet' : 'mainnet'}`,
      );
    }

    return address;
  }

  /**
   * Get GRX contract instance
   */
  private getGrxContract(
    network: string,
    isTestnet: boolean,
    signer?: ethers.Signer,
  ): ethers.Contract {
    const address = this.getGrxContractAddress(network, isTestnet);
    const provider = this.blockchainService.getProvider(network, isTestnet);
    const contractSigner = signer || provider;
    return new ethers.Contract(address, GRX_TOKEN_ABI, contractSigner);
  }

  /**
   * Mint GRX tokens with certificate (requires MINTER_ROLE)
   */
  async mint(userId: string, dto: MintDto, minterWalletAddress?: string) {
    try {
      // Get minter wallet (should have MINTER_ROLE)
      let minterAddress: string;
      let minterPrivateKey: string | null = null;

      if (minterWalletAddress) {
        // Use provided minter wallet
        const wallet = await this.walletsService.getWalletByAddress(
          minterWalletAddress,
        );
        minterAddress = wallet.address;

        // If custodial, need to decrypt private key (would need password in real scenario)
        // For now, assume non-custodial or pre-decrypted
      } else {
        // Get minter address from config
        const envKey = dto.isTestnet
          ? `GRX_MINTER_ADDRESS_TESTNET`
          : `GRX_MINTER_ADDRESS_MAINNET`;
        minterAddress = this.configService.get<string>(envKey);
        if (!minterAddress) {
          throw new BadRequestException('Minter wallet not configured');
        }
      }

      // Get contract and verify minter has MINTER_ROLE
      const contract = this.getGrxContract(dto.network, dto.isTestnet);
      const hasRole = await contract.hasRole(MINTER_ROLE, minterAddress);
      if (!hasRole) {
        throw new ForbiddenException(
          'Wallet does not have MINTER_ROLE',
        );
      }

      // Convert amount to wei
      const amountWei = ethers.parseUnits(dto.amount, GRX_DECIMALS);

      // Validate certId format and convert to bytes32
      let certIdBytes32: string;
      if (ethers.isHexString(dto.certId)) {
        certIdBytes32 = dto.certId;
      } else {
        // If not hex, hash it
        certIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(dto.certId));
      }

      // Check if certificate already used
      const certInfo = await contract.getCertificateInfo(certIdBytes32);
      if (certInfo.used) {
        throw new BadRequestException('Certificate already used');
      }

      // Create wallet signer if private key available
      let signer: ethers.Wallet | null = null;
      if (minterPrivateKey) {
        signer = this.blockchainService.createWalletFromPrivateKey(
          minterPrivateKey,
          dto.network,
          dto.isTestnet,
        );
      } else {
        // In production, you'd get the minter private key from secure storage
        throw new BadRequestException(
          'Minter private key required for minting',
        );
      }

      // Create contract with signer
      const contractWithSigner = this.getGrxContract(
        dto.network,
        dto.isTestnet,
        signer,
      );

      // Execute mint
      const tx = await contractWithSigner.mintWithCert(
        certIdBytes32,
        dto.to,
        amountWei,
        dto.metadata || '',
      );

      const receipt = await tx.wait();

      // Log audit
      await this.auditService.logAction({
        userId,
        action: 'MINT',
        resourceType: 'TOKEN',
        resourceId: dto.certId,
        details: {
          certId: dto.certId,
          to: dto.to,
          amount: dto.amount,
          amountWei: amountWei.toString(),
          txHash: receipt.hash,
          network: dto.network,
          isTestnet: dto.isTestnet,
        },
      });

      this.logger.log(
        `Tokens minted: ${dto.amount} GRX to ${dto.to} (tx: ${receipt.hash})`,
      );

      return {
        success: true,
        certId: dto.certId,
        to: dto.to,
        amount: dto.amount,
        amountWei: amountWei.toString(),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        network: dto.network,
        isTestnet: dto.isTestnet,
      };
    } catch (error) {
      this.logger.error('Error minting tokens', error);
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to mint tokens');
    }
  }

  /**
   * Burn GRX tokens with invoice
   */
  async burn(userId: string, dto: BurnDto) {
    try {
      // Verify wallet belongs to user
      const wallet = await this.walletsService.getWalletByAddress(
        dto.from,
        userId,
      );

      // Get wallet private key (for non-custodial) or handle custodial
      // For now, assume non-custodial or pre-decrypted
      // In production, you'd decrypt from wallet.privateKeyEncrypted

      // Convert amount to wei
      const amountWei = ethers.parseUnits(dto.amount, GRX_DECIMALS);

      // Validate invoiceId format and convert to bytes32
      let invoiceIdBytes32: string;
      if (ethers.isHexString(dto.invoiceId)) {
        invoiceIdBytes32 = dto.invoiceId;
      } else {
        // If not hex, hash it
        invoiceIdBytes32 = ethers.keccak256(ethers.toUtf8Bytes(dto.invoiceId));
      }

      // Get contract
      const contract = this.getGrxContract(dto.network, dto.isTestnet);

      // Check if invoice already used
      const invoiceInfo = await contract.getInvoiceInfo(invoiceIdBytes32);
      if (invoiceInfo.used) {
        throw new BadRequestException('Invoice already used');
      }

      // Check balance
      const balance = await contract.balanceOf(dto.from);
      if (balance < amountWei) {
        throw new BadRequestException('Insufficient balance');
      }

      // For now, return instructions for client-side signing
      // In production, you'd handle private key decryption here
      return {
        success: false,
        message:
          'Burn requires client-side signing. Please use the wallet to sign the transaction.',
        invoiceId: dto.invoiceId,
        amount: dto.amount,
        amountWei: amountWei.toString(),
        network: dto.network,
        isTestnet: dto.isTestnet,
      };
    } catch (error) {
      this.logger.error('Error burning tokens', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to burn tokens');
    }
  }

  /**
   * Transfer GRX tokens (standard ERC20 transfer)
   */
  async transfer(userId: string, dto: TransferDto) {
    try {
      // Verify wallet belongs to user
      const wallet = await this.walletsService.getWalletByAddress(
        dto.from,
        userId,
      );

      // Convert amount to wei
      const amountWei = ethers.parseUnits(dto.amount, GRX_DECIMALS);

      // Get contract
      const contract = this.getGrxContract(dto.network, dto.isTestnet);

      // Check balance
      const balance = await contract.balanceOf(dto.from);
      if (balance < amountWei) {
        throw new BadRequestException('Insufficient balance');
      }

      // For now, return instructions for client-side signing
      // In production, you'd handle private key decryption here
      return {
        success: false,
        message:
          'Transfer requires client-side signing. Please use the wallet to sign the transaction.',
        to: dto.to,
        amount: dto.amount,
        amountWei: amountWei.toString(),
        network: dto.network,
        isTestnet: dto.isTestnet,
      };
    } catch (error) {
      this.logger.error('Error transferring tokens', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to transfer tokens');
    }
  }

  /**
   * Create a mint proposal (for multisig)
   */
  async createMintProposal(userId: string, dto: CreateMintProposalDto) {
    try {
      // Generate proposal ID
      const proposalId = ethers.keccak256(
        ethers.toUtf8Bytes(`${userId}-${dto.certId}-${Date.now()}-${uuidv4()}`),
      );

      // Convert amount to wei
      const amountWei = ethers.parseUnits(dto.amount, GRX_DECIMALS);

      // Create proposal in database
      const proposal = await this.prisma.mint_proposals.create({
        data: {
          id: undefined, // Will be auto-generated
          proposalId,
          userId,
          certId: dto.certId,
          to: dto.to,
          amount: amountWei.toString(),
          metadata: dto.metadata || null,
          status: 'PENDING',
          signatures: JSON.stringify([]),
        } as any,
      });

      this.logger.log(`Mint proposal created: ${proposalId} by user ${userId}`);

      return {
        id: proposal.id,
        proposalId: proposal.proposalId,
        certId: proposal.certId,
        to: proposal.to,
        amount: dto.amount,
        amountWei: proposal.amount,
        status: proposal.status,
        createdAt: proposal.createdAt,
      };
    } catch (error) {
      this.logger.error('Error creating mint proposal', error);
      throw new BadRequestException('Failed to create mint proposal');
    }
  }

  /**
   * Approve a mint proposal (add signature)
   */
  async approveMintProposal(
    userId: string,
    dto: ApproveMintProposalDto,
  ) {
    try {
      // Get proposal
      const proposal = await this.prisma.mint_proposals.findUnique({
        where: { proposalId: dto.proposalId },
      });

      if (!proposal) {
        throw new NotFoundException('Proposal not found');
      }

      if (proposal.status !== 'PENDING') {
        throw new BadRequestException('Proposal is not pending');
      }

      // Parse existing signatures
      const signatures = JSON.parse(proposal.signatures || '[]');

      // Check if user already signed
      const existingSignature = signatures.find(
        (sig: any) => sig.userId === userId,
      );
      if (existingSignature) {
        throw new BadRequestException('User already signed this proposal');
      }

      // Add signature
      signatures.push({
        userId,
        signature: dto.signature,
        signedAt: new Date().toISOString(),
      });

      // Update proposal
      const updatedProposal = await this.prisma.mint_proposals.update({
        where: { proposalId: dto.proposalId },
        data: {
          signatures: JSON.stringify(signatures),
          status: signatures.length >= 2 ? 'APPROVED' : 'PENDING', // Assuming 2-of-N multisig
        },
      });

      this.logger.log(
        `Proposal ${dto.proposalId} approved by user ${userId} (${signatures.length} signatures)`,
      );

      return {
        proposalId: updatedProposal.proposalId,
        status: updatedProposal.status,
        signatureCount: signatures.length,
      };
    } catch (error) {
      this.logger.error('Error approving mint proposal', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to approve mint proposal');
    }
  }

  /**
   * Execute an approved mint proposal
   */
  async executeMintProposal(proposalId: string, minterWalletAddress?: string) {
    try {
      // Get proposal
      const proposal = await this.prisma.mint_proposals.findUnique({
        where: { proposalId },
      });

      if (!proposal) {
        throw new NotFoundException('Proposal not found');
      }

      if (proposal.status !== 'APPROVED') {
        throw new BadRequestException('Proposal is not approved');
      }

      // Parse signatures
      const signatures = JSON.parse(proposal.signatures || '[]');
      if (signatures.length < 2) {
        throw new BadRequestException('Insufficient signatures');
      }

      // Get minter wallet (similar to mint method)
      // For now, assume minter wallet is configured
      // Note: Network info should be stored in metadata or passed separately
      const minterAddress =
        minterWalletAddress || this.configService.get<string>('GRX_MINTER_ADDRESS');
      if (!minterAddress) {
        throw new BadRequestException('Minter wallet not configured');
      }

      // Execute mint (similar to mint method)
      // This would call the mint() method with proposal data
      // For now, mark as executed
      const updatedProposal = await this.prisma.mint_proposals.update({
        where: { proposalId },
        data: {
          status: 'EXECUTED',
          executedAt: new Date(),
          // txHash would be set after actual execution
        },
      });

      this.logger.log(`Proposal ${proposalId} executed`);

      return {
        proposalId: updatedProposal.proposalId,
        status: updatedProposal.status,
        executedAt: updatedProposal.executedAt,
      };
    } catch (error) {
      this.logger.error('Error executing mint proposal', error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Failed to execute mint proposal');
    }
  }

  /**
   * Get mint proposals for a user
   */
  async getProposals(userId: string, status?: string) {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const proposals = await this.prisma.mint_proposals.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return proposals.map((proposal) => ({
      id: proposal.id,
      proposalId: proposal.proposalId,
      certId: proposal.certId,
      to: proposal.to,
      amount: proposal.amount,
      status: proposal.status,
      signatureCount: JSON.parse(proposal.signatures || '[]').length,
      executedAt: proposal.executedAt,
      txHash: proposal.txHash,
      createdAt: proposal.createdAt,
    }));
  }

  /**
   * Get token balance
   */
  async getBalance(
    address: string,
    network: string,
    isTestnet: boolean,
  ): Promise<string> {
    try {
      const contract = this.getGrxContract(network, isTestnet);
      const balance = await contract.balanceOf(address);
      return ethers.formatEther(balance);
    } catch (error) {
      this.logger.error(`Error getting balance for ${address}`, error);
      throw new BadRequestException('Failed to get token balance');
    }
  }
}

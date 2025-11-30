import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import { BlockchainService } from '../common/services/blockchain.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ImportWalletDto } from './dto/import-wallet.dto';
import { GetBalanceDto } from './dto/get-balance.dto';
import { ethers } from 'ethers';
import * as bip39 from 'bip39';

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);
  private readonly DERIVATION_PATH = "m/44'/60'/0'/0/0";

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private blockchainService: BlockchainService,
  ) {}

  /**
   * Create a new wallet
   */
  async createWallet(userId: string, dto: CreateWalletDto) {
    try {
      let wallet: ethers.HDNodeWallet | ethers.Wallet;
      let mnemonic: string | null = null;

      // Generate mnemonic and derive wallet
      mnemonic = bip39.generateMnemonic(128); // 12 words
      const seed = await bip39.mnemonicToSeed(mnemonic);
      const hdNode = ethers.HDNodeWallet.fromSeed(seed);
      wallet = hdNode.derivePath(this.DERIVATION_PATH);

      const address = wallet.address;
      const privateKey = wallet.privateKey;

      // Encrypt private key if custodial
      let privateKeyEncrypted: string | null = null;
      if (dto.isCustodial) {
        if (!dto.password) {
          throw new BadRequestException(
            'Password is required for custodial wallets',
          );
        }
        privateKeyEncrypted = this.encryptionService.encrypt(
          privateKey,
          dto.password,
        );
      }

      // Check if wallet address already exists
      const existingWallet = await this.prisma.wallet.findUnique({
        where: { address },
      });

      if (existingWallet) {
        throw new BadRequestException('Wallet address already exists');
      }

      // Create wallet in database
      const dbWallet = await this.prisma.wallet.create({
        data: {
          userId,
          address,
          isCustodial: dto.isCustodial,
          privateKeyEncrypted,
          network: dto.network,
          isTestnet: dto.isTestnet,
        },
      });

      this.logger.log(`Wallet created: ${address} for user ${userId}`);

      return {
        id: dbWallet.id,
        address: dbWallet.address,
        network: dbWallet.network,
        isTestnet: dbWallet.isTestnet,
        isCustodial: dbWallet.isCustodial,
        mnemonic: dto.isCustodial ? null : mnemonic, // Only return mnemonic for non-custodial
        createdAt: dbWallet.createdAt,
      };
    } catch (error) {
      this.logger.error('Error creating wallet', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create wallet');
    }
  }

  /**
   * Import wallet from private key or mnemonic
   */
  async importWallet(userId: string, dto: ImportWalletDto) {
    try {
      let wallet: ethers.Wallet | ethers.HDNodeWallet;
      let address: string;
      let privateKey: string;

      // Check if it's a mnemonic phrase (12 or 24 words)
      const words = dto.privateKey.trim().split(/\s+/);
      const isMnemonic = words.length === 12 || words.length === 24;

      if (isMnemonic) {
        // Validate mnemonic
        if (!bip39.validateMnemonic(dto.privateKey.trim())) {
          throw new BadRequestException('Invalid mnemonic phrase');
        }

        // Derive wallet from mnemonic
        const seed = await bip39.mnemonicToSeed(dto.privateKey.trim());
        const hdNode = ethers.HDNodeWallet.fromSeed(seed);
        wallet = hdNode.derivePath(this.DERIVATION_PATH);
        address = wallet.address;
        privateKey = wallet.privateKey;
      } else {
        // Import from private key
        try {
          wallet = new ethers.Wallet(dto.privateKey);
          address = wallet.address;
          privateKey = wallet.privateKey;
        } catch (error) {
          throw new BadRequestException('Invalid private key');
        }
      }

      // Encrypt private key if custodial
      let privateKeyEncrypted: string | null = null;
      if (dto.isCustodial) {
        if (!dto.password) {
          throw new BadRequestException(
            'Password is required for custodial wallets',
          );
        }
        privateKeyEncrypted = this.encryptionService.encrypt(
          privateKey,
          dto.password,
        );
      }

      // Check if wallet already exists
      const existingWallet = await this.prisma.wallet.findUnique({
        where: { address },
      });

      if (existingWallet) {
        if (existingWallet.userId === userId) {
          // Wallet already belongs to this user
          return {
            id: existingWallet.id,
            address: existingWallet.address,
            network: existingWallet.network,
            isTestnet: existingWallet.isTestnet,
            isCustodial: existingWallet.isCustodial,
            createdAt: existingWallet.createdAt,
            message: 'Wallet already imported',
          };
        } else {
          throw new BadRequestException('Wallet address already exists');
        }
      }

      // Create wallet in database
      const dbWallet = await this.prisma.wallet.create({
        data: {
          userId,
          address,
          isCustodial: dto.isCustodial,
          privateKeyEncrypted,
          network: dto.network,
          isTestnet: dto.isTestnet,
        },
      });

      this.logger.log(`Wallet imported: ${address} for user ${userId}`);

      return {
        id: dbWallet.id,
        address: dbWallet.address,
        network: dbWallet.network,
        isTestnet: dbWallet.isTestnet,
        isCustodial: dbWallet.isCustodial,
        createdAt: dbWallet.createdAt,
      };
    } catch (error) {
      this.logger.error('Error importing wallet', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to import wallet');
    }
  }

  /**
   * Get wallet by address
   */
  async getWalletByAddress(address: string, userId?: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { address },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // If userId provided, verify ownership
    if (userId && wallet.userId !== userId) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      id: wallet.id,
      address: wallet.address,
      network: wallet.network,
      isTestnet: wallet.isTestnet,
      isCustodial: wallet.isCustodial,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    };
  }

  /**
   * Get all wallets for a user
   */
  async getWalletsByUserId(userId: string) {
    const wallets = await this.prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return wallets.map((wallet) => ({
      id: wallet.id,
      address: wallet.address,
      network: wallet.network,
      isTestnet: wallet.isTestnet,
      isCustodial: wallet.isCustodial,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
    }));
  }

  /**
   * Get balance for a wallet
   */
  async getBalance(
    address: string,
    dto: GetBalanceDto,
    userId?: string,
  ): Promise<{
    address: string;
    nativeBalance: string;
    tokenBalance?: string;
    tokenAddress?: string;
  }> {
    // Verify wallet exists and belongs to user if userId provided
    const wallet = await this.getWalletByAddress(address, userId);

    try {
      // Get native balance
      const nativeBalance = await this.blockchainService.getBalance(
        address,
        wallet.network,
        wallet.isTestnet,
      );

      const result: {
        address: string;
        nativeBalance: string;
        tokenBalance?: string;
        tokenAddress?: string;
      } = {
        address,
        nativeBalance: ethers.formatEther(nativeBalance),
      };

      // Get token balance if token address provided
      if (dto.tokenAddress) {
        const tokenBalance = await this.blockchainService.getTokenBalance(
          dto.tokenAddress,
          address,
          wallet.network,
          wallet.isTestnet,
        );
        result.tokenBalance = ethers.formatEther(tokenBalance);
        result.tokenAddress = dto.tokenAddress;
      }

      return result;
    } catch (error) {
      this.logger.error(`Error getting balance for ${address}`, error);
      throw new BadRequestException('Failed to get balance');
    }
  }

  /**
   * Decrypt private key for custodial wallet (requires password)
   */
  async decryptPrivateKey(
    address: string,
    password: string,
    userId: string,
  ): Promise<{ privateKey: string }> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { address },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.userId !== userId) {
      throw new NotFoundException('Wallet not found');
    }

    if (!wallet.isCustodial) {
      throw new BadRequestException('Wallet is not custodial');
    }

    if (!wallet.privateKeyEncrypted) {
      throw new BadRequestException('Private key not found');
    }

    try {
      const privateKey = this.encryptionService.decrypt(
        wallet.privateKeyEncrypted,
        password,
      );

      return { privateKey };
    } catch (error) {
      this.logger.error('Error decrypting private key', error);
      throw new BadRequestException('Invalid password');
    }
  }

  /**
   * Delete wallet
   */
  async deleteWallet(address: string, userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { address },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.userId !== userId) {
      throw new NotFoundException('Wallet not found');
    }

    await this.prisma.wallet.delete({
      where: { address },
    });

    this.logger.log(`Wallet deleted: ${address} by user ${userId}`);

    return { message: 'Wallet deleted successfully' };
  }
}

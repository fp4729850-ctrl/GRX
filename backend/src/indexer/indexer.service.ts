import { Injectable, OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import { PrismaService } from '../common/prisma/prisma.service';
import { ClaimMatrixService } from '../claim-matrix/claim-matrix.service';

const GRX_DECIMALS = 6;
const TRANSFER_EVENT_ABI = [
  'event Transfer(address indexed from, address indexed to, uint256 value)',
];

@Injectable()
export class IndexerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IndexerService.name);
  private provider: ethers.JsonRpcProvider | ethers.WebSocketProvider | null = null;
  private contract: ethers.Contract | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly claimMatrixService: ClaimMatrixService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing GRX Blockchain Indexer...');
    this.setupListener();
  }

  onModuleDestroy() {
    if (this.contract) {
      this.contract.removeAllListeners('Transfer');
    }
  }

  private setupListener() {
    try {
      const rpcUrl = this.configService.get<string>('EXPO_PUBLIC_GRX_RPC_URL') || 'http://localhost:26657';
      const contractAddress = this.configService.get<string>('GRX_CONTRACT_ADDRESS');

      if (!contractAddress) {
        this.logger.warn('GRX_CONTRACT_ADDRESS is not set. Indexer will not listen for events.');
        return;
      }

      if (rpcUrl.startsWith('ws')) {
        this.provider = new ethers.WebSocketProvider(rpcUrl);
      } else {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
      }

      this.contract = new ethers.Contract(contractAddress, TRANSFER_EVENT_ABI, this.provider);

      this.logger.log(`Listening for Transfer events on GRX contract: ${contractAddress}`);

      this.contract.on('Transfer', async (from: string, to: string, value: bigint, event: any) => {
        await this.handleTransferEvent(from, to, value, event);
      });

    } catch (error) {
      this.logger.error('Failed to setup GRX indexer listener', error);
    }
  }

  private async handleTransferEvent(from: string, to: string, value: bigint, event: any) {
    try {
      // Ignore minting (from zero address) or burning (to zero address)
      if (from === ethers.ZeroAddress || to === ethers.ZeroAddress) {
        return;
      }

      // Convert value from wei to decimal
      const amount = parseFloat(ethers.formatUnits(value, GRX_DECIMALS));

      this.logger.log(`Transfer event detected: ${from} -> ${to} for ${amount} GRX`);

      // Find countries mapped to these addresses
      const fromMapping = await this.prisma.wallet_mappings.findUnique({
        where: { address: from },
      });

      const toMapping = await this.prisma.wallet_mappings.findUnique({
        where: { address: to },
      });

      if (!fromMapping || !toMapping) {
        this.logger.debug(`Skipping transfer: Unmapped wallets. From: ${fromMapping?.country || 'Unknown'}, To: ${toMapping?.country || 'Unknown'}`);
        return;
      }

      const fromCountry = fromMapping.country;
      const toCountry = toMapping.country;

      this.logger.log(`Applying ClaimMatrix transfer rule: ${fromCountry} -> ${toCountry} for ${amount} GRX`);
      
      // Apply the Matrix Transfer Logic
      await this.claimMatrixService.transfer(fromCountry, toCountry, amount);
      
      this.logger.log(`Successfully processed transfer in ClaimMatrix`);

    } catch (error) {
      this.logger.error(`Error processing transfer event`, error);
    }
  }
}

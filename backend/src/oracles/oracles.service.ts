import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { EncryptionService } from '../common/services/encryption.service';
import { BlockchainService } from '../common/services/blockchain.service';
import { CreateSnapshotDto, OracleSource } from './dto/create-snapshot.dto';
import axios from 'axios';
import { Decimal } from '@prisma/client/runtime/library';
import { ethers } from 'ethers';

@Injectable()
export class OraclesService {
  private readonly logger = new Logger(OraclesService.name);
  private readonly FALLBACK_FX_URL = 'https://open.er-api.com/v6/latest/USD';

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private blockchainService: BlockchainService,
    private configService: ConfigService,
  ) {}

  /**
   * Fetch gold price from LBMA (London Bullion Market Association)
   */
  private async fetchLBMAPrice(): Promise<number | null> {
    try {
      const apiKey = this.configService.get<string>('LBMA_API_KEY');
      const apiUrl = this.configService.get<string>('LBMA_API_URL') || 
        'https://www.lbma.org.uk/api/v1/prices';

      if (!apiKey) {
        this.logger.warn('LBMA API key not configured');
        return null;
      }

      const response = await axios.get(apiUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        timeout: 5000,
      });

      // Parse LBMA response (format may vary)
      const price = response.data?.price || response.data?.gold?.price;
      if (price) {
        // Convert from USD per ounce to USD per gram (1 oz = 31.1035 grams)
        return parseFloat(price) / 31.1035;
      }

      return null;
    } catch (error) {
      this.logger.error('Error fetching LBMA price', error);
      return null;
    }
  }

  /**
   * Fetch gold price from COMEX
   */
  private async fetchCOMEXPrice(): Promise<number | null> {
    try {
      const apiKey = this.configService.get<string>('COMEX_API_KEY');
      const apiUrl = this.configService.get<string>('COMEX_API_URL') || 
        'https://www.cmegroup.com/api/v1/gold';

      if (!apiKey) {
        this.logger.warn('COMEX API key not configured');
        return null;
      }

      const response = await axios.get(apiUrl, {
        headers: { 'X-API-Key': apiKey },
        timeout: 5000,
      });

      const price = response.data?.price || response.data?.last;
      if (price) {
        // Convert from USD per ounce to USD per gram
        return parseFloat(price) / 31.1035;
      }

      return null;
    } catch (error) {
      this.logger.error('Error fetching COMEX price', error);
      return null;
    }
  }

  /**
   * Fetch gold price from MCX (Multi Commodity Exchange)
   */
  private async fetchMCXPrice(): Promise<number | null> {
    try {
      const apiKey = this.configService.get<string>('MCX_API_KEY');
      const apiUrl = this.configService.get<string>('MCX_API_URL') || 
        'https://www.mcxindia.com/api/v1/gold';

      if (!apiKey) {
        this.logger.warn('MCX API key not configured');
        return null;
      }

      const response = await axios.get(apiUrl, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        timeout: 5000,
      });

      // MCX prices are typically in INR, need to convert to USD
      const priceINR = response.data?.price || response.data?.last;
      if (priceINR) {
        // Get USD/INR rate
        const fxRates = await this.fetchFxRates();
        const usdInr = fxRates.INR || 83.5; // fallback
        const priceUSD = parseFloat(priceINR) / usdInr;
        // Convert from USD per 10 grams to USD per gram
        return priceUSD / 10;
      }

      return null;
    } catch (error) {
      this.logger.error('Error fetching MCX price', error);
      return null;
    }
  }

  /**
   * Fetch FX rates (INR, AED, RUB, CNY)
   */
  async fetchFxRates(): Promise<Record<string, number>> {
    try {
      const response = await axios.get(this.FALLBACK_FX_URL, {
        timeout: 5000,
      });

      const rates = response.data?.rates || {};
      return {
        INR: rates.INR || 83.5,
        AED: rates.AED || 3.67,
        RUB: rates.RUB || 92.0,
        CNY: rates.CNY || 7.25,
      };
    } catch (error) {
      this.logger.error('Error fetching FX rates, using fallback', error);
      // Fallback rates
      return {
        INR: 83.5,
        AED: 3.67,
        RUB: 92.0,
        CNY: 7.25,
      };
    }
  }

  /**
   * Aggregate gold prices from multiple sources
   */
  private async aggregateGoldPrices(): Promise<number> {
    const prices: number[] = [];

    const [lbmaPrice, comexPrice, mcxPrice] = await Promise.all([
      this.fetchLBMAPrice(),
      this.fetchCOMEXPrice(),
      this.fetchMCXPrice(),
    ]);

    if (lbmaPrice) prices.push(lbmaPrice);
    if (comexPrice) prices.push(comexPrice);
    if (mcxPrice) prices.push(mcxPrice);

    if (prices.length === 0) {
      // Fallback price if all sources fail
      this.logger.warn('All price sources failed, using fallback');
      return 62.5; // Fallback price in USD per gram
    }

    // Return average of available prices
    const sum = prices.reduce((a, b) => a + b, 0);
    return sum / prices.length;
  }

  /**
   * Create oracle snapshot
   */
  async createSnapshot(dto: CreateSnapshotDto, blockNumber?: bigint) {
    try {
      // Validate FX rates JSON
      let fxRatesObj: Record<string, number>;
      try {
        fxRatesObj = JSON.parse(dto.fxRates);
      } catch (error) {
        throw new Error('Invalid FX rates JSON');
      }

      // Generate signature (hash of snapshot data)
      const snapshotData = JSON.stringify({
        goldPriceUSD: dto.goldPriceUSD,
        fxRates: fxRatesObj,
        source: dto.source,
        timestamp: new Date().toISOString(),
      });
      const signature = this.encryptionService.hash(snapshotData);

      // Create snapshot
      const snapshot = await this.prisma.oracle_snapshots.create({
        data: {
          timestamp: new Date(),
          blockNumber: blockNumber || (dto.blockNumber ? BigInt(dto.blockNumber) : null),
          goldPriceUSD: new Decimal(dto.goldPriceUSD),
          fxRates: dto.fxRates,
          signature,
          source: dto.source,
        },
      });

      this.logger.log(`Oracle snapshot created: ${snapshot.id} from ${dto.source}`);

      return {
        id: snapshot.id,
        timestamp: snapshot.timestamp,
        goldPriceUSD: snapshot.goldPriceUSD.toString(),
        fxRates: fxRatesObj,
        source: snapshot.source,
        signature: snapshot.signature,
        blockNumber: snapshot.blockNumber?.toString(),
        createdAt: snapshot.createdAt,
      };
    } catch (error) {
      this.logger.error('Error creating snapshot', error);
      throw error;
    }
  }

  /**
   * Fetch prices and create snapshot automatically
   */
  async fetchAndCreateSnapshot(source: OracleSource = OracleSource.AGGREGATE) {
    try {
      let goldPriceUSD: number;

      if (source === OracleSource.AGGREGATE) {
        goldPriceUSD = await this.aggregateGoldPrices();
      } else if (source === OracleSource.LBMA) {
        goldPriceUSD = (await this.fetchLBMAPrice()) || 62.5;
      } else if (source === OracleSource.COMEX) {
        goldPriceUSD = (await this.fetchCOMEXPrice()) || 62.5;
      } else if (source === OracleSource.MCX) {
        goldPriceUSD = (await this.fetchMCXPrice()) || 62.5;
      } else {
        goldPriceUSD = 62.5; // Fallback
      }

      const fxRates = await this.fetchFxRates();

      return this.createSnapshot({
        goldPriceUSD,
        fxRates: JSON.stringify(fxRates),
        source,
      });
    } catch (error) {
      this.logger.error('Error fetching and creating snapshot', error);
      throw error;
    }
  }

  /**
   * Get latest snapshot
   */
  async getLatestSnapshot() {
    const snapshot = await this.prisma.oracle_snapshots.findFirst({
      orderBy: { timestamp: 'desc' },
    });

    if (!snapshot) {
      return null;
    }

    return {
      id: snapshot.id,
      timestamp: snapshot.timestamp,
      goldPriceUSD: snapshot.goldPriceUSD.toString(),
      fxRates: JSON.parse(snapshot.fxRates),
      source: snapshot.source,
      signature: snapshot.signature,
      blockNumber: snapshot.blockNumber?.toString(),
      createdAt: snapshot.createdAt,
    };
  }

  /**
   * Get snapshots with pagination
   */
  async getSnapshots(limit: number = 50, offset: number = 0) {
    const [snapshots, total] = await Promise.all([
      this.prisma.oracle_snapshots.findMany({
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.oracle_snapshots.count(),
    ]);

    return {
      snapshots: snapshots.map((snapshot) => ({
        id: snapshot.id,
        timestamp: snapshot.timestamp,
        goldPriceUSD: snapshot.goldPriceUSD.toString(),
        fxRates: JSON.parse(snapshot.fxRates),
        source: snapshot.source,
        signature: snapshot.signature,
        blockNumber: snapshot.blockNumber?.toString(),
        createdAt: snapshot.createdAt,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  }

  /**
   * Scheduled job: Create snapshot every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async scheduledSnapshot() {
    this.logger.log('Running scheduled oracle snapshot creation');
    try {
      await this.fetchAndCreateSnapshot(OracleSource.AGGREGATE);
    } catch (error) {
      this.logger.error('Scheduled snapshot creation failed', error);
    }
  }
}

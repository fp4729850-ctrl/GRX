import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class WalletMappingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.wallet_mappings.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async saveMapping(country: string, address: string) {
    if (!country || !address) {
      throw new BadRequestException('Country and address are required');
    }

    return this.prisma.wallet_mappings.upsert({
      where: { address },
      update: { country },
      create: { country, address }
    });
  }

  async deleteMapping(address: string) {
    const mapping = await this.prisma.wallet_mappings.findUnique({
      where: { address }
    });
    
    if (!mapping) {
      throw new NotFoundException(`Mapping for address ${address} not found`);
    }
    
    return this.prisma.wallet_mappings.delete({
      where: { address }
    });
  }
}

import { Module } from '@nestjs/common';
import { WalletMappingsService } from './wallet-mappings.service';
import { WalletMappingsController } from './wallet-mappings.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WalletMappingsService],
  controllers: [WalletMappingsController]
})
export class WalletMappingsModule {}

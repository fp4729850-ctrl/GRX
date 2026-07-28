import { Module } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import { ClaimMatrixModule } from '../claim-matrix/claim-matrix.module';
import { PrismaModule } from '../common/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ClaimMatrixModule, PrismaModule, ConfigModule],
  providers: [IndexerService],
})
export class IndexerModule {}

import { Module } from '@nestjs/common';
import { ClaimMatrixService } from './claim-matrix.service';
import { ClaimMatrixController } from './claim-matrix.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ClaimMatrixService],
  controllers: [ClaimMatrixController],
  exports: [ClaimMatrixService]
})
export class ClaimMatrixModule {}

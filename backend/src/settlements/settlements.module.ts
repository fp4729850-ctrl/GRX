import { Module } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { SettlementsController } from './settlements.controller';
import { CommonModule } from '../common/common.module';
import { InvoicesModule } from '../invoices/invoices.module';
import { OraclesModule } from '../oracles/oracles.module';

@Module({
  imports: [CommonModule, InvoicesModule, OraclesModule],
  providers: [SettlementsService],
  controllers: [SettlementsController],
  exports: [SettlementsService],
})
export class SettlementsModule {}


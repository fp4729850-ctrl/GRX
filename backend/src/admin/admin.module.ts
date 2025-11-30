import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CommonModule } from '../common/common.module';
import { OraclesModule } from '../oracles/oracles.module';

@Module({
  imports: [CommonModule, OraclesModule],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}

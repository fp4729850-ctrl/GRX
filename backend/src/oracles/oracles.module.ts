import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OraclesService } from './oracles.service';
import { OraclesController } from './oracles.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule, ScheduleModule],
  providers: [OraclesService],
  controllers: [OraclesController],
  exports: [OraclesService],
})
export class OraclesModule {}

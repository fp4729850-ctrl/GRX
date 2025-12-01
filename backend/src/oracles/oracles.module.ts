import { Module } from '@nestjs/common';
import { OraclesService } from './oracles.service';
import { OraclesController } from './oracles.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [OraclesService],
  controllers: [OraclesController],
  exports: [OraclesService],
})
export class OraclesModule {}

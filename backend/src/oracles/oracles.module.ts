import { Module } from '@nestjs/common';
import { OraclesService } from './oracles.service';
import { OraclesController } from './oracles.controller';

@Module({
  providers: [OraclesService],
  controllers: [OraclesController],
  exports: [OraclesService],
})
export class OraclesModule {}



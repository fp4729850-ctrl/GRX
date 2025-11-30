import { Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { TokensController } from './tokens.controller';
import { CommonModule } from '../common/common.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [CommonModule, WalletsModule],
  providers: [TokensService],
  controllers: [TokensController],
  exports: [TokensService],
})
export class TokensModule {}

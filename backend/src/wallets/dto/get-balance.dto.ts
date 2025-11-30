import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetBalanceDto {
  @ApiPropertyOptional({ description: 'Token contract address (for ERC20 tokens)' })
  @IsOptional()
  @IsString()
  tokenAddress?: string;
}


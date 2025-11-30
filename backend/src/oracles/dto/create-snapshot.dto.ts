import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OracleSource {
  LBMA = 'LBMA',
  COMEX = 'COMEX',
  MCX = 'MCX',
  AGGREGATE = 'AGGREGATE',
}

export class CreateSnapshotDto {
  @ApiProperty({ description: 'Gold price in USD per gram', type: Number })
  @IsNotEmpty()
  @IsNumber()
  goldPriceUSD: number;

  @ApiProperty({ description: 'FX rates as JSON object', example: '{"INR": 83.5, "AED": 3.67, "RUB": 92.0, "CNY": 7.25}' })
  @IsNotEmpty()
  @IsString()
  fxRates: string;

  @ApiProperty({ description: 'Oracle source', enum: OracleSource })
  @IsNotEmpty()
  @IsEnum(OracleSource)
  source: OracleSource;

  @ApiPropertyOptional({ description: 'Block number (if on-chain)' })
  @IsOptional()
  @IsString()
  blockNumber?: string;
}


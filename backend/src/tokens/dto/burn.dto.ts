import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NetworkType } from '../../wallets/dto/create-wallet.dto';

export class BurnDto {
  @ApiProperty({ description: 'Invoice ID (bytes32 hash)' })
  @IsNotEmpty()
  @IsString()
  invoiceId: string;

  @ApiProperty({ description: 'Amount to burn (in GRX, will be converted to wei)' })
  @IsNotEmpty()
  @IsString()
  amount: string;

  @ApiProperty({ description: 'Network type', enum: NetworkType })
  @IsNotEmpty()
  @IsEnum(NetworkType)
  network: NetworkType;

  @ApiProperty({ description: 'Whether this is a testnet', default: true })
  @IsNotEmpty()
  isTestnet: boolean;

  @ApiProperty({ description: 'Wallet address to burn from' })
  @IsNotEmpty()
  @IsString()
  from: string;
}


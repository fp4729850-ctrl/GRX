import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NetworkType } from '../../wallets/dto/create-wallet.dto';

export class TransferDto {
  @ApiProperty({ description: 'Recipient wallet address' })
  @IsNotEmpty()
  @IsString()
  to: string;

  @ApiProperty({ description: 'Amount to transfer (in GRX, will be converted to wei)' })
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

  @ApiProperty({ description: 'Sender wallet address' })
  @IsNotEmpty()
  @IsString()
  from: string;
}


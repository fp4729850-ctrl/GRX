import { IsString, IsBoolean, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NetworkType } from './create-wallet.dto';

export class ImportWalletDto {
  @ApiProperty({ description: 'Private key to import' })
  @IsNotEmpty()
  @IsString()
  privateKey: string;

  @ApiProperty({ description: 'Network type', enum: NetworkType })
  @IsNotEmpty()
  @IsEnum(NetworkType)
  network: NetworkType;

  @ApiProperty({ description: 'Whether this is a testnet', default: true })
  @IsNotEmpty()
  @IsBoolean()
  isTestnet: boolean;

  @ApiProperty({ description: 'Whether this is a custodial wallet', default: false })
  @IsNotEmpty()
  @IsBoolean()
  isCustodial: boolean;

  @ApiProperty({ description: 'Password for encrypting private key (required for custodial)', required: false })
  @IsString()
  password?: string;
}


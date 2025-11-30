import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NetworkType } from '../../wallets/dto/create-wallet.dto';

export class CreateMintProposalDto {
  @ApiProperty({ description: 'Certificate ID (bytes32 hash)' })
  @IsNotEmpty()
  @IsString()
  certId: string;

  @ApiProperty({ description: 'Recipient wallet address' })
  @IsNotEmpty()
  @IsString()
  to: string;

  @ApiProperty({ description: 'Amount to mint (in GRX, will be converted to wei)' })
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

  @ApiPropertyOptional({ description: 'Optional metadata (IPFS hash or JSON)' })
  @IsOptional()
  @IsString()
  metadata?: string;
}


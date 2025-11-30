import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VaultPartner {
  MMTC_PAMP = 'MMTC_PAMP',
  AUGMONT = 'AUGMONT',
  SAFEGOLD = 'SAFEGOLD',
  DMCC = 'DMCC',
}

export class CreateCertificateDto {
  @ApiProperty({ description: 'Vault partner name', enum: VaultPartner })
  @IsNotEmpty()
  @IsEnum(VaultPartner)
  vaultPartner: VaultPartner;

  @ApiProperty({ description: 'Original certificate ID from vault' })
  @IsNotEmpty()
  @IsString()
  vaultCertId: string;

  @ApiProperty({ description: 'Certificate payload (JSON string)' })
  @IsNotEmpty()
  @IsString()
  payload: string;

  @ApiProperty({ description: 'Vault signature' })
  @IsNotEmpty()
  @IsString()
  signature: string;

  @ApiProperty({ description: 'Gold amount in grams' })
  @IsNotEmpty()
  @IsNumber()
  grams: number;
}


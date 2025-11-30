import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CertStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  MINTED = 'MINTED',
  REJECTED = 'REJECTED',
}

export class UpdateCertificateStatusDto {
  @ApiProperty({ description: 'New status', enum: CertStatus })
  @IsNotEmpty()
  @IsEnum(CertStatus)
  status: CertStatus;

  @ApiPropertyOptional({ description: 'Mint transaction hash (for MINTED status)' })
  @IsOptional()
  @IsString()
  mintTxHash?: string;

  @ApiPropertyOptional({ description: 'User ID who initiated mint (for MINTED status)' })
  @IsOptional()
  @IsString()
  mintedBy?: string;
}


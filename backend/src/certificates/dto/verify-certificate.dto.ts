import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyCertificateDto {
  @ApiProperty({ description: 'Certificate ID (bytes32 hash)' })
  @IsNotEmpty()
  @IsString()
  certId: string;

  @ApiPropertyOptional({ description: 'Re-verify signature (if true, re-validates signature)' })
  @IsOptional()
  reVerify?: boolean;
}


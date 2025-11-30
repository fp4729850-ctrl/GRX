import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { KycStatus } from '@prisma/client';

export class UpdateKycStatusDto {
  @ApiProperty({ description: 'KYC status', enum: KycStatus })
  @IsNotEmpty()
  @IsEnum(KycStatus)
  status: KycStatus;
}


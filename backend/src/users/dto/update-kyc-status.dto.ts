import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { users_kycStatus } from '@prisma/client';

export class UpdateKycStatusDto {
  @ApiProperty({ description: 'KYC status', enum: users_kycStatus })
  @IsNotEmpty()
  @IsEnum(users_kycStatus)
  status: users_kycStatus;
}


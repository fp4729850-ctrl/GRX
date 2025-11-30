import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DecryptPrivateKeyDto {
  @ApiProperty({ description: 'Password to decrypt the private key' })
  @IsNotEmpty()
  @IsString()
  password: string;
}


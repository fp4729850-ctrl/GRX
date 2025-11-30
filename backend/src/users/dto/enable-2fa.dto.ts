import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Enable2FADto {
  @ApiProperty({ description: 'TOTP code from authenticator app', minLength: 6, maxLength: 6 })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;
}

export class Disable2FADto {
  @ApiProperty({ description: 'TOTP code to verify before disabling', minLength: 6, maxLength: 6 })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;
}


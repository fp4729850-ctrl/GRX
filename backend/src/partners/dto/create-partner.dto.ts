import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePartnerDto {
  @ApiProperty({ description: 'Partner name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'API key' })
  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @ApiPropertyOptional({ description: 'Webhook URL' })
  @IsOptional()
  @IsString()
  webhookUrl?: string;

  @ApiPropertyOptional({ description: 'IP allowlist (JSON array)', example: '["192.168.1.1", "10.0.0.1"]' })
  @IsOptional()
  @IsString()
  ipAllowlist?: string;

  @ApiProperty({ description: 'Supported currencies (JSON array)', example: '["INR", "AED"]' })
  @IsNotEmpty()
  @IsString()
  supportedCurrencies: string;
}


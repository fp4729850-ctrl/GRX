import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum DocumentType {
  PASSPORT = 'PASSPORT',
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  NATIONAL_ID = 'NATIONAL_ID',
  AADHAAR = 'AADHAAR',
  PAN_CARD = 'PAN_CARD',
}

export class UploadKycDto {
  @ApiProperty({ description: 'Document type', enum: DocumentType })
  @IsNotEmpty()
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Document file name' })
  @IsNotEmpty()
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'MIME type of the document' })
  @IsNotEmpty()
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'SHA256 hash of the document' })
  @IsNotEmpty()
  @IsString()
  documentHash: string;
}


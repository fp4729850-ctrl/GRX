import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveMintProposalDto {
  @ApiProperty({ description: 'Proposal ID' })
  @IsNotEmpty()
  @IsString()
  proposalId: string;

  @ApiProperty({ description: 'Signature from the approver' })
  @IsNotEmpty()
  @IsString()
  signature: string;
}


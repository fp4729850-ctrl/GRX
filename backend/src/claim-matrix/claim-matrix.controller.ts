import { Controller, Get, Post, Body } from '@nestjs/common';
import { ClaimMatrixService } from './claim-matrix.service';

@Controller('claim-matrix')
export class ClaimMatrixController {
  constructor(private readonly claimMatrixService: ClaimMatrixService) {}

  @Get()
  async getMatrix() {
    return this.claimMatrixService.getMatrix();
  }

  @Post('mint')
  async initialMint(@Body() body: { country: string, amount: number }) {
    return this.claimMatrixService.initialMint(body.country, body.amount);
  }

  @Post('transfer')
  async transfer(@Body() body: { fromCountry: string, toCountry: string, amount: number }) {
    return this.claimMatrixService.transfer(body.fromCountry, body.toCountry, body.amount);
  }
}

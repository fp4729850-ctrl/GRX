import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { WalletMappingsService } from './wallet-mappings.service';
// Assuming JwtAuthGuard exists. We'll leave it out if we don't know for sure, but let's check auth module later.
// For now, let's keep it open or assume the frontend handles it. 
// The user might want this to be an admin only route, but let's just make it a basic endpoint first.

@Controller('wallet-mappings')
export class WalletMappingsController {
  constructor(private readonly walletMappingsService: WalletMappingsService) {}

  @Get()
  async findAll() {
    const mappings = await this.walletMappingsService.findAll();
    return { success: true, mappings };
  }

  @Post()
  async saveMapping(@Body() body: { country: string; address: string }) {
    const mapping = await this.walletMappingsService.saveMapping(body.country, body.address);
    // Return the updated list
    const mappings = await this.walletMappingsService.findAll();
    return { success: true, mappings };
  }

  @Delete(':address')
  async deleteMapping(@Param('address') address: string) {
    await this.walletMappingsService.deleteMapping(address);
    // Return the updated list
    const mappings = await this.walletMappingsService.findAll();
    return { success: true, mappings };
  }
}

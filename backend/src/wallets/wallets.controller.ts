import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { ImportWalletDto } from './dto/import-wallet.dto';
import { GetBalanceDto } from './dto/get-balance.dto';
import { DecryptPrivateKeyDto } from './dto/decrypt-private-key.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('wallets')
@Controller('wallets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new wallet' })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createWallet(
    @CurrentUser() user: any,
    @Body() dto: CreateWalletDto,
  ) {
    return this.walletsService.createWallet(user.sub || user.id, dto);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import an existing wallet' })
  @ApiResponse({ status: 201, description: 'Wallet imported successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async importWallet(
    @CurrentUser() user: any,
    @Body() dto: ImportWalletDto,
  ) {
    return this.walletsService.importWallet(user.sub || user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all wallets for the current user' })
  @ApiResponse({ status: 200, description: 'List of wallets' })
  async getWallets(@CurrentUser() user: any) {
    return this.walletsService.getWalletsByUserId(user.sub || user.id);
  }

  @Get(':address')
  @ApiOperation({ summary: 'Get wallet by address' })
  @ApiResponse({ status: 200, description: 'Wallet details' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getWallet(
    @Param('address') address: string,
    @CurrentUser() user: any,
  ) {
    return this.walletsService.getWalletByAddress(
      address,
      user.sub || user.id,
    );
  }

  @Get(':address/balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Wallet balance' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async getBalance(
    @Param('address') address: string,
    @Query() dto: GetBalanceDto,
    @CurrentUser() user: any,
  ) {
    return this.walletsService.getBalance(
      address,
      dto,
      user.sub || user.id,
    );
  }

  @Post(':address/decrypt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decrypt private key for custodial wallet' })
  @ApiResponse({ status: 200, description: 'Private key decrypted' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async decryptPrivateKey(
    @Param('address') address: string,
    @Body() dto: DecryptPrivateKeyDto,
    @CurrentUser() user: any,
  ) {
    return this.walletsService.decryptPrivateKey(
      address,
      dto.password,
      user.sub || user.id,
    );
  }

  @Delete(':address')
  @ApiOperation({ summary: 'Delete a wallet' })
  @ApiResponse({ status: 200, description: 'Wallet deleted successfully' })
  @ApiResponse({ status: 404, description: 'Wallet not found' })
  async deleteWallet(
    @Param('address') address: string,
    @CurrentUser() user: any,
  ) {
    return this.walletsService.deleteWallet(address, user.sub || user.id);
  }
}

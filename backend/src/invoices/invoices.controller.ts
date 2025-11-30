import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { RedeemInvoiceDto } from './dto/redeem-invoice.dto';
import { SettleInvoiceDto } from './dto/settle-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('invoices')
@Controller('invoice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create invoice after burn transaction' })
  @ApiResponse({ status: 201, description: 'Invoice created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createInvoice(
    @CurrentUser() user: any,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.createInvoice(user.sub || user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get invoices for current user' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async getInvoices(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.invoicesService.getInvoicesByUserId(
      user.sub || user.id,
      status,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('by-recipient/:recipient')
  @ApiOperation({ summary: 'Get invoices by recipient address' })
  @ApiResponse({ status: 200, description: 'List of invoices' })
  async getInvoicesByRecipient(
    @Param('recipient') recipient: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.invoicesService.getInvoicesByRecipient(
      recipient,
      status,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get invoice statistics for current user' })
  @ApiResponse({ status: 200, description: 'Invoice statistics' })
  async getStats(@CurrentUser() user: any) {
    return this.invoicesService.getInvoiceStats(user.sub || user.id);
  }

  @Get(':invoiceId')
  @ApiOperation({ summary: 'Get invoice by invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice details' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: any,
  ) {
    return this.invoicesService.getInvoiceById(
      invoiceId,
      user.sub || user.id,
    );
  }

  @Post(':invoiceId/redeem')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem invoice' })
  @ApiResponse({ status: 200, description: 'Invoice redeemed' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async redeemInvoice(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: any,
    @Body() dto: Omit<RedeemInvoiceDto, 'invoiceId'>,
  ) {
    return this.invoicesService.redeemInvoice(user.sub || user.id, {
      invoiceId,
      ...dto,
    });
  }

  @Post(':invoiceId/settle')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Settle invoice (ADMIN/PARTNER only)' })
  @ApiResponse({ status: 200, description: 'Invoice settled' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async settleInvoice(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: any,
    @Body() dto: Omit<SettleInvoiceDto, 'invoiceId'>,
  ) {
    return this.invoicesService.settleInvoice(user.sub || user.id, {
      invoiceId,
      ...dto,
    });
  }

  @Patch(':invoiceId/status')
  @ApiOperation({ summary: 'Update invoice status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async updateStatus(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.invoicesService.updateInvoiceStatus(
      invoiceId,
      dto,
      user.sub || user.id,
    );
  }

  @Post('expire-old')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Expire old invoices (ADMIN only, for scheduled jobs)' })
  @ApiResponse({ status: 200, description: 'Old invoices expired' })
  async expireOldInvoices() {
    const count = await this.invoicesService.expireOldInvoices();
    return { expiredCount: count };
  }
}

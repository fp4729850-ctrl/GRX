import {
  Controller,
  Get,
  Post,
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
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { ProcessSettlementDto } from './dto/process-settlement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('settlements')
@Controller('settlements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @ApiOperation({ summary: 'Create settlement (ADMIN/PARTNER only)' })
  @ApiResponse({ status: 201, description: 'Settlement created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createSettlement(
    @CurrentUser() user: any,
    @Body() dto: CreateSettlementDto,
  ) {
    return this.settlementsService.createSettlement(user.sub || user.id, dto);
  }

  @Get(':settlementId')
  @ApiOperation({ summary: 'Get settlement by ID' })
  @ApiResponse({ status: 200, description: 'Settlement details' })
  @ApiResponse({ status: 404, description: 'Settlement not found' })
  async getSettlement(@Param('settlementId') settlementId: string) {
    return this.settlementsService.getSettlement(settlementId);
  }

  @Get('partner/:partnerId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @ApiOperation({ summary: 'Get settlements by partner (ADMIN/PARTNER only)' })
  @ApiResponse({ status: 200, description: 'List of settlements' })
  async getSettlementsByPartner(
    @Param('partnerId') partnerId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.settlementsService.getSettlementsByPartner(
      partnerId,
      status,
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post(':settlementId/process')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process settlement (ADMIN/PARTNER only)' })
  @ApiResponse({ status: 200, description: 'Settlement processed' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async processSettlement(
    @Param('settlementId') settlementId: string,
    @Body() dto: ProcessSettlementDto,
  ) {
    return this.settlementsService.processSettlement(settlementId, dto);
  }

  @Post(':settlementId/confirm')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm settlement (ADMIN/PARTNER only)' })
  @ApiResponse({ status: 200, description: 'Settlement confirmed' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async confirmSettlement(@Param('settlementId') settlementId: string) {
    return this.settlementsService.confirmSettlement(settlementId);
  }
}


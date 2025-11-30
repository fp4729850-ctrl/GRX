import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
} from '@nestjs/swagger';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('partners')
@Controller('partner')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create partner (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Partner created' })
  async createPartner(@Body() dto: CreatePartnerDto) {
    return this.partnersService.createPartner(dto);
  }

  @Post('authenticate')
  @Public()
  @ApiOperation({ summary: 'Authenticate partner by API key (Public)' })
  @ApiHeader({ name: 'X-API-Key', description: 'Partner API key' })
  @ApiResponse({ status: 200, description: 'Authentication successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async authenticate(
    @Headers('x-api-key') apiKey: string,
    @Ip() ipAddress: string,
  ) {
    if (!apiKey) {
      throw new Error('API key required');
    }
    return this.partnersService.authenticatePartner(apiKey, ipAddress);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all partners (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'List of partners' })
  async getPartners(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.partnersService.getPartners(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get(':partnerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get partner by ID (ADMIN/PARTNER only)' })
  @ApiResponse({ status: 200, description: 'Partner details' })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  async getPartner(@Param('partnerId') partnerId: string) {
    return this.partnersService.getPartner(partnerId);
  }
}

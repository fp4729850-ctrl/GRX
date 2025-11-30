import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OraclesService } from './oracles.service';
import { CreateSnapshotDto, OracleSource } from './dto/create-snapshot.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('oracles')
@Controller('oracle')
export class OraclesController {
  constructor(private readonly oraclesService: OraclesService) {}

  @Get('latest')
  @Public()
  @ApiOperation({ summary: 'Get latest oracle snapshot (Public)' })
  @ApiResponse({ status: 200, description: 'Latest snapshot' })
  async getLatest() {
    return this.oraclesService.getLatestSnapshot();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'PARTNER')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get oracle snapshots (ADMIN/PARTNER only)' })
  @ApiResponse({ status: 200, description: 'List of snapshots' })
  async getSnapshots(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.oraclesService.getSnapshots(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post('snapshot')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create oracle snapshot (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Snapshot created' })
  async createSnapshot(@Body() dto: CreateSnapshotDto) {
    return this.oraclesService.createSnapshot(dto);
  }

  @Post('fetch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Fetch prices and create snapshot (ADMIN only)' })
  @ApiResponse({ status: 201, description: 'Snapshot created' })
  async fetchAndCreate(
    @Query('source') source?: string,
  ) {
    const oracleSource = source ? (source as OracleSource) : OracleSource.AGGREGATE;
    return this.oraclesService.fetchAndCreateSnapshot(oracleSource);
  }
}

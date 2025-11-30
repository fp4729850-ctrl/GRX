import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users/stats')
  @ApiOperation({ summary: 'Get user statistics (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'User stats' })
  async getUserStats() {
    return this.adminService.getUserStats();
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction monitoring data (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Transaction data' })
  async getTransactions(@Query('limit') limit?: string) {
    return this.adminService.getTransactionMonitoring(
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get system logs (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'System logs' })
  async getLogs(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.adminService.getSystemLogs(
      limit ? parseInt(limit, 10) : 100,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('oracle/status')
  @ApiOperation({ summary: 'Get oracle status (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Oracle status' })
  async getOracleStatus() {
    return this.adminService.getOracleStatus();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get platform metrics (ADMIN only)' })
  @ApiResponse({ status: 200, description: 'Platform metrics' })
  async getMetrics() {
    return this.adminService.getPlatformMetrics();
  }
}

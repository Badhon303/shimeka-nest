import { Controller, Get } from '@nestjs/common';
import { AdminAuth } from '../../common/decorators';
import { DashboardService } from './dashboard.service';

@AdminAuth()
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  summary() {
    return this.dashboardService.summary();
  }

  @Get('recent-orders')
  recentOrders() {
    return this.dashboardService.recentOrders();
  }

  @Get('sales-series')
  salesSeries() {
    return this.dashboardService.salesSeries();
  }
}

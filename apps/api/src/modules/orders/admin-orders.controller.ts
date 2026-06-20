import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AdminAuth, CurrentUser } from '../../common/decorators';
import { OrdersService } from './orders.service';
import {
  AddOrderNoteDto,
  OrderFilterDto,
  UpdateDeliveryStatusDto,
  UpdatePaymentStatusDto,
} from './dto/orders.dto';

@AdminAuth()
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  list(@Query() query: OrderFilterDto) {
    return this.ordersService.listAll(query);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.ordersService.getOne(id);
  }

  // Dedicated status endpoints — both write to OrderStatusLog.
  @Patch(':id/payment-status')
  updatePayment(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.ordersService.updatePaymentStatus(id, dto, adminId);
  }

  @Patch(':id/delivery-status')
  updateDelivery(
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.ordersService.updateDeliveryStatus(id, dto, adminId);
  }

  @Post(':id/notes')
  addNote(
    @Param('id') id: string,
    @Body() dto: AddOrderNoteDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.ordersService.addNote(id, dto, adminId);
  }
}

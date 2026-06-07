import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtUser } from '../../common/current-user.decorator';
import { JwtAuthGuard } from '../../common/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(BigInt(user.sub), BigInt(dto.questId));
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/mock-pay')
  mockPay(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.ordersService.mockPay(BigInt(user.sub), BigInt(id));
  }
}

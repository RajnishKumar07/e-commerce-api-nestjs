import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Roles } from 'src/common/decorators/role.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleGuard } from 'src/common/guards/role.guard';
import { checkPermissions } from 'src/common/utils/check-permission.util';
import { ITokenUser } from 'src/common/utils/create-token-user';
import {
  createListResponse,
  createResponse,
} from 'src/common/utils/response.util';
import { OrderService } from 'src/modules/order/order.service';
import { UserRole } from 'src/modules/user/user.entity';
import { ListQueryDto } from 'src/shared/dto/list-query.dto';

@UseGuards(AuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  async getAllOrders(@Query() query: ListQueryDto) {
    try {
      const { page, limit } = query;
      const { orders, totalOrders, numOfPages } =
        await this.orderService.getAllOrders(query);

      return createListResponse(orders, totalOrders, page, limit, numOfPages);
    } catch (error) {
      console.log('error--->', error);
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Failed to fetch orders');
      }
    }
  }

  @Get('showAllMyOrders')
  async getCurrentUserOrders(@CurrentUser() user: ITokenUser) {
    try {
      const orders = await this.orderService.getCurrentUserOrders(user);
      return createResponse(
        HttpStatus.OK,
        'Orders fetched successfully!',
        orders,
      );
    } catch (error) {
      console.log('error--->', error);
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException(`Failed to fetch orders`);
      }
    }
  }
  @Get(':id')
  async getSingleOrder(
    @Param('id', ParseIntPipe) orderId: number,
    @CurrentUser() user: ITokenUser,
  ) {
    try {
      const order = await this.orderService.getSingleOrder(orderId);

      if (!order) {
        throw new NotFoundException(`No order found wih id ${orderId}`);
      }

      checkPermissions(user, order.user.id);

      return createResponse(HttpStatus.OK, 'Order found successfully!', order);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException(`Failed to fetch order`);
      }
    }
  }
}

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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
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

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all orders' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
  @ApiOperation({ summary: 'Get orders for the current user' })
  @ApiResponse({ status: 200, description: 'User orders fetched successfully' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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

  @Get('orderDetailBySession/:id')
  @ApiOperation({ summary: 'Get order detail by Stripe session ID' })
  @ApiParam({ name: 'id', description: 'Stripe session ID', type: String })
  @ApiResponse({
    status: 200,
    description: 'Order detail fetched successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderDetail(@Param('id') sessionId: string) {
    try {
      const orderDetail =
        await this.orderService.getOrderDetailBySessionId(sessionId);
      if (!orderDetail?.id) {
        throw new NotFoundException(`No order found wih id ${sessionId}`);
      }
      return createResponse(
        HttpStatus.OK,
        'Order found successfully!',
        orderDetail,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException(`Failed to fetch order`);
      }
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single order by order ID' })
  @ApiParam({ name: 'id', description: 'Order ID', type: Number })
  @ApiResponse({ status: 200, description: 'Order fetched successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
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

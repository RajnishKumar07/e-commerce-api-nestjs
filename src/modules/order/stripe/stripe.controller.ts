import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Post,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ITokenUser } from 'src/common/utils/create-token-user';
import { createResponse } from 'src/common/utils/response.util';
import { CreateOrderDto } from 'src/modules/order/dto/create-order-dto';
import { OrderService } from 'src/modules/order/order.service';
import { StripeService } from 'src/modules/order/stripe/stripe.service';
import { ProductReservationsService } from 'src/modules/product-reservations/product-reservations.service';

//To test event in local , need to forward route
// stripe listen --forward-to http://localhost:3000/stripe/webhook

@ApiTags('Stripe')
@Controller('stripe')
export class StripeController {
  constructor(
    private stripeService: StripeService,
    private orderService: OrderService,
    private productReservationsService: ProductReservationsService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('create-checkout-session')
  @ApiOperation({ summary: 'Create a Stripe checkout session' })
  @ApiBody({ type: CreateOrderDto, description: 'Order details' })
  @ApiQuery({
    name: 'successUrl',
    required: true,
    type: String,
    description: 'The URL to redirect to after a successful payment',
  })
  @ApiQuery({
    name: 'cancelUrl',
    required: true,
    type: String,
    description: 'The URL to redirect to after a canceled payment',
  })
  @ApiResponse({
    status: 200,
    description: 'Checkout session created successfully',
    type: Object,
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createCheckoutSession(
    @CurrentUser() user: ITokenUser,
    @Body('order') createOrderDto: CreateOrderDto,
    @Body('successUrl') successUrl: string,
    @Body('cancelUrl') cancelUrl: string,
  ) {
    try {
      const lineItems = await this.stripeService.createLineItem(
        createOrderDto,
        user,
      );

      const session = await this.stripeService.createCheckoutSession(
        lineItems,
        createOrderDto,
        successUrl,
        cancelUrl,
        user,
      );
      const {
        url,
        payment_intent: paymentIntentId,
        id: checkoutSessionId,
      } = session;

      return createResponse(HttpStatus.OK, 'Checkout session created!', {
        url,
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Failed to create order');
      }
    }
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({
    status: 200,
    description: 'Webhook event processed successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    console.log('Raw Body:', req.rawBody?.toString());
    console.log('Headers:', req.headers);
    console.log('signature', signature);
    try {
      const event = this.stripeService.constructEvent(rawBody, signature);

      switch (event.type) {
        // case 'payment_intent.succeeded': {
        //   const paymentIntent = event.data.object;
        //   await this.orderService.updateOrderStatus(
        //     Number(paymentIntent.metadata.orderId),
        //     OrderStatus.PAID,
        //   );
        //   break;
        // }

        // case 'payment_intent.payment_failed': {
        //   const paymentIntent = event.data.object;
        //   await this.orderService.updateOrderStatus(
        //     Number(paymentIntent.metadata.orderId),
        //     OrderStatus.FAILED,
        //   );
        //   break;
        // }
        case 'charge.refunded': {
          const charge = event.data.object;
          // await this.orderService.updateOrderStatus(
          //   Number(charge.metadata.orderId),
          //   OrderStatus.REFUNDED,
          // );
          break;
        }

        case 'checkout.session.completed': {
          const session = event.data.object;
          const metadata = session.metadata as unknown as {
            orderItem: string;
            shippingFee: number;
            user: string;
          };
          await this.orderService.createOrder(
            metadata,
            session.id,
            session.payment_intent as string,
          );
          break;
        }

        case 'checkout.session.expired': {
          const session = event.data.object;
          const orderItem = JSON.parse(session.metadata.orderItem) as {
            productId: number;
            quantity: number;
          }[];
          const user = JSON.parse(session.metadata.user) as ITokenUser;
          await this.productReservationsService.removeProductReservation(
            orderItem,
            user.userId,
          );
          break;
        }

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }
}

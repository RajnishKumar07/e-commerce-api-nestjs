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
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ITokenUser } from 'src/common/utils/create-token-user';
import { createResponse } from 'src/common/utils/response.util';
import { CreateOrderDto } from 'src/modules/order/dto/create-order-dto';
import { OrderService } from 'src/modules/order/order.service';
import { StripeService } from 'src/modules/order/stripe/stripe.service';
import { ProductReservationsService } from 'src/modules/product-reservations/product-reservations.service';

@Controller('stripe')
export class StripeController {
  constructor(
    private stripeService: StripeService,
    private orderService: OrderService,
    private productReservationsService: ProductReservationsService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(
    @CurrentUser() user: ITokenUser,
    @Body('order') createOrderDto: CreateOrderDto,
    // @Body('orderId') orderId: number,
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
      console.log('paymentIntentId=========>', paymentIntentId);
      console.log('checkoutSessionId=========>', checkoutSessionId);

      return createResponse(HttpStatus.OK, 'Checkout session created!', {
        url,
      });
    } catch (error) {
      console.log('error----->', error);
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Failed to create order');
      }
    }
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;

    try {
      const event = this.stripeService.constructEvent(rawBody, signature);
      // console.log('webhook event---------->', event.type, event.data.object);
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
          console.log(`Unhandled event type: ${event.type}`, event.data.object);
      }

      return { received: true };
    } catch (error) {
      throw new BadRequestException(`Webhook Error: ${error.message}`);
    }
  }
}

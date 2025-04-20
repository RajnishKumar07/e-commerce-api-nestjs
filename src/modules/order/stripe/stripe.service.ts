import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ITokenUser } from 'src/common/utils/create-token-user';
import { CreateOrderDto } from 'src/modules/order/dto/create-order-dto';
import { Order } from 'src/modules/order/entity/order.entity';
import { ProductReservationsService } from 'src/modules/product-reservations/product-reservations.service';
import { Product } from 'src/modules/product/product.entity';
import Stripe from 'stripe';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly productReservationService: ProductReservationsService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  constructEvent(body: any, signature: string) {
    return this.stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  }

  async createLineItem(createOrderDto: CreateOrderDto, user: ITokenUser) {
    const { items: cartItems, shippingFee } = createOrderDto;
    const lineItems: {
      price_data: {
        currency: string;
        product_data: {
          name: string;
        };
        unit_amount: number;
      };
      quantity: number;
    }[] = [];
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    // lets now open a new transaction:
    await queryRunner.startTransaction();

    try {
      for (const item of cartItems) {
        const dbProduct = await queryRunner.manager.findOne(Product, {
          where: {
            id: item.productId,
          },
        });

        if (!dbProduct) {
          throw new NotFoundException(`No product with id ${item.productId}`);
        }

        const productReservedByOther =
          await this.productReservationService.findProductReservedByOtherUser(
            queryRunner.manager,
            item.productId,
            user.userId,
          );
        const { quantity: reservedQnt = 0 } = productReservedByOther ?? {};
        const { inventory } = dbProduct;
        if (inventory - reservedQnt < item.quantity) {
          throw new BadRequestException(`Product ${item.name} is out of stock`);
        }
        const productReservation = await this.productReservationService.findOne(
          queryRunner.manager,
          item.productId,
          user.userId,
        );
        console.log('Already Exist==============>', productReservation);
        if (productReservation) {
          const quantity = productReservation.quantity + item.quantity;
          await this.productReservationService.updateProductReservation(
            queryRunner.manager,
            item.productId,
            user.userId,
            quantity,
          );
        } else {
          await this.productReservationService.createProductReservation(
            queryRunner.manager,
            item.productId,
            user.userId,
            item.quantity,
          );
        }

        lineItems.push({
          price_data: {
            currency: 'inr',
            product_data: { name: dbProduct.name },
            unit_amount: Number(dbProduct.price) * 100, // $20.00 or Rs 20
          },
          quantity: item.quantity,
        });
      }
      await queryRunner.commitTransaction();
    } catch (error) {
      console.log('error-->', error);
      await queryRunner.rollbackTransaction(); // Rollback on error
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Failed to create order');
      }
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }

    return lineItems;
  }

  async createCheckoutSession(
    lineItems: {
      price_data: {
        currency: string;
        product_data: {
          name: string;
        };
        unit_amount: number;
      };
      quantity: number;
    }[],
    createOrderDto: CreateOrderDto,
    successUrl: string,
    cancelUrl: string,
    user: ITokenUser,
  ) {
    const { items, shippingFee } = createOrderDto;

    const orderItem = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        orderItem: JSON.stringify(orderItem),
        shippingFee,
        user: JSON.stringify(user),
      }, // Attach metadata (e.g., order ID)
      billing_address_collection: 'required',
      customer_email: user.email,
      expires_at: Math.floor(Date.now() / 1000) + 10800, // Expires in 30 minutes

      // shipping_address_collection: {
      //   allowed_countries: ['IN'],
      // },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: shippingFee * 100, // e.g., ₹199 → 19900 cents
              currency: 'inr',
            },
            display_name: 'Shipping Fee ',
          },
        },
      ],
    });
    console.log('order------>', session);

    return session;
  }
}

import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ITokenUser } from 'src/common/utils/create-token-user';
import { Cart } from 'src/modules/cart/entity/cart.entity';
import { OrderItem } from 'src/modules/order/entity/order-item.entity';
import { Order } from 'src/modules/order/entity/order.entity';
import { ProductReservations } from 'src/modules/product-reservations/product-reservations.entity';
import { Product } from 'src/modules/product/product.entity';
import { UserService } from 'src/modules/user/user.service';
import { ListQueryDto } from 'src/shared/dto/list-query.dto';
import { OrderStatus } from 'src/shared/enums';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}
  async createOrder(
    metadata: {
      orderItem: string;
      shippingFee: number;
      user: string;
    },
    stripeSessionId: string,
    paymentIntentId: string,
  ) {
    let { shippingFee } = metadata;
    shippingFee = Number(shippingFee);

    const orderItem: { productId: number; quantity: number }[] = JSON.parse(
      metadata.orderItem,
    );
    const tokenUser: ITokenUser = JSON.parse(metadata.user);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const orderItems: OrderItem[] = [];
      let subtotal = 0;
      const user = await this.userService.findUserById(tokenUser.userId);
      const order = queryRunner.manager.create(Order, {
        checkoutSessionId: stripeSessionId,
        orderItem: orderItems,
        shippingFee: shippingFee,
        subtotal: subtotal,
        total: 0,
        user,
        status: OrderStatus.PAID,
        paymentIntentId: paymentIntentId || '',
      });

      await queryRunner.manager.save(order);

      for (const item of orderItem) {
        const dbProduct = await queryRunner.manager.findOne(Product, {
          where: {
            id: item.productId,
          },
        });

        if (!dbProduct) {
          throw new NotFoundException(`No product with id ${item.productId}`);
        }

        const { name, price, image } = dbProduct;

        const singleOrderItem = queryRunner.manager.create(OrderItem, {
          name: name,
          price: price,
          image: image,
          quantity: item.quantity,
          product: dbProduct,
          order,
        });

        orderItems.push(singleOrderItem);
        subtotal += price * item.quantity;
        dbProduct.inventory = dbProduct.inventory - item.quantity;

        //Remove reserved product from table
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(ProductReservations)
          .where('productId=:productId', { productId: item.productId })
          .andWhere('userId=:userId', { userId: user.id })
          .execute();
        await queryRunner.manager.save(dbProduct);
      }
      const total = subtotal + shippingFee;

      order.subtotal = subtotal;
      order.total = total;

      await queryRunner.manager.save(order);
      await queryRunner.manager.save(orderItems);

      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Cart)
        .where('userId=:userId', { userId: user.id })
        .execute();

      await queryRunner.commitTransaction(); // Commit transaction if successful

      return { order };
    } catch (error) {
      console.log('error-->', error);
      await queryRunner.rollbackTransaction(); // Rollback on error
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Failed to create order');
      }
    } finally {
      await queryRunner.release(); // Release the query runner
    }
  }

  async getAllOrders(query: ListQueryDto) {
    console.log('getAllOrders--->', query);
    const { limit = 10, sort = [], page = 1, search } = query;

    const orderQb = this.orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.orderItem', 'orderItem')
      .innerJoin('order.user', 'user')
      .addSelect(['user.id', 'user.name']);

    if (search) {
      orderQb.andWhere('orderItem.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    const skip = (page - 1) * limit;
    orderQb.skip(skip).limit(limit);

    for (const so of sort) {
      const key = `order.${so.key}`;
      orderQb.addOrderBy(key, so.value.toLocaleUpperCase() as 'ASC' | 'DESC');
    }

    const [orders, totalOrders] = await orderQb.getManyAndCount();
    const numOfPages = Math.ceil(totalOrders / limit);
    return { orders, totalOrders, numOfPages };
  }

  async getSingleOrder(orderId: number) {
    return await this.orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.orderItem', 'orderItem')
      .innerJoin('order.user', 'user')
      .addSelect(['user.id', 'user.name'])
      .where('order.id=:id', { id: orderId })
      .getOne();
  }

  async getCurrentUserOrders(user: ITokenUser) {
    return await this.orderRepository
      .createQueryBuilder('order')
      .innerJoinAndSelect('order.orderItem', 'orderItem')
      .innerJoin('order.user', 'user')
      .addSelect(['user.id', 'user.name'])
      .where('user.id=:id', { id: user.userId })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async getOrderDetailBySessionId(sessionId: string) {
    return await this.orderRepository.findOne({
      relations: ['orderItem'],
      where: {
        checkoutSessionId: sessionId,
      },
    });
  }
}

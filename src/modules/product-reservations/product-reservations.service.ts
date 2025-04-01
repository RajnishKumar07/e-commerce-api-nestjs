import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductReservations } from 'src/modules/product-reservations/product-reservations.entity';
import { ProductService } from 'src/modules/product/product.service';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class ProductReservationsService {
  constructor(
    @InjectRepository(ProductReservations)
    private productReservationRepository: Repository<ProductReservations>,
    private productService: ProductService,
  ) {}

  async createProductReservation(
    manager: EntityManager,
    productId: number,
    userId: number,
    quantity: number,
  ) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5); // Expire in 5 minutes
    const productReservation = await manager
      .createQueryBuilder()
      .insert()
      .into(ProductReservations)
      .values({
        product: {
          id: productId,
        },
        user: {
          id: userId,
        },
        quantity: quantity,
        expires_at: expiresAt,
      })
      .execute();
    return productReservation;
  }

  async findOne(manager: EntityManager, productId: number, userId: number) {
    const productReservation = await manager
      .createQueryBuilder(ProductReservations, 'pr')
      //   .from)
      .where('pr.productId=:productId', { productId })
      .andWhere('pr.userId=:userId', { userId })
      .getOne();
    console.log(
      'Find one query------------->',
      productId,
      userId,
      manager
        .createQueryBuilder()
        .from(ProductReservations, 'pr')
        .where('pr.productId=:productId', { productId })
        .andWhere('pr.userId=:userId', { userId })
        .getOne(),
    );
    return productReservation;
  }

  async updateProductReservation(
    manager: EntityManager,
    productId: number,
    userId: number,
    quantity: number,
  ) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    const productReservation = await manager
      .createQueryBuilder()
      .update(ProductReservations)
      .set({
        quantity,
        expires_at: expiresAt,
      })
      .where('productId=:productId', { productId })
      .andWhere('userId=:userId', { userId })
      .execute();

    return productReservation;
  }

  async findProductReservedByOtherUser(
    manager: EntityManager,
    productId: number,
    userId: number,
  ) {
    const productReserved = await manager
      .createQueryBuilder()
      .select('pr')
      .from(ProductReservations, 'pr')
      .where('productId=:productId', { productId })
      .andWhere('userId!=:userId', { userId })
      .getOne();

    return productReserved;
  }

  async removeProductReservation(
    orderItem: { productId: number; quantity: number }[],
    userId: number,
  ) {
    for (const item of orderItem) {
      await this.productReservationRepository
        .createQueryBuilder()
        .delete()
        .from(ProductReservations)
        .where('productId=:productId', {
          productId: item.productId,
        })
        .andWhere('userId=:userId', { userId })
        .execute();
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES, { name: 'clear_reserved_inventory' })
  async clearReservedInventory() {
    console.log('clear_reserved_inventory conjob started: ', new Date());
    // const expiredReservations = await this.productReservationRepository
    //   .createQueryBuilder('pr')
    //   .leftJoinAndSelect('pr.product', 'p')
    //   .where('pr.expires_at<NOW()')
    //   .getMany();

    // console.log(`Found ${expiredReservations.length} expired reservations`);
    // if (expiredReservations.length <= 0) {
    //   return;
    // }

    // const inventoryUpdates = expiredReservations.map((inv) => ({
    //   productId: inv.product.id,
    //   quantity: inv.quantity,
    // }));

    // await this.productService.bulkAddInventory(inventoryUpdates);

    await this.productReservationRepository
      .createQueryBuilder()
      .delete()
      .from(ProductReservations)
      .where('expires_at<NOW()')
      .execute();
    console.log('Expired reservations cleared and inventory updated');
  }
}

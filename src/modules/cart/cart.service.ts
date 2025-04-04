import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from 'src/modules/cart/entity/cart.entity';
import { Product } from 'src/modules/product/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getCartItem(userId: number) {
    return await this.cartRepository
      .createQueryBuilder('c')
      .select([
        'c.id as id',
        'c.quantity as quantity',
        'p.name as name',
        'p.image as image',
        'p.price as price',
        'p.id as productId',
        'p.inventory as inventory',
      ])
      .addSelect(
        `CAST(COALESCE(SUM(CASE WHEN pr_user.id != :userId THEN pr.quantity ELSE 0 END), 0) AS UNSIGNED)`,
        'reservedProductCount',
      )
      .leftJoin('c.user', 'user')
      .leftJoin('c.product', 'p')
      .leftJoin('p.productReservations', 'pr')
      .leftJoin('pr.user', 'pr_user')
      .where('user.id = :userId', { userId })
      .groupBy('c.id, p.id') // 👈 Important: Group by cart ID and product ID
      .setParameter('userId', userId)
      .getRawMany();
  }

  async addUpdateItemToCart(
    productId: number,
    quantity: number,
    userId: number,
  ) {
    const product = await this.productRepository
      .createQueryBuilder('p')
      .select('p.*')
      .leftJoin('p.productReservations', 'pr')
      .leftJoin('pr.user', 'pr_user')
      .addSelect(
        'COALESCE(SUM( CASE WHEN pr_user.id!=:userId THEN pr.quantity ELSE 0 END),0)',
        'reservedProductCount',
      )
      .where('p.id=:productId', { productId })
      .setParameter('userId', userId)
      .getRawOne();

    if (!product) {
      throw new NotFoundException(`No Product Found with id :${productId}`);
    }

    const inventoryProductCount =
      product.inventory - Number(product.reservedProductCount);
    if (inventoryProductCount < quantity) {
      throw new BadRequestException(`Product ${product.name} is out of stock`);
    }

    const existingCartItem = await this.cartRepository.findOne({
      where: {
        product: { id: productId },
        user: { id: userId },
      },
    });
    let message = '';
    if (existingCartItem) {
      const updateQuantity = existingCartItem.quantity + quantity;
      if (inventoryProductCount < updateQuantity) {
        throw new BadRequestException(
          `Product ${product.name} has reached its stock`,
        );
      }
      await this.cartRepository
        .createQueryBuilder()
        .update(Cart)
        .set({
          quantity: updateQuantity,
        })
        .where('id=:cartId', { cartId: existingCartItem.id })
        .execute();
      message = `You have already added ${product.name} in your cart and we have increased quantity by ${quantity}`;
    } else {
      await this.cartRepository
        .createQueryBuilder()
        .insert()
        .into(Cart)
        .values({
          product: {
            id: productId,
          },
          user: {
            id: userId,
          },
          quantity: quantity,
        })
        .execute();

      message = `${product.name} added to your cart.`;
    }

    return { message };
  }

  async addUpdateCartItemQuantity(
    productId: number,
    quantity: number,
    userId: number,
  ) {
    const product = await this.productRepository
      .createQueryBuilder('p')
      .select('p.*')
      .leftJoin('p.productReservations', 'pr')
      .leftJoin('pr.user', 'pr_user')
      .addSelect(
        'COALESCE(SUM( CASE WHEN pr_user.id!=:userId THEN pr.quantity ELSE 0 END),0)',
        'reservedProductCount',
      )
      .where('p.id=:productId', { productId })
      .setParameter('userId', userId)
      .getRawOne();

    if (!product) {
      throw new NotFoundException(`No Product Found with id :${productId}`);
    }

    const inventoryProductCount =
      product.inventory - Number(product.reservedProductCount);
    if (inventoryProductCount < quantity) {
      throw new BadRequestException(`Product ${product.name} is out of stock`);
    }

    const existingCartItem = await this.cartRepository.findOne({
      where: {
        product: { id: productId },
        user: { id: userId },
      },
    });
    let message = '';
    if (existingCartItem) {
      await this.cartRepository
        .createQueryBuilder()
        .update(Cart)
        .set({
          quantity: quantity,
        })
        .where('id=:cartId', { cartId: existingCartItem.id })
        .execute();
      message = `${product.name}  quantity updated to ${quantity}`;
    } else {
      await this.cartRepository
        .createQueryBuilder()
        .insert()
        .into(Cart)
        .values({
          product: {
            id: productId,
          },
          user: {
            id: userId,
          },
          quantity: quantity,
        })
        .execute();

      message = `${product.name} added to your cart.`;
    }

    return { message };
  }

  async removeItemFromCart(cartId: number) {
    const cartItem = await this.cartRepository.findOne({
      where: {
        id: cartId,
      },
    });

    console.log('cartItem-------->', cartItem);
    if (!cartItem) {
      throw new NotFoundException(`No Product Found with id :${cartId}`);
    }

    return await this.cartRepository
      .createQueryBuilder()
      .delete()
      .from(Cart)
      .where('id=:cartId', { cartId })
      .execute();
  }
}

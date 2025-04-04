import { Product } from 'src/modules/product/product.entity';
import { User } from 'src/modules/user/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cart')
export class Cart {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  quantity: number;

  @ManyToOne(() => User, (user) => user.cartItem, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Product, (product) => product.cart, {
    onDelete: 'CASCADE',
  })
  product: Product;
}

import { Cart } from 'src/modules/cart/entity/cart.entity';
import { Order } from 'src/modules/order/entity/order.entity';
import { ProductReservations } from 'src/modules/product-reservations/product-reservations.entity';
import { Product } from 'src/modules/product/product.entity';
import { Review } from 'src/modules/review/review.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users') // The name of the table in MySQL
export class User {
  @PrimaryGeneratedColumn() // Automatically generates a unique id
  id: number;

  @Column() // Maps to the "name" column in the table
  name: string;

  @Column({ unique: true }) // Ensures that email is unique
  email: string;

  @Column()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  verified: Date;
  @Column({ nullable: true })
  passwordToken: string;

  @Column({ nullable: true })
  passwordTokenExpirationDate: Date;

  @OneToMany(() => Product, (product) => product.user)
  products: Product[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(
    () => ProductReservations,
    (productReservation) => productReservation.user,
    {
      cascade: ['remove'],
    },
  )
  productReservations: ProductReservations;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Cart, (cart) => cart.user, {
    cascade: ['remove'],
  })
  cartItem: Cart;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

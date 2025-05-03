import { Cart } from 'src/modules/cart/entity/cart.entity';
import { OrderItem } from 'src/modules/order/entity/order-item.entity';
import { ProductReservations } from 'src/modules/product-reservations/product-reservations.entity';
import { Review } from 'src/modules/review/review.entity';
import { User } from 'src/modules/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProductCategory {
  OFFICE = 'office',
  KITCHEN = 'kitchen',
  BEDROOM = 'bedroom',
  CLOTHS = 'cloths',
}

export enum ProductCompany {
  IKEA = 'ikea',
  RODOSTER = 'rodoster',
  MARCOS = 'marcos',
  EMPORIO_ARMANI = 'EMPORIO ARMANI',
  BLIVE = 'BLIVE',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    nullable: false,
  })
  price: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  description: string;

  @Column({ type: 'varchar', default: '/uploads/imageNotAvailable.jpg' })
  image: string;

  @Column({ type: 'enum', enum: ProductCategory })
  category: ProductCategory;

  @Column({ type: 'enum', enum: ProductCompany })
  company: ProductCompany;

  @Column('simple-array', { nullable: true })
  colors: string[];

  @Column({ type: 'boolean', default: false })
  featured: boolean;

  @Column({ type: 'boolean', default: false })
  freeShipping: boolean;

  @Column({ type: 'int', default: 15, nullable: false })
  inventory: number;

  @Column({ type: 'float', default: 0 })
  averageRating: number;

  @Column({ type: 'int', default: 0 })
  numOfReviews: number;

  @ManyToOne(() => User, (user) => user.products, {
    nullable: false,
    eager: true,
  })
  user: User;

  @OneToMany(() => Review, (review) => review.product)
  reviews: Review[];

  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems: OrderItem[];

  @OneToMany(
    () => ProductReservations,
    (productReservation) => productReservation.product,
    {
      cascade: ['remove'],
    },
  )
  productReservations: ProductReservations;

  @OneToMany(() => Cart, (cart) => cart.product)
  cart: Cart;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateProductDto } from 'src/modules/product/dto/create-product.dto';
import { UpdateProductDto } from 'src/modules/product/dto/update-product.dto';
import { Product } from 'src/modules/product/product.entity';
import { User } from 'src/modules/user/user.entity';
import { ListQueryDto } from 'src/shared/dto/list-query.dto';
import { Repository } from 'typeorm';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}
  uploadFile(file: Express.Multer.File): { image: string } {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    let hostUrl = this.configService.get<string>('APP_URL');
    const isDevMode =
      this.configService.get<string>('NODE_ENV') === 'development';

    if (isDevMode) {
      const port = this.configService.get<string>('PORT');
      hostUrl = `http://localhost:${port}`;
    }

    const imageUrl = `${hostUrl}/uploads/${file.filename}`;
    return { image: imageUrl };
  }

  async createProduct(createProductDto: CreateProductDto, userid: number) {
    const user = await this.userRepository.findOne({
      where: { id: userid },
    });

    const product = this.productRepository.create({
      ...createProductDto,
      user: user,
    });
    return await this.productRepository.save(product);
  }

  async getAllProducts(query: ListQueryDto, userId: number) {
    const { search, sort, page = 1, limit = 10 } = query;
    const skip = limit * (page - 1);

    const productQB = this.productRepository
      .createQueryBuilder('product')
      .select('product.*')
      .leftJoin('product.productReservations', 'pr')
      .leftJoin('pr.user', 'pr_user');

    // 👇 Conditionally add reservedProductCount
    if (userId) {
      productQB.addSelect(
        'CAST(COALESCE(SUM(CASE WHEN pr_user.id!=:userId THEN pr.quantity ELSE 0 END), 0) AS UNSIGNED)',
        'reservedProductCount',
      );
      productQB.setParameter('userId', userId);
    } else {
      productQB.addSelect('0', 'reservedProductCount');
    }

    console.log('query---->', productQB.getQuery());
    if (search) {
      productQB.where('product.name Like :search', { search: `%${search}%` });
    }

    productQB.groupBy('product.id').skip(skip).limit(limit);

    // Sorting
    if (sort && sort.length > 0) {
      sort.forEach(({ key, value }) => {
        productQB.addOrderBy(
          `product.${key}`,
          value.toUpperCase() as 'ASC' | 'DESC',
        );
      });
    }

    const rawProducts = await productQB.getRawMany();
    const products = rawProducts.map((p) => ({
      ...p,
      reservedProductCount: Number(p.reservedProductCount), // Convert to number
    }));
    const totalProducts = await productQB.getCount();
    const numOfPages = Math.ceil(totalProducts / limit);

    return {
      products,
      totalProducts,
      numOfPages,
    };
  }

  async getSingleProduct(productId: number, userId: number) {
    const productQB = this.productRepository.createQueryBuilder('product');

    const productRow = await productQB
      .leftJoin('product.productReservations', 'pr')
      .leftJoin('pr.user', 'pr_user')
      .addSelect(
        'CAST(COALESCE(SUM(CASE WHEN pr_user.id!=:userId THEN  pr.quantity ELSE 0 END), 0) AS UNSIGNED)',
        'reservedProductCount',
      )
      .setParameter('userId', userId)
      .groupBy('product.id')
      .where('product.id=:productId', { productId })
      .getRawOne();
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.user', 'user')
      .addSelect(['user.name', 'user.id', 'user.email'])
      .leftJoin('product.reviews', 'review')
      .leftJoin('review.user', 'reviewUser')
      .addSelect([
        'review.id',
        'review.rating',
        'review.title',
        'review.comment',
        'reviewUser.id',
        'reviewUser.email',
        'reviewUser.name',
        'review.createdAt',
        'review.updatedAt',
      ])
      .where('product.id=:productId', { productId })
      .getOne();
    return {
      ...product,
      reservedProductCount: Number(productRow.reservedProductCount),
    };
  }
  async getSingleProductDetail(productId: number) {
    const product = await this.productRepository
      .createQueryBuilder('product')
      .leftJoin('product.user', 'user')
      .addSelect(['user.name', 'user.id', 'user.email'])
      .leftJoin('product.reviews', 'review')
      .leftJoin('review.user', 'reviewUser')
      .addSelect([
        'review.id',
        'review.rating',
        'review.title',
        'review.comment',
        'reviewUser.id',
        'reviewUser.email',
        'reviewUser.name',
        'review.createdAt',
        'review.updatedAt',
      ])
      .where('product.id=:productId', { productId })
      .getOne();
    return {
      ...product,
    };
  }
  async updateProduct(productId: number, updateProductDto: UpdateProductDto) {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
      },
    });
    if (!product) {
      throw new NotFoundException(`No Product Found with id :${productId}`);
    }
    await this.productRepository
      .createQueryBuilder()
      .update(Product)
      .set(updateProductDto)
      .where('id=:productId', { productId })
      .execute();

    return await this.getSingleProductDetail(productId);
  }

  async deleteProduct(productId: number) {
    const product = await this.getSingleProductDetail(productId);
    if (!product) {
      throw new NotFoundException(`No Product Found with id :${productId}`);
    }

    await this.productRepository
      .createQueryBuilder()
      .delete()
      .from(Product)
      .where('id=:productId', {
        productId,
      })
      .execute();

    return;
  }

  async bulkAddInventory(updates: { productId: number; quantity: number }[]) {
    const updatePromise = updates.map(({ productId, quantity }) => {
      return this.productRepository
        .createQueryBuilder()
        .update(Product)
        .set({
          inventory: () => `inventory + ${quantity}`,
        })
        .where('id=:productId', { productId: productId })
        .execute();
    });

    return Promise.all(updatePromise);
  }
}

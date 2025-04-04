import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ITokenUser } from 'src/common/utils/create-token-user';
import { createResponse } from 'src/common/utils/response.util';
import { CartService } from 'src/modules/cart/cart.service';
import { AddCartItemDtO } from 'src/modules/cart/dto/add-item-dto';

@UseGuards(AuthGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}
  @Get()
  async getCartItem(@CurrentUser() user: ITokenUser) {
    try {
      const cartItem = await this.cartService.getCartItem(user.userId);
      return createResponse(
        HttpStatus.OK,
        'Cart item found successfully',
        cartItem,
      );
    } catch (error) {
      console.log('error---------->', error);

      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to fetch cart');
    }
  }

  @Post('/:id')
  async addUpdateItemToCart(
    @Param('id', ParseIntPipe) productId: number,
    @CurrentUser() user: ITokenUser,
    @Body() body: AddCartItemDtO,
  ) {
    try {
      console.log('addItemToCart-------------------------');
      const { message } = await this.cartService.addUpdateItemToCart(
        productId,
        body.quantity,
        user.userId,
      );

      return createResponse(HttpStatus.CREATED, message);
    } catch (error) {
      console.log('error---------->', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add item in cart');
    }
  }

  @Put('/:id')
  async updateCartItemQuantity(
    @Param('id', ParseIntPipe) productId: number,
    @CurrentUser() user: ITokenUser,
    @Body() body: AddCartItemDtO,
  ) {
    try {
      const { message } = await this.cartService.addUpdateCartItemQuantity(
        productId,
        body.quantity,
        user.userId,
      );

      return createResponse(HttpStatus.CREATED, message);
    } catch (error) {
      console.log('error---------->', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add item in cart');
    }
  }

  @Delete('/:id')
  async deleteCartItem(@Param('id', ParseIntPipe) cartId: number) {
    try {
      await this.cartService.removeItemFromCart(cartId);
      return createResponse(HttpStatus.OK, 'Cart item successfully removed');
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove item from cart');
    }
  }
}

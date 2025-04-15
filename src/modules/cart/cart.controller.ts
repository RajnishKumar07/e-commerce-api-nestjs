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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ITokenUser } from 'src/common/utils/create-token-user';
import { createResponse } from 'src/common/utils/response.util';
import { CartService } from 'src/modules/cart/cart.service';
import { AddCartItemDtO } from 'src/modules/cart/dto/add-item-dto';

@ApiTags('Cart')
@ApiBearerAuth() // JWT authentication via cookies or token
@UseGuards(AuthGuard)
@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get all cart items for current user' })
  @ApiResponse({ status: 200, description: 'Cart item found successfully' })
  @ApiResponse({ status: 500, description: 'Failed to fetch cart' })
  async getCartItem(@CurrentUser() user: ITokenUser) {
    try {
      const cartItem = await this.cartService.getCartItem(user.userId);
      return createResponse(
        HttpStatus.OK,
        'Cart item found successfully',
        cartItem,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to fetch cart');
    }
  }

  @Post('/:id')
  @ApiOperation({ summary: 'Add or update a cart item' })
  @ApiParam({ name: 'id', description: 'Product ID', type: Number })
  @ApiResponse({
    status: 201,
    description: 'Item added or updated successfully',
  })
  @ApiResponse({ status: 500, description: 'Failed to add item in cart' })
  async addUpdateItemToCart(
    @Param('id', ParseIntPipe) productId: number,
    @CurrentUser() user: ITokenUser,
    @Body() body: AddCartItemDtO,
  ) {
    try {
      const { message } = await this.cartService.addUpdateItemToCart(
        productId,
        body.quantity,
        user.userId,
      );
      return createResponse(HttpStatus.CREATED, message);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to add item in cart');
    }
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update quantity of a cart item' })
  @ApiParam({ name: 'id', description: 'Product ID', type: Number })
  @ApiResponse({ status: 201, description: 'Cart item updated successfully' })
  @ApiResponse({ status: 500, description: 'Failed to update cart item' })
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
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to update cart item');
    }
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'Delete a cart item' })
  @ApiParam({ name: 'id', description: 'Cart item ID', type: Number })
  @ApiResponse({ status: 200, description: 'Cart item successfully removed' })
  @ApiResponse({ status: 500, description: 'Failed to remove item from cart' })
  async deleteCartItem(@Param('id', ParseIntPipe) cartId: number) {
    try {
      await this.cartService.removeItemFromCart(cartId);
      return createResponse(HttpStatus.OK, 'Cart item successfully removed');
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Failed to remove item from cart');
    }
  }
}

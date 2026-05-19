import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { User } from '../users/auth/decorators/user.decorator';
import type { JwtPayloadType } from '../utils/types';
import { JwtAuthGuard } from '../users/auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('api/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add an item to the current user wishlist' })
  create(
    @Param('itemId', ParseIntPipe) itemId: number,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.wishlistService.create(jwtPayload.id, itemId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all wishlist items for the current user' })
  findAllByUser(@User() jwtPayload: JwtPayloadType) {
    return this.wishlistService.findAllByUser(jwtPayload.id);
  }

  @Delete(':itemId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove an item from the current user wishlist' })
  delete(
    @Param('itemId', ParseIntPipe) itemId: number,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.wishlistService.remove(jwtPayload.id, itemId);
  }
}

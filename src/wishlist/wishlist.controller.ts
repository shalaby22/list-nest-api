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

@Controller('api/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post(':itemId')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('itemId', ParseIntPipe) itemId: number,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.wishlistService.create(jwtPayload.id, itemId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAllByUser(@User() jwtPayload: JwtPayloadType) {
    return this.wishlistService.findAllByUser(jwtPayload.id);
  }

  @Delete(':itemId')
  @UseGuards(JwtAuthGuard)
  delete(
    @Param('itemId', ParseIntPipe) itemId: number,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.wishlistService.remove(jwtPayload.id, itemId);
  }
}

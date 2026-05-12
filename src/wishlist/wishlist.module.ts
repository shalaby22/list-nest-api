import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from './wishlist.entity';
import { UsersModule } from '../users/users.module';
import { ItemsModule } from '../items/items.module';

@Module({
  controllers: [WishlistController],
  providers: [WishlistService],
  imports: [TypeOrmModule.forFeature([Wishlist]), UsersModule, ItemsModule],
})
export class WishlistModule {}

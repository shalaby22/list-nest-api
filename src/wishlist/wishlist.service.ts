import { ItemsService } from './../items/items.service';
import { UsersService } from './../users/users.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './wishlist.entity';

@Injectable()
export class WishlistService {
  constructor(
    private usersService: UsersService,
    private itemsService: ItemsService,
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
  ) {}
  // =========================================================================

  /**
   * Links a verified user with a specific item and saves it as a wishlist record.
   * @param userId - The ID of the user
   * @param itemId - The ID of the item to be favorite
   * @returns The newly created wishlist record
   */
  async create(userId: number, itemId: number) {
    const { user } = await this.usersService.getUserBy(userId);
    const { item } = await this.itemsService.findOne(itemId);
    let wishlist = this.wishlistRepository.create({
      user,
      item,
    });
    wishlist = await this.wishlistRepository.save(wishlist);
    return { wishlistRecord: wishlist };
  }

  // =========================================================================

  /**
   * Retrieves all items currently saved in the user's wishlist.
   * @param userId - The ID of the targeted user
   * @returns An array of wishlist records populated with item details
   */
  async findAllByUser(userId: number) {
    const wishlist = await this.wishlistRepository.find({
      where: { userId },
      relations: { item: true },
    });

    return { wishlist };
  }
  // =========================================================================

  /**
   * Removes a specific item from the user's wishlist.
   * @param userId - The ID of the user requesting the removal
   * @param itemId - The target item ID to remove
   * @returns message: `deleted this item from your wishList successfully`
   */
  async remove(userId: number, itemId: number) {
    let wishlist = await this.wishlistRepository.findOne({
      where: { userId, itemId },
    });
    if (!wishlist) {
      throw new BadRequestException(
        "you don't have this item in your wishlist",
      );
    }
    wishlist = await this.wishlistRepository.remove(wishlist);
    return { message: `deleted this item from your wishList successfully` };
  }
}

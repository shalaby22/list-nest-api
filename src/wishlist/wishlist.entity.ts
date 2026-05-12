import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from '../users/users.entity';
import { Item } from '../items/entities/item.entity';

@Entity()
export class Wishlist {
  @PrimaryColumn()
  itemId: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => Item, (item) => item.wishlist, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @ManyToOne(() => User, (user) => user.wishlist, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;
}

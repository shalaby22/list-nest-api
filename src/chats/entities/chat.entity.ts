import { Exclude } from 'class-transformer';
import {
  Check,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/users.entity';
import { Item } from '../../items/entities/item.entity';
import { Message } from './message.entity';

@Entity()
@Unique(['item', 'buyer']) //for indexing also
@Check(`"buyerId" != "sellerId"`)
export class Chat {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  createdAt: Date;

  @Index()
  @UpdateDateColumn()
  updatedAt: Date;

  //relations

  @Index()
  @ManyToOne(() => User, (user) => user.sellerChats, {})
  seller: User;

  @Index()
  @ManyToOne(() => User, (user) => user.buyerChats, {})
  buyer: User;

  @ManyToOne(() => Item, (item) => item.chats, {})
  item: Item;

  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];
}

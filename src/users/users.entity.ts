import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserType } from '../utils/enums';
import { Exclude } from 'class-transformer';
import { Item } from '../items/entities/item.entity';
import { Wishlist } from '../wishlist/wishlist.entity';
import { Chat } from '../chats/entities/chat.entity';
import { Message } from '../chats/entities/message.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  //todo select falsy
  @Exclude()
  password: string;

  @Column()
  phone: string;

  @Column()
  username: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: UserType, default: UserType.NORMAL_USER })
  userType: UserType;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //relations
  @OneToMany(() => Item, (item) => item.user)
  items: Item[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.user)
  wishlist: Wishlist[];

  @OneToMany(() => Chat, (chat) => chat.seller)
  sellerChats: Chat[];

  @OneToMany(() => Chat, (chat) => chat.buyer)
  buyerChats: Chat[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages: Message[];

  //not column
  @Exclude()
  refreshToken?: string;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Point } from 'typeorm';
import { User } from '../../users/users.entity';
import { Category } from '../../categories/entities/category.entity';
import { ImageItem } from './image-item.entity';
import { ItemStatusType } from '../../utils/enums';
import { City } from './city.entity';
import { Wishlist } from '../../wishlist/wishlist.entity';
import { Chat } from '../../chats/entities/chat.entity';

@Entity()
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: 'enum', enum: ItemStatusType, default: ItemStatusType.DRAFT })
  status: ItemStatusType;

  @Column()
  price: number;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    //todo make nullable false after making sure it works
    nullable: true,
  })
  point: Point;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'tsvector',
    nullable: true,
    select: false,
    generatedType: 'STORED',
    asExpression: `
      setweight(to_tsvector('english', coalesce(title, '')), 'A') || 
      setweight(to_tsvector('english', coalesce(description, '')), 'B')
    `,
  })
  searchVector: string;

  //relations
  @ManyToOne(() => User, (user) => user.items, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Category, (category) => category.items, { eager: true })
  category: Category;

  @ManyToOne(() => City, (city) => city.items, { eager: true })
  city: City;

  @OneToMany(() => ImageItem, (imageItem) => imageItem.item, {
    eager: true,
    cascade: ['insert'],
  })
  images: ImageItem[];

  @OneToMany(() => Wishlist, (wishlist) => wishlist.item)
  wishlist: Wishlist[];

  @OneToMany(() => Chat, (chat) => chat.item)
  chats: Chat[];
}

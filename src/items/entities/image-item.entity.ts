import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Item } from './item.entity';

@Entity()
export class ImageItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  link: string;

  @CreateDateColumn()
  createdAt: Date;

  @Index()
  @ManyToOne(() => Item, (item) => item.images, { onDelete: 'CASCADE' })
  item: Item;
}

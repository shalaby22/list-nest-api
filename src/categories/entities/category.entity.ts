import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Item } from '../../items/entities/item.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //relation with self
  @ManyToOne(() => Category, (category) => category.childCategories, {
    onDelete: 'CASCADE',
  })
  parentCategory: Category;

  @OneToMany(() => Category, (category) => category.parentCategory, {})
  childCategories: Category[];

  //relations
  @OneToMany(() => Item, (item) => item.category)
  items: Item[];
}

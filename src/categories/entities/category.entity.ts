import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @ManyToOne(() => Category, (category) => category.childCategories, {
    onDelete: 'CASCADE',
  })
  parentCategory: Category;

  @OneToMany(() => Category, (category) => category.parentCategory, {})
  childCategories: Category[];
}

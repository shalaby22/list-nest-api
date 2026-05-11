import { forwardRef, Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { Category } from './entities/category.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemsModule } from '../items/items.module';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  imports: [
    TypeOrmModule.forFeature([Category]),
    forwardRef(() => ItemsModule),
  ],
  exports: [CategoriesService],
})
export class CategoriesModule {}

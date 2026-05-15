import { CategoriesModule } from './../categories/categories.module';
import { forwardRef, Module } from '@nestjs/common';
import { ItemsService } from './items.service';
import { ItemsController } from './items.controller';
import { Item } from './entities/item.entity';
import { ImageItem } from './entities/image-item.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { HttpModule } from '@nestjs/axios';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { Country } from './entities/country.entity';
import { City } from './entities/city.entity';
import { Region } from './entities/region.entity';
import { ItemsCronService } from './items-cron.service';

@Module({
  controllers: [ItemsController],
  providers: [ItemsService, ItemsCronService],
  imports: [
    TypeOrmModule.forFeature([Item, ImageItem, Country, City, Region]),
    forwardRef(() => CategoriesModule),
    UsersModule,
    HttpModule,
    CloudinaryModule,
  ],
  exports: [ItemsService],
})
export class ItemsModule {}

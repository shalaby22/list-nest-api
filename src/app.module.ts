import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/users.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/entities/category.entity';
import { ItemsModule } from './items/items.module';
import { Item } from './items/entities/item.entity';
import { ImageItem } from './items/entities/image-item.entity';
import { City } from './items/entities/city.entity';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { Country } from './items/entities/country.entity';
import { Region } from './items/entities/region.entity';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      envFilePath: '.env.development.local',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [User, Category, Item, ImageItem, City, Country, Region],
        //warning from synchronize only for development todo
        //todo add PostGIS to postgres in migrations
        //installExtensions - A boolean to control whether to install necessary postgres extensions automatically or not (default: true)
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    CategoriesModule,
    ItemsModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

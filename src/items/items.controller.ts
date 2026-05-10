import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
  ParseIntPipe,
  ClassSerializerInterceptor,
  UseInterceptors,
  Patch,
  ParseArrayPipe,
  Query,
  UsePipes,
  ValidationPipe,
  ParseFloatPipe,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../users/auth/guards/jwt-auth.guard';
import type { JwtPayloadType } from '../utils/types';
import { User } from '../users/auth/decorators/user.decorator';
import { v2 as cloudinary } from 'cloudinary';
import { AddImagesToItemDto } from './dto/add-Images.dto';
import { FindItemsDto } from './dto/find-items-query.dto';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('api/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createItemDto: CreateItemDto,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.itemsService.create(createItemDto, jwtPayload.id);
  }

  //replaced that ; made create and update returns signature
  // //todo add rate limit private
  // @Get('signature/:id')
  // @UseGuards(JwtAuthGuard)
  // getSignature(
  //   @Param('id', ParseIntPipe) id: number,
  //   @User() jwtPayload: JwtPayloadType,
  // ) {
  //   return this.itemsService.getSignature(id, jwtPayload.id);
  // }

  @Patch('images/:id')
  @UseGuards(JwtAuthGuard)
  addImages(
    @Param('id', ParseIntPipe) id: number,
    @Body() addImagesToItemDto: AddImagesToItemDto,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.itemsService.addImagesToItem(
      id,
      addImagesToItemDto,
      jwtPayload.id,
    );
  }

  // @Get()
  // // @UsePipes(new ValidationPipe({ transform: true }))
  // findAll(
  //   @Query('page') page: number,
  //   @Query('sorting') sorting: string,
  //   @Query('search') search: string,
  //   @Query('category') category: string,
  //   @Query('lat', ParseFloatPipe) lat: number,
  //   @Query('lng') lng: number,
  //   @Query('distance') distance: number,
  //   @Query('country') country: string,
  //   @Query('region') region: string,
  //   @Query('place') place: string,
  // ) {
  //   console.log(typeof lat);
  //   console.log(lat);
  //   return this.itemsService.findAll(
  //     page,
  //     sorting,
  //     search,
  //     category,
  //     lat,
  //     lng,
  //     distance,
  //     country,
  //     region,
  //     place,
  //   );
  // }

  @Get()
  findAll(@Query() findItemsDto: FindItemsDto) {
    return this.itemsService.findAll(findItemsDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemDto: UpdateItemDto,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.itemsService.update(id, updateItemDto, jwtPayload);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('id', ParseIntPipe) id: string,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.itemsService.remove(+id, jwtPayload);
  }
}

// عمل اكسبيراشون todo كل شهر cron

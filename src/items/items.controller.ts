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
  Query,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../users/auth/guards/jwt-auth.guard';
import type { JwtPayloadType } from '../utils/types';
import { User } from '../users/auth/decorators/user.decorator';
import { AddImagesToItemDto } from './dto/add-Images.dto';
import { FindItemsDto } from './dto/find-items-query.dto';
import { Roles } from '../users/auth/decorators/roles.decorator';
import { UserType } from '../utils/enums';
import { RolesGuard } from '../users/auth/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('api/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createItemDto: CreateItemDto,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.itemsService.create(createItemDto, jwtPayload.id);
  }

  //replaced that ; made create and update returns signature
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

  @Get()
  findAll(@Query() findItemsDto: FindItemsDto) {
    return this.itemsService.findAll(findItemsDto);
  }

  @Get('admin')
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  findAllForAdmins(@Query() findItemsDto: FindItemsDto) {
    return this.itemsService.findAllForAdmins(findItemsDto);
  }

  //<deprecated> use find all with user query
  // @Get('user/:userId')
  // findItemsByUser(
  //   @Param('userId', ParseIntPipe) userId: number,
  //   @Query('page', new ParseIntPipe({ optional: true })) page: number,
  // ) {
  //   return this.itemsService.findItemsByUser(userId, page);
  // }

  @Get('locations')
  findAllLocations() {
    return this.itemsService.getAllLocations();
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

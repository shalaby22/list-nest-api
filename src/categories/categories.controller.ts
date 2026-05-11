import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from '../users/auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../users/auth/guards/jwt-auth.guard';
import { UserType } from '../utils/enums';
import { RolesGuard } from '../users/auth/guards/roles.guard';
import { FindCategoryItemsDto } from './dto/find-category-items-query.dto';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(+id);
  }

  @Get(':id/items')
  findOneWithItems(
    @Param('id', ParseIntPipe) id: number,
    @Query() findCategoryItemsDto: FindCategoryItemsDto,
  ) {
    return this.categoriesService.findOneWithItems(id, findCategoryItemsDto);
  }

  @Put(':id')
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(+id);
  }
}

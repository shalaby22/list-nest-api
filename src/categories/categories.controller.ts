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
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // =========================================================================

  /**
   * [POST] /api/categories
   * Access: Admin Only
   * Description: Create a new category
   */
  @Post()
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '(Admin only) Create a new category',
  })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  // =========================================================================

  /**
   * [GET] /api/categories
   * Access: Public
   * Description: Get the entire categories tree
   */
  @Get()
  @ApiOperation({ summary: 'Get all categories tree' })
  findAll() {
    return this.categoriesService.findAll();
  }

  // =========================================================================

  /**
   * [GET] /api/categories/:id
   * Access: Public
   * Description: Get a specific category by its ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific category by ID' })
  findOne(@Param('id', ParseIntPipe) id: string) {
    return this.categoriesService.findOne(+id);
  }

  // =========================================================================

  /**
   * [GET] /api/categories/:id/items
   * Access: Public
   * Description: Get all items for a category with pagination & filters
   */
  @Get(':id/items')
  @ApiOperation({
    summary:
      'Get all items belonging to a specific category with pagination and filters',
  })
  findOneWithItems(
    @Param('id', ParseIntPipe) id: number,
    @Query() findCategoryItemsDto: FindCategoryItemsDto,
  ) {
    return this.categoriesService.findOneWithItems(id, findCategoryItemsDto);
  }

  // =========================================================================
  /**
   * [PUT] /api/categories/:id
   * Access: Admin Only
   * Description: Update an existing category by ID
   */

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '(Admin only) Update category by ID',
  })
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(+id, updateCategoryDto);
  }

  // =========================================================================

  /**
   * [DELETE] /api/categories/:id
   * Access: Admin Only
   * Description: Remove a category by ID (Fails if category has items)
   */
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: '(Admin only) Delete category by ID',
  })
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(+id);
  }
}

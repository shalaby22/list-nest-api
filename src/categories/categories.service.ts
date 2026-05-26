import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { IsNull, Repository } from 'typeorm';
import { FindCategoryItemsDto } from './dto/find-category-items-query.dto';
import { ItemsService } from '../items/items.service';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../utils/constants';

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(forwardRef(() => ItemsService))
    private itemsService: ItemsService,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  // =========================================================================

  /**
   * Creates a new category in the database.
   * @param createCategoryDto - The data for the new category
   * @returns The new created category
   */
  public async create(createCategoryDto: CreateCategoryDto) {
    const foundCategory = await this.categoriesRepository.findOneBy({
      title: createCategoryDto.title,
    });
    if (foundCategory)
      throw new BadRequestException('there is a category with the same title');

    const newCategory = new Category();
    newCategory.title = createCategoryDto.title;
    newCategory.description = createCategoryDto.description;
    if (createCategoryDto.parentCategoryId) {
      newCategory.parentCategory = await this.CanCategoryBeParent(
        createCategoryDto.parentCategoryId,
      );
    }
    await this.categoriesRepository.save(newCategory);
    await this.clearCategoriesCache();

    return { category: newCategory };
  }

  // =========================================================================

  /**
   * Get the entire categories tree.
   * Utilizes Redis caching to improve performance.
   * @returns An array containing main and child categories
   */
  async findAll() {
    let cachedData: string | Category[] = (await this.redisClient.get(
      'categories_tree_cache',
    )) as string;

    if (cachedData && typeof cachedData === 'string') {
      cachedData = JSON.parse(cachedData) as Category[];
      // console.log('[Cache] Fetched from Redis');
    } else {
      const categories = await this.categoriesRepository.find({
        where: { parentCategory: IsNull() },
        relations: { childCategories: true },
      });
      await this.redisClient.set(
        'categories_tree_cache',
        JSON.stringify(categories),
        'EX',
        24 * 60 * 60,
      );
      cachedData = categories;
    }
    return { categories: cachedData };
  }

  // =========================================================================

  /**
   * Retrieves a specific category by its ID
   * @param id - The category ID
   * @returns The requested category
   */
  async findOne(id: number) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: {
        childCategories: true,
        parentCategory: true,
      },
    });
    if (!category) throw new NotFoundException('cant find that category');
    return { category };
  }

  // =========================================================================

  /**
   * Updates an existing category.
   * @param id - The ID of the category to update
   * @param updateCategoryDto - The updated data
   * @returns The updated category
   */
  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const { category } = await this.findOne(id);

    if (updateCategoryDto.title && updateCategoryDto.title !== category.title) {
      const foundCategory = await this.categoriesRepository.findOneBy({
        title: updateCategoryDto.title,
      });
      if (foundCategory) {
        throw new BadRequestException(
          'there is a category with the same title',
        );
      } else {
        category.title = updateCategoryDto.title;
      }
    }

    if (updateCategoryDto.parentCategoryId) {
      if (category.childCategories.length) {
        throw new BadRequestException(
          "this category is a parent can't have parentCategoryId",
        );
      }
      category.parentCategory = await this.CanCategoryBeParent(
        updateCategoryDto.parentCategoryId,
      );
    }

    category.description =
      updateCategoryDto.description ?? category.description;

    await this.categoriesRepository.save(category);
    await this.clearCategoriesCache();

    return { category };
  }

  // =========================================================================

  /**
   * Removes a category by ID
   * * @param id - The category ID
   * @returns A success message
   */
  async remove(id: number) {
    const { category } = await this.findOne(id);
    const items = await this.itemsService.findAllForAdmins({ category: id });

    if (items.totalItems) {
      throw new BadRequestException(
        'there are items in that category you have delete them first',
      );
    }
    await this.categoriesRepository.remove(category);
    await this.clearCategoriesCache();
    return { message: 'Category removed successfully' };
  }

  // =========================================================================

  /**
   * GET a specific category along with all its associated items.
   * @param id - The category ID
   * @param findCategoryItemsDto - Pagination and filtering options
   * @returns A paginated list of items belonging to the category
   */
  async findOneWithItems(
    id: number,
    findCategoryItemsDto: FindCategoryItemsDto,
  ) {
    const { category } = await this.findOne(id);
    findCategoryItemsDto['category'] = category.id;
    return this.itemsService.findAll(findCategoryItemsDto);
  }

  // =========================================================================

  /**
   * Helper private function to check if a selected category can act as a parent.
   * @param categoryId - category ID
   * @returns The category if yes
   */
  private async CanCategoryBeParent(categoryId: number) {
    const { category } = await this.findOne(categoryId);
    if (category.parentCategory) {
      throw new BadRequestException('the parent category you chose is a child');
    } else {
      return category;
    }
  }
  // =========================================================================

  /**
   * Helper private function Clears the categories tree cache from Redis.
   */
  private async clearCategoriesCache() {
    await this.redisClient.del('categories_tree_cache');
  }
}

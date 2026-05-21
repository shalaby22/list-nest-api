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

@Injectable()
export class CategoriesService {
  constructor(
    @Inject(forwardRef(() => ItemsService))
    private itemsService: ItemsService,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}
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

    return newCategory;
  }

  findAll() {
    //todo add here caching
    return this.categoriesRepository.find({
      where: { parentCategory: IsNull() },
      relations: {
        childCategories: true,
      },
    });
  }

  async findOne(id: number) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: {
        childCategories: true,
        parentCategory: true,
      },
    });
    if (!category) throw new NotFoundException('cant find that category');
    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);

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

    return category;
  }
  async remove(id: number) {
    const category = await this.findOne(id);
    const items = await this.itemsService.findAllForAdmins({ category: id });

    if (items.totalItems) {
      throw new BadRequestException(
        'there are items in that category you have delete them first',
      );
    }
    await this.categoriesRepository.remove(category);
    return `removed successfully`;
  }

  async findOneWithItems(
    id: number,
    findCategoryItemsDto: FindCategoryItemsDto,
  ) {
    const category = await this.findOne(id);
    findCategoryItemsDto['category'] = category.id;
    return this.itemsService.findAll(findCategoryItemsDto);
  }

  private async CanCategoryBeParent(categoryId: number) {
    const category = await this.findOne(categoryId);
    if (category.parentCategory) {
      throw new BadRequestException('the parent category you chose is a child');
    } else {
      return category;
    }
  }
}

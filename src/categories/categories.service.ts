import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { IsNull, Repository } from 'typeorm';

@Injectable()
export class CategoriesService {
  constructor(
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
    await this.categoriesRepository.remove(category);
    return `removed successfully`;
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

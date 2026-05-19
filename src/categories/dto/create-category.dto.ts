import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'The title of the category',
  })
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(5)
  @ApiProperty({
    example: 'Smartphones, laptops, and other electronic devices',
    description: 'A detailed description of what this category contains',
  })
  description: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty({
    example: 1,
    description: 'The ID of the parent category, if this is a subcategory',
    required: false,
  })
  parentCategoryId?: number;
}

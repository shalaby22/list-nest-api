import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { SortingType } from '../../utils/enums';
import { ApiProperty } from '@nestjs/swagger';

export class FindItemsDto {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  @ApiProperty({ required: false, example: 1 })
  page?: number;

  @ApiProperty({ required: false, enum: SortingType })
  @IsString()
  @IsOptional()
  @IsEnum(SortingType)
  sorting?: SortingType;

  @ApiProperty({ required: false, example: 'iPhone 16' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false, example: 2 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  category?: number;

  @ApiProperty({ required: false, example: 31.2001 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  lng?: number;

  @ApiProperty({ required: false, example: 29.9187 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  lat?: number;

  @ApiProperty({
    required: false,
    example: 50,
    description: 'Search radius distance in kilometers',
  })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  distance?: number;

  @ApiProperty({ required: false, example: 4 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  minPrice?: number;

  @ApiProperty({ required: false, example: 5000 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  maxPrice?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  country?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  region?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  city?: number;
}

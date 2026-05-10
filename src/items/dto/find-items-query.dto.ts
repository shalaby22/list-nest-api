import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { SortingType } from '../../utils/enums';

export class FindItemsDto {
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  page?: number;

  @IsString()
  @IsOptional()
  @IsEnum(SortingType)
  sorting?: SortingType;

  @IsString()
  @IsOptional()
  search?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  category?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  lng?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  lat?: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  distance?: number;

  @IsString()
  @IsOptional()
  country?: number;

  @IsString()
  @IsOptional()
  region?: number;

  @IsString()
  @IsOptional()
  place?: number;
}

import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateItemDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(5)
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  longitude: number;

  @IsNumber()
  latitude: number;

  @IsNumber()
  categoryId: number;
}

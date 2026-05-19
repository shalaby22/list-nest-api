import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString, Min, MinLength } from 'class-validator';

export class CreateItemDto {
  @IsString()
  @MinLength(3)
  @ApiProperty({ example: 'iPhone 16 Pro Max' })
  title: string;

  @IsString()
  @ApiProperty({ example: 'Brand new sealed device, 256GB storage.' })
  @MinLength(5)
  description: string;

  @IsNumber()
  @ApiProperty({ example: 1200 })
  @Min(0)
  price: number;

  @IsNumber()
  @ApiProperty({ example: 31.2001 })
  longitude: number;

  @IsNumber()
  @ApiProperty({ example: 29.9187 })
  latitude: number;

  @IsNumber()
  @ApiProperty({ example: 1 })
  categoryId: number;

  @IsBoolean()
  @ApiProperty({ example: true })
  wantSignature: boolean;
}

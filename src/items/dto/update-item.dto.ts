import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateItemDto } from './create-item.dto';
import { ItemStatusType } from '../../utils/enums';
import { IsArray, IsIn, IsNumber, IsOptional } from 'class-validator';

export class UpdateItemDto extends PartialType(CreateItemDto) {
  @IsIn([ItemStatusType.ACTIVE, ItemStatusType.SOLD])
  @ApiProperty({
    enum: [ItemStatusType.ACTIVE, ItemStatusType.SOLD],
    required: false,
  })
  @IsOptional()
  status?: ItemStatusType;

  @IsArray()
  @ApiProperty({
    example: [1, 2, 3],
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  deletedImagesIds?: number[];
}

import { PartialType } from '@nestjs/swagger';
import { CreateItemDto } from './create-item.dto';
import { ItemStatusType } from '../../utils/enums';
import { IsArray, IsIn, IsNumber, IsOptional } from 'class-validator';

export class UpdateItemDto extends PartialType(CreateItemDto) {
  @IsIn([ItemStatusType.ACTIVE, ItemStatusType.SOLD])
  @IsOptional()
  status?: ItemStatusType;

  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  deletedImagesIds?: number[];
}

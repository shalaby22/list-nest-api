import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { ItemStatusType } from '../../utils/enums';

export class AddImagesToItemDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  imageIds: string[];

  @IsIn([ItemStatusType.ACTIVE])
  @IsOptional()
  status?: ItemStatusType;
}

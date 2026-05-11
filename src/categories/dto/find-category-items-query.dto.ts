import { OmitType } from '@nestjs/swagger';
import { FindItemsDto } from '../../items/dto/find-items-query.dto';

export class FindCategoryItemsDto extends OmitType(FindItemsDto, [
  'category',
] as const) {}

import { ArrayMinSize, IsArray, IsBoolean, IsString } from 'class-validator';

export class AddImagesToItemDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  imageIds: string[];

  @IsBoolean()
  changeDraftToActive: boolean;
}

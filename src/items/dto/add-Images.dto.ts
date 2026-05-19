import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsBoolean, IsString } from 'class-validator';

export class AddImagesToItemDto {
  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty({
    example: ['img_dgs1', 'img_dss2'],
  })
  @IsString({ each: true })
  imageIds: string[];

  @IsBoolean()
  @ApiProperty({ example: true })
  changeDraftToActive: boolean;
}

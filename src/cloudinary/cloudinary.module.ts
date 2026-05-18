import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { deleteImageProcessor } from './queues/deleteImage.processor';
import { BullModule } from '@nestjs/bullmq';
import { deleteFolderProcessor } from './queues/deleteFolder.processor';

@Module({
  providers: [
    {
      provide: 'CLOUDINARY',
      useFactory: (configService: ConfigService) => {
        return cloudinary.config({
          cloud_name: configService.get<string>('CLOUDINARY_NAME'),
          api_key: configService.get<string>('CLOUDINARY_API_KEY'),
          api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
        });
      },
      inject: [ConfigService],
    },
    CloudinaryService,
    deleteImageProcessor,
    deleteFolderProcessor,
  ],
  exports: [CloudinaryService],
  imports: [
    BullModule.registerQueue(
      {
        name: 'deleteImage-queue',
      },
      {
        name: 'deleteFolder-queue',
      },
    ),
  ],
})
export class CloudinaryModule {}

import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { deleteImageProcessor } from './queues/deleteImage.processor';
import { BullModule } from '@nestjs/bullmq';
import { deleteFolderProcessor } from './queues/deleteFolder.processor';
import { QueueCloudinaryEventsService } from './queues/queue-events.service';

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
    QueueCloudinaryEventsService,
  ],
  exports: [CloudinaryService],
  imports: [
    BullModule.registerQueue(
      {
        name: 'deleteImage-queue',
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: 100,
        },
      },
      {
        name: 'deleteFolder-queue',
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: 100,
        },
      },
    ),
  ],
})
export class CloudinaryModule {}

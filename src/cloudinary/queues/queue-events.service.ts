import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueCloudinaryEventsService {
  private readonly logger = new Logger('QueueConnection');

  constructor(
    @InjectQueue('deleteImage-queue')
    private deleteImageQueue: Queue,
    @InjectQueue('deleteFolder-queue')
    private deleteFolderQueue: Queue,
  ) {
    const queues = [this.deleteImageQueue, this.deleteFolderQueue];

    queues.forEach((queue) => {
      queue.on('error', (err) => {
        if (
          err.message.includes('ECONNREFUSED') ||
          err.message.includes('ECONNRESET')
        ) {
          //this.logger.warn( `Queue [${queue.name}] waiting for Redis... Because it is disconnected`);
          return;
        }
        this.logger.error(`Queue [${queue.name}] error: ${err.message}`);
      });
    });
  }
}

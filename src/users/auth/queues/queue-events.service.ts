import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueUsersEventsService {
  private readonly logger = new Logger('QueueConnection');

  constructor(
    @InjectQueue('verifyEmail-queue')
    private emailQueue: Queue,
    @InjectQueue('forgotPassword-queue')
    private emailQueue2: Queue,
  ) {
    const queues = [this.emailQueue, this.emailQueue2];

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

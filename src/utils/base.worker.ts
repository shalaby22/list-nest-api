import { Logger } from '@nestjs/common';
import { OnWorkerEvent, WorkerHost } from '@nestjs/bullmq';

export abstract class BaseWorker extends WorkerHost {
  protected readonly logger = new Logger(this.constructor.name);

  @OnWorkerEvent('error')
  onError(err: Error) {
    if (
      err.message.includes('ECONNRESET') ||
      err.message.includes('ECONNREFUSED')
    ) {
      return;
    }
    this.logger.error(`Bull error: ${err.message}`);
  }

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.log('Bull worker ready');
  }
}

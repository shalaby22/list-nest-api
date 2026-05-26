import { OnWorkerEvent, Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { v2 as cloudinary } from 'cloudinary';
import { BaseWorker } from '../../utils/base.worker';

@Processor('deleteFolder-queue')
export class deleteFolderProcessor extends BaseWorker {
  /**
   * Processes the background job to completely delete a folder from Cloudinary.
   * @param job -folder path
   * @returns A promise that resolves when the folder deletion lifecycle completes
   */
  async process(job: Job<{ folderPath: string }, any, string>): Promise<any> {
    const { folderPath } = job.data;
    this.logger.log(`started deleting folder of  path ${folderPath}`);

    await cloudinary.api.delete_resources_by_prefix(folderPath);
    await cloudinary.api.delete_folder(folderPath);

    this.logger.log(`deleted folder of  path ${folderPath} successfully `);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: any) {
    const error = err as {
      error: {
        http_code?: number;
        message?: string;
      };
    };
    if (error.error.http_code === 404) {
      this.logger.warn(
        `Cannot find that folder to delete of error : ${error.error.message}`,
      );
    } else {
      this.logger.error(`Job ${job?.id} failed with error: ${err}`);
    }
  }
}

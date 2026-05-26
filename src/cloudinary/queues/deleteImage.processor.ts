import { OnWorkerEvent, Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { v2 as cloudinary } from 'cloudinary';
import { BaseWorker } from '../../utils/base.worker';

@Processor('deleteImage-queue')
export class deleteImageProcessor extends BaseWorker {
  /**
   * Processes the background job to delete a specific image from Cloudinary using its Public ID.
   * @param job - the PublicID of image
   * @returns A promise that resolves when the Cloudinary deletion callback executes
   */
  async process(job: Job<{ PublicID: string }, any, string>): Promise<any> {
    const { PublicID } = job.data;
    this.logger.log(`Started deleting image of publicId ${PublicID}`);
    await cloudinary.uploader.destroy(
      PublicID,
      (error: Error, result: { result: string }) => {
        //{ result: 'not found' } or { result: 'ok' } no error if not found
        if (result.result === 'not found') {
          this.logger.warn(`Cannot find image of ${PublicID}`);
        } else if (result.result === 'ok') {
          this.logger.log(`Deleted image of publicId ${PublicID} successfully`);
        } else {
          this.logger.error(
            `Unexpected result while deleting ${PublicID}: ${JSON.stringify(result)}`,
            error ? error.toString() : '',
          );
        }
      },
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job?.id} failed with error: ${err.message}`);
  }
}

import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { v2 as cloudinary } from 'cloudinary';

@Processor('deleteImage-queue')
export class deleteImageProcessor extends WorkerHost {
  async process(job: Job<{ PublicID: string }, any, string>): Promise<any> {
    const { PublicID } = job.data;
    console.log(`started deleting image of of publicId ${PublicID}`);

    await cloudinary.uploader.destroy(
      PublicID,
      (error, result: { result: string }) => {
        //{ result: 'not found' } or { result: 'ok' } no error if not found
        if (result.result === 'not found') {
          console.log(`can not found image of ${PublicID}`);
        } else if (result.result === 'ok') {
          console.log(`deleted image of publicId ${PublicID} successfully `);
        } else {
          console.log(result, error);
        }
      },
    );
    //todo transfer console logs from queues and cron to actual logs
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    console.error(`Job ${job?.id} failed with error:`, err.message);
  }
}

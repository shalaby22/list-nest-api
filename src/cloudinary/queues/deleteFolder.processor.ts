import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { v2 as cloudinary } from 'cloudinary';

@Processor('deleteFolder-queue')
export class deleteFolderProcessor extends WorkerHost {
  async process(job: Job<{ folderPath: string }, any, string>): Promise<any> {
    const { folderPath } = job.data;
    console.log(`started deleting folder of  path ${folderPath}`);

    await cloudinary.api.delete_resources_by_prefix(folderPath);
    await cloudinary.api.delete_folder(folderPath);

    //todo transfer console logs from queues and cron to actual logs
    console.log(`deleted folder of  path ${folderPath} successfully `);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: unknown) {
    const error = err as {
      error: {
        http_code?: number;
        message?: string;
      };
    };
    if (error.error.http_code === 404) {
      console.log(error.error.message);
    } else {
      console.error(`Job ${job?.id} failed with error:`, err);
    }
  }
}

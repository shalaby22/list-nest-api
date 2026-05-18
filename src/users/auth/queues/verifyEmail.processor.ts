import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailJobData } from '../../../utils/interfaces';

@Processor('verifyEmail-queue')
export class verifyEmailProcessor extends WorkerHost {
  constructor(private readonly mailerService: MailerService) {
    super();
  }
  async process(job: Job<EmailJobData, any, string>): Promise<any> {
    const { email, name, url } = job.data;
    console.log(`started sending verify-email email to ${email}`);

    await this.mailerService.sendMail({
      to: email,
      from: `<admin@nestList.com>`,
      subject: 'Welcome to ListNest - Verify Your Account',
      template: 'verify-email',
      context: {
        name: name,
        url,
      },
    });
    //todo transfer console logs from queues and cron to actual logs
    console.log(`sent verify-email successfully to ${email}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    console.error(`Job ${job?.id} failed with error:`, err.message);
  }
}

import { OnWorkerEvent, Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailJobData } from '../../../utils/interfaces';
import { BaseWorker } from '../../../utils/base.worker';

@Processor('verifyEmail-queue')
export class verifyEmailProcessor extends BaseWorker {
  constructor(private readonly mailerService: MailerService) {
    super();
  }
  async process(job: Job<EmailJobData, any, string>): Promise<any> {
    const { email, name, url } = job.data;
    this.logger.log(`Started sending verify-email to ${email}`);
    await this.mailerService.sendMail({
      to: email,
      subject: 'ACCOUNT VERIFICATION - LIST NEST',
      template: 'verify-email',
      context: {
        name: name,
        url,
      },
    });
    this.logger.log(`Sent verify-email successfully to ${email}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    this.logger.error(`Job ${job?.id} failed with error: ${err.message}`);
  }
}

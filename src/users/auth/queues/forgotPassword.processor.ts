import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailJobData } from '../../../utils/interfaces';

@Processor('forgotPassword-queue')
export class ForgotPasswordProcessor extends WorkerHost {
  constructor(private readonly mailerService: MailerService) {
    super();
  }
  async process(job: Job<EmailJobData, any, string>): Promise<any> {
    const { email, name, url } = job.data;
    console.log(`started sending forgot password email to ${email}`);

    await this.mailerService.sendMail({
      to: email,
      subject: 'RESET PASSWORD - LIST NEST',
      template: 'forgot-password',
      context: {
        name: name,
        url: url,
      },
    });
    //todo transfer console logs from queues and cron to actual logs
    console.log(`sent forgot password email successfully to ${email}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error) {
    console.error(`Job ${job?.id} failed with error:`, err.message);
  }
}

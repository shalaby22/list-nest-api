import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EjsAdapter } from '@nestjs-modules/mailer/adapters/ejs.adapter';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          transport: {
            host: config.get<string>('MAIL_HOST'),
            port: config.get<number>('MAIL_Port'),
            secure: false, // todo deployment change to gmail APP and set validation on email registration
            auth: {
              user: config.get<string>('MAIL_Username'),
              pass: config.get<string>('MAIL_Password'),
            },
          },

          template: {
            dir: join(__dirname, 'templates'),
            adapter: new EjsAdapter(),
            options: {
              strict: false,
            },
          },

          defaults: {
            from: '"ListNest" <admin@nestlist.com>',
          },
        };
      },
    }),
  ],
})
export class MailModule {}

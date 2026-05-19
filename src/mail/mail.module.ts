import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EjsAdapter } from '@nestjs-modules/mailer/adapters/ejs.adapter';
import nodemailerSendgrid from 'nodemailer-sendgrid';
@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          transport: nodemailerSendgrid({
            apiKey: config.get<string>('SENDGRID_API_KEY') as string,
          }) as unknown,

          template: {
            dir: join(__dirname, 'templates'),
            adapter: new EjsAdapter(),
            options: {
              strict: false,
            },
          },

          defaults: {
            from: `"ListNest" <${config.get<string>('GMAIL_APP_EMAIL')}>`,
          },
        };
      },
    }),
  ],
})
export class MailModule {}

//  return {
//           transport: {
//             service: 'gmail',
//             // host: config.get<string>('MAIL_HOST'),
//             // port: config.get<number>('MAIL_PORT'),
//             // secure: false, // todo deployment change to gmail APP and set validation on email registration
//             // tls: {
//             //   rejectUnauthorized: false,
//             // },
//             auth: {
//               user: config.get<string>('GMAIL_APP_EMAIL'),
//               pass: config.get<string>('GMAIL_APP_PASSWORD'),
//             },
//           },

//           template: {
//             dir: join(__dirname, 'templates'),
//             adapter: new EjsAdapter(),
//             options: {
//               strict: false,
//             },
//           },

//           defaults: {
//             from: '"ListNest" <admin@nestlist.com>',
//           },
//         };
// return {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
//   // transport: mailjetTransport({
//   //   auth: {
//   //     apiKey: config.get<string>('MAILJET_API_KEY'),
//   //     apiSecret: config.get<string>('MAILJET_Secret_KEY'),
//   //   },
//   // }),

//   template: {
//     dir: join(__dirname, 'templates'),
//     adapter: new EjsAdapter(),
//     options: {
//       strict: false,
//     },
//   },

//   defaults: {
//     from: '<m.messm45@gmail.com>',
//   },
// };
// return {
//   transport: {
//     service: 'gmail',
//     auth: {
//       type: 'OAuth2',
//       user: config.get<string>('GMAIL_APP_EMAIL'),

//       clientId: config.get<string>('GOOGLE_CLIENT_ID'),

//       clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET'),

//       refreshToken: config.get<string>('GOOGLE_REFRESH_TOKEN'),
//     },
//   },

//   template: {
//     dir: join(__dirname, 'templates'),
//     adapter: new EjsAdapter(),
//     options: {
//       strict: false,
//     },
//   },
//   defaults: {
//     from: config.get<string>('GMAIL_APP_EMAIL'),
//   },
// };

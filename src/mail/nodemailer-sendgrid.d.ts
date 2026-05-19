declare module 'nodemailer-sendgrid' {
  import { TransportOptions } from 'nodemailer';

  export default function nodemailerSendgrid(options: {
    apiKey: string;
  }): TransportOptions;
}

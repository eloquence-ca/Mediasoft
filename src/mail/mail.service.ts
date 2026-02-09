import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendDefault(
    to: string | string[],
    subject: string,
    template: string,
    options?: Record<string, any>,
    attachments?: AttachmentMail[],
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject: subject,
        template: `./${template}`,
        context: options,
        attachments,
      });
    } catch (error) {
      console.log('error', error);
    }
  }

  async sendHtml(
    to: string | string[],
    subject: string,
    html: string,
    attachments?: AttachmentMail[],
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject: subject,
        html,
        attachments,
      });
    } catch (error) {
      console.log('error', error);
    }
  }
}

export interface AttachmentMail {
  filename: string;
  content: Buffer;
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(
    name: string,
    email: string,
    verificationToken: string,
    origin: string,
  ): Promise<void> {
    // Encode the email address to ensure special characters like '+' are handled properly
    const encodedEmail = encodeURIComponent(email);

    // Construct the verification URL with the encoded email
    const verifyEmailUrl = `${origin}/user/verify-token?token=${verificationToken}&email=${encodedEmail}`;

    const message = `<p>Please confirm your email by clicking on the following link : <a href="${verifyEmailUrl}">Verify Email</a></p>`;

    const mailOptions = {
      from: `"E-Commerce" <${this.configService.get('AUTH_VERIFICATION_EMAIL')}>`, // sender address
      to: email,
      subject: 'Email Confirmation',
      html: `<h4>Hello, ${name}</h4>${message}`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: %s', info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  async sendResetPasswordEmail(
    name: string,
    email: string,
    token: string,
    origin,
  ) {
    const encodedEmail = encodeURIComponent(email);

    const resetUrl = `${origin}/user/reset-password?token=${token}&email=${encodedEmail}`;
    const message = `<p>Please reset password by clicking on the following link : <a href="${resetUrl}">Reset Password</a></p>`;

    const mailOptions = {
      from: `"E-Commerce" <${this.configService.get('AUTH_VERIFICATION_EMAIL')}>`,
      to: email,
      subject: 'Email Confirmation',
      html: ` <h4>Hello,${name}</h4>${message}`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: %s', info.messageId);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}

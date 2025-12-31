import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.logger.warn('SMTP not configured - emails will be logged only');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    this.logger.log(`Email transporter initialized: ${host}:${port}`);
  }

  async send(options: SendEmailOptions): Promise<EmailResult> {
    const html = this.renderTemplate(options.template, options.data);
    const from = process.env.SMTP_FROM || 'DockPulse <noreply@dockpulse.com>';

    if (!this.transporter) {
      // Log email in development/test mode
      this.logger.log(`[EMAIL] To: ${options.to}`);
      this.logger.log(`[EMAIL] Subject: ${options.subject}`);
      this.logger.log(`[EMAIL] Template: ${options.template}`);
      this.logger.debug(`[EMAIL] HTML: ${html.substring(0, 200)}...`);

      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    }

    try {
      const result = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html,
        attachments: options.attachments,
      });

      this.logger.log(`Email sent to ${options.to}: ${result.messageId}`);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    const templatePath = join(__dirname, '..', 'templates', `${template}.html`);

    let html: string;

    if (existsSync(templatePath)) {
      html = readFileSync(templatePath, 'utf-8');
    } else {
      // Fallback to default template
      html = this.getDefaultTemplate(template, data);
    }

    // Simple template variable replacement
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, String(value ?? ''));
    });

    return html;
  }

  private getDefaultTemplate(template: string, data: Record<string, any>): string {
    const title = data.subject || 'Powiadomienie';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2B579A 0%, #4472C4 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #eee; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; background: #2B579A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">DockPulse</h1>
    </div>
    <div class="content">
      <h2>${title}</h2>
      ${template === 'order-created-admin' ? `
        <p>Otrzymano nowe zamówienie:</p>
        <ul>
          <li><strong>Numer:</strong> {{orderNumber}}</li>
          <li><strong>Klient:</strong> {{customerName}}</li>
          <li><strong>Kwota:</strong> {{totalAmount}} PLN</li>
        </ul>
      ` : ''}
      ${template === 'order-status-changed' ? `
        <p>Status zamówienia <strong>{{orderNumber}}</strong> został zmieniony na:</p>
        <p style="font-size: 18px; font-weight: bold; color: #2B579A;">{{status}}</p>
      ` : ''}
      ${template === 'quote-sent' ? `
        <p>Przygotowaliśmy dla Ciebie wycenę:</p>
        <ul>
          <li><strong>Numer:</strong> {{quoteNumber}}</li>
          <li><strong>Kwota:</strong> {{totalAmount}} PLN</li>
          <li><strong>Ważna do:</strong> {{validUntil}}</li>
        </ul>
        <p><a href="#" class="button">Zobacz wycenę</a></p>
      ` : ''}
      <p>Pozdrawiamy,<br>Zespół DockPulse</p>
    </div>
    <div class="footer">
      <p>DockPulse - Modularna platforma CRM/WMS</p>
      <p>Ten email został wysłany automatycznie.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface SendSmsOptions {
  to: string;
  template: string;
  data: Record<string, any>;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// SMS Templates
const SMS_TEMPLATES: Record<string, string> = {
  'order-created-admin-sms':
    'Nowe zamówienie {{orderNumber}} od {{customerName}}. Kwota: {{totalAmount}} PLN',
  'order-status-changed-sms':
    'Zamówienie {{orderNumber}}: status zmieniony na {{status}}',
  'order-shipped-sms':
    'Zamówienie {{orderNumber}} zostało wysłane. Nr przesyłki: {{trackingNumber}}',
  'quote-accepted-sms':
    'Wycena {{quoteNumber}} została zaakceptowana przez {{customerName}}',
  'customer-welcome-sms':
    'Witamy w {{companyName}}! Twój login: {{phone}}, hasło: {{password}}',
  'password-reset-sms': 'Twój kod resetowania hasła: {{code}}. Ważny przez 15 minut.',
};

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly sender: string;
  private readonly baseUrl = 'https://api.smsapi.pl';

  constructor() {
    this.apiKey = process.env.SMS_API_KEY || '';
    this.sender = process.env.SMS_SENDER || 'DockPulse';

    if (!this.apiKey) {
      this.logger.warn('SMS API key not configured - SMS will be logged only');
    }
  }

  async send(options: SendSmsOptions): Promise<SmsResult> {
    const message = this.renderTemplate(options.template, options.data);
    const phone = this.normalizePhone(options.to);

    if (!phone) {
      return {
        success: false,
        error: 'Invalid phone number',
      };
    }

    if (!this.apiKey) {
      // Log SMS in development/test mode
      this.logger.log(`[SMS] To: ${phone}`);
      this.logger.log(`[SMS] Message: ${message}`);

      return {
        success: true,
        messageId: `dev-sms-${Date.now()}`,
      };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/sms.do`,
        null,
        {
          params: {
            to: phone,
            message,
            from: this.sender,
            format: 'json',
          },
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        },
      );

      if (response.data.error) {
        throw new Error(response.data.message || 'SMS API error');
      }

      const messageId = response.data.list?.[0]?.id || response.data.id;
      this.logger.log(`SMS sent to ${phone}: ${messageId}`);

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${phone}: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    let message = SMS_TEMPLATES[template];

    if (!message) {
      this.logger.warn(`Unknown SMS template: ${template}, using data as message`);
      message = data.message || JSON.stringify(data);
      return message;
    }

    // Replace template variables
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      message = message.replace(regex, String(value ?? ''));
    });

    return message;
  }

  private normalizePhone(phone: string): string | null {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');

    // Handle Polish numbers
    if (cleaned.startsWith('48') && cleaned.length === 11) {
      return cleaned;
    }

    if (cleaned.length === 9) {
      return `48${cleaned}`;
    }

    // Handle other formats
    if (cleaned.length >= 9 && cleaned.length <= 15) {
      return cleaned;
    }

    return null;
  }

  async getBalance(): Promise<number | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/account/balance`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.data.balance;
    } catch {
      return null;
    }
  }
}

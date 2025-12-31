import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { SendNotificationDto } from './dto/send-notification.dto';

export type NotificationChannel = 'email' | 'sms' | 'push';

export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  recipient: string;
  messageId?: string;
  error?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  async send(dto: SendNotificationDto): Promise<NotificationResult> {
    this.logger.log(`Sending ${dto.channel} notification to ${dto.recipient}`);

    try {
      switch (dto.channel) {
        case 'email':
          return await this.sendEmail(dto);
        case 'sms':
          return await this.sendSms(dto);
        case 'push':
          return await this.sendPush(dto);
        default:
          throw new Error(`Unknown channel: ${dto.channel}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      return {
        success: false,
        channel: dto.channel,
        recipient: dto.recipient,
        error: error.message,
      };
    }
  }

  async sendEmail(dto: SendNotificationDto): Promise<NotificationResult> {
    const result = await this.emailService.send({
      to: dto.recipient,
      subject: dto.subject || 'Powiadomienie z DockPulse',
      template: dto.template,
      data: dto.data,
    });

    return {
      success: result.success,
      channel: 'email',
      recipient: dto.recipient,
      messageId: result.messageId,
      error: result.error,
    };
  }

  async sendSms(dto: SendNotificationDto): Promise<NotificationResult> {
    const result = await this.smsService.send({
      to: dto.recipient,
      template: dto.template,
      data: dto.data,
    });

    return {
      success: result.success,
      channel: 'sms',
      recipient: dto.recipient,
      messageId: result.messageId,
      error: result.error,
    };
  }

  async sendPush(dto: SendNotificationDto): Promise<NotificationResult> {
    // Push notifications - to be implemented with web-push
    this.logger.warn('Push notifications not yet implemented');
    return {
      success: false,
      channel: 'push',
      recipient: dto.recipient,
      error: 'Push notifications not yet implemented',
    };
  }

  // Convenience methods for common notifications
  async notifyOrderCreated(order: {
    orderNumber: string;
    customerName: string;
    customerEmail?: string;
    customerPhone?: string;
    totalAmount: number;
    adminEmail: string;
    adminPhone?: string;
  }): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    // Notify admin via email
    results.push(
      await this.send({
        channel: 'email',
        recipient: order.adminEmail,
        subject: `Nowe zamówienie ${order.orderNumber}`,
        template: 'order-created-admin',
        data: order,
      }),
    );

    // Notify admin via SMS if phone provided
    if (order.adminPhone) {
      results.push(
        await this.send({
          channel: 'sms',
          recipient: order.adminPhone,
          template: 'order-created-admin-sms',
          data: order,
        }),
      );
    }

    return results;
  }

  async notifyOrderStatusChanged(order: {
    orderNumber: string;
    status: string;
    customerEmail?: string;
    customerPhone?: string;
  }): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    if (order.customerEmail) {
      results.push(
        await this.send({
          channel: 'email',
          recipient: order.customerEmail,
          subject: `Status zamówienia ${order.orderNumber}: ${order.status}`,
          template: 'order-status-changed',
          data: order,
        }),
      );
    }

    if (order.customerPhone) {
      results.push(
        await this.send({
          channel: 'sms',
          recipient: order.customerPhone,
          template: 'order-status-changed-sms',
          data: order,
        }),
      );
    }

    return results;
  }

  async notifyQuoteSent(quote: {
    quoteNumber: string;
    customerName: string;
    customerEmail: string;
    validUntil: Date;
    totalAmount: number;
  }): Promise<NotificationResult> {
    return this.send({
      channel: 'email',
      recipient: quote.customerEmail,
      subject: `Wycena ${quote.quoteNumber} od DockPulse`,
      template: 'quote-sent',
      data: quote,
    });
  }
}

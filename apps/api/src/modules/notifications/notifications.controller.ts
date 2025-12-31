import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { EmailService } from './services/email.service';
import { SmsService } from './services/sms.service';
import { SendNotificationDto, TestNotificationDto } from './dto/send-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Send a notification' })
  async send(@Body() dto: SendNotificationDto) {
    return this.notificationsService.send(dto);
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test notification' })
  async test(@Body() dto: TestNotificationDto) {
    return this.notificationsService.send({
      ...dto,
      subject: 'Test notification from DockPulse',
      template: dto.channel === 'email' ? 'test-email' : 'test-sms',
      data: {
        message: 'To jest testowa wiadomość z DockPulse.',
        timestamp: new Date().toISOString(),
      },
    });
  }

  @Get('status')
  @ApiOperation({ summary: 'Get notification services status' })
  async getStatus() {
    const emailOk = await this.emailService.verifyConnection();
    const smsBalance = await this.smsService.getBalance();

    return {
      email: {
        configured: emailOk,
        status: emailOk ? 'ok' : 'not_configured',
      },
      sms: {
        configured: smsBalance !== null,
        status: smsBalance !== null ? 'ok' : 'not_configured',
        balance: smsBalance,
      },
      push: {
        configured: false,
        status: 'not_implemented',
      },
    };
  }
}

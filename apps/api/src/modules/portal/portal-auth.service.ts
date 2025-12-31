import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { SmsService } from '../notifications/services/sms.service';

export interface PortalLoginResult {
  access_token: string;
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    company?: string;
    firstLogin: boolean;
  };
}

export interface PortalJwtPayload {
  sub: string;
  type: 'portal';
  tenantId: string;
  phone: string;
}

@Injectable()
export class PortalAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
  ) {}

  async login(
    phone: string,
    password: string,
    tenantId: string,
  ): Promise<PortalLoginResult> {
    const normalizedPhone = this.normalizePhone(phone);

    const customer = await this.prisma.customer.findFirst({
      where: {
        phone: normalizedPhone,
        tenantId,
      },
    });

    if (!customer) {
      throw new UnauthorizedException('Nieprawidłowy numer telefonu lub hasło');
    }

    // Check if customer has portal access
    const portalPassword = (customer as any).portalPassword;
    if (!portalPassword) {
      throw new UnauthorizedException('Konto nie ma dostępu do portalu');
    }

    const isValid = await bcrypt.compare(password, portalPassword);
    if (!isValid) {
      throw new UnauthorizedException('Nieprawidłowy numer telefonu lub hasło');
    }

    const payload: PortalJwtPayload = {
      sub: customer.id,
      type: 'portal',
      tenantId,
      phone: normalizedPhone,
    };

    const access_token = this.jwtService.sign(payload);

    // Check if first login
    const firstLogin = (customer as any).portalFirstLogin ?? true;

    return {
      access_token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || undefined,
        company: customer.company || undefined,
        firstLogin,
      },
    };
  }

  async changePassword(
    customerId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new BadRequestException('Klient nie znaleziony');
    }

    const currentPassword = (customer as any).portalPassword;
    if (!currentPassword) {
      throw new BadRequestException('Konto nie ma dostępu do portalu');
    }

    const isValid = await bcrypt.compare(oldPassword, currentPassword);
    if (!isValid) {
      throw new UnauthorizedException('Aktualne hasło jest nieprawidłowe');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Nowe hasło musi mieć min. 6 znaków');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.customer.update({
      where: { id: customerId },
      data: {
        // Using raw query since these fields might not be in schema yet
      } as any,
    });

    // Update via raw SQL to handle dynamic fields
    await this.prisma.$executeRaw`
      UPDATE customers
      SET portal_password = ${hashedPassword}, portal_first_login = false
      WHERE id = ${customerId}::uuid
    `;
  }

  async createPortalAccess(
    customerId: string,
    tenantId: string,
  ): Promise<{ password: string }> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new BadRequestException('Klient nie znaleziony');
    }

    if (!customer.phone) {
      throw new BadRequestException('Klient nie ma numeru telefonu');
    }

    // Generate random password
    const password = this.generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update customer with portal access
    await this.prisma.$executeRaw`
      UPDATE customers
      SET portal_password = ${hashedPassword}, portal_first_login = true
      WHERE id = ${customerId}::uuid
    `;

    // Send SMS with credentials
    await this.smsService.send({
      to: customer.phone,
      template: 'customer-welcome-sms',
      data: {
        companyName: 'DockPulse',
        phone: customer.phone,
        password,
      },
    });

    return { password };
  }

  async resetPassword(phone: string, tenantId: string): Promise<void> {
    const normalizedPhone = this.normalizePhone(phone);

    const customer = await this.prisma.customer.findFirst({
      where: { phone: normalizedPhone, tenantId },
    });

    if (!customer) {
      // Don't reveal if customer exists
      return;
    }

    // Generate new password
    const newPassword = this.generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$executeRaw`
      UPDATE customers
      SET portal_password = ${hashedPassword}, portal_first_login = true
      WHERE id = ${customer.id}::uuid
    `;

    // Send SMS with new password
    await this.smsService.send({
      to: normalizedPhone,
      template: 'customer-welcome-sms',
      data: {
        companyName: 'DockPulse',
        phone: normalizedPhone,
        password: newPassword,
      },
    });
  }

  validateToken(token: string): PortalJwtPayload | null {
    try {
      return this.jwtService.verify<PortalJwtPayload>(token);
    } catch {
      return null;
    }
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private normalizePhone(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('48') && cleaned.length === 11) {
      return `+${cleaned}`;
    }

    if (cleaned.length === 9) {
      return `+48${cleaned}`;
    }

    if (!cleaned.startsWith('+')) {
      cleaned = `+${cleaned}`;
    }

    return cleaned;
  }
}

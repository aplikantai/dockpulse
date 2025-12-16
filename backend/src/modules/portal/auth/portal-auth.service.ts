import { Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../../infra/db/prisma.js';
import { ClientUser } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Cookie options dla Portal (osobne cookies)
 */
export const PORTAL_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export const portalAuthService = {
  /**
   * Rejestracja klienta
   */
  async register(
    tenantId: string,
    data: {
      email: string;
      password: string;
      name: string;
      phone?: string;
      company?: string;
    }
  ) {
    // Sprawdz czy email juz istnieje
    const existing = await prisma.clientUser.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email: data.email,
        },
      },
    });

    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const clientUser = await prisma.clientUser.create({
      data: {
        tenantId,
        email: data.email,
        passwordHash,
        name: data.name,
        phone: data.phone,
        company: data.company,
      },
    });

    const tokens = this.generateTokenPair(clientUser);

    // Zapisz refresh token
    await prisma.clientRefreshToken.create({
      data: {
        token: this.hashToken(tokens.refreshToken),
        clientUserId: clientUser.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return {
      user: {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name,
      },
      tokens,
    };
  },

  /**
   * Login klienta
   */
  async login(tenantId: string, email: string, password: string) {
    const clientUser = await prisma.clientUser.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });

    if (!clientUser || !clientUser.isActive) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, clientUser.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const tokens = this.generateTokenPair(clientUser);

    await prisma.clientRefreshToken.create({
      data: {
        token: this.hashToken(tokens.refreshToken),
        clientUserId: clientUser.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return {
      user: {
        id: clientUser.id,
        email: clientUser.email,
        name: clientUser.name,
      },
      tokens,
    };
  },

  /**
   * Refresh token
   */
  async refresh(refreshToken: string) {
    const hashedToken = this.hashToken(refreshToken);
    const storedToken = await prisma.clientRefreshToken.findUnique({
      where: { token: hashedToken },
      include: { clientUser: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid refresh token');
    }

    if (!storedToken.clientUser.isActive) {
      throw new Error('User inactive');
    }

    // Rotation
    await prisma.clientRefreshToken.delete({ where: { id: storedToken.id } });

    const tokens = this.generateTokenPair(storedToken.clientUser);

    await prisma.clientRefreshToken.create({
      data: {
        token: this.hashToken(tokens.refreshToken),
        clientUserId: storedToken.clientUserId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return tokens;
  },

  /**
   * Logout
   */
  async logout(refreshToken: string) {
    const hashedToken = this.hashToken(refreshToken);
    await prisma.clientRefreshToken.deleteMany({
      where: { token: hashedToken },
    });
  },

  generateTokenPair(user: Pick<ClientUser, 'id' | 'tenantId' | 'email'>): TokenPair {
    const accessToken = jwt.sign(
      {
        clientUserId: user.id,
        tenantId: user.tenantId,
        email: user.email,
        type: 'portal',
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');
    return { accessToken, refreshToken };
  },

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },
};

export function setPortalAuthCookies(res: Response, tokens: TokenPair): void {
  res.cookie('portal_access_token', tokens.accessToken, {
    ...PORTAL_COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('portal_refresh_token', tokens.refreshToken, {
    ...PORTAL_COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: '/api/portal/auth/refresh',
  });
}

export function clearPortalAuthCookies(res: Response): void {
  res.clearCookie('portal_access_token', PORTAL_COOKIE_OPTIONS);
  res.clearCookie('portal_refresh_token', {
    ...PORTAL_COOKIE_OPTIONS,
    path: '/api/portal/auth/refresh',
  });
}

export default portalAuthService;

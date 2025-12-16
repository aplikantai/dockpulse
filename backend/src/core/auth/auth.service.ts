import { Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../infra/db/prisma.js';
import { User } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 dni

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface LoginResult {
  user: Pick<User, 'id' | 'name' | 'phone'>;
  tokens: TokenPair;
}

/**
 * Cookie options dla httpOnly cookies
 */
export const COOKIE_OPTIONS = {
  httpOnly: true, // KRYTYCZNE: JS nie ma dostepu
  secure: process.env.NODE_ENV === 'production', // HTTPS only w prod
  sameSite: 'strict' as const, // CSRF protection
  path: '/',
};

export const authService = {
  /**
   * Login uzytkownika (pracownika firmy)
   */
  async login(phone: string, password: string): Promise<LoginResult> {
    // Znajdz usera po telefonie
    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        name: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials');
    }

    // Sprawdz haslo
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generuj tokeny
    const tokens = this.generateTokenPair(user);

    // Zapisz refresh token w bazie (zahashowany)
    await prisma.refreshToken.create({
      data: {
        token: this.hashToken(tokens.refreshToken),
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
      },
      tokens,
    };
  },

  /**
   * Refresh token - rotation strategy
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    // Znajdz token w bazie
    const hashedToken = this.hashToken(refreshToken);
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    if (!storedToken.user.isActive) {
      throw new Error('User is inactive');
    }

    // ROTATION: usun stary token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Generuj nowe tokeny
    const newTokens = this.generateTokenPair(storedToken.user);

    // Zapisz nowy refresh token
    await prisma.refreshToken.create({
      data: {
        token: this.hashToken(newTokens.refreshToken),
        userId: storedToken.userId,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    return newTokens;
  },

  /**
   * Logout - usun refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);
    await prisma.refreshToken.deleteMany({
      where: { token: hashedToken },
    });
  },

  /**
   * Logout ze wszystkich urzadzen
   */
  async logoutAll(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  },

  /**
   * Zmiana hasla
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid current password');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Wyloguj ze wszystkich urzadzen
    await this.logoutAll(userId);
  },

  /**
   * Hash hasla
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  },

  /**
   * Generuj pare tokenow
   */
  generateTokenPair(user: Pick<User, 'id' | 'phone'>): TokenPair {
    const accessToken = jwt.sign(
      {
        userId: user.id,
        phone: user.phone,
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = crypto.randomBytes(64).toString('hex');

    return { accessToken, refreshToken };
  },

  /**
   * Hash tokena (dla bezpiecznego przechowywania)
   */
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  },
};

/**
 * Helper do ustawiania cookies w response
 */
export function setAuthCookies(res: Response, tokens: TokenPair): void {
  res.cookie('access_token', tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie('refresh_token', tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: '/api/auth/refresh', // Tylko dla refresh endpoint!
  });
}

/**
 * Helper do czyszczenia cookies
 */
export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', COOKIE_OPTIONS);
  res.clearCookie('refresh_token', { ...COOKIE_OPTIONS, path: '/api/auth/refresh' });
}

export default authService;

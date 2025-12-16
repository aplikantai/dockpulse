import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticateToken, optionalAuth } from '../../middleware/auth.js';
import { authRateLimiter } from '../../middleware/rateLimiter.js';

const router = Router();

// Login - rate limited
router.post('/login', authRateLimiter, authController.login);

// Refresh token
router.post('/refresh', authController.refresh);

// Logout
router.post('/logout', authController.logout);

// Get current user (requires auth)
router.get('/me', optionalAuth, authController.me);

// Change password (requires auth)
router.post('/change-password', authenticateToken, authController.changePassword);

// List user's organizations (requires auth)
router.get('/memberships', authenticateToken, authController.memberships);

export default router;

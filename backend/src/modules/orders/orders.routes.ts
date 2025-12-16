import { Router } from 'express';
import { ordersController } from './orders.controller.js';
import { requireMembership, requireRole, requirePermission } from '../../middleware/rbac.js';

const router = Router();

// Wszystkie endpointy wymagaja membership w tenant
router.use(requireMembership);

// Lista zamowien - wszyscy czlonkowie
router.get('/', ordersController.findAll);

// Szczegoly zamowienia - wszyscy czlonkowie
router.get('/:id', ordersController.findById);

// Utworz zamowienie - wszyscy czlonkowie
router.post('/', ordersController.create);

// Aktualizuj zamowienie - MANAGER+
router.put('/:id', requireRole('OWNER', 'ADMIN', 'MANAGER'), ordersController.update);

// Zmien status - wymaga uprawnienia lub MANAGER+
router.patch(
  '/:id/status',
  requirePermission('ORDER_CHANGE_STATUS'),
  ordersController.updateStatus
);

// Przypisz zamowienie - MANAGER+
router.patch(
  '/:id/assign',
  requireRole('OWNER', 'ADMIN', 'MANAGER'),
  ordersController.assign
);

// Usun zamowienie - tylko OWNER/ADMIN
router.delete('/:id', requireRole('OWNER', 'ADMIN'), ordersController.delete);

// Dodaj komentarz - wszyscy czlonkowie
router.post('/:id/comments', ordersController.addComment);

export default router;

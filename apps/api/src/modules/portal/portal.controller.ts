import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { PortalAuthService } from './portal-auth.service';
import { PortalOrdersService } from './portal-orders.service';
import { PortalQuotesService } from './portal-quotes.service';
import { PortalAuthGuard, PortalRequest } from './guards/portal-auth.guard';
import {
  PortalLoginDto,
  PortalChangePasswordDto,
  PortalResetPasswordDto,
  CreatePortalAccessDto,
} from './dto/portal-auth.dto';
import { CreatePortalOrderDto, RejectQuoteDto } from './dto/portal-order.dto';

@ApiTags('Portal Klienta')
@Controller('portal')
export class PortalController {
  constructor(
    private readonly authService: PortalAuthService,
    private readonly ordersService: PortalOrdersService,
    private readonly quotesService: PortalQuotesService,
  ) {}

  // ============ AUTH ENDPOINTS ============

  @Post('auth/login')
  @ApiOperation({ summary: 'Logowanie klienta do portalu' })
  @ApiHeader({ name: 'x-tenant-id', description: 'ID tenanta' })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: PortalLoginDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    return this.authService.login(dto.phone, dto.password, tenantId);
  }

  @Post('auth/change-password')
  @ApiOperation({ summary: 'Zmiana hasła (wymagane przy pierwszym logowaniu)' })
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() dto: PortalChangePasswordDto,
    @Req() req: PortalRequest,
  ) {
    await this.authService.changePassword(
      req.portalUser.sub,
      dto.oldPassword,
      dto.newPassword,
    );
    return { success: true, message: 'Hasło zostało zmienione' };
  }

  @Post('auth/reset-password')
  @ApiOperation({ summary: 'Reset hasła - wysyła nowe hasło SMS' })
  @ApiHeader({ name: 'x-tenant-id', description: 'ID tenanta' })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() dto: PortalResetPasswordDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    await this.authService.resetPassword(dto.phone, tenantId);
    return {
      success: true,
      message: 'Jeśli numer jest zarejestrowany, nowe hasło zostanie wysłane SMS',
    };
  }

  @Get('auth/me')
  @ApiOperation({ summary: 'Dane zalogowanego klienta' })
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async getMe(@Req() req: PortalRequest) {
    return {
      customerId: req.portalUser.sub,
      phone: req.portalUser.phone,
      tenantId: req.portalUser.tenantId,
    };
  }

  // ============ ORDERS ENDPOINTS ============

  @Get('orders')
  @ApiOperation({ summary: 'Lista zamówień klienta' })
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async getMyOrders(@Req() req: PortalRequest) {
    return this.ordersService.getMyOrders(
      req.portalUser.sub,
      req.portalUser.tenantId,
    );
  }

  @Get('orders/stats')
  @ApiOperation({ summary: 'Statystyki zamówień klienta' })
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async getOrderStats(@Req() req: PortalRequest) {
    return this.ordersService.getOrderStats(
      req.portalUser.sub,
      req.portalUser.tenantId,
    );
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Szczegóły zamówienia' })
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async getOrder(@Param('id') id: string, @Req() req: PortalRequest) {
    return this.ordersService.getOrder(
      id,
      req.portalUser.sub,
      req.portalUser.tenantId,
    );
  }

  @Post('orders')
  @ApiOperation({ summary: 'Złożenie nowego zamówienia' })
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async createOrder(
    @Body() dto: CreatePortalOrderDto,
    @Req() req: PortalRequest,
  ) {
    return this.ordersService.createOrder(
      req.portalUser.sub,
      req.portalUser.tenantId,
      dto,
    );
  }

  // ============ QUOTES ENDPOINTS ============

  @Get('quotes')
  @ApiOperation({ summary: 'Lista wycen klienta' })
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async getMyQuotes(@Req() req: PortalRequest) {
    return this.quotesService.getMyQuotes(
      req.portalUser.sub,
      req.portalUser.tenantId,
    );
  }

  @Get('quotes/:id')
  @ApiOperation({ summary: 'Szczegóły wyceny' })
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async getQuote(@Param('id') id: string, @Req() req: PortalRequest) {
    return this.quotesService.getQuote(
      id,
      req.portalUser.sub,
      req.portalUser.tenantId,
    );
  }

  @Post('quotes/:id/accept')
  @ApiOperation({ summary: 'Akceptacja wyceny - tworzy zamówienie' })
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async acceptQuote(@Param('id') id: string, @Req() req: PortalRequest) {
    return this.quotesService.acceptQuote(
      id,
      req.portalUser.sub,
      req.portalUser.tenantId,
    );
  }

  @Post('quotes/:id/reject')
  @ApiOperation({ summary: 'Odrzucenie wyceny' })
  @ApiBearerAuth()
  @UseGuards(PortalAuthGuard)
  async rejectQuote(
    @Param('id') id: string,
    @Body() dto: RejectQuoteDto,
    @Req() req: PortalRequest,
  ) {
    return this.quotesService.rejectQuote(
      id,
      req.portalUser.sub,
      req.portalUser.tenantId,
      dto.reason,
    );
  }

  // ============ ADMIN ENDPOINTS (for creating portal access) ============

  @Post('admin/create-access')
  @ApiOperation({ summary: 'Utworzenie dostępu do portalu dla klienta (admin)' })
  @ApiHeader({ name: 'x-tenant-id', description: 'ID tenanta' })
  async createPortalAccess(
    @Body() dto: CreatePortalAccessDto,
    @Headers('x-tenant-id') tenantId: string,
  ) {
    // Note: In production, this should be protected by admin auth guard
    return this.authService.createPortalAccess(dto.customerId, tenantId);
  }
}

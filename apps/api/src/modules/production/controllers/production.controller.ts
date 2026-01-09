import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole, ProductionPlanStatus, PreorderSlotStatus } from '@prisma/client';
import { PlanningService } from '../services/planning.service';
import { ConversionService } from '../services/conversion.service';
import { PreorderService } from '../services/preorder.service';
import {
  CreatePlanDto,
  UpdatePlanDto,
  CreatePlanItemDto,
  UpdatePlanItemDto,
  ProducePlanItemDto,
  GeneratePlanFromOrdersDto,
} from '../dto/plan.dto';
import { CreateConversionDto, UpdateConversionDto, ConvertUnitsDto } from '../dto/conversion.dto';
import {
  CreatePreorderSlotDto,
  UpdatePreorderSlotDto,
  AddOrderToSlotDto,
  GenerateSlotsDto,
} from '../dto/preorder.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('production')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductionController {
  constructor(
    private readonly planningService: PlanningService,
    private readonly conversionService: ConversionService,
    private readonly preorderService: PreorderService,
  ) {}

  // ============================================
  // PRODUCTION PLANS
  // ============================================

  @Get('plans')
  async getPlans(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: ProductionPlanStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');

    return this.planningService.findAll(tenantId, {
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('plans/date/:date')
  async getPlanByDate(
    @Headers('x-tenant-id') tenantId: string,
    @Param('date') date: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.findByDate(tenantId, new Date(date));
  }

  @Get('plans/:id')
  async getPlan(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.findOne(tenantId, id);
  }

  @Post('plans')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async createPlan(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreatePlanDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.create(tenantId, user.id, dto);
  }

  @Post('plans/generate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async generatePlanFromOrders(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: GeneratePlanFromOrdersDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.generateFromOrders(tenantId, user.id, dto);
  }

  @Put('plans/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async updatePlan(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePlanDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.update(tenantId, id, dto);
  }

  @Post('plans/:id/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async addPlanItem(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() item: CreatePlanItemDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.addItem(tenantId, id, item);
  }

  @Put('plans/:id/items/:itemId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async updatePlanItem(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePlanItemDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.updateItem(tenantId, id, itemId, dto);
  }

  @Delete('plans/:id/items/:itemId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async removePlanItem(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.removeItem(tenantId, id, itemId);
  }

  @Post('plans/:id/confirm')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async confirmPlan(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.confirm(tenantId, id, user.id);
  }

  @Post('plans/:id/start')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async startPlan(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.start(tenantId, id, user.id);
  }

  @Post('plans/:id/produce')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async produceItem(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ProducePlanItemDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.produceItem(tenantId, id, user.id, dto);
  }

  @Post('plans/:id/complete')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async completePlan(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.complete(tenantId, id, user.id);
  }

  @Post('plans/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async cancelPlan(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('reason') reason?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.planningService.cancel(tenantId, id, user.id, reason);
  }

  // ============================================
  // UNIT CONVERSIONS
  // ============================================

  @Get('conversions')
  async getConversions(
    @Headers('x-tenant-id') tenantId: string,
    @Query('productId') productId?: string,
    @Query('fromUnit') fromUnit?: string,
    @Query('toUnit') toUnit?: string,
    @Query('active') active?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');

    return this.conversionService.findAll(tenantId, {
      productId: productId === 'null' ? null : productId,
      fromUnit,
      toUnit,
      isActive: active === 'true' ? true : active === 'false' ? false : undefined,
    });
  }

  @Get('conversions/:id')
  async getConversion(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.conversionService.findOne(tenantId, id);
  }

  @Post('conversions')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async createConversion(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateConversionDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.conversionService.create(tenantId, dto);
  }

  @Put('conversions/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async updateConversion(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateConversionDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.conversionService.update(tenantId, id, dto);
  }

  @Delete('conversions/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async deleteConversion(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.conversionService.delete(tenantId, id);
  }

  @Post('conversions/convert')
  async convert(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: ConvertUnitsDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.conversionService.convert(tenantId, dto);
  }

  @Post('conversions/seed-defaults')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async seedDefaultConversions(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.conversionService.seedDefaultConversions(tenantId);
  }

  // ============================================
  // PREORDER SLOTS
  // ============================================

  @Get('preorder/slots')
  async getPreorderSlots(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: PreorderSlotStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');

    return this.preorderService.findAll(tenantId, {
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('preorder/slots/available')
  async getAvailableSlots(
    @Headers('x-tenant-id') tenantId: string,
    @Query('days') days?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.preorderService.findAvailable(tenantId, days ? parseInt(days, 10) : 60);
  }

  @Get('preorder/slots/date/:date')
  async getSlotByDate(
    @Headers('x-tenant-id') tenantId: string,
    @Param('date') date: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.preorderService.findByDate(tenantId, new Date(date));
  }

  @Get('preorder/slots/:id')
  async getPreorderSlot(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.preorderService.findOne(tenantId, id);
  }

  @Post('preorder/slots')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async createPreorderSlot(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreatePreorderSlotDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.preorderService.create(tenantId, dto);
  }

  @Post('preorder/slots/generate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async generateSlots(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: GenerateSlotsDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.preorderService.generateSlots(tenantId, dto);
  }

  @Put('preorder/slots/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async updatePreorderSlot(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePreorderSlotDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.preorderService.update(tenantId, id, dto);
  }

  @Delete('preorder/slots/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async deletePreorderSlot(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.preorderService.delete(tenantId, id);
  }

  @Post('preorder/slots/:id/orders')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async addOrderToSlot(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: AddOrderToSlotDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.preorderService.addOrder(tenantId, id, dto);
  }

  @Delete('preorder/slots/:id/orders/:orderId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async removeOrderFromSlot(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Param('orderId') orderId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.preorderService.removeOrder(tenantId, id, orderId);
  }

  @Post('preorder/slots/:id/close')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async closeSlot(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.preorderService.close(tenantId, id, user.id);
  }

  @Post('preorder/slots/:id/complete')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async completeSlot(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.preorderService.complete(tenantId, id);
  }

  @Post('preorder/auto-close')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async autoCloseExpiredSlots(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.preorderService.autoCloseExpiredSlots(tenantId);
  }
}

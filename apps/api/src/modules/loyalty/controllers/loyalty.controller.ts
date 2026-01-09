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
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PointsService } from '../services/points.service';
import { DiscountCodeService } from '../services/discount-code.service';
import { TierService } from '../services/tier.service';
import {
  CreateLoyaltyProgramDto,
  UpdateLoyaltyProgramDto,
} from '../dto/loyalty-program.dto';
import {
  CreateLoyaltyTierDto,
  UpdateLoyaltyTierDto,
} from '../dto/loyalty-tier.dto';
import {
  EnrollCustomerDto,
  AwardPointsDto,
  RedeemPointsDto,
  AdjustPointsDto,
} from '../dto/points.dto';
import {
  CreateDiscountCodeDto,
  UpdateDiscountCodeDto,
  ValidateDiscountCodeDto,
  ApplyDiscountCodeDto,
  GenerateCodesDto,
  DiscountCodeStatusDto,
  DiscountCodeTypeDto,
} from '../dto/discount-code.dto';

/**
 * LoyaltyController - REST API for Loyalty Module
 *
 * Base path: /api/loyalty
 */
@Controller('loyalty')
export class LoyaltyController {
  constructor(
    private readonly pointsService: PointsService,
    private readonly discountCodeService: DiscountCodeService,
    private readonly tierService: TierService,
  ) {}

  // ============================================
  // PROGRAM CONFIGURATION
  // ============================================

  /**
   * GET /api/loyalty/program
   * Get loyalty program configuration
   */
  @Get('program')
  async getProgram(@Headers('x-tenant-id') tenantId: string) {
    this.validateTenantId(tenantId);
    return this.pointsService.getOrCreateProgram(tenantId);
  }

  /**
   * GET /api/loyalty/summary
   * Get loyalty program summary/dashboard
   */
  @Get('summary')
  async getSummary(@Headers('x-tenant-id') tenantId: string) {
    this.validateTenantId(tenantId);
    return this.pointsService.getLoyaltySummary(tenantId);
  }

  // ============================================
  // TIERS
  // ============================================

  /**
   * GET /api/loyalty/tiers
   * List all tiers
   */
  @Get('tiers')
  async listTiers(
    @Headers('x-tenant-id') tenantId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    this.validateTenantId(tenantId);
    return this.tierService.list(tenantId, includeInactive === 'true');
  }

  /**
   * GET /api/loyalty/tiers/:id
   * Get tier by ID
   */
  @Get('tiers/:id')
  async getTier(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') tierId: string,
  ) {
    this.validateTenantId(tenantId);
    return this.tierService.getById(tenantId, tierId);
  }

  /**
   * POST /api/loyalty/tiers
   * Create new tier
   */
  @Post('tiers')
  async createTier(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateLoyaltyTierDto,
  ) {
    this.validateTenantId(tenantId);
    return this.tierService.create(tenantId, dto);
  }

  /**
   * PUT /api/loyalty/tiers/:id
   * Update tier
   */
  @Put('tiers/:id')
  async updateTier(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') tierId: string,
    @Body() dto: UpdateLoyaltyTierDto,
  ) {
    this.validateTenantId(tenantId);
    return this.tierService.update(tenantId, tierId, dto);
  }

  /**
   * DELETE /api/loyalty/tiers/:id
   * Delete tier
   */
  @Delete('tiers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTier(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') tierId: string,
  ) {
    this.validateTenantId(tenantId);
    await this.tierService.delete(tenantId, tierId);
  }

  /**
   * POST /api/loyalty/tiers/defaults
   * Create default tiers (Bronze, Silver, Gold, Platinum)
   */
  @Post('tiers/defaults')
  async createDefaultTiers(@Headers('x-tenant-id') tenantId: string) {
    this.validateTenantId(tenantId);
    return this.tierService.createDefaultTiers(tenantId);
  }

  /**
   * POST /api/loyalty/tiers/reorder
   * Reorder tiers
   */
  @Post('tiers/reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reorderTiers(
    @Headers('x-tenant-id') tenantId: string,
    @Body('tierIds') tierIds: string[],
  ) {
    this.validateTenantId(tenantId);
    await this.tierService.reorder(tenantId, tierIds);
  }

  /**
   * POST /api/loyalty/tiers/recalculate
   * Recalculate all customer tiers
   */
  @Post('tiers/recalculate')
  async recalculateTiers(@Headers('x-tenant-id') tenantId: string) {
    this.validateTenantId(tenantId);
    return this.tierService.recalculateAllTiers(tenantId);
  }

  // ============================================
  // CUSTOMER LOYALTY
  // ============================================

  /**
   * GET /api/loyalty/customers/:customerId
   * Get customer loyalty status
   */
  @Get('customers/:customerId')
  async getCustomerLoyalty(
    @Headers('x-tenant-id') tenantId: string,
    @Param('customerId') customerId: string,
  ) {
    this.validateTenantId(tenantId);
    return this.pointsService.getCustomerLoyalty(tenantId, customerId);
  }

  /**
   * POST /api/loyalty/customers/enroll
   * Enroll customer in loyalty program
   */
  @Post('customers/enroll')
  async enrollCustomer(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: EnrollCustomerDto,
  ) {
    this.validateTenantId(tenantId);
    return this.pointsService.enrollCustomer(tenantId, dto.customerId);
  }

  /**
   * GET /api/loyalty/customers/:customerId/transactions
   * Get customer points transaction history
   */
  @Get('customers/:customerId/transactions')
  async getCustomerTransactions(
    @Headers('x-tenant-id') tenantId: string,
    @Param('customerId') customerId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.validateTenantId(tenantId);
    return this.pointsService.getCustomerTransactions(
      tenantId,
      customerId,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }

  /**
   * GET /api/loyalty/customers/:customerId/tier-benefits
   * Get customer's tier benefits
   */
  @Get('customers/:customerId/tier-benefits')
  async getCustomerTierBenefits(
    @Headers('x-tenant-id') tenantId: string,
    @Param('customerId') customerId: string,
  ) {
    this.validateTenantId(tenantId);
    return this.tierService.getCustomerTierBenefits(tenantId, customerId);
  }

  // ============================================
  // POINTS OPERATIONS
  // ============================================

  /**
   * POST /api/loyalty/points/award
   * Award points to customer
   */
  @Post('points/award')
  async awardPoints(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: AwardPointsDto,
  ) {
    this.validateTenantId(tenantId);
    return this.pointsService.awardPoints(tenantId, dto, userId);
  }

  /**
   * POST /api/loyalty/points/redeem
   * Redeem customer points
   */
  @Post('points/redeem')
  async redeemPoints(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: RedeemPointsDto,
  ) {
    this.validateTenantId(tenantId);
    return this.pointsService.redeemPoints(tenantId, dto, userId);
  }

  /**
   * POST /api/loyalty/points/adjust
   * Manually adjust customer points
   */
  @Post('points/adjust')
  async adjustPoints(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Headers('x-user-name') userName: string,
    @Body() dto: AdjustPointsDto,
  ) {
    this.validateTenantId(tenantId);
    return this.pointsService.adjustPoints(tenantId, dto, userId, userName);
  }

  /**
   * POST /api/loyalty/points/calculate
   * Calculate points for an order
   */
  @Post('points/calculate')
  async calculatePoints(
    @Headers('x-tenant-id') tenantId: string,
    @Body('customerId') customerId: string,
    @Body('orderValue') orderValue: number,
  ) {
    this.validateTenantId(tenantId);
    return this.pointsService.calculatePointsForOrder(tenantId, customerId, orderValue);
  }

  /**
   * POST /api/loyalty/points/redemption-calculate
   * Calculate redemption options for an order
   */
  @Post('points/redemption-calculate')
  async calculateRedemption(
    @Headers('x-tenant-id') tenantId: string,
    @Body('customerId') customerId: string,
    @Body('orderValue') orderValue: number,
  ) {
    this.validateTenantId(tenantId);
    return this.pointsService.calculateRedemption(tenantId, customerId, orderValue);
  }

  // ============================================
  // DISCOUNT CODES
  // ============================================

  /**
   * GET /api/loyalty/codes
   * List discount codes
   */
  @Get('codes')
  async listCodes(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: DiscountCodeStatusDto,
    @Query('type') type?: DiscountCodeTypeDto,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    this.validateTenantId(tenantId);
    return this.discountCodeService.list(tenantId, {
      status,
      type,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * GET /api/loyalty/codes/summary
   * Get discount codes summary
   */
  @Get('codes/summary')
  async getCodesSummary(@Headers('x-tenant-id') tenantId: string) {
    this.validateTenantId(tenantId);
    return this.discountCodeService.getSummary(tenantId);
  }

  /**
   * GET /api/loyalty/codes/:id
   * Get discount code by ID
   */
  @Get('codes/:id')
  async getCode(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') codeId: string,
  ) {
    this.validateTenantId(tenantId);
    return this.discountCodeService.getById(tenantId, codeId);
  }

  /**
   * GET /api/loyalty/codes/by-code/:code
   * Get discount code by code string
   */
  @Get('codes/by-code/:code')
  async getByCode(
    @Headers('x-tenant-id') tenantId: string,
    @Param('code') code: string,
  ) {
    this.validateTenantId(tenantId);
    return this.discountCodeService.getByCode(tenantId, code);
  }

  /**
   * POST /api/loyalty/codes
   * Create discount code
   */
  @Post('codes')
  async createCode(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: CreateDiscountCodeDto,
  ) {
    this.validateTenantId(tenantId);
    return this.discountCodeService.create(tenantId, dto, userId);
  }

  /**
   * PUT /api/loyalty/codes/:id
   * Update discount code
   */
  @Put('codes/:id')
  async updateCode(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') codeId: string,
    @Body() dto: UpdateDiscountCodeDto,
  ) {
    this.validateTenantId(tenantId);
    return this.discountCodeService.update(tenantId, codeId, dto);
  }

  /**
   * DELETE /api/loyalty/codes/:id
   * Delete discount code
   */
  @Delete('codes/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCode(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') codeId: string,
  ) {
    this.validateTenantId(tenantId);
    await this.discountCodeService.delete(tenantId, codeId);
  }

  /**
   * POST /api/loyalty/codes/validate
   * Validate discount code for order
   */
  @Post('codes/validate')
  async validateCode(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: ValidateDiscountCodeDto,
  ) {
    this.validateTenantId(tenantId);
    return this.discountCodeService.validate(tenantId, dto);
  }

  /**
   * POST /api/loyalty/codes/apply
   * Apply discount code to order
   */
  @Post('codes/apply')
  async applyCode(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: ApplyDiscountCodeDto,
  ) {
    this.validateTenantId(tenantId);
    return this.discountCodeService.apply(tenantId, dto);
  }

  /**
   * POST /api/loyalty/codes/generate
   * Generate multiple discount codes
   */
  @Post('codes/generate')
  async generateCodes(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() dto: GenerateCodesDto,
  ) {
    this.validateTenantId(tenantId);
    return this.discountCodeService.generateBulk(tenantId, dto, userId);
  }

  /**
   * POST /api/loyalty/codes/update-expired
   * Update status of expired codes
   */
  @Post('codes/update-expired')
  async updateExpiredCodes(@Headers('x-tenant-id') tenantId: string) {
    this.validateTenantId(tenantId);
    const count = await this.discountCodeService.updateExpiredStatus(tenantId);
    return { updated: count };
  }

  // ============================================
  // HELPERS
  // ============================================

  private validateTenantId(tenantId: string): void {
    if (!tenantId) {
      throw new BadRequestException('x-tenant-id header is required');
    }
  }
}

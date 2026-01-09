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
import { UserRole, PriceTableType, SurchargeType } from '@prisma/client';
import { PriceTableService } from '../services/price-table.service';
import { SurchargeService } from '../services/surcharge.service';
import { MarginCalculatorService } from '../services/margin-calculator.service';
import { PriceResolverService } from '../services/price-resolver.service';
import {
  CreatePriceCategoryDto,
  UpdatePriceCategoryDto,
  CreatePriceTableDto,
  UpdatePriceTableDto,
  CreatePriceTableEntryDto,
  UpdatePriceTableEntryDto,
  BulkCreatePriceTableEntriesDto,
  GetPriceDto,
  GetPricesDto,
} from '../dto/price-table.dto';
import {
  CreateSurchargeDto,
  UpdateSurchargeDto,
  CalculateSurchargeDto,
  CalculateSurchargesDto,
} from '../dto/surcharge.dto';
import {
  CreateProductCostDto,
  UpdateProductCostDto,
  CreateCustomerPricingDto,
  UpdateCustomerPricingDto,
  CalculateMarginDto,
  CalculateSalePriceDto,
} from '../dto/product-cost.dto';

@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PricingController {
  constructor(
    private readonly priceTableService: PriceTableService,
    private readonly surchargeService: SurchargeService,
    private readonly marginCalculatorService: MarginCalculatorService,
    private readonly priceResolverService: PriceResolverService,
  ) {}

  // ============================================
  // PRICE CATEGORIES
  // ============================================

  @Get('categories')
  async getCategories(
    @Headers('x-tenant-id') tenantId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.findAllCategories(tenantId, includeInactive === 'true');
  }

  @Get('categories/:id')
  async getCategory(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.findCategoryById(tenantId, id);
  }

  @Post('categories')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async createCategory(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreatePriceCategoryDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.createCategory(tenantId, dto);
  }

  @Put('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async updateCategory(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePriceCategoryDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.updateCategory(tenantId, id, dto);
  }

  @Delete('categories/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async deleteCategory(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.deleteCategory(tenantId, id);
  }

  // ============================================
  // PRICE TABLES
  // ============================================

  @Get('tables')
  async getTables(
    @Headers('x-tenant-id') tenantId: string,
    @Query('categoryId') categoryId?: string,
    @Query('priceType') priceType?: PriceTableType,
    @Query('isActive') isActive?: string,
    @Query('validAt') validAt?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');

    return this.priceTableService.findAllTables(tenantId, {
      categoryId,
      priceType,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      validAt: validAt ? new Date(validAt) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('tables/default')
  async getDefaultTable(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.findDefaultTable(tenantId);
  }

  @Get('tables/:id')
  async getTable(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.findTableById(tenantId, id);
  }

  @Get('tables/code/:code')
  async getTableByCode(@Headers('x-tenant-id') tenantId: string, @Param('code') code: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.findTableByCode(tenantId, code);
  }

  @Post('tables')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async createTable(@Headers('x-tenant-id') tenantId: string, @Body() dto: CreatePriceTableDto) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.createTable(tenantId, dto);
  }

  @Put('tables/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async updateTable(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePriceTableDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.updateTable(tenantId, id, dto);
  }

  @Delete('tables/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async deleteTable(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.deleteTable(tenantId, id);
  }

  @Post('tables/:id/duplicate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async duplicateTable(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body('code') code: string,
    @Body('name') name: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.duplicateTable(tenantId, id, code, name);
  }

  @Post('tables/:id/adjust-prices')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async adjustPrices(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body('adjustmentPercent') adjustmentPercent: number,
    @Body('productIds') productIds?: string[],
    @Body('roundTo') roundTo?: number,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.bulkUpdatePrices(tenantId, id, adjustmentPercent, {
      productIds,
      roundTo,
    });
  }

  // ============================================
  // PRICE TABLE ENTRIES
  // ============================================

  @Get('tables/:tableId/entries')
  async getEntries(
    @Headers('x-tenant-id') tenantId: string,
    @Param('tableId') tableId: string,
    @Query('productId') productId?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');

    return this.priceTableService.findEntriesByTable(tenantId, tableId, {
      productId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Post('tables/:tableId/entries')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async createEntry(
    @Headers('x-tenant-id') tenantId: string,
    @Param('tableId') tableId: string,
    @Body() dto: CreatePriceTableEntryDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.createEntry(tenantId, tableId, dto);
  }

  @Post('tables/:tableId/entries/bulk')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async bulkCreateEntries(
    @Headers('x-tenant-id') tenantId: string,
    @Param('tableId') tableId: string,
    @Body() dto: BulkCreatePriceTableEntriesDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.bulkCreateEntries(tenantId, tableId, dto);
  }

  @Put('tables/:tableId/entries/:entryId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async updateEntry(
    @Headers('x-tenant-id') tenantId: string,
    @Param('tableId') tableId: string,
    @Param('entryId') entryId: string,
    @Body() dto: UpdatePriceTableEntryDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.updateEntry(tenantId, tableId, entryId, dto);
  }

  @Delete('tables/:tableId/entries/:entryId')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async deleteEntry(
    @Headers('x-tenant-id') tenantId: string,
    @Param('tableId') tableId: string,
    @Param('entryId') entryId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceTableService.deleteEntry(tenantId, tableId, entryId);
  }

  // ============================================
  // SURCHARGES
  // ============================================

  @Get('surcharges')
  async getSurcharges(
    @Headers('x-tenant-id') tenantId: string,
    @Query('type') type?: SurchargeType,
    @Query('isActive') isActive?: string,
    @Query('isRequired') isRequired?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');

    return this.surchargeService.findAll(tenantId, {
      type,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      isRequired: isRequired === 'true' ? true : isRequired === 'false' ? false : undefined,
    });
  }

  @Get('surcharges/:id')
  async getSurcharge(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.surchargeService.findOne(tenantId, id);
  }

  @Post('surcharges')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async createSurcharge(@Headers('x-tenant-id') tenantId: string, @Body() dto: CreateSurchargeDto) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.surchargeService.create(tenantId, dto);
  }

  @Put('surcharges/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async updateSurcharge(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSurchargeDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.surchargeService.update(tenantId, id, dto);
  }

  @Delete('surcharges/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async deleteSurcharge(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.surchargeService.delete(tenantId, id);
  }

  @Post('surcharges/calculate')
  async calculateSurcharge(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CalculateSurchargeDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.surchargeService.calculateSingle(tenantId, dto);
  }

  @Post('surcharges/calculate-multiple')
  async calculateSurcharges(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CalculateSurchargesDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.surchargeService.calculateMultiple(tenantId, dto);
  }

  @Post('surcharges/seed-defaults')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async seedDefaultSurcharges(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.surchargeService.seedDefaults(tenantId);
  }

  // ============================================
  // PRODUCT COSTS
  // ============================================

  @Get('costs')
  async getProductCosts(
    @Headers('x-tenant-id') tenantId: string,
    @Query('productId') productId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('isActive') isActive?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');

    return this.marginCalculatorService.findAllProductCosts(tenantId, {
      productId,
      categoryId,
      supplierId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('costs/:id')
  async getProductCost(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.marginCalculatorService.findProductCost(tenantId, id);
  }

  @Post('costs')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async createProductCost(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateProductCostDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.marginCalculatorService.createProductCost(tenantId, dto);
  }

  @Put('costs/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async updateProductCost(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductCostDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.marginCalculatorService.updateProductCost(tenantId, id, dto);
  }

  @Delete('costs/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async deleteProductCost(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.marginCalculatorService.deleteProductCost(tenantId, id);
  }

  // ============================================
  // CUSTOMER PRICING
  // ============================================

  @Get('customers/:customerId/pricing')
  async getCustomerPricing(
    @Headers('x-tenant-id') tenantId: string,
    @Param('customerId') customerId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.marginCalculatorService.findCustomerPricing(tenantId, customerId);
  }

  @Post('customers/:customerId/pricing')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async createCustomerPricing(
    @Headers('x-tenant-id') tenantId: string,
    @Param('customerId') customerId: string,
    @Body() dto: CreateCustomerPricingDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.marginCalculatorService.createCustomerPricing(tenantId, {
      ...dto,
      customerId,
    });
  }

  @Put('customers/:customerId/pricing')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async updateCustomerPricing(
    @Headers('x-tenant-id') tenantId: string,
    @Param('customerId') customerId: string,
    @Body() dto: UpdateCustomerPricingDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.marginCalculatorService.updateCustomerPricing(tenantId, customerId, dto);
  }

  // ============================================
  // MARGIN CALCULATIONS
  // ============================================

  @Post('margin/calculate')
  async calculateMargin(@Headers('x-tenant-id') tenantId: string, @Body() dto: CalculateMarginDto) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.marginCalculatorService.calculateMargin(tenantId, dto);
  }

  @Post('margin/suggest-price')
  async suggestPrice(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CalculateSalePriceDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.marginCalculatorService.calculateSalePrice(tenantId, dto);
  }

  @Post('margin/calculate-bulk')
  async calculateBulkMargins(
    @Headers('x-tenant-id') tenantId: string,
    @Body('items') items: { productId: string; salePrice: number }[],
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.marginCalculatorService.calculateBulkMargins(tenantId, items);
  }

  @Get('margin/low-margin-products')
  async getLowMarginProducts(
    @Headers('x-tenant-id') tenantId: string,
    @Query('threshold') threshold?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.marginCalculatorService.getProductsWithLowMargin(
      tenantId,
      threshold ? parseFloat(threshold) : undefined,
    );
  }

  // ============================================
  // PRICE RESOLVER
  // ============================================

  @Post('resolve')
  async resolvePrice(@Headers('x-tenant-id') tenantId: string, @Body() dto: GetPriceDto) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceResolverService.resolvePrice(tenantId, dto);
  }

  @Post('resolve/bulk')
  async resolvePrices(@Headers('x-tenant-id') tenantId: string, @Body() dto: GetPricesDto) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceResolverService.resolvePrices(tenantId, dto);
  }

  @Get('resolve/compare/:productId')
  async comparePrices(
    @Headers('x-tenant-id') tenantId: string,
    @Param('productId') productId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceResolverService.comparePrices(tenantId, productId);
  }

  @Get('resolve/history/:productId')
  async getPriceHistory(
    @Headers('x-tenant-id') tenantId: string,
    @Param('productId') productId: string,
    @Query('priceTableId') priceTableId?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.priceResolverService.getPriceHistory(tenantId, productId, { priceTableId });
  }
}

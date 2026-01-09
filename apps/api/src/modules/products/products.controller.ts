import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateStockDto,
  ProductResponseDto,
  ProductListQueryDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Tenant } from '../tenant/tenant.decorator';
import { TenantContext } from '../tenant/tenant.interface';

@ApiTags('products')
@Controller('products')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create a new product (Admin/Manager only)' })
  @ApiResponse({ status: 201, description: 'Product created', type: ProductResponseDto })
  @ApiResponse({ status: 409, description: 'SKU already exists' })
  async create(
    @Tenant() tenant: TenantContext,
    @Body() dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(tenant.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products for tenant' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of products' })
  async findAll(
    @Tenant() tenant: TenantContext,
    @Query() query: ProductListQueryDto,
  ): Promise<{ data: ProductResponseDto[]; total: number }> {
    return this.productsService.findAll(tenant.id, query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all product categories' })
  @ApiResponse({ status: 200, description: 'List of categories', type: [String] })
  async getCategories(@Tenant() tenant: TenantContext): Promise<string[]> {
    return this.productsService.getCategories(tenant.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product data', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.findOne(tenant.id, id);
  }

  @Get('sku/:sku')
  @ApiOperation({ summary: 'Get product by SKU' })
  @ApiResponse({ status: 200, description: 'Product data', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findBySku(
    @Tenant() tenant: TenantContext,
    @Param('sku') sku: string,
  ): Promise<ProductResponseDto> {
    return this.productsService.findBySku(tenant.id, sku);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update product (Admin/Manager only)' })
  @ApiResponse({ status: 200, description: 'Product updated', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(tenant.id, id, dto);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Update product stock (add or subtract)' })
  @ApiResponse({ status: 200, description: 'Stock updated', type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Insufficient stock' })
  async updateStock(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateStockDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.updateStock(tenant.id, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<void> {
    return this.productsService.remove(tenant.id, id);
  }
}

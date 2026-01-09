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
import { QuotesService } from './quotes.service';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  UpdateQuoteStatusDto,
  QuoteResponseDto,
  QuoteListQueryDto,
  QuoteStatus,
} from './dto/quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Tenant } from '../tenant/tenant.decorator';
import { TenantContext } from '../tenant/tenant.interface';

@ApiTags('quotes')
@Controller('quotes')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard, RolesGuard)
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new quote' })
  @ApiResponse({ status: 201, description: 'Quote created', type: QuoteResponseDto })
  async create(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateQuoteDto,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.create(tenant.id, user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all quotes for tenant' })
  @ApiQuery({ name: 'status', required: false, enum: QuoteStatus })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of quotes' })
  async findAll(
    @Tenant() tenant: TenantContext,
    @Query() query: QuoteListQueryDto,
  ): Promise<{ data: QuoteResponseDto[]; total: number }> {
    return this.quotesService.findAll(tenant.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quote by ID' })
  @ApiResponse({ status: 200, description: 'Quote data', type: QuoteResponseDto })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async findOne(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.findOne(tenant.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update quote' })
  @ApiResponse({ status: 200, description: 'Quote updated', type: QuoteResponseDto })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.update(tenant.id, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update quote status' })
  @ApiResponse({ status: 200, description: 'Status updated', type: QuoteResponseDto })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async updateStatus(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteStatusDto,
  ): Promise<QuoteResponseDto> {
    return this.quotesService.updateStatus(tenant.id, id, dto);
  }

  @Post(':id/convert')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Convert quote to order (Admin/Manager only)' })
  @ApiResponse({ status: 201, description: 'Order created from quote' })
  @ApiResponse({ status: 400, description: 'Quote not accepted' })
  async convertToOrder(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<any> {
    return this.quotesService.convertToOrder(tenant.id, id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete quote (Admin/Manager only)' })
  @ApiResponse({ status: 204, description: 'Quote deleted' })
  @ApiResponse({ status: 404, description: 'Quote not found' })
  async remove(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<void> {
    return this.quotesService.remove(tenant.id, id);
  }
}

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
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderDto,
  UpdateOrderStatusDto,
  OrderResponseDto,
  OrderListQueryDto,
  OrderStatus,
} from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Tenant } from '../tenant/tenant.decorator';
import { TenantContext } from '../tenant/tenant.interface';

@ApiTags('orders')
@Controller('orders')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderResponseDto })
  async create(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.create(tenant.id, user.userId, dto);
  }

  @Get('statuses')
  @ApiOperation({ summary: 'Get valid statuses for tenant template' })
  @ApiResponse({
    status: 200,
    description: 'List of valid statuses',
    schema: {
      example: [
        { code: 'new', name: 'Nowe', color: '#3B82F6' },
        { code: 'confirmed', name: 'Potwierdzone', color: '#8B5CF6' },
      ],
    },
  })
  async getStatuses(@Tenant() tenant: TenantContext) {
    return this.ordersService.getValidStatuses(tenant.id);
  }

  @Get('naming')
  @ApiOperation({ summary: 'Get entity naming for tenant template' })
  @ApiResponse({ status: 200, description: 'Entity naming configuration' })
  async getNaming(@Tenant() tenant: TenantContext) {
    return this.ordersService.getEntityNaming(tenant.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for tenant' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of orders' })
  async findAll(
    @Tenant() tenant: TenantContext,
    @Query() query: OrderListQueryDto,
  ): Promise<{ data: OrderResponseDto[]; total: number }> {
    return this.ordersService.findAll(tenant.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order data', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<OrderResponseDto> {
    return this.ordersService.findOne(tenant.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update order' })
  @ApiResponse({ status: 200, description: 'Order updated', type: OrderResponseDto })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.update(tenant.id, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Status updated', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid status for template' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @Tenant() tenant: TenantContext,
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateStatus(tenant.id, id, dto, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete order (Admin/Manager only)' })
  @ApiResponse({ status: 204, description: 'Order deleted' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async remove(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<void> {
    return this.ordersService.remove(tenant.id, id);
  }
}

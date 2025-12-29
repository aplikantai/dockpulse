import {
  Controller,
  Get,
  Post,
  Put,
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
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  CustomerListQueryDto,
} from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/dto/auth.dto';
import { Tenant } from '../tenant/tenant.decorator';
import { TenantContext } from '../tenant/tenant.interface';

@ApiTags('customers')
@Controller('customers')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created', type: CustomerResponseDto })
  async create(
    @Tenant() tenant: TenantContext,
    @Body() dto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.create(tenant.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers for tenant' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'tag', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of customers' })
  async findAll(
    @Tenant() tenant: TenantContext,
    @Query() query: CustomerListQueryDto,
  ): Promise<{ data: CustomerResponseDto[]; total: number }> {
    return this.customersService.findAll(tenant.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer data', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<CustomerResponseDto> {
    return this.customersService.findOne(tenant.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({ status: 200, description: 'Customer updated', type: CustomerResponseDto })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete customer (Admin/Manager only)' })
  @ApiResponse({ status: 204, description: 'Customer deleted' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async remove(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
  ): Promise<void> {
    return this.customersService.remove(tenant.id, id);
  }

  @Post(':id/tags/:tag')
  @ApiOperation({ summary: 'Add tag to customer' })
  @ApiResponse({ status: 200, description: 'Tag added', type: CustomerResponseDto })
  async addTag(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Param('tag') tag: string,
  ): Promise<CustomerResponseDto> {
    return this.customersService.addTag(tenant.id, id, tag);
  }

  @Delete(':id/tags/:tag')
  @ApiOperation({ summary: 'Remove tag from customer' })
  @ApiResponse({ status: 200, description: 'Tag removed', type: CustomerResponseDto })
  async removeTag(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Param('tag') tag: string,
  ): Promise<CustomerResponseDto> {
    return this.customersService.removeTag(tenant.id, id, tag);
  }
}

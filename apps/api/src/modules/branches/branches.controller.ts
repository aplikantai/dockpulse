import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiHeader, ApiOperation } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import {
  CreateBranchDto,
  UpdateBranchDto,
  AssignUserDto,
  PostalPrefixDto,
} from './dto';
import { Tenant } from '../tenant/tenant.decorator';
import { TenantContext } from '../tenant/tenant.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('branches')
@Controller('branches')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard, RolesGuard)
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all branches' })
  findAll(@Tenant() tenant: TenantContext) {
    return this.branchesService.findAll(tenant.id);
  }

  @Get('by-postal-code/:code')
  @ApiOperation({ summary: 'Find branch by postal code' })
  findByPostalCode(
    @Tenant() tenant: TenantContext,
    @Param('code') postalCode: string,
  ) {
    return this.branchesService.findByPostalCode(tenant.id, postalCode);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by ID' })
  findOne(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.branchesService.findOne(tenant.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new branch' })
  create(@Tenant() tenant: TenantContext, @Body() dto: CreateBranchDto) {
    return this.branchesService.create(tenant.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update branch' })
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete branch' })
  remove(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.branchesService.remove(tenant.id, id);
  }

  // User assignments
  @Get(':id/users')
  @ApiOperation({ summary: 'Get users assigned to branch' })
  getUsers(@Tenant() tenant: TenantContext, @Param('id') branchId: string) {
    return this.branchesService.getUsers(tenant.id, branchId);
  }

  @Post(':id/users')
  @ApiOperation({ summary: 'Assign user to branch' })
  assignUser(
    @Tenant() tenant: TenantContext,
    @Param('id') branchId: string,
    @Body() dto: AssignUserDto,
  ) {
    return this.branchesService.assignUser(tenant.id, branchId, dto);
  }

  @Delete(':id/users/:userId')
  @ApiOperation({ summary: 'Unassign user from branch' })
  unassignUser(
    @Tenant() tenant: TenantContext,
    @Param('id') branchId: string,
    @Param('userId') userId: string,
  ) {
    return this.branchesService.unassignUser(tenant.id, branchId, userId);
  }

  // Postal prefixes
  @Get(':id/postal-prefixes')
  @ApiOperation({ summary: 'Get postal prefixes for branch' })
  getPostalPrefixes(
    @Tenant() tenant: TenantContext,
    @Param('id') branchId: string,
  ) {
    return this.branchesService.getPostalPrefixes(tenant.id, branchId);
  }

  @Post(':id/postal-prefixes')
  @ApiOperation({ summary: 'Add postal prefix to branch' })
  addPostalPrefix(
    @Tenant() tenant: TenantContext,
    @Param('id') branchId: string,
    @Body() dto: PostalPrefixDto,
  ) {
    return this.branchesService.addPostalPrefix(tenant.id, branchId, dto);
  }

  @Delete(':id/postal-prefixes/:prefixId')
  @ApiOperation({ summary: 'Remove postal prefix from branch' })
  removePostalPrefix(
    @Tenant() tenant: TenantContext,
    @Param('id') branchId: string,
    @Param('prefixId') prefixId: string,
  ) {
    return this.branchesService.removePostalPrefix(tenant.id, branchId, prefixId);
  }
}

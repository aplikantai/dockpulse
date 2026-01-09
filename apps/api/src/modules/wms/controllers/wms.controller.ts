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
import { UserRole, WarehouseDocumentType, WarehouseDocumentStatus, ContainerType, ContainerStatus, InventoryCountStatus } from '@prisma/client';
import { LocationService } from '../services/location.service';
import { DocumentService } from '../services/document.service';
import { ContainerService } from '../services/container.service';
import { InventoryService } from '../services/inventory.service';
import { CreateLocationDto, UpdateLocationDto } from '../dto/location.dto';
import { CreateDocumentDto, UpdateDocumentDto, ProcessDocumentDto } from '../dto/document.dto';
import { CreateContainerDto, UpdateContainerDto, AddContainerContentDto, RemoveContainerContentDto } from '../dto/container.dto';
import { CreateInventoryCountDto, UpdateInventoryCountDto, SubmitInventoryCountDto, ApproveInventoryCountDto } from '../dto/inventory.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('wms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WmsController {
  constructor(
    private readonly locationService: LocationService,
    private readonly documentService: DocumentService,
    private readonly containerService: ContainerService,
    private readonly inventoryService: InventoryService,
  ) {}

  // ============================================
  // LOCATIONS
  // ============================================

  @Get('locations')
  async getLocations(
    @Headers('x-tenant-id') tenantId: string,
    @Query('type') type?: string,
    @Query('parentId') parentId?: string,
    @Query('active') active?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');

    return this.locationService.findAll(tenantId, {
      type: type as any,
      parentId: parentId === 'null' ? null : parentId,
      isActive: active === 'true' ? true : active === 'false' ? false : undefined,
    });
  }

  @Get('locations/tree')
  async getLocationTree(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.locationService.findTree(tenantId);
  }

  @Get('locations/barcode/:barcode')
  async getLocationByBarcode(
    @Headers('x-tenant-id') tenantId: string,
    @Param('barcode') barcode: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.locationService.findByBarcode(tenantId, barcode);
  }

  @Get('locations/:id')
  async getLocation(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.locationService.findOne(tenantId, id);
  }

  @Post('locations')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async createLocation(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateLocationDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.locationService.create(tenantId, dto);
  }

  @Put('locations/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async updateLocation(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.locationService.update(tenantId, id, dto);
  }

  @Delete('locations/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async deleteLocation(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.locationService.delete(tenantId, id);
  }

  @Post('locations/:id/barcode')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async generateLocationBarcode(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    const barcode = await this.locationService.generateBarcode(tenantId, id);
    return { barcode };
  }

  // ============================================
  // DOCUMENTS
  // ============================================

  @Get('documents')
  async getDocuments(
    @Headers('x-tenant-id') tenantId: string,
    @Query('type') type?: WarehouseDocumentType,
    @Query('status') status?: WarehouseDocumentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');

    return this.documentService.findAll(tenantId, {
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('documents/:id')
  async getDocument(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.documentService.findOne(tenantId, id);
  }

  @Post('documents')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async createDocument(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateDocumentDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.documentService.create(tenantId, user.id, dto);
  }

  @Put('documents/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async updateDocument(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.documentService.update(tenantId, id, dto);
  }

  @Post('documents/:id/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async addDocumentItem(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() item: any,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.documentService.addItem(tenantId, id, item);
  }

  @Delete('documents/:id/items/:itemId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async removeDocumentItem(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.documentService.removeItem(tenantId, id, itemId);
  }

  @Post('documents/:id/confirm')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async confirmDocument(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.documentService.confirm(tenantId, id, user.id);
  }

  @Post('documents/:id/process')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async processDocument(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ProcessDocumentDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.documentService.process(tenantId, id, user.id, dto);
  }

  @Post('documents/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async cancelDocument(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('reason') reason?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.documentService.cancel(tenantId, id, user.id, reason);
  }

  // ============================================
  // CONTAINERS
  // ============================================

  @Get('containers')
  async getContainers(
    @Headers('x-tenant-id') tenantId: string,
    @Query('type') type?: ContainerType,
    @Query('status') status?: ContainerStatus,
    @Query('locationId') locationId?: string,
    @Query('orderId') orderId?: string,
    @Query('active') active?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');

    return this.containerService.findAll(tenantId, {
      type,
      status,
      locationId,
      orderId,
      isActive: active === 'true' ? true : active === 'false' ? false : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('containers/barcode/:barcode')
  async getContainerByBarcode(
    @Headers('x-tenant-id') tenantId: string,
    @Param('barcode') barcode: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.containerService.findByBarcode(tenantId, barcode);
  }

  @Get('containers/:id')
  async getContainer(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.containerService.findOne(tenantId, id);
  }

  @Post('containers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async createContainer(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreateContainerDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.containerService.create(tenantId, dto);
  }

  @Put('containers/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async updateContainer(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateContainerDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.containerService.update(tenantId, id, dto);
  }

  @Delete('containers/:id')
  @Roles(UserRole.ADMIN, UserRole.OWNER)
  async deleteContainer(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.containerService.delete(tenantId, id);
  }

  @Post('containers/:id/content')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async addContainerContent(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: AddContainerContentDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.containerService.addContent(tenantId, id, user.id, dto);
  }

  @Delete('containers/:id/content')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async removeContainerContent(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: RemoveContainerContentDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.containerService.removeContent(tenantId, id, dto);
  }

  @Post('containers/:id/move')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async moveContainer(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body('locationId') locationId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.containerService.move(tenantId, id, locationId);
  }

  @Post('containers/:id/barcode')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async generateContainerBarcode(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    const barcode = await this.containerService.generateBarcode(tenantId, id);
    return { barcode };
  }

  // ============================================
  // INVENTORY COUNTS
  // ============================================

  @Get('inventory')
  async getInventoryCounts(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: InventoryCountStatus,
    @Query('locationId') locationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');

    return this.inventoryService.findAll(tenantId, {
      status,
      locationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  @Get('inventory/:id')
  async getInventoryCount(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.inventoryService.findOne(tenantId, id);
  }

  @Post('inventory')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async createInventoryCount(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateInventoryCountDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.inventoryService.create(tenantId, user.id, dto);
  }

  @Post('inventory/generate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async generateInventoryFromStock(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser() user: any,
    @Body('locationId') locationId?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.inventoryService.generateFromStock(tenantId, user.id, locationId);
  }

  @Put('inventory/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async updateInventoryCount(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInventoryCountDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.inventoryService.update(tenantId, id, dto);
  }

  @Post('inventory/:id/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async addInventoryItem(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() item: any,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.inventoryService.addItem(tenantId, id, item);
  }

  @Delete('inventory/:id/items/:itemId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async removeInventoryItem(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.inventoryService.removeItem(tenantId, id, itemId);
  }

  @Post('inventory/:id/start')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async startInventoryCount(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.inventoryService.start(tenantId, id, user.id);
  }

  @Post('inventory/:id/submit')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE, UserRole.OWNER)
  async submitInventoryCounts(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitInventoryCountDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.inventoryService.submitCounts(tenantId, id, user.id, dto);
  }

  @Post('inventory/:id/approve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async approveInventoryCount(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: ApproveInventoryCountDto,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.inventoryService.approve(tenantId, id, user.id, dto);
  }

  @Post('inventory/:id/cancel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async cancelInventoryCount(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ) {
    if (!tenantId) throw new BadRequestException('Tenant ID required');
    return this.inventoryService.cancel(tenantId, id, reason);
  }
}

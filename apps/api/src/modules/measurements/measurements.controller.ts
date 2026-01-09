import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MeasurementsService } from './measurements.service';
import {
  CreateMeasurementDto,
  UpdateMeasurementDto,
  MeasurementItemDto,
  UpdateMeasurementItemDto,
} from './dto';
import { Tenant } from '../tenant/tenant.decorator';
import { TenantContext } from '../tenant/tenant.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('measurements')
@Controller('measurements')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all measurements' })
  @ApiQuery({ name: 'orderId', required: false })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Tenant() tenant: TenantContext,
    @Query('orderId') orderId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('status') status?: string,
  ) {
    return this.measurementsService.findAll(tenant.id, { orderId, technicianId, status });
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get measurements for calendar view' })
  @ApiQuery({ name: 'start', required: true })
  @ApiQuery({ name: 'end', required: true })
  getCalendar(
    @Tenant() tenant: TenantContext,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.measurementsService.getCalendar(tenant.id, new Date(start), new Date(end));
  }

  @Get('by-technician/:technicianId')
  @ApiOperation({ summary: 'Get measurements by technician' })
  getByTechnician(
    @Tenant() tenant: TenantContext,
    @Param('technicianId') technicianId: string,
  ) {
    return this.measurementsService.getByTechnician(tenant.id, technicianId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get measurement by ID' })
  findOne(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.measurementsService.findOne(tenant.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new measurement' })
  create(@Tenant() tenant: TenantContext, @Body() dto: CreateMeasurementDto) {
    return this.measurementsService.create(tenant.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update measurement' })
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateMeasurementDto,
  ) {
    return this.measurementsService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete measurement' })
  remove(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.measurementsService.remove(tenant.id, id);
  }

  // Status transitions
  @Post(':id/start')
  @ApiOperation({ summary: 'Start measurement' })
  start(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.measurementsService.start(tenant.id, id);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete measurement' })
  complete(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.measurementsService.complete(tenant.id, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel measurement' })
  cancel(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.measurementsService.cancel(tenant.id, id);
  }

  // Items
  @Get(':id/items')
  @ApiOperation({ summary: 'Get measurement items' })
  getItems(@Tenant() tenant: TenantContext, @Param('id') measurementId: string) {
    return this.measurementsService.getItems(tenant.id, measurementId);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add measurement item' })
  addItem(
    @Tenant() tenant: TenantContext,
    @Param('id') measurementId: string,
    @Body() dto: MeasurementItemDto,
  ) {
    return this.measurementsService.addItem(tenant.id, measurementId, dto);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Update measurement item' })
  updateItem(
    @Tenant() tenant: TenantContext,
    @Param('id') measurementId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateMeasurementItemDto,
  ) {
    return this.measurementsService.updateItem(tenant.id, measurementId, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @ApiOperation({ summary: 'Remove measurement item' })
  removeItem(
    @Tenant() tenant: TenantContext,
    @Param('id') measurementId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.measurementsService.removeItem(tenant.id, measurementId, itemId);
  }

  // Photos
  @Post(':id/photos')
  @ApiOperation({ summary: 'Add photos to measurement' })
  addPhotos(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: { photos: string[] },
  ) {
    return this.measurementsService.addPhotos(tenant.id, id, body.photos);
  }

  @Delete(':id/photos')
  @ApiOperation({ summary: 'Remove photo from measurement' })
  removePhoto(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() body: { photoUrl: string },
  ) {
    return this.measurementsService.removePhoto(tenant.id, id, body.photoUrl);
  }
}

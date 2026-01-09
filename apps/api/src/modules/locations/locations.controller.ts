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
import { LocationsService } from './locations.service';
import { CreateLocationDto, UpdateLocationDto } from './dto';
import { Tenant } from '../tenant/tenant.decorator';
import { TenantContext } from '../tenant/tenant.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('locations')
@Controller('locations')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all locations' })
  @ApiQuery({ name: 'type', required: false })
  findAll(@Tenant() tenant: TenantContext, @Query('type') type?: string) {
    return this.locationsService.findAll(tenant.id, type);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active locations' })
  findActive(@Tenant() tenant: TenantContext) {
    return this.locationsService.findActive(tenant.id);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get default location' })
  findDefault(@Tenant() tenant: TenantContext) {
    return this.locationsService.findDefault(tenant.id);
  }

  @Get('nearest')
  @ApiOperation({ summary: 'Find nearest location by coordinates' })
  @ApiQuery({ name: 'lat', required: true })
  @ApiQuery({ name: 'lng', required: true })
  findNearest(
    @Tenant() tenant: TenantContext,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    return this.locationsService.findNearest(tenant.id, parseFloat(lat), parseFloat(lng));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get location by ID' })
  findOne(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.locationsService.findOne(tenant.id, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new location' })
  create(@Tenant() tenant: TenantContext, @Body() dto: CreateLocationDto) {
    return this.locationsService.create(tenant.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update location' })
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationsService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete location' })
  remove(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.locationsService.remove(tenant.id, id);
  }
}

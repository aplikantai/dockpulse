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
import { DictionariesService } from './dictionaries.service';
import { CreateDictionaryDto, UpdateDictionaryDto } from './dto';
import { Tenant } from '../tenant/tenant.decorator';
import { TenantContext } from '../tenant/tenant.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('dictionaries')
@Controller('dictionaries')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: true })
@UseGuards(JwtAuthGuard, RolesGuard)
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Get('types')
  @ApiOperation({ summary: 'Get all dictionary types' })
  getTypes() {
    return this.dictionariesService.getTypes();
  }

  @Get()
  @ApiOperation({ summary: 'Get all dictionaries' })
  findAll(@Tenant() tenant: TenantContext) {
    return this.dictionariesService.findAll(tenant.id);
  }

  @Get('by-type/:type')
  @ApiOperation({ summary: 'Get dictionaries by type' })
  findByType(@Tenant() tenant: TenantContext, @Param('type') type: string) {
    return this.dictionariesService.findByType(tenant.id, type);
  }

  @Get('by-type/:type/default')
  @ApiOperation({ summary: 'Get default value for dictionary type' })
  getDefault(@Tenant() tenant: TenantContext, @Param('type') type: string) {
    return this.dictionariesService.getDefault(tenant.id, type);
  }

  @Get(':type/:code')
  @ApiOperation({ summary: 'Get specific dictionary value' })
  getValue(
    @Tenant() tenant: TenantContext,
    @Param('type') type: string,
    @Param('code') code: string,
  ) {
    return this.dictionariesService.getValue(tenant.id, type, code);
  }

  @Post()
  @ApiOperation({ summary: 'Create new dictionary entry' })
  create(@Tenant() tenant: TenantContext, @Body() dto: CreateDictionaryDto) {
    return this.dictionariesService.create(tenant.id, dto);
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed default dictionaries for tenant' })
  seedDefaults(@Tenant() tenant: TenantContext) {
    return this.dictionariesService.seedDefaults(tenant.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update dictionary entry' })
  update(
    @Tenant() tenant: TenantContext,
    @Param('id') id: string,
    @Body() dto: UpdateDictionaryDto,
  ) {
    return this.dictionariesService.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete dictionary entry' })
  remove(@Tenant() tenant: TenantContext, @Param('id') id: string) {
    return this.dictionariesService.remove(tenant.id, id);
  }
}

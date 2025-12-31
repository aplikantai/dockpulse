import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeysService, CreateApiKeyDto } from './api-keys.service';

@ApiTags('API Keys')
@Controller('api/settings/api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @ApiOperation({ summary: 'Get all API keys for tenant (masked)' })
  async getApiKeys(@Request() req: any) {
    const tenantId = req.user.tenantId;
    return this.apiKeysService.getApiKeys(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update API key' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'service', 'apiKey'],
      properties: {
        name: { type: 'string', description: 'Company/key name' },
        service: { type: 'string', enum: ['openrouter', 'openai', 'anthropic'] },
        apiKey: { type: 'string', description: 'API key value' },
      },
    },
  })
  async createApiKey(@Request() req: any, @Body() dto: CreateApiKeyDto) {
    const tenantId = req.user.tenantId;
    return this.apiKeysService.upsertApiKey(tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete API key' })
  async deleteApiKey(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    await this.apiKeysService.deleteApiKey(tenantId, id);
    return { message: 'API key deleted' };
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle API key active status' })
  async toggleApiKey(@Request() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.apiKeysService.toggleApiKey(tenantId, id);
  }
}

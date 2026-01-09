import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDictionaryDto, UpdateDictionaryDto, DEFAULT_DICTIONARIES, DICTIONARY_TYPES } from './dto';

@Injectable()
export class DictionariesService {
  constructor(private prisma: PrismaService) {}

  // Get all dictionary types
  getTypes() {
    return Object.entries(DICTIONARY_TYPES).map(([key, value]) => ({
      key,
      code: value,
    }));
  }

  // Get all dictionaries for tenant (including system ones)
  async findAll(tenantId: string) {
    return this.prisma.dictionary.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
      },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  // Get dictionary by type
  async findByType(tenantId: string, type: string) {
    // First get tenant-specific values
    const tenantValues = await this.prisma.dictionary.findMany({
      where: { tenantId, type, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Then get system values (tenantId = null)
    const systemValues = await this.prisma.dictionary.findMany({
      where: { tenantId: null, type, isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Merge - tenant values override system values with same code
    const result = [...systemValues];
    for (const tv of tenantValues) {
      const idx = result.findIndex((sv) => sv.code === tv.code);
      if (idx !== -1) {
        result[idx] = tv;
      } else {
        result.push(tv);
      }
    }

    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  // Get single value
  async getValue(tenantId: string, type: string, code: string) {
    // First try tenant-specific
    let value = await this.prisma.dictionary.findFirst({
      where: { tenantId, type, code },
    });

    // Then try system
    if (!value) {
      value = await this.prisma.dictionary.findFirst({
        where: { tenantId: null, type, code },
      });
    }

    return value;
  }

  // Get default value for type
  async getDefault(tenantId: string, type: string) {
    // First try tenant-specific default
    let value = await this.prisma.dictionary.findFirst({
      where: { tenantId, type, isDefault: true, isActive: true },
    });

    // Then try system default
    if (!value) {
      value = await this.prisma.dictionary.findFirst({
        where: { tenantId: null, type, isDefault: true, isActive: true },
      });
    }

    return value;
  }

  // Validate if value is valid for type
  async isValidValue(tenantId: string, type: string, code: string): Promise<boolean> {
    const value = await this.getValue(tenantId, type, code);
    return value !== null && value.isActive;
  }

  // Create dictionary value
  async create(tenantId: string, dto: CreateDictionaryDto) {
    // Check if code already exists for this type and tenant
    const existing = await this.prisma.dictionary.findFirst({
      where: { tenantId, type: dto.type, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(
        `Dictionary value with code ${dto.code} already exists for type ${dto.type}`,
      );
    }

    // If this is default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.dictionary.updateMany({
        where: { tenantId, type: dto.type, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.dictionary.create({
      data: {
        tenantId,
        ...dto,
      },
    });
  }

  // Update dictionary value
  async update(tenantId: string, id: string, dto: UpdateDictionaryDto) {
    const dictionary = await this.prisma.dictionary.findFirst({
      where: { id, tenantId },
    });

    if (!dictionary) {
      throw new NotFoundException(`Dictionary with ID ${id} not found`);
    }

    if (dictionary.isSystem) {
      throw new ConflictException('Cannot modify system dictionary values');
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.dictionary.updateMany({
        where: { tenantId, type: dictionary.type, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.dictionary.update({
      where: { id },
      data: dto,
    });
  }

  // Delete dictionary value
  async remove(tenantId: string, id: string) {
    const dictionary = await this.prisma.dictionary.findFirst({
      where: { id, tenantId },
    });

    if (!dictionary) {
      throw new NotFoundException(`Dictionary with ID ${id} not found`);
    }

    if (dictionary.isSystem) {
      throw new ConflictException('Cannot delete system dictionary values');
    }

    return this.prisma.dictionary.delete({
      where: { id },
    });
  }

  // Seed default dictionaries for tenant
  async seedDefaults(tenantId: string) {
    const results: any[] = [];

    for (const [type, values] of Object.entries(DEFAULT_DICTIONARIES)) {
      for (const value of values) {
        // Check if already exists
        const existing = await this.prisma.dictionary.findFirst({
          where: { tenantId, type, code: value.code },
        });

        if (!existing) {
          const created = await this.prisma.dictionary.create({
            data: {
              tenantId,
              type,
              ...value,
              isSystem: false,
            },
          });
          results.push(created);
        }
      }
    }

    return { seeded: results.length, items: results };
  }

  // Seed system-wide dictionaries (tenantId = null)
  async seedSystemDictionaries() {
    const results: any[] = [];

    for (const [type, values] of Object.entries(DEFAULT_DICTIONARIES)) {
      for (const value of values) {
        // Check if already exists
        const existing = await this.prisma.dictionary.findFirst({
          where: { tenantId: null, type, code: value.code },
        });

        if (!existing) {
          const created = await this.prisma.dictionary.create({
            data: {
              tenantId: null,
              type,
              ...value,
              isSystem: true,
            },
          });
          results.push(created);
        }
      }
    }

    return { seeded: results.length, items: results };
  }
}

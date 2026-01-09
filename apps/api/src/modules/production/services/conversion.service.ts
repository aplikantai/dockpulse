import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateConversionDto,
  UpdateConversionDto,
  ConvertUnitsDto,
} from '../dto/conversion.dto';

@Injectable()
export class ConversionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    options?: {
      productId?: string;
      fromUnit?: string;
      toUnit?: string;
      isActive?: boolean;
    },
  ) {
    const where: any = { tenantId };

    if (options?.productId !== undefined) {
      where.productId = options.productId;
    }
    if (options?.fromUnit) where.fromUnit = options.fromUnit;
    if (options?.toUnit) where.toUnit = options.toUnit;
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    return this.prisma.unitConversion.findMany({
      where,
      orderBy: [{ productId: 'asc' }, { fromUnit: 'asc' }, { toUnit: 'asc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const conversion = await this.prisma.unitConversion.findFirst({
      where: { id, tenantId },
    });

    if (!conversion) {
      throw new NotFoundException(`Conversion ${id} not found`);
    }

    return conversion;
  }

  async findConversion(
    tenantId: string,
    fromUnit: string,
    toUnit: string,
    productId?: string,
  ) {
    if (fromUnit === toUnit) {
      return { conversionRate: 1, source: 'identity' };
    }

    if (productId) {
      const productConversion = await this.prisma.unitConversion.findFirst({
        where: {
          tenantId,
          productId,
          fromUnit,
          toUnit,
          isActive: true,
        },
      });

      if (productConversion) {
        return { conversionRate: Number(productConversion.conversionRate), source: 'product' };
      }
    }

    const globalConversion = await this.prisma.unitConversion.findFirst({
      where: {
        tenantId,
        productId: null,
        fromUnit,
        toUnit,
        isActive: true,
      },
    });

    if (globalConversion) {
      return { conversionRate: Number(globalConversion.conversionRate), source: 'global' };
    }

    if (productId) {
      const reverseProductConversion = await this.prisma.unitConversion.findFirst({
        where: {
          tenantId,
          productId,
          fromUnit: toUnit,
          toUnit: fromUnit,
          isActive: true,
        },
      });

      if (reverseProductConversion) {
        return {
          conversionRate: 1 / Number(reverseProductConversion.conversionRate),
          source: 'product-reverse',
        };
      }
    }

    const reverseGlobalConversion = await this.prisma.unitConversion.findFirst({
      where: {
        tenantId,
        productId: null,
        fromUnit: toUnit,
        toUnit: fromUnit,
        isActive: true,
      },
    });

    if (reverseGlobalConversion) {
      return {
        conversionRate: 1 / Number(reverseGlobalConversion.conversionRate),
        source: 'global-reverse',
      };
    }

    return null;
  }

  async create(tenantId: string, dto: CreateConversionDto) {
    if (dto.fromUnit === dto.toUnit) {
      throw new BadRequestException('From and to units cannot be the same');
    }

    const existing = await this.prisma.unitConversion.findUnique({
      where: {
        tenantId_productId_fromUnit_toUnit: {
          tenantId,
          productId: dto.productId || null,
          fromUnit: dto.fromUnit,
          toUnit: dto.toUnit,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Conversion already exists for this unit pair');
    }

    if (dto.isDefault && dto.productId) {
      await this.prisma.unitConversion.updateMany({
        where: {
          tenantId,
          productId: dto.productId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.unitConversion.create({
      data: {
        tenantId,
        productId: dto.productId,
        fromUnit: dto.fromUnit,
        toUnit: dto.toUnit,
        conversionRate: dto.conversionRate,
        description: dto.description,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateConversionDto) {
    const conversion = await this.findOne(tenantId, id);

    if (dto.isDefault && conversion.productId) {
      await this.prisma.unitConversion.updateMany({
        where: {
          tenantId,
          productId: conversion.productId,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.unitConversion.update({
      where: { id },
      data: dto,
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.unitConversion.delete({
      where: { id },
    });
  }

  async convert(tenantId: string, dto: ConvertUnitsDto): Promise<{
    result: number;
    fromUnit: string;
    toUnit: string;
    conversionRate: number;
    source: string;
  }> {
    const conversion = await this.findConversion(
      tenantId,
      dto.fromUnit,
      dto.toUnit,
      dto.productId,
    );

    if (!conversion) {
      throw new BadRequestException(
        `No conversion found from ${dto.fromUnit} to ${dto.toUnit}`,
      );
    }

    const result = dto.quantity * conversion.conversionRate;

    return {
      result: Math.round(result * 1000000) / 1000000,
      fromUnit: dto.fromUnit,
      toUnit: dto.toUnit,
      conversionRate: conversion.conversionRate,
      source: conversion.source,
    };
  }

  async seedDefaultConversions(tenantId: string) {
    const defaults = [
      { fromUnit: 'kg', toUnit: 'g', conversionRate: 1000, description: '1 kg = 1000 g' },
      { fromUnit: 'g', toUnit: 'kg', conversionRate: 0.001, description: '1 g = 0.001 kg' },
      { fromUnit: 'l', toUnit: 'ml', conversionRate: 1000, description: '1 l = 1000 ml' },
      { fromUnit: 'ml', toUnit: 'l', conversionRate: 0.001, description: '1 ml = 0.001 l' },
      { fromUnit: 'm', toUnit: 'cm', conversionRate: 100, description: '1 m = 100 cm' },
      { fromUnit: 'cm', toUnit: 'm', conversionRate: 0.01, description: '1 cm = 0.01 m' },
    ];

    const created = [];

    for (const def of defaults) {
      try {
        const conversion = await this.create(tenantId, {
          ...def,
          productId: undefined,
        });
        created.push(conversion);
      } catch (error) {
      }
    }

    return created;
  }
}

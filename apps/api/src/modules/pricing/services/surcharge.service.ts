import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SurchargeType } from '@prisma/client';
import {
  CreateSurchargeDto,
  UpdateSurchargeDto,
  CalculateSurchargeDto,
  CalculateSurchargesDto,
  CalculatedSurcharge,
} from '../dto/surcharge.dto';

@Injectable()
export class SurchargeService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // CRUD OPERATIONS
  // ============================================

  async findAll(
    tenantId: string,
    options?: {
      type?: SurchargeType;
      isActive?: boolean;
      isRequired?: boolean;
      validAt?: Date;
    },
  ) {
    const where: any = { tenantId };

    if (options?.type) where.type = options.type;
    if (options?.isActive !== undefined) where.isActive = options.isActive;
    if (options?.isRequired !== undefined) where.isRequired = options.isRequired;

    if (options?.validAt) {
      where.OR = [
        { validFrom: null, validTo: null },
        {
          validFrom: { lte: options.validAt },
          OR: [{ validTo: null }, { validTo: { gte: options.validAt } }],
        },
      ];
    }

    return this.prisma.surcharge.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const surcharge = await this.prisma.surcharge.findFirst({
      where: { id, tenantId },
    });

    if (!surcharge) {
      throw new NotFoundException(`Surcharge ${id} not found`);
    }

    return surcharge;
  }

  async findByCode(tenantId: string, code: string) {
    const surcharge = await this.prisma.surcharge.findFirst({
      where: { tenantId, code },
    });

    if (!surcharge) {
      throw new NotFoundException(`Surcharge with code ${code} not found`);
    }

    return surcharge;
  }

  async create(tenantId: string, dto: CreateSurchargeDto) {
    const existing = await this.prisma.surcharge.findFirst({
      where: { tenantId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Surcharge with code ${dto.code} already exists`);
    }

    return this.prisma.surcharge.create({
      data: {
        tenantId,
        code: dto.code,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        minValue: dto.minValue,
        maxValue: dto.maxValue,
        tiers: dto.tiers || null,
        appliesToCategories: dto.appliesToCategories || null,
        appliesToProducts: dto.appliesToProducts || null,
        minOrderValue: dto.minOrderValue,
        maxOrderValue: dto.maxOrderValue,
        isRequired: dto.isRequired ?? false,
        isOptional: dto.isOptional ?? true,
        sortOrder: dto.sortOrder ?? 0,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validTo: dto.validTo ? new Date(dto.validTo) : null,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateSurchargeDto) {
    await this.findOne(tenantId, id);

    return this.prisma.surcharge.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        value: dto.value,
        minValue: dto.minValue,
        maxValue: dto.maxValue,
        tiers: dto.tiers,
        appliesToCategories: dto.appliesToCategories,
        appliesToProducts: dto.appliesToProducts,
        minOrderValue: dto.minOrderValue,
        maxOrderValue: dto.maxOrderValue,
        isRequired: dto.isRequired,
        isOptional: dto.isOptional,
        isActive: dto.isActive,
        sortOrder: dto.sortOrder,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
      },
    });
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.surcharge.delete({ where: { id } });
  }

  // ============================================
  // CALCULATION OPERATIONS
  // ============================================

  async calculateSingle(tenantId: string, dto: CalculateSurchargeDto): Promise<CalculatedSurcharge> {
    const surcharge = await this.findOne(tenantId, dto.surchargeId);

    let amount = this.calculateAmount(
      surcharge.type,
      Number(surcharge.value),
      dto.baseValue,
      surcharge.tiers as any[],
    );

    // Apply min/max constraints
    if (surcharge.minValue && amount < Number(surcharge.minValue)) {
      amount = Number(surcharge.minValue);
    }
    if (surcharge.maxValue && amount > Number(surcharge.maxValue)) {
      amount = Number(surcharge.maxValue);
    }

    return {
      surchargeId: surcharge.id,
      surchargeCode: surcharge.code,
      surchargeName: surcharge.name,
      type: surcharge.type,
      rate: Number(surcharge.value),
      baseValue: dto.baseValue,
      baseUnit: dto.baseUnit,
      amount: Math.round(amount * 100) / 100,
    };
  }

  async calculateMultiple(
    tenantId: string,
    dto: CalculateSurchargesDto,
  ): Promise<CalculatedSurcharge[]> {
    const now = new Date();

    // Get applicable surcharges
    let surcharges = await this.prisma.surcharge.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          { validFrom: null, validTo: null },
          {
            validFrom: { lte: now },
            OR: [{ validTo: null }, { validTo: { gte: now } }],
          },
        ],
      },
    });

    // Filter by IDs if provided
    if (dto.surchargeIds?.length) {
      surcharges = surcharges.filter((s) => dto.surchargeIds!.includes(s.id));
    }

    // Filter by order value
    surcharges = surcharges.filter((s) => {
      if (s.minOrderValue && dto.orderValue < Number(s.minOrderValue)) return false;
      if (s.maxOrderValue && dto.orderValue > Number(s.maxOrderValue)) return false;
      return true;
    });

    // Filter by categories
    if (dto.productCategories?.length) {
      surcharges = surcharges.filter((s) => {
        if (!s.appliesToCategories) return true; // Applies to all
        const categories = s.appliesToCategories as string[];
        return dto.productCategories!.some((c) => categories.includes(c));
      });
    }

    // Filter by products
    if (dto.productIds?.length) {
      surcharges = surcharges.filter((s) => {
        if (!s.appliesToProducts) return true; // Applies to all
        const products = s.appliesToProducts as string[];
        return dto.productIds!.some((p) => products.includes(p));
      });
    }

    // Calculate amounts
    const results: CalculatedSurcharge[] = [];

    for (const surcharge of surcharges) {
      let baseValue: number;
      let baseUnit: string;

      switch (surcharge.type) {
        case SurchargeType.FIXED:
          baseValue = 1;
          baseUnit = 'szt';
          break;
        case SurchargeType.PERCENT:
          baseValue = dto.orderValue;
          baseUnit = 'PLN';
          break;
        case SurchargeType.PER_M2:
          baseValue = dto.totalArea ?? 0;
          baseUnit = 'm2';
          break;
        case SurchargeType.PER_MB:
          baseValue = dto.totalLength ?? 0;
          baseUnit = 'mb';
          break;
        case SurchargeType.PER_KG:
          baseValue = dto.totalWeight ?? 0;
          baseUnit = 'kg';
          break;
        case SurchargeType.PER_UNIT:
          baseValue = dto.totalQuantity ?? 0;
          baseUnit = 'szt';
          break;
        case SurchargeType.TIERED:
          baseValue = dto.orderValue;
          baseUnit = 'PLN';
          break;
        default:
          baseValue = dto.orderValue;
          baseUnit = 'PLN';
      }

      let amount = this.calculateAmount(
        surcharge.type,
        Number(surcharge.value),
        baseValue,
        surcharge.tiers as any[],
      );

      // Apply min/max constraints
      if (surcharge.minValue && amount < Number(surcharge.minValue)) {
        amount = Number(surcharge.minValue);
      }
      if (surcharge.maxValue && amount > Number(surcharge.maxValue)) {
        amount = Number(surcharge.maxValue);
      }

      results.push({
        surchargeId: surcharge.id,
        surchargeCode: surcharge.code,
        surchargeName: surcharge.name,
        type: surcharge.type,
        rate: Number(surcharge.value),
        baseValue,
        baseUnit,
        amount: Math.round(amount * 100) / 100,
      });
    }

    return results;
  }

  async getRequiredSurcharges(tenantId: string, orderValue: number): Promise<CalculatedSurcharge[]> {
    return this.calculateMultiple(tenantId, {
      orderValue,
      surchargeIds: undefined,
    }).then((results) =>
      results.filter((r) => {
        // Get original surcharge to check isRequired
        return true; // Filter later based on isRequired flag
      }),
    );
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private calculateAmount(
    type: SurchargeType,
    value: number,
    baseValue: number,
    tiers?: { from: number; to: number | null; value: number }[],
  ): number {
    switch (type) {
      case SurchargeType.FIXED:
        return value;

      case SurchargeType.PERCENT:
        return (baseValue * value) / 100;

      case SurchargeType.PER_M2:
      case SurchargeType.PER_MB:
      case SurchargeType.PER_KG:
      case SurchargeType.PER_UNIT:
        return baseValue * value;

      case SurchargeType.TIERED:
        if (!tiers?.length) return value;
        // Find matching tier
        const tier = tiers.find(
          (t) => baseValue >= t.from && (t.to === null || baseValue <= t.to),
        );
        return tier ? tier.value : value;

      default:
        return value;
    }
  }

  // ============================================
  // SEED DEFAULT SURCHARGES
  // ============================================

  async seedDefaults(tenantId: string) {
    const defaults = [
      {
        code: 'TRANSPORT',
        name: 'Transport',
        description: 'Koszt transportu do klienta',
        type: SurchargeType.FIXED,
        value: 50,
        isRequired: false,
        isOptional: true,
      },
      {
        code: 'MONTAZ',
        name: 'Montaż',
        description: 'Koszt montażu u klienta',
        type: SurchargeType.PER_M2,
        value: 25,
        isRequired: false,
        isOptional: true,
      },
      {
        code: 'EXPRESS',
        name: 'Dostawa ekspresowa',
        description: 'Przyspieszona realizacja zamówienia',
        type: SurchargeType.PERCENT,
        value: 15,
        isRequired: false,
        isOptional: true,
      },
      {
        code: 'PAKOWANIE',
        name: 'Pakowanie premium',
        description: 'Dodatkowe zabezpieczenie przesyłki',
        type: SurchargeType.FIXED,
        value: 20,
        isRequired: false,
        isOptional: true,
      },
    ];

    const created = [];
    for (const surcharge of defaults) {
      const existing = await this.prisma.surcharge.findFirst({
        where: { tenantId, code: surcharge.code },
      });

      if (!existing) {
        const result = await this.prisma.surcharge.create({
          data: { tenantId, ...surcharge },
        });
        created.push(result);
      }
    }

    return { created: created.length, surcharges: created };
  }
}

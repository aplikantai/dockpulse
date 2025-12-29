import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  CustomerListQueryDto,
} from './dto/customer.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(tenantId: string, dto: CreateCustomerDto): Promise<CustomerResponseDto> {
    const customer = await (this.prisma as any).customer.create({
      data: {
        ...dto,
        tenantId,
      },
    });

    return customer;
  }

  async findAll(
    tenantId: string,
    query: CustomerListQueryDto = {},
  ): Promise<{ data: CustomerResponseDto[]; total: number }> {
    const { search, tag, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (tag) {
      where.tags = { has: tag };
    }

    const [data, total] = await Promise.all([
      (this.prisma as any).customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).customer.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(tenantId: string, customerId: string): Promise<CustomerResponseDto> {
    const cacheKey = `customer:${customerId}`;
    const cached = await this.cacheManager.get<CustomerResponseDto>(cacheKey);
    if (cached && cached.tenantId === tenantId) return cached;

    const customer = await (this.prisma as any).customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.cacheManager.set(cacheKey, customer, 300000); // 5 min
    return customer;
  }

  async update(
    tenantId: string,
    customerId: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    const existingCustomer = await (this.prisma as any).customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!existingCustomer) {
      throw new NotFoundException('Customer not found');
    }

    const customer = await (this.prisma as any).customer.update({
      where: { id: customerId },
      data: dto,
    });

    // Invalidate cache
    await this.cacheManager.del(`customer:${customerId}`);

    return customer;
  }

  async remove(tenantId: string, customerId: string): Promise<void> {
    const customer = await (this.prisma as any).customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await (this.prisma as any).customer.delete({
      where: { id: customerId },
    });

    // Invalidate cache
    await this.cacheManager.del(`customer:${customerId}`);
  }

  async addTag(tenantId: string, customerId: string, tag: string): Promise<CustomerResponseDto> {
    const customer = await (this.prisma as any).customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const tags = customer.tags || [];
    if (!tags.includes(tag)) {
      tags.push(tag);
    }

    return (this.prisma as any).customer.update({
      where: { id: customerId },
      data: { tags },
    });
  }

  async removeTag(tenantId: string, customerId: string, tag: string): Promise<CustomerResponseDto> {
    const customer = await (this.prisma as any).customer.findFirst({
      where: { id: customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const tags = (customer.tags || []).filter((t: string) => t !== tag);

    return (this.prisma as any).customer.update({
      where: { id: customerId },
      data: { tags },
    });
  }
}

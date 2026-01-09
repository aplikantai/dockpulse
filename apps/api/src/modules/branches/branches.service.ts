import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateBranchDto, UpdateBranchDto, AssignUserDto, PostalPrefixDto } from './dto';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { users: true, orders: true },
        },
        postalPrefixes: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, tenantId },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
        },
        postalPrefixes: true,
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    return branch;
  }

  async create(tenantId: string, dto: CreateBranchDto) {
    // Check if code already exists
    const existing = await this.prisma.branch.findFirst({
      where: { tenantId, code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Branch with code ${dto.code} already exists`);
    }

    // If this is default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.branch.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.branch.create({
      data: {
        tenantId,
        ...dto,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateBranchDto) {
    await this.findOne(tenantId, id);

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.branch.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.branch.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    // Check if branch has orders
    const ordersCount = await this.prisma.order.count({
      where: { branchId: id },
    });

    if (ordersCount > 0) {
      throw new ConflictException(
        `Cannot delete branch with ${ordersCount} orders. Deactivate it instead.`,
      );
    }

    return this.prisma.branch.delete({
      where: { id },
    });
  }

  // User assignments
  async getUsers(tenantId: string, branchId: string) {
    await this.findOne(tenantId, branchId);

    return this.prisma.userBranch.findMany({
      where: { branchId },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, active: true },
        },
      },
    });
  }

  async assignUser(tenantId: string, branchId: string, dto: AssignUserDto) {
    await this.findOne(tenantId, branchId);

    // Check if user exists and belongs to tenant
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    // Check if already assigned
    const existing = await this.prisma.userBranch.findFirst({
      where: { userId: dto.userId, branchId },
    });

    if (existing) {
      throw new ConflictException('User is already assigned to this branch');
    }

    return this.prisma.userBranch.create({
      data: {
        userId: dto.userId,
        branchId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });
  }

  async unassignUser(tenantId: string, branchId: string, userId: string) {
    await this.findOne(tenantId, branchId);

    const assignment = await this.prisma.userBranch.findFirst({
      where: { userId, branchId },
    });

    if (!assignment) {
      throw new NotFoundException('User is not assigned to this branch');
    }

    return this.prisma.userBranch.delete({
      where: { id: assignment.id },
    });
  }

  // Postal prefixes
  async getPostalPrefixes(tenantId: string, branchId: string) {
    await this.findOne(tenantId, branchId);

    return this.prisma.branchPostalPrefix.findMany({
      where: { branchId },
      orderBy: { prefix: 'asc' },
    });
  }

  async addPostalPrefix(tenantId: string, branchId: string, dto: PostalPrefixDto) {
    await this.findOne(tenantId, branchId);

    // Check if prefix already exists in any branch
    const existing = await this.prisma.branchPostalPrefix.findFirst({
      where: { prefix: dto.prefix },
      include: { branch: true },
    });

    if (existing) {
      throw new ConflictException(
        `Prefix ${dto.prefix} is already assigned to branch ${existing.branch.name}`,
      );
    }

    return this.prisma.branchPostalPrefix.create({
      data: {
        branchId,
        ...dto,
      },
    });
  }

  async removePostalPrefix(tenantId: string, branchId: string, prefixId: string) {
    await this.findOne(tenantId, branchId);

    const prefix = await this.prisma.branchPostalPrefix.findFirst({
      where: { id: prefixId, branchId },
    });

    if (!prefix) {
      throw new NotFoundException('Postal prefix not found');
    }

    return this.prisma.branchPostalPrefix.delete({
      where: { id: prefixId },
    });
  }

  // Find branch by postal code
  async findByPostalCode(tenantId: string, postalCode: string) {
    // Try exact match first (e.g., "66-400")
    let prefix = await this.prisma.branchPostalPrefix.findFirst({
      where: {
        prefix: postalCode,
        branch: { tenantId },
      },
      include: { branch: true },
    });

    if (prefix) {
      return prefix.branch;
    }

    // Try partial match (e.g., "66-40", "66-4", "66-", "66")
    const parts = postalCode.split('-');
    const prefixes = [
      postalCode,
      parts[0] + '-' + (parts[1]?.substring(0, 2) || ''),
      parts[0] + '-' + (parts[1]?.substring(0, 1) || ''),
      parts[0] + '-',
      parts[0],
    ];

    for (const p of prefixes) {
      prefix = await this.prisma.branchPostalPrefix.findFirst({
        where: {
          prefix: p,
          branch: { tenantId },
        },
        include: { branch: true },
      });

      if (prefix) {
        return prefix.branch;
      }
    }

    // Return default branch if no match
    return this.prisma.branch.findFirst({
      where: { tenantId, isDefault: true },
    });
  }
}

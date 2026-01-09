import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateLocationDto, UpdateLocationDto } from './dto';

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, type?: string) {
    return this.prisma.location.findMany({
      where: {
        tenantId,
        ...(type && { type: type as any }),
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findActive(tenantId: string) {
    return this.prisma.location.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async findDefault(tenantId: string) {
    return this.prisma.location.findFirst({
      where: { tenantId, isDefault: true, isActive: true },
    });
  }

  async findOne(tenantId: string, id: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return location;
  }

  async create(tenantId: string, dto: CreateLocationDto) {
    // Check if code already exists
    if (dto.code) {
      const existing = await this.prisma.location.findFirst({
        where: { tenantId, code: dto.code },
      });

      if (existing) {
        throw new ConflictException(`Location with code ${dto.code} already exists`);
      }
    }

    // If this is default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.location.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.location.create({
      data: {
        tenantId,
        ...dto,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateLocationDto) {
    await this.findOne(tenantId, id);

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.location.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.location.update({
      where: { id },
      data: dto,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    // Check if location has orders
    const ordersCount = await this.prisma.order.count({
      where: { locationId: id },
    });

    if (ordersCount > 0) {
      throw new ConflictException(
        `Cannot delete location with ${ordersCount} orders. Deactivate it instead.`,
      );
    }

    return this.prisma.location.delete({
      where: { id },
    });
  }

  // Find nearest location
  async findNearest(tenantId: string, lat: number, lng: number) {
    const locations = await this.prisma.location.findMany({
      where: { tenantId, isActive: true, latitude: { not: null }, longitude: { not: null } },
    });

    if (locations.length === 0) {
      return null;
    }

    // Calculate distances using Haversine formula
    const withDistances = locations.map((loc) => ({
      ...loc,
      distance: this.haversineDistance(lat, lng, loc.latitude!, loc.longitude!),
    }));

    // Sort by distance
    withDistances.sort((a, b) => a.distance - b.distance);

    return withDistances[0];
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

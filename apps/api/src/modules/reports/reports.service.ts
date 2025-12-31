import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CsvService } from './services/csv.service';
import { PdfService } from './services/pdf.service';
import { ReportType, ReportFormat, ReportFilterDto } from './dto/report.dto';

export interface ReportResult {
  content: string;
  contentType: string;
  filename: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly csvService: CsvService,
    private readonly pdfService: PdfService,
  ) {}

  async generateReport(
    tenantId: string,
    type: ReportType,
    format: ReportFormat,
    filters: ReportFilterDto = {},
    generatedBy?: string,
  ): Promise<ReportResult> {
    // Fetch data based on report type
    const data = await this.fetchReportData(tenantId, type, filters);

    if (data.length === 0) {
      throw new BadRequestException('Brak danych do wygenerowania raportu');
    }

    // Generate report in requested format
    let content: string;
    let contentType: string;
    let extension: string;

    switch (format) {
      case ReportFormat.CSV:
        content = this.generateCsv(type, data);
        contentType = 'text/csv; charset=utf-8';
        extension = 'csv';
        break;

      case ReportFormat.PDF:
      case ReportFormat.HTML:
        content = this.generatePdfHtml(type, data, { generatedBy });
        contentType = format === ReportFormat.PDF
          ? 'application/pdf'
          : 'text/html; charset=utf-8';
        extension = format === ReportFormat.PDF ? 'pdf' : 'html';
        break;

      default:
        throw new BadRequestException('Nieobsługiwany format raportu');
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `raport_${type}_${timestamp}.${extension}`;

    return { content, contentType, filename };
  }

  private async fetchReportData(
    tenantId: string,
    type: ReportType,
    filters: ReportFilterDto,
  ): Promise<any[]> {
    const dateFilter = this.buildDateFilter(filters.dateFrom, filters.dateTo);

    switch (type) {
      case ReportType.ORDERS:
        return this.prisma.order.findMany({
          where: {
            tenantId,
            ...(dateFilter && { createdAt: dateFilter }),
            ...(filters.status && { status: filters.status }),
            ...(filters.customerId && { customerId: filters.customerId }),
          },
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

      case ReportType.CUSTOMERS:
        return this.prisma.customer.findMany({
          where: {
            tenantId,
            ...(dateFilter && { createdAt: dateFilter }),
          },
          include: {
            _count: {
              select: { orders: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

      case ReportType.PRODUCTS:
        return this.prisma.product.findMany({
          where: {
            tenantId,
            ...(filters.categoryId && { categoryId: filters.categoryId }),
          },
          include: {
            category: true,
          },
          orderBy: { name: 'asc' },
        });

      case ReportType.QUOTES:
        return this.prisma.quote.findMany({
          where: {
            tenantId,
            ...(dateFilter && { createdAt: dateFilter }),
            ...(filters.status && { status: filters.status }),
            ...(filters.customerId && { customerId: filters.customerId }),
          },
          include: {
            customer: true,
            items: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });

      default:
        throw new BadRequestException('Nieobsługiwany typ raportu');
    }
  }

  private generateCsv(type: ReportType, data: any[]): string {
    switch (type) {
      case ReportType.ORDERS:
        return this.csvService.generateOrdersReport(data);
      case ReportType.CUSTOMERS:
        return this.csvService.generateCustomersReport(data);
      case ReportType.PRODUCTS:
        return this.csvService.generateProductsReport(data);
      case ReportType.QUOTES:
        return this.csvService.generateQuotesReport(data);
      default:
        throw new BadRequestException('Nieobsługiwany typ raportu');
    }
  }

  private generatePdfHtml(
    type: ReportType,
    data: any[],
    options: { generatedBy?: string } = {},
  ): string {
    switch (type) {
      case ReportType.ORDERS:
        return this.pdfService.generateOrdersReport(data, options);
      case ReportType.CUSTOMERS:
        return this.pdfService.generateCustomersReport(data, options);
      case ReportType.PRODUCTS:
        return this.pdfService.generateProductsReport(data, options);
      case ReportType.QUOTES:
        return this.pdfService.generateQuotesReport(data, options);
      default:
        throw new BadRequestException('Nieobsługiwany typ raportu');
    }
  }

  private buildDateFilter(
    dateFrom?: string,
    dateTo?: string,
  ): { gte?: Date; lte?: Date } | null {
    if (!dateFrom && !dateTo) return null;

    const filter: { gte?: Date; lte?: Date } = {};

    if (dateFrom) {
      filter.gte = new Date(dateFrom);
    }

    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filter.lte = endDate;
    }

    return filter;
  }

  // Quick stats for dashboard
  async getReportStats(tenantId: string): Promise<{
    ordersThisMonth: number;
    ordersLastMonth: number;
    customersTotal: number;
    productsActive: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [ordersThisMonth, ordersLastMonth, customersTotal, productsActive] =
      await Promise.all([
        this.prisma.order.count({
          where: {
            tenantId,
            createdAt: { gte: startOfMonth },
          },
        }),
        this.prisma.order.count({
          where: {
            tenantId,
            createdAt: {
              gte: startOfLastMonth,
              lte: endOfLastMonth,
            },
          },
        }),
        this.prisma.customer.count({ where: { tenantId } }),
        this.prisma.product.count({ where: { tenantId, active: true } }),
      ]);

    return {
      ordersThisMonth,
      ordersLastMonth,
      customersTotal,
      productsActive,
    };
  }
}

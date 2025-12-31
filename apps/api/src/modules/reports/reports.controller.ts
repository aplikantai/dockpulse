import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  UseGuards,
  Headers,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { GenerateReportDto, ReportType, ReportFormat, ReportFilterDto } from './dto/report.dto';

@ApiTags('Raporty')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generowanie raportu (CSV/PDF/HTML)' })
  @ApiHeader({ name: 'x-tenant-id', description: 'ID tenanta' })
  @ApiBearerAuth()
  async generateReport(
    @Body() dto: GenerateReportDto,
    @Headers('x-tenant-id') tenantId: string,
    @Res() res: Response,
  ) {
    const filters: ReportFilterDto = {
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
      status: dto.status,
      customerId: dto.customerId,
    };

    const result = await this.reportsService.generateReport(
      tenantId,
      dto.type,
      dto.format,
      filters,
    );

    // Set response headers
    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);

    // Add BOM for CSV (Excel compatibility with Polish chars)
    if (dto.format === ReportFormat.CSV) {
      res.send('\uFEFF' + result.content);
    } else {
      res.send(result.content);
    }
  }

  @Get('orders/csv')
  @ApiOperation({ summary: 'Eksport zamówień do CSV' })
  @ApiHeader({ name: 'x-tenant-id', description: 'ID tenanta' })
  @ApiBearerAuth()
  async exportOrdersCsv(
    @Headers('x-tenant-id') tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    const result = await this.reportsService.generateReport(
      tenantId,
      ReportType.ORDERS,
      ReportFormat.CSV,
      { dateFrom, dateTo, status },
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send('\uFEFF' + result.content);
  }

  @Get('orders/pdf')
  @ApiOperation({ summary: 'Eksport zamówień do PDF (HTML)' })
  @ApiHeader({ name: 'x-tenant-id', description: 'ID tenanta' })
  @ApiBearerAuth()
  async exportOrdersPdf(
    @Headers('x-tenant-id') tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    const result = await this.reportsService.generateReport(
      tenantId,
      ReportType.ORDERS,
      ReportFormat.HTML,
      { dateFrom, dateTo, status },
    );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(result.content);
  }

  @Get('customers/csv')
  @ApiOperation({ summary: 'Eksport klientów do CSV' })
  @ApiHeader({ name: 'x-tenant-id', description: 'ID tenanta' })
  @ApiBearerAuth()
  async exportCustomersCsv(
    @Headers('x-tenant-id') tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Res() res?: Response,
  ) {
    const result = await this.reportsService.generateReport(
      tenantId,
      ReportType.CUSTOMERS,
      ReportFormat.CSV,
      { dateFrom, dateTo },
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send('\uFEFF' + result.content);
  }

  @Get('products/csv')
  @ApiOperation({ summary: 'Eksport produktów do CSV' })
  @ApiHeader({ name: 'x-tenant-id', description: 'ID tenanta' })
  @ApiBearerAuth()
  async exportProductsCsv(
    @Headers('x-tenant-id') tenantId: string,
    @Query('categoryId') categoryId?: string,
    @Res() res?: Response,
  ) {
    const result = await this.reportsService.generateReport(
      tenantId,
      ReportType.PRODUCTS,
      ReportFormat.CSV,
      { categoryId },
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send('\uFEFF' + result.content);
  }

  @Get('quotes/csv')
  @ApiOperation({ summary: 'Eksport wycen do CSV' })
  @ApiHeader({ name: 'x-tenant-id', description: 'ID tenanta' })
  @ApiBearerAuth()
  async exportQuotesCsv(
    @Headers('x-tenant-id') tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('status') status?: string,
    @Res() res?: Response,
  ) {
    const result = await this.reportsService.generateReport(
      tenantId,
      ReportType.QUOTES,
      ReportFormat.CSV,
      { dateFrom, dateTo, status },
    );

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send('\uFEFF' + result.content);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statystyki do dashboard' })
  @ApiHeader({ name: 'x-tenant-id', description: 'ID tenanta' })
  @ApiBearerAuth()
  async getStats(@Headers('x-tenant-id') tenantId: string) {
    return this.reportsService.getReportStats(tenantId);
  }
}

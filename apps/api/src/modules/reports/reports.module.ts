import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { CsvService } from './services/csv.service';
import { PdfService } from './services/pdf.service';
import { DatabaseModule } from '../database/prisma.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ReportsController],
  providers: [ReportsService, CsvService, PdfService],
  exports: [ReportsService, CsvService, PdfService],
})
export class ReportsModule {}

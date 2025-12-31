import { Injectable } from '@nestjs/common';

export interface PdfTableColumn {
  header: string;
  key: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any, row: any) => string;
}

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  companyName?: string;
  generatedBy?: string;
  orientation?: 'portrait' | 'landscape';
}

@Injectable()
export class PdfService {
  /**
   * Generate PDF report as HTML (to be converted by puppeteer/wkhtmltopdf)
   * For now returns HTML that can be rendered as PDF
   */
  generateReportHtml<T extends Record<string, any>>(
    data: T[],
    columns: PdfTableColumn[],
    options: PdfReportOptions,
  ): string {
    const {
      title,
      subtitle,
      companyName = 'DockPulse',
      generatedBy,
      orientation = 'portrait',
    } = options;

    const now = new Date().toLocaleString('pl-PL');

    return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4 ${orientation};
      margin: 15mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 10px;
      line-height: 1.4;
      color: #333;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #2563eb;
    }

    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }

    .report-info {
      text-align: right;
      font-size: 9px;
      color: #666;
    }

    .title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 5px;
      color: #1e293b;
    }

    .subtitle {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 15px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    th {
      background-color: #2563eb;
      color: white;
      padding: 8px 6px;
      text-align: left;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
    }

    td {
      padding: 6px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 9px;
    }

    tr:nth-child(even) {
      background-color: #f8fafc;
    }

    tr:hover {
      background-color: #f1f5f9;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 10px 15mm;
      font-size: 8px;
      color: #94a3b8;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }

    .summary {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8fafc;
      border-radius: 8px;
    }

    .summary-title {
      font-weight: bold;
      margin-bottom: 10px;
      color: #1e293b;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${companyName}</div>
    </div>
    <div class="report-info">
      <div>Wygenerowano: ${now}</div>
      ${generatedBy ? `<div>Przez: ${generatedBy}</div>` : ''}
    </div>
  </div>

  <div class="title">${title}</div>
  ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}

  <table>
    <thead>
      <tr>
        ${columns.map((col) => `<th class="${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}" style="${col.width ? `width: ${col.width}px` : ''}">${col.header}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map((row) => `
        <tr>
          ${columns.map((col) => {
            const value = this.getNestedValue(row, col.key);
            const formatted = col.formatter ? col.formatter(value, row) : this.formatValue(value);
            return `<td class="${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}">${formatted}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-title">Podsumowanie</div>
    <div class="summary-row">
      <span>Liczba rekordów:</span>
      <strong>${data.length}</strong>
    </div>
  </div>

  <div class="footer">
    ${companyName} - Raport wygenerowany automatycznie przez system DockPulse
  </div>
</body>
</html>`;
  }

  /**
   * Generate orders PDF report
   */
  generateOrdersReport(orders: any[], options: Partial<PdfReportOptions> = {}): string {
    const columns: PdfTableColumn[] = [
      { header: 'Nr zamówienia', key: 'orderNumber', width: 80 },
      { header: 'Data', key: 'createdAt', width: 70, formatter: (v) => this.formatDate(v) },
      { header: 'Klient', key: 'customer.name', width: 120 },
      { header: 'Status', key: 'status', width: 80, formatter: (v) => this.translateStatus(v) },
      { header: 'Netto', key: 'totalNet', width: 70, align: 'right', formatter: (v) => this.formatCurrency(v) },
      { header: 'Brutto', key: 'totalGross', width: 70, align: 'right', formatter: (v) => this.formatCurrency(v) },
    ];

    return this.generateReportHtml(orders, columns, {
      title: 'Raport zamówień',
      ...options,
    });
  }

  /**
   * Generate customers PDF report
   */
  generateCustomersReport(customers: any[], options: Partial<PdfReportOptions> = {}): string {
    const columns: PdfTableColumn[] = [
      { header: 'Nazwa', key: 'name', width: 120 },
      { header: 'Firma', key: 'company', width: 100 },
      { header: 'Email', key: 'email', width: 130 },
      { header: 'Telefon', key: 'phone', width: 90 },
      { header: 'Miasto', key: 'city', width: 80 },
      { header: 'Zamówienia', key: '_count.orders', width: 60, align: 'center', formatter: (v) => String(v || 0) },
    ];

    return this.generateReportHtml(customers, columns, {
      title: 'Raport klientów',
      ...options,
    });
  }

  /**
   * Generate products PDF report
   */
  generateProductsReport(products: any[], options: Partial<PdfReportOptions> = {}): string {
    const columns: PdfTableColumn[] = [
      { header: 'SKU', key: 'sku', width: 80 },
      { header: 'Nazwa', key: 'name', width: 150 },
      { header: 'Kategoria', key: 'category.name', width: 100 },
      { header: 'Cena', key: 'price', width: 70, align: 'right', formatter: (v) => this.formatCurrency(v) },
      { header: 'Stan', key: 'stock', width: 50, align: 'center', formatter: (v) => String(v || 0) },
      { header: 'Aktywny', key: 'active', width: 50, align: 'center', formatter: (v) => v ? 'Tak' : 'Nie' },
    ];

    return this.generateReportHtml(products, columns, {
      title: 'Raport produktów',
      ...options,
    });
  }

  /**
   * Generate quotes PDF report
   */
  generateQuotesReport(quotes: any[], options: Partial<PdfReportOptions> = {}): string {
    const columns: PdfTableColumn[] = [
      { header: 'Nr wyceny', key: 'quoteNumber', width: 80 },
      { header: 'Data', key: 'createdAt', width: 70, formatter: (v) => this.formatDate(v) },
      { header: 'Klient', key: 'customer.name', width: 120 },
      { header: 'Status', key: 'status', width: 80, formatter: (v) => this.translateQuoteStatus(v) },
      { header: 'Ważna do', key: 'validUntil', width: 70, formatter: (v) => v ? this.formatDate(v) : '-' },
      { header: 'Brutto', key: 'totalGross', width: 80, align: 'right', formatter: (v) => this.formatCurrency(v) },
    ];

    return this.generateReportHtml(quotes, columns, {
      title: 'Raport wycen',
      ...options,
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return this.formatDate(value);
    if (typeof value === 'boolean') return value ? 'Tak' : 'Nie';
    return String(value);
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pl-PL');
  }

  private formatCurrency(value: any): string {
    if (value === null || value === undefined) return '0,00 zł';
    return Number(value).toLocaleString('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    });
  }

  private translateStatus(status: string): string {
    const map: Record<string, string> = {
      new: 'Nowe',
      confirmed: 'Potwierdzone',
      in_progress: 'W realizacji',
      completed: 'Zakończone',
      cancelled: 'Anulowane',
    };
    return map[status] || status;
  }

  private translateQuoteStatus(status: string): string {
    const map: Record<string, string> = {
      draft: 'Szkic',
      sent: 'Wysłana',
      accepted: 'Zaakceptowana',
      rejected: 'Odrzucona',
      expired: 'Wygasła',
    };
    return map[status] || status;
  }
}

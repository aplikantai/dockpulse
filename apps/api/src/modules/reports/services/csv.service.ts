import { Injectable } from '@nestjs/common';

export interface CsvColumn<T> {
  header: string;
  key: keyof T | string;
  formatter?: (value: any, row: T) => string;
}

@Injectable()
export class CsvService {
  /**
   * Generate CSV content from array of objects
   */
  generate<T extends Record<string, any>>(
    data: T[],
    columns: CsvColumn<T>[],
    options: { delimiter?: string; includeHeader?: boolean } = {},
  ): string {
    const { delimiter = ';', includeHeader = true } = options;

    const lines: string[] = [];

    // Header row
    if (includeHeader) {
      const headers = columns.map((col) => this.escapeValue(col.header));
      lines.push(headers.join(delimiter));
    }

    // Data rows
    for (const row of data) {
      const values = columns.map((col) => {
        const rawValue = this.getNestedValue(row, col.key as string);
        const formattedValue = col.formatter
          ? col.formatter(rawValue, row)
          : this.formatValue(rawValue);
        return this.escapeValue(formattedValue);
      });
      lines.push(values.join(delimiter));
    }

    return lines.join('\n');
  }

  /**
   * Generate CSV for orders report
   */
  generateOrdersReport(orders: any[]): string {
    const columns: CsvColumn<any>[] = [
      { header: 'Numer zamówienia', key: 'orderNumber' },
      { header: 'Data', key: 'createdAt', formatter: (v) => this.formatDate(v) },
      { header: 'Klient', key: 'customer.name' },
      { header: 'Telefon', key: 'customer.phone' },
      { header: 'Status', key: 'status', formatter: (v) => this.translateStatus(v) },
      { header: 'Netto', key: 'totalNet', formatter: (v) => this.formatCurrency(v) },
      { header: 'Brutto', key: 'totalGross', formatter: (v) => this.formatCurrency(v) },
      { header: 'Liczba pozycji', key: 'items', formatter: (v) => String(v?.length || 0) },
    ];

    return this.generate(orders, columns);
  }

  /**
   * Generate CSV for customers report
   */
  generateCustomersReport(customers: any[]): string {
    const columns: CsvColumn<any>[] = [
      { header: 'Nazwa', key: 'name' },
      { header: 'Firma', key: 'company' },
      { header: 'Email', key: 'email' },
      { header: 'Telefon', key: 'phone' },
      { header: 'Miasto', key: 'city' },
      { header: 'Data utworzenia', key: 'createdAt', formatter: (v) => this.formatDate(v) },
      { header: 'Liczba zamówień', key: '_count.orders', formatter: (v) => String(v || 0) },
    ];

    return this.generate(customers, columns);
  }

  /**
   * Generate CSV for products report
   */
  generateProductsReport(products: any[]): string {
    const columns: CsvColumn<any>[] = [
      { header: 'SKU', key: 'sku' },
      { header: 'Nazwa', key: 'name' },
      { header: 'Kategoria', key: 'category.name' },
      { header: 'Cena', key: 'price', formatter: (v) => this.formatCurrency(v) },
      { header: 'Stan magazynowy', key: 'stock', formatter: (v) => String(v || 0) },
      { header: 'Aktywny', key: 'active', formatter: (v) => v ? 'Tak' : 'Nie' },
    ];

    return this.generate(products, columns);
  }

  /**
   * Generate CSV for quotes report
   */
  generateQuotesReport(quotes: any[]): string {
    const columns: CsvColumn<any>[] = [
      { header: 'Numer wyceny', key: 'quoteNumber' },
      { header: 'Data', key: 'createdAt', formatter: (v) => this.formatDate(v) },
      { header: 'Klient', key: 'customer.name' },
      { header: 'Status', key: 'status', formatter: (v) => this.translateQuoteStatus(v) },
      { header: 'Ważna do', key: 'validUntil', formatter: (v) => v ? this.formatDate(v) : '-' },
      { header: 'Netto', key: 'totalNet', formatter: (v) => this.formatCurrency(v) },
      { header: 'Brutto', key: 'totalGross', formatter: (v) => this.formatCurrency(v) },
    ];

    return this.generate(quotes, columns);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private escapeValue(value: string): string {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    // Escape quotes and wrap in quotes if contains special characters
    if (stringValue.includes('"') || stringValue.includes(';') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (value instanceof Date) {
      return this.formatDate(value);
    }
    if (typeof value === 'boolean') {
      return value ? 'Tak' : 'Nie';
    }
    return String(value);
  }

  private formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  private formatCurrency(value: any): string {
    if (value === null || value === undefined) return '0,00';
    const num = Number(value);
    return num.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      new: 'Nowe',
      confirmed: 'Potwierdzone',
      in_progress: 'W realizacji',
      completed: 'Zakończone',
      cancelled: 'Anulowane',
    };
    return statusMap[status] || status;
  }

  private translateQuoteStatus(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'Szkic',
      sent: 'Wysłana',
      accepted: 'Zaakceptowana',
      rejected: 'Odrzucona',
      expired: 'Wygasła',
    };
    return statusMap[status] || status;
  }
}

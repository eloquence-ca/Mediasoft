import { Injectable } from '@nestjs/common';
import * as ejs from 'ejs';
import { exec } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';
import { Document } from './entities/document.entity';
import {
  ItemDocument,
  TYPE_ITEM_DOCUMENT,
} from './entities/item-document.entity';
import { Address } from 'src/address/entities/address.entity';
import { Customer } from 'src/customer/entities/customer.entity';

const execPromise = promisify(exec);

@Injectable()
export class HtmlPdfGeneratorService {
  private readonly templatePath = path.join(
    __dirname,
    '..',
    'mail',
    'templates',
    `doc_1.ejs`,
  );

  async generatePDF(html: string): Promise<string> {
    const tmpDir = path.join(process.cwd(), 'tmp');
    await fs.promises.mkdir(tmpDir, { recursive: true });

    const timestamp = Date.now();
    const htmlPath = path.join(tmpDir, `document-${timestamp}.html`);
    const pdfPath = path.join(tmpDir, `document-${timestamp}.pdf`);

    await fs.promises.writeFile(htmlPath, html, 'utf8');

    const inputFile = `file://${htmlPath}`;

    try {
      const { stdout, stderr } = await execPromise(
        `wkhtmltopdf ${inputFile} ${pdfPath}`,
      );

      if (stdout) console.log('stdout:', stdout);
      if (stderr) console.warn('stderr:', stderr);
    } catch (err) {
      console.error('Erreur wkhtmltopdf:', err);
      throw new Error('Échec génération PDF');
    }

    const exists = await fs.promises.stat(pdfPath).catch(() => null);
    if (!exists) throw new Error('Le PDF n’a pas été généré');

    await fs.promises.unlink(htmlPath);
    return pdfPath;
  }

  async generateHtml(document: Document): Promise<string> {
    const templateData = {
      document,
      formatDate: this.formatDate,
      formatCurrency: this.formatCurrency,
      getTypeLabel: this.getTypeLabel,
      calculateSubtotal: this.calculateSubtotal,
      formatAdrress: this.formatAdrress,
      getCustomerName: this.getCustomerName,
    };

    return ejs.renderFile(this.templatePath, templateData);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR').format(new Date(date));
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount || 0);
  }

  private getTypeLabel(type: TYPE_ITEM_DOCUMENT): string {
    switch (type) {
      case TYPE_ITEM_DOCUMENT.TITLE:
        return 'TITRE';
      case TYPE_ITEM_DOCUMENT.ARTICLE:
        return 'AR';
      case TYPE_ITEM_DOCUMENT.OUVRAGE:
        return 'OU';
      default:
        return '';
    }
  }

  private calculateSubtotal(items: ItemDocument[]): number {
    let total = 0;

    const addItemTotal = (item: ItemDocument) => {
      if (item.type !== TYPE_ITEM_DOCUMENT.TITLE && item.totalHT) {
        total += item.totalHT;
      }
      if (item.items) {
        item.items.forEach(addItemTotal);
      }
    };

    items.forEach(addItemTotal);
    return total;
  }

  private formatAdrress(address?: Address): string {
    if (!address) return '---';
    return `${address.trackNum || ''} ${address.trackName} ${address.label} ${address.postalCode} ${address.countryName || ''}`;
  }

  private getCustomerName(customer?: Customer): string {
    if (!customer) {
      return '---';
    }

    switch (customer.type) {
      case 'INDIVIDUAL':
        return `${customer.individual?.firstname || ''} ${customer.individual?.lastname || ''}`.trim();

      case 'PROFESSIONAL':
        return `${customer.professional?.legalStatus} ${customer.professional?.companyName || '---'} ${customer.professional?.siret}`.trim();

      case 'PUBLIC_ENTITY':
        return `${customer.publicEntity?.entityName || '---'} ${customer.publicEntity?.siret}`.trim();

      default:
        return '---';
    }
  }
}

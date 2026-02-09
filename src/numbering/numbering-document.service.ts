import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DOCUMENT_TYPE } from 'src/document/enum';
import { Repository } from 'typeorm';
import { NumberingDocument } from './entities/numbering-document.entity';

export const DefaultFormats = [
  { type: DOCUMENT_TYPE.DEVIS, format: `DEV-[AAAA][MOIS]-[NUM]`, final: false },
  {
    type: DOCUMENT_TYPE.COMMANDE,
    format: `CMD-[AAAA][MOIS]-[NUM]`,
    final: false,
  },
  {
    type: DOCUMENT_TYPE.FACTURE_ACOMPTE,
    format: `FACAC-PRO-[AAAA][MOIS]-[NUM]`,
    final: false,
  },
  {
    type: DOCUMENT_TYPE.FACTURE_ACOMPTE,
    format: `FACAC-[AAAA][MOIS]-[NUM]`,
    final: true,
  },
  {
    type: DOCUMENT_TYPE.FACTURE,
    format: `FAC-PRO-[AAAA][MOIS]-[NUM]`,
    final: false,
  },
  {
    type: DOCUMENT_TYPE.FACTURE,
    format: `FAC-[AAAA][MOIS]-[NUM]`,
    final: true,
  },
  {
    type: DOCUMENT_TYPE.ALL_FACTURE,
    format: `FAC-PRO-[AAAA][MOIS]-[NUM]`,
    final: false,
  },
  {
    type: DOCUMENT_TYPE.ALL_FACTURE,
    format: `FAC-[AAAA][MOIS]-[NUM]`,
    final: true,
  },
  { type: DOCUMENT_TYPE.AVOIR, format: `AVO-[AAAA][MOIS]-[NUM]`, final: false },
];

@Injectable()
export class NumberingDocumentService {
  constructor(
    @InjectRepository(NumberingDocument)
    private readonly numberingRepository: Repository<NumberingDocument>,
  ) {}

  async create(
    idCompany: string,
    idTypeDocument: string,
    codeType: DOCUMENT_TYPE,
    final: boolean,
  ): Promise<NumberingDocument | null> {
    const defautFormat = DefaultFormats.find(
      (item) => item.type === codeType && item.final === final,
    );

    if (!defautFormat) {
      console.log('Format par défaut non trouvé');
      return null;
    }

    const numbering = this.numberingRepository.create({
      idCompany,
      idTypeDocument,
      final,
      format: defautFormat.format,
      counter: 0,
    });

    return await this.numberingRepository.save(numbering);
  }

  async getNextNumber(
    idCompany: string,
    idTypeDocument: string,
    codeType: DOCUMENT_TYPE,
    final: boolean,
  ): Promise<string> {
    let numbering = await this.numberingRepository.findOne({
      where: { idCompany, idTypeDocument, final },
    });

    if (!numbering) {
      numbering = await this.create(idCompany, idTypeDocument, codeType, final);

      if (!numbering) {
        return Date.now().toString();
      }
    }

    numbering.counter += 1;
    await this.numberingRepository.save(numbering);

    const formattedNumber = this.formatNumber(
      numbering.format,
      numbering.counter,
    );

    return formattedNumber;
  }

  async incrementNumber(
    idCompany: string,
    idTypeDocument: string,
    final: boolean,
  ): Promise<void> {
    const numbering = await this.numberingRepository.findOne({
      where: { idCompany, idTypeDocument, final },
    });

    if (numbering) {
      numbering.counter += 1;
      await this.numberingRepository.save(numbering);
    }
  }

  escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  formatNumber(format: string, counter: number): string {
    const now = new Date();

    const variables: Record<string, string> = {
      '[AAAA]': now.getFullYear().toString(),
      '[AA]': now.getFullYear().toString().slice(-2),
      '[MOIS]': (now.getMonth() + 1).toString().padStart(2, '0'),
      '[JOUR]': now.getDate().toString().padStart(2, '0'),
      '[NUM]': counter.toString(),
      '[NUM:1]': counter.toString(),
      '[NUM:2]': counter.toString().padStart(2, '0'),
      '[NUM:3]': counter.toString().padStart(3, '0'),
      '[NUM:4]': counter.toString().padStart(4, '0'),
      '[NUM:5]': counter.toString().padStart(5, '0'),
      '[NUM:6]': counter.toString().padStart(6, '0'),
    };

    let formattedCode = format;

    Object.entries(variables).forEach(([placeholder, value]) => {
      formattedCode = formattedCode.replace(
        new RegExp(this.escapeRegex(placeholder), 'g'),
        value,
      );
    });

    return formattedCode;
  }
}

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentType } from './entities/document-type.entity';
import { DOCUMENT_TYPE } from './enum';

@Injectable()
export class DocumentTypeService {
  private readonly logger = new Logger(DocumentTypeService.name);

  constructor(
    @InjectRepository(DocumentType)
    private readonly repo: Repository<DocumentType>,
  ) {}

  async findAll(): Promise<DocumentType[]> {
    return await this.repo.find({
      relations: { documentStates: true },
      order: { code: 'ASC' },
    });
  }

  async findByCode(code: DOCUMENT_TYPE): Promise<DocumentType | null> {
    return await this.repo.findOne({
      where: { code },
      relations: { documentStates: true },
    });
  }

  async findById(id: string): Promise<DocumentType | null> {
    return await this.repo.findOne({
      where: { id },
      relations: { documentStates: true },
    });
  }

  async initializeStatuses(): Promise<void> {
    this.logger.log('Initializing document statuses...');

    const typesData = [
      {
        code: DOCUMENT_TYPE.DEVIS,
        label: 'Devis',
        description: 'Document de devis',
      },
      {
        code: DOCUMENT_TYPE.COMMANDE,
        label: 'Commande',
        description: 'Document de commande',
      },
      {
        code: DOCUMENT_TYPE.FACTURE_ACOMPTE,
        label: "Facture d'acompte",
        description: "Facture d'acompte",
      },
      {
        code: DOCUMENT_TYPE.FACTURE,
        label: 'Facture',
        description: 'Facture finale',
      },
      {
        code: DOCUMENT_TYPE.ALL_FACTURE,
        label: 'Facture globale',
        description: 'Toutes les factures',
      },
      {
        code: DOCUMENT_TYPE.AVOIR,
        label: 'Avoir',
        description: 'Avoir client',
      },
    ];

    for (const data of typesData) {
      const existing = await this.repo.findOne({
        where: { code: data.code },
      });

      if (!existing) {
        const type = this.repo.create(data);
        await this.repo.save(type);
        this.logger.log(`Created type: ${data.code}`);
      } else {
        existing.label = data.label;
        existing.description = data.description;
        await this.repo.save(existing);
        this.logger.log(`Updating type: ${data.code}`);
      }
    }

    this.logger.log('Document types initialization completed');
  }

  async getDocumentType(
    id: string | null,
    code: DOCUMENT_TYPE | null,
  ): Promise<DocumentType> {
    let type: DocumentType | null = null;
    if (code) {
      type = await this.findByCode(code);
    } else if (id) {
      type = await this.findById(id);
    }

    if (!type) {
      throw new NotFoundException(`Type de document non trouvé`);
    }

    return type;
  }
}

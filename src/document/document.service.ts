import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { promises, unlinkSync } from 'node:fs';
import { AddressClone } from 'src/address-clone/entities/address-clone.entity';
import { Address } from 'src/address/entities/address.entity';
import { Company } from 'src/company/entities/company.entity';
import { DocumentStatusValueDoc } from 'src/document-status/entities/document-status-value-doc.entity';
import { DocumentStatusValue } from 'src/document-status/entities/document-status-value.entity';
import {
  DOCUMENT_STATUS,
  DOCUMENT_STATUS_VALUE,
} from 'src/document-status/group';
import { MailService } from 'src/mail/mail.service';
import { NumberingDocumentService } from 'src/numbering/numbering-document.service';
import { BillService } from 'src/payment/bill.service';
import { BillingDto } from 'src/payment/dto/billing.dto';
import { Bill } from 'src/payment/entities/bill.entity';
import { PaymentMethod } from 'src/payment/entities/payment-method.entity';
import { Payment } from 'src/payment/entities/payment.entity';
import { PaymentService } from 'src/payment/payment.service';
import { User } from 'src/user/entities/user.entity';
import { WorkflowService } from 'src/workflow/workflow.service';
import {
  DataSource,
  FindOptionsWhere,
  In,
  QueryRunner,
  Repository,
} from 'typeorm';
import { DocumentStateService } from './document-state.service';
import { DocumentTypeService } from './document-type.service';
import { ChangeStateDto } from './dto/change-state.dto';
import { CreateComponentDocumentDto } from './dto/create-component.dto';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateItemDocumentDto } from './dto/create-item-document.dto';
import { InvoiceDto } from './dto/invoice.dto';
import { TransformToDto } from './dto/transorm-to.dto';
import { ComponentDocument } from './entities/component-document.entity';
import { DocumentType } from './entities/document-type.entity';
import { Document } from './entities/document.entity';
import { ItemDocument } from './entities/item-document.entity';
import { Project } from './entities/project.entity';
import { DOCUMENT_STATE, DOCUMENT_TYPE } from './enum';
import { HtmlPdfGeneratorService } from './pdf-generator.service';

@Injectable()
export class DocumentService implements OnModuleInit {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(ItemDocument)
    private readonly itemDocumentRepository: Repository<ItemDocument>,
    @InjectRepository(ComponentDocument)
    private readonly componentDocumentRepository: Repository<ComponentDocument>,
    @InjectRepository(AddressClone)
    private readonly addressCloneRepository: Repository<AddressClone>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(DocumentStatusValue)
    private readonly documentStatusValueRepository: Repository<DocumentStatusValue>,

    private readonly numberingService: NumberingDocumentService,
    private readonly dataSource: DataSource,
    private readonly documentStateService: DocumentStateService,
    private readonly documentTypeService: DocumentTypeService,
    private readonly htmlPdfGeneratorService: HtmlPdfGeneratorService,
    private readonly mailService: MailService,
    private readonly workflowService: WorkflowService,
    private readonly paymentService: PaymentService,
    private readonly billService: BillService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing application data...');

    try {
      await this.documentTypeService.initializeStatuses();
      await this.documentStateService.initializeStates();
      await this.documentStateService.initializeStateStatusRelations();

      this.logger.log('Application data initialization completed successfully');
    } catch (error) {
      this.logger.error('Failed to initialize application data', error);
      throw error;
    }
  }

  async create(
    dto: CreateDocumentDto,
    tenantId: string,
    userId: string,
  ): Promise<Document> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const type = await this.documentTypeService.getDocumentType(
        dto.idType,
        dto.codeType,
      );

      const state = await this.documentStateService.getInitialState(type.code);

      const billingAddressClone = await this.cloneAddress(
        dto.idBillingAddress,
        queryRunner,
      );

      let workAddressClone: AddressClone | null = null;
      if (dto.idWorkAddress) {
        workAddressClone = await this.cloneAddress(
          dto.idWorkAddress,
          queryRunner,
        );
      }

      const code = await this.numberingService.getNextNumber(
        dto.idCompany,
        type.id,
        type.code,
        false,
      );

      const document = queryRunner.manager.create(Document, {
        idTenant: tenantId,
        idCreatedBy: userId,
        idUpdatedBy: userId,
        idType: type.id,
        idState: state.id,
        idCustomer: dto.idCustomer,
        idBillingAddress: billingAddressClone.id,
        idWorkAddress: workAddressClone?.id,
        idTvaRate: dto.idTvaRate,
        idConditionRegulation: dto.idConditionRegulation,
        code,
        title: dto.title,
        description: dto.description,
        tariffCategory: dto.tariffCategory,
        validityDate: dto.validityDate,
        dueDate: dto.dueDate,
        reminderDate: dto.reminderDate,
        totalHT: dto.totalHT,
        totalTVA: dto.totalTVA,
        totalTTC: dto.totalTTC,
        data: {
          customerReference: dto.customerReference,
        },
      });

      if (dto.idCompany) {
        const company = await queryRunner.manager.findOne(Company, {
          where: { id: dto.idCompany },
        });

        if (!company) {
          throw new NotFoundException(`Société non trouvée`);
        }

        const project = queryRunner.manager.create(Project, {
          idCompany: dto.idCompany,
        });

        const savedProject = await queryRunner.manager.save(Project, project);

        document.idCompany = dto.idCompany;
        document.idProject = savedProject.id;
      }

      if (type.code === DOCUMENT_TYPE.COMMANDE) {
        document.status = await this.changeDocumentStatus(
          document.id,
          [],
          DOCUMENT_STATUS.FACTURATION,
          DOCUMENT_STATUS_VALUE.A_FACTURER,
        );
      } else if (type.code === DOCUMENT_TYPE.FACTURE) {
        document.status = await this.changeDocumentStatus(
          document.id,
          [],
          DOCUMENT_STATUS.REGLEMENT,
          DOCUMENT_STATUS_VALUE.NON_REGLEE,
        );
      }

      const savedDocument = await queryRunner.manager.save(Document, document);

      const componentMap = await this.saveComponents(
        savedDocument.id,
        dto.components,
        queryRunner,
      );

      for (const itemDto of dto.items) {
        await this.saveItemDocument(
          savedDocument.id,
          null,
          itemDto,
          componentMap,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();

      return this.findOne(savedDocument.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Erreur lors de la création du document: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async update(
    id: string,
    dto: CreateDocumentDto,
    tenantId: string,
    userId: string,
  ): Promise<Document> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existing = await queryRunner.manager.findOne(Document, {
        where: { id, idTenant: tenantId },
        relations: { state: true, type: true, children: true },
      });

      if (!existing) {
        throw new NotFoundException(`Document non trouvé`);
      }

      const finalState = await this.documentStateService.getFinalState(
        existing.type.code,
      );

      if (
        existing.type.code !== DOCUMENT_TYPE.DEVIS &&
        finalState.code === existing.state.code
      ) {
        throw new NotFoundException(
          `Le document ne peut être modifié car son état est final`,
        );
      }

      if (existing.locked) {
        throw new NotFoundException(`Le document ne peut être modifier`);
      }

      const type = await this.documentTypeService.getDocumentType(
        dto.idType,
        dto.codeType,
      );

      const flow = this.workflowService.getWorkflowByDocumentType(type.code);

      if (!flow) {
        throw new BadRequestException(
          `Aucun workflow défini pour ce type de document`,
        );
      }

      const state = await this.documentStateService.getDocumentState(
        dto.idState,
        dto.codeState,
      );

      const can = this.documentStateService.verifyTransition(
        flow,
        existing.state.code,
        state.code,
      );

      if (!can) {
        throw new BadRequestException(
          `Impossible de passer de ${existing.state.label} à ${state.label} `,
        );
      }

      let billingAddressClone = existing.idBillingAddress;
      if (dto.idBillingAddress !== existing.idBillingAddress) {
        const newBillingAddressClone = await this.cloneAddress(
          dto.idBillingAddress,
          queryRunner,
        );
        billingAddressClone = newBillingAddressClone.id;
      }

      let workAddressClone = existing.idWorkAddress;
      if (dto.idWorkAddress !== existing.idWorkAddress) {
        if (dto.idWorkAddress) {
          const newWorkAddressClone = await this.cloneAddress(
            dto.idWorkAddress,
            queryRunner,
          );
          workAddressClone = newWorkAddressClone.id;
        } else {
          workAddressClone = null;
        }
      }

      await queryRunner.manager.update(Document, id, {
        idUpdatedBy: userId,
        idType: type.id,
        idState: state.id,
        idCustomer: dto.idCustomer,
        idBillingAddress: billingAddressClone,
        idWorkAddress: workAddressClone,
        idTvaRate: dto.idTvaRate,
        idConditionRegulation: dto.idConditionRegulation,
        title: dto.title,
        description: dto.description,
        tariffCategory: dto.tariffCategory,
        validityDate: dto.validityDate,
        dueDate: dto.dueDate,
        reminderDate: dto.reminderDate,
        totalHT: dto.totalHT,
        totalTVA: dto.totalTVA,
        totalTTC: dto.totalTTC,
        data: {
          ...existing.data,
        },
        updatedAt: new Date(),
      });

      const componentMap = await this.saveComponents(
        id,
        dto.components,
        queryRunner,
      );

      await queryRunner.manager.delete(ItemDocument, { idDocument: id });

      for (const itemDto of dto.items) {
        await this.saveItemDocument(
          id,
          null,
          itemDto,
          componentMap,
          queryRunner,
        );
      }

      await queryRunner.commitTransaction();

      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Erreur lors de la mise à jour du document: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async getHtml(id: string): Promise<string> {
    const document = await this.findOne(id);

    return await this.htmlPdfGeneratorService.generateHtml(document);
  }

  async transformTo(dto: TransformToDto, user: User): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const type = await this.documentTypeService.getDocumentType(
        dto.idType,
        dto.codeType,
      );

      for (const id of dto.ids) {
        const document = await queryRunner.manager.findOne(Document, {
          where: { id },
          relations: {
            type: true,
            components: true,
            status: { documentStatus: true },
          },
        });

        if (!document) {
          throw new NotFoundException(`Document avec l'ID ${id} non trouvé`);
        }

        const items = await this.itemDocumentRepository.find({
          where: { idDocument: id },
          relations: { tvaRate: true, component: true },
        });

        document.items = this.buildItemHierarchy(items);

        await this.cloneDocumentWithTransaction(
          document,
          dto.amount,
          user,
          type,
          queryRunner,
        );

        if (type.code !== DOCUMENT_TYPE.FACTURE_ACOMPTE) {
          const state = await this.documentStateService.getFinalState(
            document.type.code,
          );
          await queryRunner.manager.update(Document, id, {
            idState: state.id,
            locked: true,
          });
        }

        if (
          document.type.code === DOCUMENT_TYPE.COMMANDE &&
          type.code === DOCUMENT_TYPE.FACTURE
        ) {
          const status = await this.changeDocumentStatus(
            document.id,
            document.status,
            DOCUMENT_STATUS.FACTURATION,
            DOCUMENT_STATUS_VALUE.FACTUREE,
          );

          await queryRunner.manager.delete(DocumentStatusValueDoc, {
            idDocument: document.id,
          });

          await Promise.all(
            status.map((item) =>
              queryRunner.manager.save(DocumentStatusValueDoc, item),
            ),
          );
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Erreur lors de la transformation des documents: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async changeState(dto: ChangeStateDto, user: User): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const state = await this.documentStateService.getDocumentState(
        dto.idState,
        dto.codeState,
      );

      for (const id of dto.ids) {
        const document = await this.documentRepository.findOne({
          where: { id },
          relations: { type: true, state: true },
        });

        if (!document) {
          throw new NotFoundException(`Document non trouvé`);
        }

        if (document.locked) {
          throw new BadRequestException(`Le document est déjà définitive`);
        }

        const flow = this.workflowService.getWorkflowByDocumentType(
          document.type.code,
        );

        if (!flow) {
          throw new BadRequestException(
            `Aucun workflow défini pour ce type de document`,
          );
        }

        const can = this.documentStateService.verifyTransition(
          flow,
          document.state.code,
          state.code,
        );

        if (!can) {
          throw new BadRequestException(
            `Impossible de passer de ${document.state.label} à ${state.label} `,
          );
        }

        if (state.code === DOCUMENT_STATE.FINAL && document.idCompany) {
          document.code = await this.numberingService.getNextNumber(
            document.idCompany,
            document.type.id,
            document.type.code,
            true,
          );

          document.locked = true;
        }

        document.idState = state.id;
        document.state = state;
        document.idUpdatedBy = user.id;
        document.updatedBy = user;

        await queryRunner.manager.save(Document, document);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      console.log('error', error);
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new BadRequestException(`Erreur lors du changement de status`);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async getTotalBillAmount(idProject: string): Promise<number> {
    const bills = await this.billService.findByProject(idProject);
    let amount = 0;
    bills.forEach((bill) => {
      amount += bill.montant;
    });

    return amount;
  }

  async getFactureAcompte(idProject: string): Promise<Document[]> {
    return await this.documentRepository.find({
      where: { idProject, type: { code: DOCUMENT_TYPE.FACTURE_ACOMPTE } },
    });
  }

  async billing(dto: BillingDto): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const method = await queryRunner.manager.findOne(PaymentMethod, {
        where: { id: dto.idPaymentMethod },
      });

      if (!method) {
        throw new NotFoundException(`Méthode de paiement non trouvé`);
      }

      for (const id of dto.ids) {
        const document = await this.documentRepository.findOne({
          where: { id },
          relations: {
            type: true,
            state: true,
            status: { documentStatus: true },
          },
        });

        if (!document) {
          throw new NotFoundException(`Document non trouvé`);
        }

        let montant = 0;

        if (document.idProject) {
          montant =
            document.totalTTC -
            (await this.getTotalBillAmount(document.idProject));
        }

        if (
          document.amount &&
          document.type.code === DOCUMENT_TYPE.FACTURE_ACOMPTE
        ) {
          montant = montant;
        }

        const payment = queryRunner.manager.create(Payment, {
          idCustomer: document.idCustomer,
          idPaymentMethod: method.id,
          ref: document.code,
          montant,
          date: new Date(),
        });

        const savedPayment = await queryRunner.manager.save(Payment, payment);

        const bill = queryRunner.manager.create(Bill, {
          idPayment: savedPayment.id,
          idDocument: document.id,
          idProject: document.idProject,
          montant,
        });

        await queryRunner.manager.save(Bill, bill);

        document.status = await this.changeDocumentStatus(
          document.id,
          document.status,
          DOCUMENT_STATUS.REGLEMENT,
          DOCUMENT_STATUS_VALUE.REGLEE,
        );

        await queryRunner.manager.save(Document, document);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      console.log('error', error);
      await queryRunner.rollbackTransaction();
      if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new BadRequestException(`Erreur lors du changement de status`);
      }
    } finally {
      await queryRunner.release();
    }
  }

  async changeDocumentStatus(
    idDocument: string,
    values: DocumentStatusValueDoc[],
    status: DOCUMENT_STATUS,
    value: DOCUMENT_STATUS_VALUE,
  ): Promise<DocumentStatusValueDoc[]> {
    console.log('mise à jour status');
    const data = [...values];

    for (let i = 0; i < data.length; i++) {
      const value = data[i];

      if (value.documentStatus.code === status) {
        data.splice(i, 1);
      }
    }

    const documentStatusValue =
      await this.documentStatusValueRepository.findOne({
        where: { code: value },
      });

    if (documentStatusValue) {
      let response = new DocumentStatusValueDoc();
      response.idDocumentStatus = documentStatusValue.idDocumentStatus;
      response.idDocument = idDocument;
      response.idValue = documentStatusValue.id;
      data.push(response);
      return data;
    }

    return values;
  }

  async invoice(dto: InvoiceDto, user: User): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const type = await this.documentTypeService.getDocumentType(
        null,
        DOCUMENT_TYPE.FACTURE_ACOMPTE,
      );

      const document = await queryRunner.manager.findOne(Document, {
        where: { id: dto.idDocument },
        relations: {
          type: true,
          status: { documentStatus: true },
          components: true,
        },
      });

      if (!document) {
        throw new NotFoundException(`Document non trouvé`);
      }

      document.status = await this.changeDocumentStatus(
        document.id,
        document.status,
        DOCUMENT_STATUS.FACTURATION,
        DOCUMENT_STATUS_VALUE.FACTURATION_PARTIEL,
      );

      await queryRunner.manager.save(Document, document);

      const items = await this.itemDocumentRepository.find({
        where: { idDocument: document.id },
        relations: { tvaRate: true, component: true },
      });

      document.items = this.buildItemHierarchy(items);

      const bill = await queryRunner.manager.findOne(Bill, {
        where: { idDocument: dto.idDocument, idPayment: dto.idPayment },
      });

      const clone = await this.cloneDocumentWithTransaction(
        document,
        bill?.montant || dto.amount || null,
        user,
        type,
        queryRunner,
      );

      clone.status = await this.changeDocumentStatus(
        clone.id,
        [],
        DOCUMENT_STATUS.REGLEMENT,
        bill ? DOCUMENT_STATUS_VALUE.REGLEE : DOCUMENT_STATUS_VALUE.NON_REGLEE,
      );

      await queryRunner.manager.save(Document, clone);

      if (bill) {
        bill.idDocumentLink = clone.id;
        await queryRunner.manager.save(Bill, bill);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.log('error', error);
      throw new BadRequestException(
        `Erreur lors de la transformation des documents: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async cloneDocument(
    document: Document,
    user: User,
    idType?: string,
  ): Promise<Document> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const type = await this.documentTypeService.getDocumentType(
        idType || document.idType,
        null,
      );

      const clonedDocument = await this.cloneDocumentWithTransaction(
        document,
        null,
        user,
        type,
        queryRunner,
      );

      await queryRunner.commitTransaction();
      return this.findOne(clonedDocument.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Erreur lors du clonage du document: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private async cloneDocumentWithTransaction(
    document: Document,
    amount: number | null,
    user: User,
    type: DocumentType,
    queryRunner: QueryRunner,
  ): Promise<Document> {
    const state = await this.documentStateService.getInitialState(type.code);

    let code = `${Date.now()}`;

    if (document.idCompany) {
      code = await this.numberingService.getNextNumber(
        document.idCompany,
        type.id,
        type.code,
        false,
      );
    }

    const clonedBillingAddress = await this.cloneAddressFromClone(
      document.idBillingAddress,
      queryRunner,
    );

    let clonedWorkAddress: AddressClone | null = null;
    if (document.idWorkAddress) {
      clonedWorkAddress = await this.cloneAddressFromClone(
        document.idWorkAddress,
        queryRunner,
      );
    }

    const clonedDocument = queryRunner.manager.create(Document, {
      idTenant: document.idTenant,
      idCreatedBy: user.id,
      idUpdatedBy: user.id,
      idType: type.id,
      idState: state.id,
      idCustomer: document.idCustomer,
      idCompany: document.idCompany,
      idProject: document.idProject,
      idBillingAddress: clonedBillingAddress.id,
      idWorkAddress: clonedWorkAddress?.id,
      idTvaRate: document.idTvaRate,
      idConditionRegulation: document.idConditionRegulation,
      code,
      title: `${document.title}`,
      description: document.description,
      tariffCategory: document.tariffCategory,
      totalHT: document.totalHT,
      totalTVA: document.totalTVA,
      totalTTC: document.totalTTC,
      amount: amount,
      data: { ...document.data },
    });

    if (type.code === DOCUMENT_TYPE.COMMANDE) {
      clonedDocument.status = await this.changeDocumentStatus(
        clonedDocument.id,
        [],
        DOCUMENT_STATUS.FACTURATION,
        DOCUMENT_STATUS_VALUE.A_FACTURER,
      );
    } else if (type.code === DOCUMENT_TYPE.FACTURE) {
      const count = document?.idProject
        ? await this.getTotalBillAmount(document.idProject)
        : 0;

      clonedDocument.status = await this.changeDocumentStatus(
        clonedDocument.id,
        [],
        DOCUMENT_STATUS.REGLEMENT,
        count === 0
          ? DOCUMENT_STATUS_VALUE.NON_REGLEE
          : count >= clonedDocument.totalTTC
            ? DOCUMENT_STATUS_VALUE.REGLEE
            : DOCUMENT_STATUS_VALUE.REGLEMENT_PARTIEL,
      );
    }

    const savedDocument = await queryRunner.manager.save(
      Document,
      clonedDocument,
    );

    await queryRunner.manager
      .createQueryBuilder()
      .relation(Document, 'parents')
      .of(savedDocument.id)
      .add(document.id);

    const oldToNewComponentMap = await this.cloneComponents(
      document.components,
      savedDocument.id,
      queryRunner,
    );

    if (document.items && document.items.length > 0) {
      for (const rootItem of document.items) {
        await this.cloneItemRecursively(
          rootItem,
          savedDocument.id,
          null,
          oldToNewComponentMap,
          queryRunner,
        );
      }
    }

    return savedDocument;
  }

  private async cloneAddressFromClone(
    addressCloneId: string,
    queryRunner: QueryRunner,
  ): Promise<AddressClone> {
    const originalAddressClone = await queryRunner.manager.findOne(
      AddressClone,
      {
        where: { id: addressCloneId },
      },
    );

    if (!originalAddressClone) {
      throw new NotFoundException(
        `Adresse clonée avec l'ID ${addressCloneId} non trouvée`,
      );
    }

    const newAddressClone = queryRunner.manager.create(AddressClone, {
      idCity: originalAddressClone.idCity,
      label: originalAddressClone.label,
      trackNum: originalAddressClone.trackNum,
      trackName: originalAddressClone.trackName,
      complement: originalAddressClone.complement,
      cityName: originalAddressClone.cityName,
      countryName: originalAddressClone.countryName,
      postalCode: originalAddressClone.postalCode,
      data: originalAddressClone.data,
    });

    return await queryRunner.manager.save(AddressClone, newAddressClone);
  }

  private async cloneComponents(
    components: ComponentDocument[],
    documentId: string,
    queryRunner: QueryRunner,
  ): Promise<Map<string, string>> {
    const oldToNewComponentMap = new Map<string, string>();

    if (!components || components.length === 0) {
      return oldToNewComponentMap;
    }

    for (const originalComponent of components) {
      const clonedComponent = queryRunner.manager.create(ComponentDocument, {
        idDocument: documentId,
        type: originalComponent.type,
        articleId: originalComponent.articleId,
        ouvrageId: originalComponent.ouvrageId,
        code: originalComponent.code,
        name: originalComponent.name,
        label: originalComponent.label,
        commercialDescription: originalComponent.commercialDescription,
        photo: originalComponent.photo,
        margin: originalComponent.margin,
        designation: originalComponent.designation,
        conversionCoefficient: originalComponent.conversionCoefficient,
        salePriceHT: originalComponent.salePriceHT,
        priceOuvrage: originalComponent.priceOuvrage,
        salePriceTTC: originalComponent.salePriceTTC,
        purchasePriceHT: originalComponent.purchasePriceHT,
        purchasePriceTTC: originalComponent.purchasePriceTTC,
      });

      const savedComponent = await queryRunner.manager.save(
        ComponentDocument,
        clonedComponent,
      );

      oldToNewComponentMap.set(
        originalComponent.id.toString(),
        savedComponent.id.toString(),
      );
    }

    return oldToNewComponentMap;
  }

  private async cloneItemRecursively(
    item: ItemDocument,
    documentId: string,
    parentId: string | null,
    componentMap: Map<string, string>,
    queryRunner: QueryRunner,
  ): Promise<void> {
    const newComponentId = item.idComponent
      ? componentMap.get(item.idComponent) || null
      : null;

    const clonedItem = queryRunner.manager.create(ItemDocument, {
      idDocument: documentId,
      idComponent: newComponentId,
      idParent: parentId,
      idTvaRate: item.idTvaRate,
      position: item.position,
      type: item.type,
      title: item.title,
      quantity: item.quantity,
      totalHT: item.totalHT,
      totalTVA: item.totalTVA,
      totalTTC: item.totalTTC,
    });

    const savedItem = await queryRunner.manager.save(ItemDocument, clonedItem);

    if (item.items && item.items.length > 0) {
      for (const childItem of item.items) {
        await this.cloneItemRecursively(
          childItem,
          documentId,
          savedItem.id,
          componentMap,
          queryRunner,
        );
      }
    }
  }

  async sendDocument(id: string, user: User) {
    const document = await this.findOne(id);
    let html = '';

    try {
      html = await this.htmlPdfGeneratorService.generateHtml(document);
    } catch (error) {
      console.log('error', error);
    }

    const output = await this.htmlPdfGeneratorService.generatePDF(html);
    const pdf = await promises.readFile(output);

    try {
      await this.mailService.sendHtml(
        [user.email, document.customer.email],
        document.title,
        html,
        [
          {
            filename: `${document.code}.pdf`,
            content: pdf,
          },
        ],
      );

      if (
        document.type?.code === DOCUMENT_TYPE.DEVIS &&
        document.state?.code === DOCUMENT_STATE.DRAFT
      ) {
        const state = await this.documentStateService.findByCode(
          DOCUMENT_STATE.PENDING_RESPONSE,
        );

        if (state) {
          await this.documentRepository.update(document.id, {
            idState: state.id,
          });
        }
      }
    } catch (error) {
      console.log('error', error);
    }

    try {
      unlinkSync(output);
    } catch (err) {
      console.error('Erreur suppression fichier :', err);
    }
  }

  private async saveComponents(
    documentId: string,
    dtos: CreateComponentDocumentDto[],
    queryRunner: QueryRunner,
  ): Promise<Map<string, ComponentDocument>> {
    const existingComponents = await queryRunner.manager.find(
      ComponentDocument,
      {
        where: { idDocument: documentId },
      },
    );

    const existingComponentIds = new Set(
      existingComponents.map((c) => c.id.toString()),
    );
    const newComponentIds = new Set(dtos.filter((c) => c.id).map((c) => c.id));

    const componentsToDelete = existingComponents.filter(
      (c) => !newComponentIds.has(c.id.toString()),
    );

    for (const component of componentsToDelete) {
      await queryRunner.manager.delete(ComponentDocument, component.id);
    }

    const componentMap = new Map<string, ComponentDocument>();

    for (const componentDto of dtos) {
      let component: ComponentDocument;

      if (componentDto.id && existingComponentIds.has(componentDto.id)) {
        await queryRunner.manager.update(ComponentDocument, componentDto.id, {
          type: componentDto.type,
          articleId: componentDto.articleId,
          ouvrageId: componentDto.ouvrageId,
          unitId: componentDto.unitId,
          saleUnitId: componentDto.saleUnitId,
          purchaseUnitId: componentDto.purchaseUnitId,
          code: componentDto.code,
          name: componentDto.name,
          label: componentDto.label,
          commercialDescription: componentDto.commercialDescription,
          photo: componentDto.photo,
          margin: componentDto.margin,
          designation: componentDto.designation,
          conversionCoefficient: componentDto.conversionCoefficient,
          salePriceHT: componentDto.salePriceHT,
          priceOuvrage: componentDto.priceOuvrage,
          salePriceTTC: componentDto.salePriceTTC,
          purchasePriceHT: componentDto.purchasePriceHT,
          purchasePriceTTC: componentDto.purchasePriceTTC,
        });

        component = (await queryRunner.manager.findOne(ComponentDocument, {
          where: { id: componentDto.id },
        }))!;
      } else {
        component = queryRunner.manager.create(ComponentDocument, {
          idDocument: documentId,
          type: componentDto.type,
          articleId: componentDto.articleId,
          ouvrageId: componentDto.ouvrageId,
          unitId: componentDto.unitId,
          saleUnitId: componentDto.saleUnitId,
          purchaseUnitId: componentDto.purchaseUnitId,
          code: componentDto.code,
          name: componentDto.name,
          label: componentDto.label,
          commercialDescription: componentDto.commercialDescription,
          photo: componentDto.photo,
          margin: componentDto.margin,
          designation: componentDto.designation,
          conversionCoefficient: componentDto.conversionCoefficient,
          salePriceHT: componentDto.salePriceHT,
          priceOuvrage: componentDto.priceOuvrage,
          salePriceTTC: componentDto.salePriceTTC,
          purchasePriceHT: componentDto.purchasePriceHT,
          purchasePriceTTC: componentDto.purchasePriceTTC,
        });

        component = await queryRunner.manager.save(
          ComponentDocument,
          component,
        );
      }

      componentMap.set(componentDto.ref, component);
    }

    return componentMap;
  }

  private async cloneAddress(
    addressId: string,
    queryRunner: any,
  ): Promise<AddressClone> {
    const originalAddress = await queryRunner.manager.findOne(Address, {
      where: { id: addressId },
      relations: ['city'],
    });

    if (!originalAddress) {
      throw new NotFoundException(`Adresse avec l'ID ${addressId} non trouvée`);
    }

    const addressClone = queryRunner.manager.create(AddressClone, {
      idCity: originalAddress.idCity,
      label: originalAddress.label,
      trackNum: originalAddress.trackNum,
      trackName: originalAddress.trackName,
      complement: originalAddress.complement,
      cityName: originalAddress.cityName,
      countryName: originalAddress.countryName,
      postalCode: originalAddress.postalCode,
      data: originalAddress,
    });

    return await queryRunner.manager.save(AddressClone, addressClone);
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: {
        type: true,
        state: true,
        tenant: true,
        status: { documentStatus: true, value: true },
        company: { billingAddress: true, headOffice: true },
        bill: true,
        bills: true,
        customer: {
          billingAddress: true,
          workAddresses: true,
          individual: true,
          professional: true,
          publicEntity: true,
        },
        parents: true,
        billingAddress: true,
        workAddress: true,
        tvaRate: true,
        conditionRegulation: true,
        components: {
          article: true,
          ouvrage: true,
          unit: true,
          saleUnit: true,
          purchaseUnit: true,
        },
        createdBy: true,
        updatedBy: true,
      },
    });

    if (!document) {
      throw new NotFoundException(`Document non trouvé`);
    }

    const items = await this.itemDocumentRepository.find({
      where: { idDocument: id.toString() },
      relations: { tvaRate: true, component: true },
    });

    const codeStates = this.workflowService.getAvailableStates(
      document.type.code,
      document.state.code,
    );

    const availableStates =
      await this.documentStateService.findByCodes(codeStates);

    const hierarchicalItems = this.buildItemHierarchy(items);
    document.items = hierarchicalItems;
    document.availableStates = availableStates;

    if (document.type.code !== DOCUMENT_TYPE.DEVIS) {
      if (document.idProject && document.type.code === DOCUMENT_TYPE.FACTURE) {
        document.billsAmount = await this.getTotalBillAmount(
          document.idProject,
        );

        document.netToPay = Number.parseFloat(
          (document.totalTTC - document.billsAmount).toFixed(2),
        );

        document.invoices = await this.getFactureAcompte(document.idProject);
      } else if (document.bill) {
        document.billsAmount = document.bill.montant;
        document.netToPay = Number.parseFloat(
          (document.totalTTC - document.billsAmount).toFixed(2),
        );
      } else {
        let amount = 0;
        document.bills.forEach((bill) => {
          amount += bill.montant;
        });

        document.billsAmount = amount;

        document.netToPay = Number.parseFloat(
          (document.totalTTC - document.billsAmount).toFixed(2),
        );
      }
    }

    return document;
  }

  private buildItemHierarchy(flatItems: ItemDocument[]): ItemDocument[] {
    const itemMap = new Map<string, ItemDocument>();

    for (const item of flatItems) {
      item.items = [];
      itemMap.set(item.id.toString(), item);
    }

    const rootItems: ItemDocument[] = [];

    for (const item of flatItems) {
      if (item.idParent) {
        const parent = itemMap.get(item.idParent);
        if (parent) {
          if (!parent.items) {
            parent.items = [];
          }
          parent.items.push(item);
        } else {
          console.warn(
            `Item ${item.id} a un parent ${item.idParent} inexistant, traité comme racine`,
          );
          rootItems.push(item);
        }
      } else {
        rootItems.push(item);
      }
    }

    this.sortItemsRecursively(rootItems);

    return rootItems;
  }

  private sortItemsRecursively(items: ItemDocument[]): void {
    items.sort((a, b) => a.position - b.position);

    for (const item of items) {
      if (item.items && item.items.length > 0) {
        this.sortItemsRecursively(item.items);
      }
    }
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 10,
  ): Promise<{ documents: Document[]; total: number }> {
    const [documents, total] = await this.documentRepository.findAndCount({
      where: { idTenant: tenantId, isDeleted: false },
      relations: {
        type: true,
        state: true,
        tvaRate: true,
        conditionRegulation: true,
        status: { documentStatus: true, value: true },
        customer: {
          individual: true,
          professional: true,
          publicEntity: true,
        },
        billingAddress: true,
        workAddress: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { documents, total };
  }

  async findByCompany(
    companyId: string,
    page = 1,
    limit = 10,
    typeCode?: DOCUMENT_TYPE,
  ): Promise<{ documents: Document[]; total: number }> {
    const where: FindOptionsWhere<Document> = { idCompany: companyId };
    const factures = [DOCUMENT_TYPE.FACTURE, DOCUMENT_TYPE.FACTURE_ACOMPTE];

    if (typeCode) {
      where.type = {
        code: factures.includes(typeCode) ? In(factures) : typeCode,
      };
    }

    const [documents, total] = await this.documentRepository.findAndCount({
      where,
      relations: {
        type: true,
        state: true,
        status: { documentStatus: true, value: true },
        customer: {
          individual: true,
          professional: true,
          publicEntity: true,
        },
        billingAddress: true,
        workAddress: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { documents, total };
  }

  async updateAddressClone(
    documentId: string,
    addressId: string,
    isWorkAddress = false,
  ): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const document = await queryRunner.manager.findOne(Document, {
        where: { id: documentId },
      });

      if (!document) {
        throw new NotFoundException(
          `Document avec l'ID ${documentId} non trouvé`,
        );
      }

      const newAddressClone = await this.cloneAddress(addressId, queryRunner);

      if (isWorkAddress) {
        await queryRunner.manager.update(Document, documentId, {
          idWorkAddress: newAddressClone.id,
        });
      } else {
        await queryRunner.manager.update(Document, documentId, {
          idBillingAddress: newAddressClone.id,
        });
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(
        `Erreur lors de la mise à jour de l'adresse: ${error.message}`,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async saveItemDocument(
    idDocument: string,
    parentId: string | null,
    dto: CreateItemDocumentDto,
    componentMap: Map<string, ComponentDocument>,
    queryRunner: QueryRunner,
  ) {
    const component = componentMap.get(dto.refComponent || '');

    let item: ItemDocument | null = null;

    if (dto.id) {
      const search = await queryRunner.manager.findOne(ItemDocument, {
        where: { id: dto.id },
      });

      if (search) {
        item = search;
      }
    }

    item ??= queryRunner.manager.create(ItemDocument, {
      idDocument: idDocument,
      idComponent: component?.id.toString(),
      idParent: parentId,
      idTvaRate: dto.idTvaRate,
      position: dto.position,
      type: dto.type,
      title: dto.title,
      quantity: dto.quantity,
      totalHT: dto.totalHT,
      totalTVA: dto.totalTVA,
      totalTTC: dto.totalTTC,
    });

    const saved = await queryRunner.manager.save(ItemDocument, item);

    if (dto.children) {
      for (let i = 0; i < dto.children.length; i++) {
        const child = dto.children[i];
        await this.saveItemDocument(
          idDocument,
          saved.id,
          child,
          componentMap,
          queryRunner,
        );
      }
    }
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);

    if (document.locked) {
      throw new BadRequestException(
        'Inmpossible de supprimé un document définitive',
      );
    }

    await this.documentRepository.softDelete(document.id);

    if (document.parents) {
      for (const parent of document.parents) {
        await this.refreshParentState(parent.id);
      }
    }
  }

  async refreshParentState(id: string): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: {
        children: { type: true },
        type: true,
        status: { documentStatus: true },
      },
    });

    const isOrder = document?.type.code === DOCUMENT_TYPE.COMMANDE;

    if (isOrder) {
      const count = document.children.filter(
        (item) => item.type.code === DOCUMENT_TYPE.FACTURE,
      ).length;

      if (count === 0) {
        const state = await this.documentStateService.getInitialState(
          document.type.code,
        );

        document.status = await this.changeDocumentStatus(
          document.id,
          document.status,
          DOCUMENT_STATUS.FACTURATION,
          DOCUMENT_STATUS_VALUE.FACTURATION_PARTIEL,
        );

        document.idState = state.id;
        document.state = state;
        document.locked = false;

        await this.documentRepository.save(document);
      }
    } else if (document?.children.length === 0) {
      const state = await this.documentStateService.getInitialState(
        document.type.code,
      );

      await this.documentRepository.update(document.id, {
        idState: state.id,
        locked: false,
      });
    }
  }
}

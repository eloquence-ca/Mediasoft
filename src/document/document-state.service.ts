import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workflow } from 'src/workflow/interface/workflow-interface';
import { In, Repository } from 'typeorm';
import { DocumentState } from './entities/document-state.entity';
import { DocumentType } from './entities/document-type.entity';
import {
  DOCUMENT_STATE,
  DOCUMENT_TYPE,
  DOCUMENT_TYPE_STATES_CONFIG,
} from './enum';
import { WorkflowService } from 'src/workflow/workflow.service';

@Injectable()
export class DocumentStateService {
  private readonly logger = new Logger(DocumentStateService.name);

  constructor(
    @InjectRepository(DocumentState)
    private readonly documentStateRepository: Repository<DocumentState>,
    @InjectRepository(DocumentType)
    private readonly documentTypeRepository: Repository<DocumentType>,
    private readonly workflowService: WorkflowService,
  ) {}

  async findAll(): Promise<DocumentState[]> {
    return await this.documentStateRepository.find({
      relations: { documentTypes: true },
      order: { code: 'ASC' },
    });
  }

  async findByCode(code: DOCUMENT_STATE): Promise<DocumentState | null> {
    return await this.documentStateRepository.findOne({
      where: { code },
      relations: { documentTypes: true },
    });
  }

  async findByCodes(codes: DOCUMENT_STATE[]): Promise<DocumentState[]> {
    return await this.documentStateRepository.find({
      where: { code: In(codes) },
    });
  }

  async findById(id: string): Promise<DocumentState | null> {
    return await this.documentStateRepository.findOne({
      where: { id },
      relations: { documentTypes: true },
    });
  }

  async initializeStates(): Promise<void> {
    this.logger.log('Initializing document states...');

    const statesData = [
      {
        code: DOCUMENT_STATE.DRAFT,
        label: 'En rédaction',
        description: 'Document en cours de rédaction',
      },
      {
        code: DOCUMENT_STATE.PENDING_RESPONSE,
        label: 'En attente de réponse',
        description: 'En attente de réponse du client',
      },
      {
        code: DOCUMENT_STATE.SIGNED,
        label: 'Signé',
        description: 'Document signé',
      },
      {
        code: DOCUMENT_STATE.DECLINED,
        label: 'Décliné',
        description: 'Document décliné',
      },
      {
        code: DOCUMENT_STATE.IN_PROGRESS,
        label: 'En cours',
        description: 'Document en cours de traitement',
      },
      {
        code: DOCUMENT_STATE.COMPLETED,
        label: 'Terminé',
        description: 'Document traité',
      },

      {
        code: DOCUMENT_STATE.CANCELLED,
        label: 'Annulé',
        description: 'Document annulé',
      },
      {
        code: DOCUMENT_STATE.PROVISIONAL,
        label: 'Provisoire',
        description: 'Document provisoire',
      },
      {
        code: DOCUMENT_STATE.FINAL,
        label: 'Définitive',
        description: 'Document final',
      },
    ];

    for (const stateData of statesData) {
      const existingState = await this.documentStateRepository.findOne({
        where: { code: stateData.code },
      });

      if (!existingState) {
        const state = this.documentStateRepository.create(stateData);
        await this.documentStateRepository.save(state);
        this.logger.log(`Created state: ${stateData.code}`);
      } else {
        existingState.label = stateData.label;
        existingState.description = stateData.description;
        await this.documentStateRepository.save(existingState);
        this.logger.log(`Updating state: ${stateData.code}`);
      }
    }

    this.logger.log('Document states initialization completed');
  }

  async initializeStateStatusRelations(): Promise<void> {
    this.logger.log('Initializing state-status relations...');

    const relations = this.buildStateToTypesRelations();

    for (const relation of relations) {
      const state = await this.documentStateRepository.findOne({
        where: { code: relation.code },
        relations: { documentTypes: true },
      });

      if (state) {
        const statuses = await this.documentTypeRepository.find({
          where: relation.typeCodes.map((code) => ({ code: code })),
        });

        const existingStatusIds = new Set(
          state.documentTypes.map((s: any) => s.id),
        );
        const newStatuses = statuses.filter(
          (s: any) => !existingStatusIds.has(s.id),
        );

        if (newStatuses.length > 0) {
          state.documentTypes = [...state.documentTypes, ...newStatuses];
          await this.documentStateRepository.save(state);
          this.logger.log(
            `Linked state ${relation.code} with types: ${newStatuses.map((s: any) => s.code).join(', ')}`,
          );
        }
      }
    }

    this.logger.log('State-status relations initialization completed');
  }

  buildStateToTypesRelations() {
    const relations = new Map<DOCUMENT_STATE, DOCUMENT_TYPE[]>();

    for (const config of DOCUMENT_TYPE_STATES_CONFIG) {
      for (const state of config.availableStates) {
        const existingTypes = relations.get(state) || [];
        relations.set(state, [...existingTypes, config.documentType]);
      }
    }

    return Array.from(relations.entries()).map(([code, typeCodes]) => ({
      code,
      typeCodes,
    }));
  }

  async getDocumentState(
    id: string,
    code: DOCUMENT_STATE,
  ): Promise<DocumentState> {
    let type: DocumentState | null = null;
    if (code) {
      type = await this.findByCode(code);
    } else if (id) {
      type = await this.findById(id);
    }

    if (!type) {
      throw new NotFoundException(`Statut de document non trouvé`);
    }

    return type;
  }

  verifyTransition(
    workflow: Workflow,
    from: DOCUMENT_STATE,
    to: DOCUMENT_STATE,
  ): boolean {
    if (from === to) return true;

    const transitionExists = workflow.transitions.some(
      (transition) => transition.from.includes(from) && transition.to === to,
    );

    return transitionExists;
  }

  async getInitialState(code: DOCUMENT_TYPE): Promise<DocumentState> {
    const flow = this.workflowService.getWorkflowByDocumentType(code);

    if (!flow) {
      throw new BadRequestException(
        `Aucun workflow défini pour ce type de document`,
      );
    }

    const state = await this.findByCode(flow.initial);

    if (!state) {
      throw new BadRequestException(`Etat par défaut du workflow introuvable`);
    }

    return state;
  }

  async getFinalState(code: DOCUMENT_TYPE): Promise<DocumentState> {
    const flow = this.workflowService.getWorkflowByDocumentType(code);

    if (!flow) {
      throw new BadRequestException(
        `Aucun workflow défini pour ce type de document`,
      );
    }

    const state = await this.findByCode(flow.final);

    if (!state) {
      throw new BadRequestException(`Etat par défaut du workflow introuvable`);
    }

    return state;
  }
}

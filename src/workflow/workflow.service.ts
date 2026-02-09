import { Injectable } from '@nestjs/common';
import { DOCUMENT_STATE, DOCUMENT_TYPE } from 'src/document/enum';
import { WORKFLOWS_CONFIG } from './workflow';
import { Workflow } from './interface/workflow-interface';
import { Transition } from './interface/transition-interface';

@Injectable()
export class WorkflowService {
  getWorkflowByDocumentType(documentType: DOCUMENT_TYPE): Workflow | undefined {
    return WORKFLOWS_CONFIG.find((w) => w.documentType === documentType);
  }

  getAvailableTransitions(
    documentType: DOCUMENT_TYPE,
    currentState: DOCUMENT_STATE,
  ): Transition[] {
    const workflow = this.getWorkflowByDocumentType(documentType);
    if (!workflow) return [];

    return workflow.transitions.filter((t) => t.from.includes(currentState));
  }

  getAvailableStates(
    documentType: DOCUMENT_TYPE,
    currentState: DOCUMENT_STATE,
  ): DOCUMENT_STATE[] {
    const workflow = this.getWorkflowByDocumentType(documentType);
    if (!workflow) return [];

    return workflow.transitions
      .filter((t) => t.from.includes(currentState))
      .map((transition) => transition.to);
  }
}

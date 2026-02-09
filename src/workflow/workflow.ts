import { DOCUMENT_STATE, DOCUMENT_TYPE } from 'src/document/enum';
import { Workflow } from './interface/workflow-interface';

export const WORKFLOWS_CONFIG: Workflow[] = [
  // Workflow DEVIS
  {
    documentType: DOCUMENT_TYPE.DEVIS,
    initial: DOCUMENT_STATE.DRAFT,
    final: DOCUMENT_STATE.SIGNED,
    transitions: [
      {
        code: `${DOCUMENT_TYPE.DEVIS}_TO_${DOCUMENT_STATE.PENDING_RESPONSE}`,
        from: [DOCUMENT_STATE.DRAFT],
        to: DOCUMENT_STATE.PENDING_RESPONSE,
      },
      {
        code: `${DOCUMENT_TYPE.DEVIS}_TO_${DOCUMENT_STATE.DRAFT}`,
        from: [DOCUMENT_STATE.PENDING_RESPONSE, DOCUMENT_STATE.DECLINED],
        to: DOCUMENT_STATE.DRAFT,
      },
      {
        code: `${DOCUMENT_TYPE.DEVIS}_TO_${DOCUMENT_STATE.SIGNED}`,
        from: [DOCUMENT_STATE.PENDING_RESPONSE, DOCUMENT_STATE.DECLINED],
        to: DOCUMENT_STATE.SIGNED,
      },
      {
        code: `${DOCUMENT_TYPE.DEVIS}_TO_${DOCUMENT_STATE.DECLINED}`,
        from: [DOCUMENT_STATE.PENDING_RESPONSE, DOCUMENT_STATE.SIGNED],
        to: DOCUMENT_STATE.DECLINED,
      },
    ],
    lockedStates: [DOCUMENT_STATE.SIGNED],
    actions: [],
  },

  // Workflow COMMANDE
  {
    documentType: DOCUMENT_TYPE.COMMANDE,
    initial: DOCUMENT_STATE.IN_PROGRESS,
    final: DOCUMENT_STATE.COMPLETED,
    transitions: [
      {
        code: `${DOCUMENT_TYPE.COMMANDE}_TO_${DOCUMENT_STATE.COMPLETED}`,
        from: [DOCUMENT_STATE.IN_PROGRESS],
        to: DOCUMENT_STATE.COMPLETED,
      },
      {
        code: `${DOCUMENT_TYPE.COMMANDE}_TO_${DOCUMENT_STATE.IN_PROGRESS}`,
        from: [DOCUMENT_STATE.COMPLETED, DOCUMENT_STATE.CANCELLED],
        to: DOCUMENT_STATE.IN_PROGRESS,
      },
      {
        code: `${DOCUMENT_TYPE.COMMANDE}_TO_${DOCUMENT_STATE.CANCELLED}`,
        from: [DOCUMENT_STATE.IN_PROGRESS],
        to: DOCUMENT_STATE.CANCELLED,
      },
    ],
    lockedStates: [],
    actions: [],
  },

  // Workflow FACTURE_ACOMPTE
  {
    documentType: DOCUMENT_TYPE.FACTURE_ACOMPTE,
    initial: DOCUMENT_STATE.PROVISIONAL,
    final: DOCUMENT_STATE.FINAL,
    transitions: [
      {
        code: `${DOCUMENT_TYPE.FACTURE_ACOMPTE}_TO_${DOCUMENT_STATE.FINAL}`,
        from: [DOCUMENT_STATE.PROVISIONAL],
        to: DOCUMENT_STATE.FINAL,
      },
    ],
    lockedStates: [],
    actions: [],
  },

  // Workflow FACTURE
  {
    documentType: DOCUMENT_TYPE.FACTURE,
    initial: DOCUMENT_STATE.PROVISIONAL,
    final: DOCUMENT_STATE.FINAL,
    transitions: [
      {
        code: `${DOCUMENT_TYPE.FACTURE}_TO_${DOCUMENT_STATE.FINAL}`,
        from: [DOCUMENT_STATE.PROVISIONAL],
        to: DOCUMENT_STATE.FINAL,
      },
    ],
    lockedStates: [],
    actions: [],
  },

  // Workflow AVOIR
  {
    documentType: DOCUMENT_TYPE.AVOIR,
    initial: DOCUMENT_STATE.PROVISIONAL,
    final: DOCUMENT_STATE.FINAL,
    transitions: [
      {
        code: `${DOCUMENT_TYPE.AVOIR}_TO_${DOCUMENT_STATE.FINAL}`,
        from: [DOCUMENT_STATE.PROVISIONAL],
        to: DOCUMENT_STATE.FINAL,
      },
    ],
    lockedStates: [],
    actions: [],
  },
];

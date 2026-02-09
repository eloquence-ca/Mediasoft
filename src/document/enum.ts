export enum DOCUMENT_STATE {
  /** En rédaction - Document en cours de rédaction */
  DRAFT = 'DRAFT',

  /** En attente de réponse - En attente de réponse du client */
  PENDING_RESPONSE = 'PENDING_RESPONSE',

  /** Signé - Document signé */
  SIGNED = 'SIGNED',

  /** Décliné - Document décliné */
  DECLINED = 'DECLINED',

  /** En cours - Document en cours de traitement */
  IN_PROGRESS = 'IN_PROGRESS',

  /** Traité - Document traité*/
  COMPLETED = 'COMPLETED',

  /** Annulé - Document annulé*/
  CANCELLED = 'CANCELLED',

  /** Provisoire - Document provisoire */
  PROVISIONAL = 'PROVISIONAL',

  /** Final - Document final */
  FINAL = 'FINAL',
}

export const enum DOCUMENT_TYPE {
  DEVIS = 'DEVIS',
  COMMANDE = 'COMMANDE',
  FACTURE_ACOMPTE = 'FACTURE_ACOMPTE',
  FACTURE = 'FACTURE',
  ALL_FACTURE = 'ALL_FACTURE',
  AVOIR = 'AVOIR',
}

export const DOCUMENT_TYPE_STATES_CONFIG = [
  {
    documentType: DOCUMENT_TYPE.DEVIS,
    availableStates: [
      DOCUMENT_STATE.DRAFT,
      DOCUMENT_STATE.PENDING_RESPONSE,
      DOCUMENT_STATE.SIGNED,
      DOCUMENT_STATE.DECLINED,
    ],
  },
  {
    documentType: DOCUMENT_TYPE.COMMANDE,
    availableStates: [
      DOCUMENT_STATE.IN_PROGRESS,
      DOCUMENT_STATE.COMPLETED,
      DOCUMENT_STATE.CANCELLED,
    ],
  },
  {
    documentType: DOCUMENT_TYPE.FACTURE_ACOMPTE,
    availableStates: [DOCUMENT_STATE.PROVISIONAL, DOCUMENT_STATE.FINAL],
  },
  {
    documentType: DOCUMENT_TYPE.FACTURE,
    availableStates: [DOCUMENT_STATE.PROVISIONAL, DOCUMENT_STATE.FINAL],
  },
  {
    documentType: DOCUMENT_TYPE.AVOIR,
    availableStates: [DOCUMENT_STATE.PROVISIONAL, DOCUMENT_STATE.FINAL],
  },
  {
    documentType: DOCUMENT_TYPE.ALL_FACTURE,
    availableStates: [],
  },
];

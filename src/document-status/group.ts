import { DOCUMENT_TYPE } from 'src/document/enum';

export const enum DOCUMENT_STATUS {
  FACTURATION = 'FACTURATION',
  REGLEMENT = 'REGLEMENT',
  LIVRAISON = 'LIVRAISON',
  SIGNATURE = 'SIGNATURE',
}

export const enum DOCUMENT_STATUS_VALUE {
  FACTURATION_PARTIEL = 'FACTURATION_PARTIEL',
  A_FACTURER = 'A_FACTURER',
  FACTUREE = 'FACTUREE',

  REGLEMENT_PARTIEL = 'REGLEMENT_PARTIEL',
  NON_REGLEE = 'NON_REGLEE',
  REGLEE = 'REGLEE',

  LIVRAISON_PARTIEL = 'LIVRAISON_PARTIEL',
  A_LIVRER = 'A_LIVRER',

  SIGNATURE_ELECTRONIQUE = 'SIGNATURE_ELECTRONIQUE',
}

export const groups = [
  {
    type: DOCUMENT_TYPE.COMMANDE,
    status: DOCUMENT_STATUS.FACTURATION,
    label: 'Facturation',
    values: [
      {
        code: DOCUMENT_STATUS_VALUE.FACTURATION_PARTIEL,
        label: 'Facturée partiellement',
      },
      {
        code: DOCUMENT_STATUS_VALUE.A_FACTURER,
        label: 'A facturer',
      },
      {
        code: DOCUMENT_STATUS_VALUE.FACTUREE,
        label: 'Facturée',
      },
    ],
  },
  {
    type: DOCUMENT_TYPE.FACTURE,
    status: DOCUMENT_STATUS.REGLEMENT,
    label: 'Reglement',
    values: [
      {
        code: DOCUMENT_STATUS_VALUE.REGLEMENT_PARTIEL,
        label: 'Réglée partiellement',
      },
      {
        code: DOCUMENT_STATUS_VALUE.NON_REGLEE,
        label: 'Non réglée',
      },
      {
        code: DOCUMENT_STATUS_VALUE.REGLEE,
        label: 'Réglée',
      },
    ],
  },
  // {
  //   status: DOCUMENT_STATUS.LIVRAISON,
  //   label: 'Livraison',
  //   values: [
  //     {
  //       code: DOCUMENT_STATUS_VALUE.LIVRAISON_PARTIEL,
  //       label: 'Livrée partiellement',
  //     },
  //     {
  //       code: DOCUMENT_STATUS_VALUE.A_LIVRER,
  //       label: 'A livrer',
  //     },
  //   ],
  // },
  {
    type: DOCUMENT_TYPE.DEVIS,
    status: DOCUMENT_STATUS.SIGNATURE,
    label: 'Signature',
    values: [
      {
        code: DOCUMENT_STATUS_VALUE.SIGNATURE_ELECTRONIQUE,
        label: 'Signé électroniquement',
      },
    ],
  },
];

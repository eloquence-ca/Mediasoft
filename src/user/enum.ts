export enum USER_AUTH_TYPE {
  SIMPLE = 'SIMPLE',
  TWO_FACTOR = 'TWO_FACTOR',
}

export enum USER_ROLE {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum CIVILITY {
  M = 'M.',
  Mme = 'Mme',
  Mlle = 'Mlle',
  MMme = 'M. Mme',
  Mmes = 'Mmes',
  MM = 'MM.',
}

export enum USER_STATUS {
  ACTIVED = 'ACTIVED',
  BLOCKED = 'BLOCKED',
}

export enum USER_OTP_ROLE {
  ACTIVATE = 'ACTIVATE',
  RESET = 'RESET',
  EMAIL = 'EMAIL',
  TWO_FACTOR = 'TWO_FACTOR',
}

export enum SUBSCRIPTION_STATUS {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum COMPANY_SIZE {
  FREELANCE = 'FREELANCE',
  STARTUP = 'STARTUP',
  SME = 'SME',
  ENTERPRISE = 'ENTERPRISE',
  CORPORATION = 'CORPORATION',
}

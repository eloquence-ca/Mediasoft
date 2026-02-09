export interface SynchroInterface {
  id: string;
  timestamp: number;
}

export interface SynchroUserCompanyInterface {
  idUser: string;
  idCompany: string;
  timestamp: number;
}

export interface SynchroTenantCatalogInterface {
  tenantId: string;
  catalogId: string;
}

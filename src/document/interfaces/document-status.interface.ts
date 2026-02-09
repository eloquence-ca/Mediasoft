import { IDocumentState } from "./document-state.interface";

export interface IDocumentStatus {
  id: number;
  code: string;
  label: string;
  description?: string;
  documentStates: IDocumentState[];
  createdAt: Date;
  updatedAt: Date;
}

import { IDocumentStatus } from "./document-status.interface";

export interface IDocumentState {
  id: number;
  code: string;
  label: string;
  description?: string;
  documentStatuses: IDocumentStatus[];
  createdAt: Date;
  updatedAt: Date;
}
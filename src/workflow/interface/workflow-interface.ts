import { DOCUMENT_STATE, DOCUMENT_TYPE } from 'src/document/enum';
import { Action } from './action.interface';
import { Transition } from './transition-interface';

export interface Workflow {
  documentType: DOCUMENT_TYPE;
  initial: DOCUMENT_STATE;
  final: DOCUMENT_STATE; // ⚠️ voir la necessité
  lockedStates: DOCUMENT_STATE[];
  transitions: Transition[];
  actions: Action[];
}

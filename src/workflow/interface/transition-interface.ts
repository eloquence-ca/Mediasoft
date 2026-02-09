import { DOCUMENT_STATE } from 'src/document/enum';

export interface Transition {
  code: string;
  from: DOCUMENT_STATE[];
  to: DOCUMENT_STATE;
}

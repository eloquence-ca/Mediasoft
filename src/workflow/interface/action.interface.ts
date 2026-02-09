import { DOCUMENT_TYPE } from 'src/document/enum';

export type Action =
  | {
      label: string;
      type: ACTION_TYPE.TRANSFORM_TO;
      target: DOCUMENT_TYPE;
    }
  | {
      label: string;
      type: Exclude<ACTION_TYPE, ACTION_TYPE.TRANSFORM_TO>;
    };

export const enum ACTION_TYPE {
  TRANSFORM_TO = 'TRANSFORM_TO',
  SEND_MAIL = 'SEND_MAIL',
}

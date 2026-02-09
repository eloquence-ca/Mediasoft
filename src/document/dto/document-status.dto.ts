import { ApiProperty } from '@nestjs/swagger';
import { DocumentStateDto } from './document-state.dto';

export class DocumentStatusDto {
  @ApiProperty({ example: 1, description: 'Unique identifier' })
  id: number;

  @ApiProperty({ example: 'DEVIS', description: 'Unique status code' })
  code: string;

  @ApiProperty({ example: 'Devis', description: 'Status label' })
  label: string;

  @ApiProperty({
    example: 'Document de devis',
    description: 'Status description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    type: () => [DocumentStateDto],
    description: 'Associated document states',
  })
  documentStates: DocumentStateDto[];

  @ApiProperty({
    example: '2023-01-01T00:00:00Z',
    description: 'Creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00Z',
    description: 'Last update date',
  })
  updatedAt: Date;
}

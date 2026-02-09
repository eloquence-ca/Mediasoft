import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatusDto } from './document-status.dto';

export class DocumentStateDto {
  @ApiProperty({ example: 1, description: 'Unique identifier' })
  id: number;

  @ApiProperty({ example: 'DRAFT', description: 'Unique state code' })
  code: string;

  @ApiProperty({ example: 'En rédaction', description: 'State label' })
  label: string;

  @ApiProperty({
    example: 'Document en cours de rédaction',
    description: 'State description',
    required: false,
  })
  description?: string;

  @ApiProperty({
    type: () => [DocumentStatusDto],
    description: 'Associated document statuses',
  })
  documentStatuses: DocumentStatusDto[];

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

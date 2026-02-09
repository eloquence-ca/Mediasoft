import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DocumentTypeService } from './document-type.service';
import { DocumentType } from './entities/document-type.entity';
import { DOCUMENT_TYPE } from './enum';

@ApiTags('Document Types')
@Controller('document-types')
export class DocumentTypeController {
  constructor(private readonly documentTypeService: DocumentTypeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all document types' })
  @ApiResponse({
    status: 200,
    description: 'List of all document types',
    type: [DocumentType],
  })
  async findAll(): Promise<DocumentType[]> {
    return await this.documentTypeService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document type by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Document type ID' })
  @ApiResponse({
    status: 200,
    description: 'Document type details',
    type: DocumentType,
  })
  @ApiResponse({
    status: 404,
    description: 'Type de document introuvable',
  })
  async findById(@Param('id') id: string): Promise<DocumentType> {
    const type = await this.documentTypeService.findById(id);
    if (!type) {
      throw new NotFoundException(
        `Type de document avec l'ID ${id} est introuvable`,
      );
    }
    return type;
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get document type by code' })
  @ApiParam({
    name: 'code',
    type: 'string',
    description: 'Document type code',
  })
  @ApiResponse({
    status: 200,
    description: 'Document type details',
    type: DocumentType,
  })
  @ApiResponse({
    status: 404,
    description: 'Type de document introuvable',
  })
  async findByCode(@Param('code') code: DOCUMENT_TYPE): Promise<DocumentType> {
    const type = await this.documentTypeService.findByCode(code);
    if (!type) {
      throw new NotFoundException(
        `Type de document avec le code ${code} est introuvable`,
      );
    }
    return type;
  }
}

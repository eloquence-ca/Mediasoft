import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DocumentState } from './entities/document-state.entity';
import { DocumentStateService } from './document-state.service';
import { DOCUMENT_STATE } from './enum';

@ApiTags('Document State')
@Controller('document-states')
export class DocumentStateController {
  constructor(private readonly documentStateService: DocumentStateService) {}

  @Get()
  @ApiOperation({ summary: 'Get all document states' })
  @ApiResponse({
    status: 200,
    description: 'List of all document states',
    type: [DocumentState],
  })
  async findAll(): Promise<DocumentState[]> {
    return await this.documentStateService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document state by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Document state ID' })
  @ApiResponse({
    status: 200,
    description: 'Document state details',
    type: DocumentState,
  })
  @ApiResponse({
    status: 404,
    description: 'État de document introuvable',
  })
  async findById(@Param('id') id: string): Promise<DocumentState> {
    const state = await this.documentStateService.findById(id);
    if (!state) {
      throw new NotFoundException(
        `État de document avec l'ID ${id} introuvable`,
      );
    }
    return state;
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get document state by code' })
  @ApiParam({
    name: 'code',
    type: 'string',
    description: 'Document state code',
  })
  @ApiResponse({
    status: 200,
    description: 'Document state details',
    type: DocumentState,
  })
  @ApiResponse({
    status: 404,
    description: 'État de document introuvable',
  })
  async findByCode(
    @Param('code') code: DOCUMENT_STATE,
  ): Promise<DocumentState> {
    const state = await this.documentStateService.findByCode(code);
    if (!state) {
      throw new NotFoundException(
        `État de document avec le code ${code} introuvable`,
      );
    }
    return state;
  }
}

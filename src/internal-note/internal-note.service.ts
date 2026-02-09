import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InternalNote } from './entities/internal-note.entity';
import { CreateInternalNoteDto } from './dto/create-internal-note.dto';
import { UpdateInternalNoteDto } from './dto/update-internal-note.dto';

@Injectable()
export class InternalNoteService {
  constructor(
    @InjectRepository(InternalNote)
    private readonly internalNoteRepository: Repository<InternalNote>,
  ) {}

  async create(createInternalNoteDto: CreateInternalNoteDto): Promise<InternalNote> {
    const internalNote = this.internalNoteRepository.create(createInternalNoteDto);
    return await this.internalNoteRepository.save(internalNote);
  }

  async findByCustomer(customerId: string): Promise<InternalNote[]> {
    return await this.internalNoteRepository.find({
      where: { idCustomer: customerId },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<InternalNote> {
    const internalNote = await this.internalNoteRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!internalNote) {
      throw new NotFoundException(`Internal note with ID ${id} not found`);
    }

    return internalNote;
  }

  async update(id: string, updateInternalNoteDto: UpdateInternalNoteDto): Promise<InternalNote> {
    const internalNote = await this.findOne(id);
    Object.assign(internalNote, updateInternalNoteDto);
    return await this.internalNoteRepository.save(internalNote);
  }

  async remove(id: string): Promise<void> {
    const internalNote = await this.findOne(id);
    await this.internalNoteRepository.remove(internalNote);
  }
}
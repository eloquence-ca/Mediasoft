import { Module } from '@nestjs/common';
import { InternalNoteService } from './internal-note.service';
import { InternalNoteController } from './internal-note.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InternalNote } from './entities/internal-note.entity';

@Module({
  imports: [TypeOrmModule.forFeature([InternalNote])],
  controllers: [InternalNoteController],
  providers: [InternalNoteService],
})
export class InternalNoteModule {}

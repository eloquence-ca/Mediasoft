import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Commentaire } from './entities/commentaire.entity';
import { CreateCommentaireDto } from './dto/create-commentaire.dto';
import { UpdateCommentaireDto } from './dto/update-commentaire.dto';
import { plainToClass } from 'class-transformer';
import { CommentaireResponseDto } from './dto/commentaire-response.dto';

@Injectable()
export class CommentaireService {
  constructor(
    @InjectRepository(Commentaire)
    private readonly commentaireRepo: Repository<Commentaire>,
  ) {}

  async create(dto: CreateCommentaireDto): Promise<CommentaireResponseDto> {
    try {
      const commentaire = this.commentaireRepo.create({
        description: dto.description?.trim(),
      });

      const saved = await this.commentaireRepo.save(commentaire);

      const reloaded = await this.commentaireRepo.findOne({
        where: { commentaireId: (saved as Commentaire).commentaireId },
        relations: ['lignesOuvrage'],
      });

      if (!reloaded) {
        throw new NotFoundException(
          `Impossible de retrouver le commentaire créé`,
        );
      }

      return this.toDto(reloaded);
    } catch (error) {
      console.error('Erreur lors de la création du commentaire :', error);

      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la création du commentaire',
      );
    }
  }

  async findAll(): Promise<CommentaireResponseDto[]> {
    const commentaires = await this.commentaireRepo.find({
      relations: ['lignesOuvrage'],
    });
    return commentaires.map((commentaire) => this.toDto(commentaire));
  }

  async findOne(id: string): Promise<CommentaireResponseDto> {
    const commentaire = await this.commentaireRepo.findOne({
      where: { commentaireId: id },
      relations: ['lignesOuvrage'],
    });

    if (!commentaire) {
      throw new NotFoundException('Commentaire non trouvé');
    }

    return this.toDto(commentaire);
  }

  async update(
    id: string,
    dto: UpdateCommentaireDto,
  ): Promise<CommentaireResponseDto> {
    const commentaire = await this.commentaireRepo.findOne({
      where: { commentaireId: id },
    });

    if (!commentaire) {
      throw new NotFoundException('Commentaire non trouvé');
    }

    Object.assign(commentaire, { description: dto.description });
    const saved = await this.commentaireRepo.save(commentaire);

    const reloaded = await this.commentaireRepo.findOne({
      where: { commentaireId: (saved as Commentaire).commentaireId },
      relations: ['lignesOuvrage'],
    });

    return this.toDto(reloaded!);
  }

  async remove(id: string): Promise<void> {
    const commentaire = await this.commentaireRepo.findOne({
      where: { commentaireId: id },
      relations: ['lignesOuvrage'],
    });
    if (!commentaire) {
      throw new NotFoundException('Commentaire non trouvé');
    }

    await this.commentaireRepo.remove(commentaire);
  }

  private toDto(entity: Commentaire): CommentaireResponseDto {
    const dto = plainToClass(CommentaireResponseDto, entity, {
      excludeExtraneousValues: true,
    });
    dto.lignesOuvrageCount = entity.lignesOuvrage?.length || 0;
    return dto;
  }
}

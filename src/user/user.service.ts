import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOneByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['tenant', 'userCompanies'],
    });
  }

  async findOneByEmailAndFailed(email: string): Promise<User> {
    const user = await this.findOneByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAllByTenant(tenantId: string): Promise<User[]> {
    return await this.userRepository.find({
      where: { idTenant: tenantId },
      relations: ['tenant', 'userCompanies', 'userCompanies.company'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['tenant', 'userCompanies', 'userCompanies.company'],
    });
  }
}

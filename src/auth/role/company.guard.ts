import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from 'src/company/entities/company.entity';
import { UserCompany } from 'src/user/entities/user-company.entity';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { ROLES } from './roles.decorator';

@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(UserCompany)
    private readonly userCompanyRepository: Repository<UserCompany>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const idCompany =
      request.headers['id_company'] || request.headers['id-company'];

    if (!idCompany) {
      throw new BadRequestException(
        'Company ID is required in header (id_company)',
      );
    }

    const company = await this.companyRepository.findOne({
      where: {
        id: idCompany,
        idTenant: user.idTenant,
      },
    });

    if (!company) {
      throw new ForbiddenException('Company not found or access denied');
    }

    if (user.isAdmin) {
      return true;
    }

    const userCompany = await this.userCompanyRepository.findOne({
      where: {
        idUser: user.id,
        idCompany: idCompany,
      },
    });

    if (!userCompany) {
      throw new ForbiddenException('User is not a member of this company');
    }

    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!roles || roles.length === 0) {
      return true;
    }

    let userRole: string;
    if (userCompany.isAdmin) {
      userRole = ROLES.COMPANY_ADMIN;
    } else {
      userRole = ROLES.COMPANY_USER;
    }

    request.company = company;

    return roles.includes(userRole);
  }
}

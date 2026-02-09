import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Company } from 'src/company/entities/company.entity';

export const GetCompany = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Company => {
    const request = ctx.switchToHttp().getRequest();
    const company: Company = request.company;

    return company;
  },
);
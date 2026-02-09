import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { User } from 'src/user/entities/user.entity';
import { ROLES } from './roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (roles.length === 0) {
      return true;
    }

    const user: User = context.switchToHttp().getRequest().user;

    const user_role = user.isAdmin ? ROLES.TENANT_ADMIN : ROLES.TENANT_USER;
    return roles.includes(user_role);
  }
}

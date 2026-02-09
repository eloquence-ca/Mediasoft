import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const IS_BLOCKED_KEY = 'isBlocked';
export const Blocked = () => SetMetadata(IS_BLOCKED_KEY, true);

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // Vérifie si la route est marquée comme publique
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // Vérifie si la route est bloquée
    const isBlocked = this.reflector.getAllAndOverride<boolean>(
      IS_BLOCKED_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isBlocked) {
      throw new ForbiddenException('Access to this resource is blocked.');
    }

    return super.canActivate(context);
  }
}

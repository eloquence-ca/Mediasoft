import { AuthService } from './auth.service';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './interfaces/payload.interface';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';
import { readFileSync } from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: readFileSync(
        process.env.JWT_PUBLIC_KEY_PATH || './secrets/public.key',
        'utf8',
      ),
      algorithms: [process.env.JWT_ALGORITHM || 'RS256'] as any,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.authService.validate(payload);
    if (!user) {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
    return user;
  }
}

import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtPayload } from './interfaces/payload.interface';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validate(payload: JwtPayload): Promise<User> {
    if (payload.role === 'AUTH') {
      const user = await this.userService.findOneByEmail(payload.email);
      if (!user) {
        throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
      }
      return user;
    }
    throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
  }
}

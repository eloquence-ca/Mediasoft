import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { readFileSync } from 'fs';

@Global()
@Module({
  imports: [
    UserModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: false,
    }),
    JwtModule.registerAsync({
      useFactory: async (config: ConfigService) => {
        const publicKeyPath =
          config.get<string>('JWT_PUBLIC_KEY_PATH') || './secrets/public.key';

        return {
          publicKey: readFileSync(publicKeyPath, 'utf8'),
          signOptions: {
            algorithm: config.get('JWT_ALGORITHM', 'RS256'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}

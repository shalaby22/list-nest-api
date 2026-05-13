import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { JwtPayloadType } from '../../utils/types';

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'ws-jwt') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: (client: Socket) => {
        const authPayload = client?.handshake?.auth;
        const headersPayload = client?.handshake?.headers;
        let authHeader: string | undefined;

        if (authPayload && typeof authPayload.token === 'string') {
          authHeader = authPayload.token;
        } else if (
          headersPayload &&
          typeof headersPayload.authorization === 'string'
        ) {
          authHeader = headersPayload.authorization;
        }
        if (authHeader) {
          return authHeader.split(' ')[1];
        }
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') as string,
    });
  }

  validate(payload: JwtPayloadType) {
    return { id: payload.id, userType: payload.userType };
  }
}

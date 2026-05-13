import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard extends AuthGuard('ws-jwt') {
  getRequest(context: ExecutionContext) {
    return context.switchToWs().getClient<Socket>();
  }
  handleRequest(err: any, user: any): any {
    if (err || !user) {
      throw new WsException({
        status: 'error',
        message: 'you are not Authenticated',
      });
    }

    return user;
  }
}

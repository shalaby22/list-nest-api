import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../decorators/roles.decorator';
import { RequestWithUserPayload } from '../../../utils/interfaces';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (roles) {
      const request: RequestWithUserPayload = context
        .switchToHttp()
        .getRequest();

      if (!roles.includes(request.user.userType)) {
        throw new ForbiddenException('not allowed to reach this');
      }
    } else {
      return false;
    }
    return true;
  }
}

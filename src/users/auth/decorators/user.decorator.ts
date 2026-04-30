import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUserPayload } from '../../../utils/interfaces';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request: RequestWithUserPayload = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

import { User } from '../users/users.entity';
import { JwtPayloadType } from './types';

export interface RequestWithUserPayload extends Request {
  user: JwtPayloadType;
}

export interface RequestWithWholeUser extends Request {
  user: User;
  cookies: { refresh_token: string };
}

export interface RequestWithCookies extends Request {
  cookies: { refresh_token: string };
}

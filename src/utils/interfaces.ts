import { User } from '../users/users.entity';
import { JwtPayloadType } from './types';
import { Socket } from 'socket.io';

export interface RequestWithUserPayload extends Request {
  user: JwtPayloadType;
}

export interface RequestWithUserAndTokens extends Request {
  user: { user: User; accessToken: string; refreshToken: string };
}

export interface RequestWithWholeUser extends Request {
  user: User;
}

export interface RequestWithCookies extends Request {
  cookies: { refresh_token: string };
}

export interface MapTilerFeature {
  id: string;
  text: string;
  place_name: string;
  place_type: string[];
}

export interface MapTilerResponse {
  type: string;
  features: MapTilerFeature[];
  query: number[];
}

export interface RawItemData {
  item_id: number;
  distance: number;
}

export interface RawChatData {
  chat_id: number;
  unreadCount: number;
}

export interface AuthenticatedSocket extends Socket {
  user: {
    id: number;
    userType: string;
  };
}

export interface EmailJobData {
  email: string;
  name: string;
  url: string;
}

export interface JSendSuccess<T> {
  status: 'success';
  data: T;
}

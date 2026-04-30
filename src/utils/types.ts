import { Request } from 'express';
import { UserType } from './enums';

export type JwtPayloadType = {
  userType: UserType;
  id: number;
};

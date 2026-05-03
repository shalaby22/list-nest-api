import { Request } from 'express';
import { UserType } from './enums';

export type JwtPayloadType = {
  userType: UserType;
  id: number;
};

export type Profile = {
  emails: { value: string }[];
  id: string;
  name: { givenName: string; familyName: string };
};

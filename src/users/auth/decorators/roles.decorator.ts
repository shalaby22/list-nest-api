import { Reflector } from '@nestjs/core';
import { UserType } from '../../../utils/enums';

export const Roles = Reflector.createDecorator<UserType[]>();

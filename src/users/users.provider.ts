import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './users.entity';
import { Repository } from 'typeorm';
import { UpdateUserDto } from './dtos/update-user.dto';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersProvider {
  constructor(
    private cloudinaryService: CloudinaryService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Get all users
   * @permission Admins only
   * @returns all users
   */
  public getAllUsers() {
    return this.usersRepository.find({});
  }

  /**
   * get User By id
   * @param id
   * @permission any one
   * @returns user
   */
  public async getUserBy(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  /**
   * edit User By id
   * @param id of my user or any user if admin
   * @param updateUserDto data to edit
   * @permission Admins only or edit own user
   * @returns user edited
   */
  public async editUserBy(id: number, updateUserDto: UpdateUserDto) {
    if (!updateUserDto) throw new BadRequestException('the body is empty');

    const user = await this.getUserBy(id);
    user.firstName = updateUserDto.firstName ?? user.firstName;
    user.lastName = updateUserDto.lastName ?? user.lastName;
    user.phone = updateUserDto.phone ?? user.phone;
    user.username = updateUserDto.username ?? user.username;
    if (updateUserDto.password) {
      const hash = await bcrypt.hash(updateUserDto.password, 10);
      user.password = hash;
    }
    const editedUser = await this.usersRepository.save(user);
    return editedUser;
  }

  /**
   * delete User By id
   * @param id of my user or any user if admin
   * @permission Admins only or edit own user
   * @returns user deleted
   */
  public async deleteUserBy(id: number) {
    const user = await this.getUserBy(id);
    const _deleted = this.cloudinaryService.deleteFolder(`items/user_${id}`);
    await this.usersRepository.remove(user);
    return 'deleted successfully';
  }
}

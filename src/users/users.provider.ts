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
   * @returns An array containing all user entities
   */
  public getAllUsers() {
    return this.usersRepository.find({});
  }

  // =========================================================================

  /**
   * Fetches a specific user entity by their unique ID identifier.
   * @param id - The target user ID
   * @returns The requested user
   */
  public async getUserBy(id: number) {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException();
    }
    return { user };
  }

  // =========================================================================

  /**
   * edit User By id
   * @param id - The ID of the target user to edit
   * @param updateUserDto - The payload mapping fields intended for modification
   * @returns The updated and saved user entity
   */
  public async editUserBy(id: number, updateUserDto: UpdateUserDto) {
    if (!updateUserDto) throw new BadRequestException('the body is empty');

    const { user } = await this.getUserBy(id);
    user.firstName = updateUserDto.firstName ?? user.firstName;
    user.lastName = updateUserDto.lastName ?? user.lastName;
    user.phone = updateUserDto.phone ?? user.phone;
    user.username = updateUserDto.username ?? user.username;
    if (updateUserDto.password) {
      const hash = await bcrypt.hash(updateUserDto.password, 10);
      user.password = hash;
    }
    const editedUser = await this.usersRepository.save(user);
    return { user: editedUser };
  }

  // =========================================================================

  /**
   * deletes a user record and delegates the removal of their remote Cloudinary directory.
   * @param id - The ID of the target user to delete
   * @returns An object containing the ID of the deleted user for frontend state tracking
   */
  public async deleteUserBy(id: number) {
    const { user } = await this.getUserBy(id);
    const _deleted = this.cloudinaryService.deleteFolder(`items/user_${id}`);
    await this.usersRepository.remove(user);
    return { message: 'user deleted successfully' };
  }
}

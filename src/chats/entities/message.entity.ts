import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/users.entity';
import { Chat } from './chat.entity';

@Entity()
@Index(['chat', 'createdAt'])
@Index(['receiver', 'chat'], { where: '"isRead" = false' })
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  //relations

  @ManyToOne(() => User, (user) => user.sentMessages, {})
  sender: User;

  @ManyToOne(() => User, (user) => user.receivedMessages, {})
  receiver: User;

  @ManyToOne(() => Chat, (chat) => chat.messages, {})
  chat: Chat;
}

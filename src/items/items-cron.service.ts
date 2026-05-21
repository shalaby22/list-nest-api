import { CloudinaryService } from './../cloudinary/cloudinary.service';
import { ItemsService } from './items.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Item } from './entities/item.entity';
import { In, LessThan, Repository } from 'typeorm';
import { ItemStatusType, UserType } from '../utils/enums';
import { DAYS_TO_EXPIRE_ITEM } from '../utils/constants';
import { JwtPayloadType } from '../utils/types';
import { ImageItem } from './entities/image-item.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ItemsCronService {
  constructor(
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    private itemsService: ItemsService,
    private cloudinaryService: CloudinaryService,
    @InjectRepository(ImageItem)
    private imageItemRepository: Repository<ImageItem>,
    private configService: ConfigService,
  ) {}
  private readonly logger = new Logger(ItemsCronService.name);

  // @Cron(CronExpression.EVERY_30_SECONDS)
  // handleCron() {
  //   this.logger.log('started cron job EVERY_30_SECONDS');
  // }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOldItems() {
    this.logger.log('started cron job on date items check for expiration');
    const constDaysAgo = new Date();
    constDaysAgo.setDate(constDaysAgo.getDate() - DAYS_TO_EXPIRE_ITEM);

    try {
      const result = await this.itemsRepository.update(
        {
          createdAt: LessThan(constDaysAgo),
          status: In([ItemStatusType.ACTIVE, ItemStatusType.SOLD]),
        },
        {
          status: ItemStatusType.EXPIRED,
        },
      );

      this.logger.log(
        `${result.affected} items changed to expires successfully`,
      );
    } catch (error) {
      this.logger.error('could not expire items due to an error', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async deleteDrafts() {
    this.logger.log('started cron job on to delete draft items');

    try {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const drafts = await this.itemsRepository.find({
        where: {
          status: ItemStatusType.DRAFT,
          createdAt: LessThan(twentyFourHoursAgo),
        },
      });
      this.logger.log(`found ${drafts.length} draft items will be removed`);
      const jwtPayload: JwtPayloadType = { userType: UserType.ADMIN, id: 0 };
      for (const item of drafts) {
        await this.itemsService.remove(item.id, jwtPayload);
        this.logger.log(`${item.id} : this item deleted successfully`);
      }
    } catch (err) {
      this.logger.error(`there is an error during removing draft items ${err}`);
    }
    this.logger.log(`finished`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async deleteUnusedCloudinaryImages() {
    this.logger.log(
      'started cron job on cloudinary images to delete un used images there',
    );
    const imagesOfThreeDays =
      await this.cloudinaryService.getAllImagesOfThreeDays();
    this.logger.log(imagesOfThreeDays);

    const knownImagesObj = await this.imageItemRepository.find({
      where: { link: In(imagesOfThreeDays) },
      select: ['link'],
    });
    const knownImages = knownImagesObj.map((x) => x.link);
    let orphanLinks = imagesOfThreeDays.filter(
      (link) => !knownImages.includes(link),
    );
    if (orphanLinks.length > 0) {
      this.logger.log(`found those images to delete ${orphanLinks.toString()}`);
      orphanLinks = orphanLinks.map((ele) => {
        return ele.split(`${this.configService.get('CLOUDINARY_NAME')}/`)[1];
      });
      await this.cloudinaryService.deleteArrayOfPublicIds(orphanLinks);
    }
    this.logger.log(
      `deleted ${orphanLinks.length} successfully from cloudinary`,
    );
  }
}

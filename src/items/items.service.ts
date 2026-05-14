import { CloudinaryService } from './../cloudinary/cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './../users/users.service';
import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Item } from './entities/item.entity';
import { Point, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { City } from './entities/city.entity';
import { JwtPayloadType } from '../utils/types';
import { ItemStatusType, SortingType, UserType } from '../utils/enums';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { MapTilerResponse, RawItemData } from '../utils/interfaces';
import { AddImagesToItemDto } from './dto/add-Images.dto';
import { ImageItem } from './entities/image-item.entity';
import { DEFAULT_NEARBY_DISTANCE, ITEMS_PER_PAGE } from '../utils/constants';
import { FindItemsDto } from './dto/find-items-query.dto';
import { Region } from './entities/region.entity';
import { Country } from './entities/country.entity';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ItemsService {
  constructor(
    @Inject(forwardRef(() => CategoriesService))
    private categoriesService: CategoriesService,

    private configService: ConfigService,
    private readonly httpService: HttpService,
    private usersService: UsersService,
    private cloudinaryService: CloudinaryService,
    @InjectRepository(Item)
    private itemsRepository: Repository<Item>,
    @InjectRepository(City)
    private cityRepository: Repository<City>,
    @InjectRepository(Region)
    private regionRepository: Repository<Region>,
    @InjectRepository(Country)
    private countryRepository: Repository<Country>,
    @InjectRepository(ImageItem)
    private imageItemRepository: Repository<ImageItem>,
  ) {}

  public async create(createItemDto: CreateItemDto, userId: number) {
    let newItem = new Item();
    newItem.title = createItemDto.title;
    newItem.description = createItemDto.description;
    newItem.price = createItemDto.price;
    //check if verified user
    const user = await this.usersService.getUserBy(userId);
    if (!user.isVerified)
      throw new BadRequestException('your user is not verified yet');
    newItem.user = user;

    //check if category is a child category
    const category = await this.categoriesService.findOne(
      createItemDto.categoryId,
    );
    if (!category.parentCategory)
      throw new BadRequestException('this category is a parent category');
    newItem.category = category;

    //find location or generate it
    const location = await this.getLocation(
      createItemDto.longitude,
      createItemDto.latitude,
    );
    newItem.city = location;

    //generate point
    const pointObject: Point = {
      type: 'Point',
      coordinates: [createItemDto.longitude, createItemDto.latitude],
    };
    newItem.point = pointObject;

    //want image signature
    if (!createItemDto.wantSignature) {
      newItem.status = ItemStatusType.ACTIVE;
    }
    newItem = await this.itemsRepository.save(newItem);

    if (createItemDto.wantSignature) {
      //save as a draft (default)
      const signature = this.getSignature(newItem.id, userId);
      newItem['signature'] = signature;
    }
    return newItem;
  }

  async findAll(findItemsDto: FindItemsDto) {
    return this.findItems(findItemsDto, true);
  }
  async findAllForAdmins(findItemsDto: FindItemsDto) {
    return this.findItems(findItemsDto, false);
  }

  private async findItems(findItemsDto: FindItemsDto, isActiveOnly: boolean) {
    const sqlLine = this.itemsRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('category.parentCategory', 'parentCategory')
      .leftJoinAndSelect('item.user', 'user')
      .leftJoinAndSelect('item.city', 'city')
      .leftJoinAndSelect('city.region', 'region')
      .leftJoinAndSelect('region.country', 'country')
      .leftJoinAndSelect('item.images', 'imageItem')
      .orderBy('item.createdAt', 'DESC');

    //isActiveOnly
    if (isActiveOnly) {
      sqlLine.where('item.status = :active', { active: 'active' });
    }

    //for search

    if (findItemsDto.search) {
      sqlLine
        .addSelect(
          `
    (
      ts_rank(item."searchVector", plainto_tsquery('english', :searchTerm)) +
      similarity(item.title, :searchTerm)
    )
  `,
          'score',
        )
        .andWhere(
          `(
    (item."searchVector" @@ plainto_tsquery('english', :searchTerm))
    OR
    (item.title % :searchTerm)
        )
  `,
          { searchTerm: findItemsDto.search },
        )
        .setParameter('searchTerm', findItemsDto.search);
    }
    //for point
    if (findItemsDto.lat && findItemsDto.lng) {
      const userLocation = `ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography`;
      const distanceInMeters =
        (findItemsDto.distance ?? DEFAULT_NEARBY_DISTANCE) * 1000;

      sqlLine
        .andWhere(`ST_DWithin(item.point, ${userLocation}, :radius)`)
        .addSelect(`ST_Distance(item.point, ${userLocation})`, 'distance')
        .orderBy('distance', 'ASC')
        .setParameters({
          lng: findItemsDto.lng,
          lat: findItemsDto.lat,
          radius: distanceInMeters,
        });
    }

    //for min and max price
    if (findItemsDto.minPrice) {
      sqlLine.andWhere('item.price >= :min', { min: findItemsDto.minPrice });
    }

    if (findItemsDto.maxPrice) {
      sqlLine.andWhere('item.price <= :max', { max: findItemsDto.maxPrice });
    }

    //for sorting
    if (findItemsDto.sorting) {
      if (findItemsDto.sorting === SortingType.CREATION) {
        sqlLine.orderBy('item.createdAt', 'DESC');
      } else if (findItemsDto.sorting === SortingType.ASC_PRICE) {
        sqlLine.orderBy('item.price', 'ASC');
      } else if (findItemsDto.sorting === SortingType.DESC_PRICE) {
        sqlLine.orderBy('item.price', 'DESC');
      } else if (
        findItemsDto.sorting === SortingType.SEARCH_SCORE &&
        findItemsDto.search
      ) {
        sqlLine.orderBy('score', 'DESC');
      }
    }

    //for categories
    if (findItemsDto.category) {
      const category = await this.categoriesService.findOne(
        findItemsDto.category,
      );
      if (category.parentCategory) {
        sqlLine.andWhere('category.id = :categoryId', {
          categoryId: findItemsDto.category,
        });
      } else {
        sqlLine.andWhere('parentCategory.id = :categoryId', {
          categoryId: findItemsDto.category,
        });
      }
    }

    //for locations
    let locationID: number | null = null;
    let locationFIlerQuery = '';
    if (findItemsDto.city) {
      const city = await this.cityRepository.findOneBy({
        id: findItemsDto.city,
      });
      if (!city) {
        throw new BadRequestException('there is no city with that id');
      }
      locationFIlerQuery = 'city.id = :locationID';
      locationID = findItemsDto.city;
    } else if (findItemsDto.region) {
      const region = await this.regionRepository.findOneBy({
        id: findItemsDto.region,
      });
      if (!region) {
        throw new BadRequestException('there is no region with that id');
      }
      locationFIlerQuery = 'region.id = :locationID';
      locationID = findItemsDto.region;
    } else if (findItemsDto.country) {
      const country = await this.countryRepository.findOneBy({
        id: findItemsDto.country,
      });
      if (!country) {
        throw new BadRequestException('there is no country with that id');
      }
      locationFIlerQuery = 'country.id = :locationID';
      locationID = findItemsDto.country;
    }

    if (locationID) {
      sqlLine.andWhere(locationFIlerQuery, {
        locationID,
      });
    }

    //for pagination
    const totalItems = await sqlLine.getCount();
    const limit = ITEMS_PER_PAGE;
    const skip = limit * ((findItemsDto.page ?? 1) - 1);
    sqlLine.skip(skip).take(limit);

    //execute query
    let items = {};
    // console.log(sqlLine.getQuery());

    if (findItemsDto.lat && findItemsDto.lng) {
      const { entities, raw } = await sqlLine.getRawAndEntities();
      const distanceMap = new Map();
      raw.forEach((ele: RawItemData) => {
        distanceMap.set(ele.item_id, +ele.distance);
      });

      items = entities.map((item) => {
        const distance: number = distanceMap.get(item.id) as number;
        return {
          ...item,
          distance: Math.round(distance) / 1000,
        };
      });
    } else {
      items = await sqlLine.getMany();
    }
    return { items, totalItems };
    //  //execute query
    //     let items = {};
    //     if (findItemsDto.lat && findItemsDto.lng) {
    //       const { entities, raw } = await sqlLine.getRawAndEntities();
    //       items = entities.map((item) => {
    //         const rawData = raw.find((r) => r.item_id === item.id);
    //         return {
    //           ...item,
    //           distance: Math.round(rawData.distance) / 1000,
    //         };
    //       });
    //     } else {
    //       items = await sqlLine.getMany();
    //     }
    //         return { items, totalItems };
  }

  //<deprecated> use find all with user query
  // async findItemsByUser(userId: number, page: number) {
  //   const user = await this.usersService.getUserBy(userId);

  //   const limit = ITEMS_PER_PAGE;
  //   const skip = limit * ((page ?? 1) - 1);

  //   const items = await this.itemsRepository.findAndCount({
  //     where: { user: { id: user.id } },
  //     skip: skip,
  //     take: limit,
  //     relations: { category: { parentCategory: true } },
  //   });
  //   return { items: items[0], totalItems: items[1] };
  // }

  async findOne(id: number) {
    const item = await this.itemsRepository.findOne({
      where: { id },
      relations: { category: { parentCategory: true } },
    });
    if (!item) throw new NotFoundException('there is no item with that id');
    return item;
  }

  async update(id: number, updateItemDto: UpdateItemDto, user: JwtPayloadType) {
    let item = await this.findOne(id);
    if (item.user.id !== user.id && user.userType !== UserType.ADMIN) {
      throw new ForbiddenException(
        'you are not allowed to remove another one item',
      );
    }

    item.title = updateItemDto.title ?? item.title;
    item.description = updateItemDto.description ?? item.description;
    item.price = updateItemDto.price ?? item.price;

    //check for status
    if (updateItemDto.status) {
      if (item.status === ItemStatusType.EXPIRED)
        throw new BadRequestException("can't edit status of expired item");
      item.status = updateItemDto.status;
    }
    //check if category is a child category
    if (updateItemDto.categoryId) {
      const category = await this.categoriesService.findOne(
        updateItemDto.categoryId,
      );
      if (!category.parentCategory)
        throw new BadRequestException('this category is a parent category');
      item.category = category;
    }

    //if location
    if (updateItemDto.longitude && updateItemDto.latitude) {
      //find location or generate it
      const location = await this.getLocation(
        updateItemDto.longitude,
        updateItemDto.latitude,
      );
      item.city = location;
      //generate point
      const pointObject: Point = {
        type: 'Point',
        coordinates: [updateItemDto.longitude, updateItemDto.latitude],
      };
      item.point = pointObject;
    } else if (updateItemDto.longitude || updateItemDto.latitude) {
      throw new BadRequestException(
        'you sent only one of longitude and latitude',
      );
    }

    //remove images
    if (updateItemDto.deletedImagesIds?.length) {
      for (let i = 0; i < updateItemDto.deletedImagesIds.length; i++) {
        const imageId = updateItemDto.deletedImagesIds[i];
        const image = await this.imageItemRepository.findOne({
          where: { id: imageId, item: { id: item.id } },
        });
        if (image) {
          const PublicID = image.link.split(
            `${this.configService.get('CLOUDINARY_NAME')}/`,
          )[1];
          const _deleted = this.cloudinaryService.deleteImage(PublicID);
          await this.imageItemRepository.remove(image);
        }
      }
    }
    //if want signature
    if (updateItemDto.wantSignature) {
      item['signature'] = this.getSignature(item.id, item.user.id);
    }

    item = await this.itemsRepository.save(item);
    return item;
  }

  async remove(id: number, user: JwtPayloadType) {
    const item = await this.findOne(id);
    if (item.user.id !== user.id && user.userType !== UserType.ADMIN) {
      throw new ForbiddenException(
        'you are not allowed to remove another one item',
      );
    }
    if (item.images.length) {
      const _deleted = this.cloudinaryService.deleteFolder(
        `items/user_${item.user.id}/${id}`,
      );
    }
    await this.itemsRepository.remove(item);
    return 'deleted successfully';
  }

  getSignature(itemId: number, userId: number) {
    return this.cloudinaryService.generateSignature(itemId, userId);
  }

  async addImagesToItem(
    itemId: number,
    addImagesToItemDto: AddImagesToItemDto,
    userId: number,
  ) {
    const item = await this.findOne(itemId);
    if (item.user.id !== userId) {
      throw new ForbiddenException(
        'you are not allowed to add images to another one item',
      );
    }
    //change status to active if it was draft while creating the item
    if (
      item.status === ItemStatusType.DRAFT &&
      addImagesToItemDto.status === ItemStatusType.ACTIVE
    ) {
      item.status = ItemStatusType.ACTIVE;
    }
    //------
    const itemImagesLinks = item.images.map((ele) => ele.link);
    console.log(itemImagesLinks);

    const newImages: ImageItem[] = [];
    for (let i = 0; i < addImagesToItemDto.imageIds.length; i++) {
      const element = addImagesToItemDto.imageIds[i];
      const link = `https://res.cloudinary.com/dmudqzggn/items/user_${userId}/${itemId}/${element}`;
      if (!itemImagesLinks.includes(link)) {
        newImages[i] = this.imageItemRepository.create({
          link,
        });
        item.images.push(newImages[i]);
      }
    }
    await this.itemsRepository.save(item);
    return item;
  }

  private async getLocation(longitude: number, latitude: number) {
    const responseData = await firstValueFrom(
      this.httpService.get<MapTilerResponse>(
        `https://api.maptiler.com/geocoding/${longitude},${latitude}.json?key=${this.configService.get('MAPTILER_KEY')}&language=en`,
      ),
    );
    // console.log(responseData.data);
    const location = responseData.data;
    if (!location.features.length)
      throw new BadRequestException('not found your location on map');

    let country: string | null = null;
    let region: string | null = null;
    let place: string | null = null;
    for (const feature of location.features) {
      if (feature.place_type[0] === 'place') {
        place = feature.text;
      }
      if (feature.place_type[0] === 'region') {
        region = feature.text;
      }
      if (feature.place_type[0] === 'country') {
        country = feature.text;
      }
    }
    if (!region || !country)
      throw new BadRequestException('not found your location on map');

    if (!place) place = 'other';

    //find location in dataBase or generate it
    let foundCountry = await this.countryRepository.findOneBy({
      country,
    });
    let foundRegion: Region | null = null;
    let foundCity: City | null = null;

    if (foundCountry) {
      foundRegion = await this.regionRepository.findOne({
        where: { country: { id: foundCountry.id }, region: region },
      });
    } else {
      foundCountry = this.countryRepository.create({
        country: country,
      });
    }

    if (foundRegion) {
      foundCity = await this.cityRepository.findOneBy({
        region: { id: foundRegion.id },
        city: place,
      });
    } else {
      foundRegion = this.regionRepository.create({
        country: foundCountry,
        region,
      });
    }

    if (!foundCity) {
      foundCity = this.cityRepository.create({
        region: foundRegion,
        city: place,
      });
      foundCity = await this.cityRepository.save(foundCity);
    }
    return foundCity;
  }

  getAllLocations() {
    return this.countryRepository.find({
      relations: { regions: { cities: true } },
    });
  }
}

//todo add cron job to expire items
//todo add cron job to delete unused images معتقدش هنحتاجها
//todo ترتيب السيرفيس والكونترولرز للبرنامج كله

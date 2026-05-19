import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
  ParseIntPipe,
  ClassSerializerInterceptor,
  UseInterceptors,
  Patch,
  Query,
} from '@nestjs/common';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../users/auth/guards/jwt-auth.guard';
import type { JwtPayloadType } from '../utils/types';
import { User } from '../users/auth/decorators/user.decorator';
import { AddImagesToItemDto } from './dto/add-Images.dto';
import { FindItemsDto } from './dto/find-items-query.dto';
import { Roles } from '../users/auth/decorators/roles.decorator';
import { UserType } from '../utils/enums';
import { RolesGuard } from '../users/auth/guards/roles.guard';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('api/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post()
  @Throttle({ default: { limit: 2, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new item',
    description:
      '**Workflow:**\n- `wantSignature: true` -> Creates as `DRAFT` and returns a Cloudinary signature for image uploads.\n- `wantSignature: false` -> Creates immediately as `ACTIVE`.',
  })
  create(
    @Body() createItemDto: CreateItemDto,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.itemsService.create(createItemDto, jwtPayload.id);
  }

  //replaced that ; made create and update returns signature
  // @Get('signature/:id')
  // @UseGuards(JwtAuthGuard)
  // getSignature(
  //   @Param('id', ParseIntPipe) id: number,
  //   @User() jwtPayload: JwtPayloadType,
  // ) {
  //   return this.itemsService.getSignature(id, jwtPayload.id);
  // }

  @ApiOperation({
    summary: 'Attach uploaded images to an item',
    description: `
    Send Cloudinary image IDs here after uploading. Use "changeDraftToActive: true" to flip status from "DRAFT" to "ACTIVE".
**🚀 How to Upload Images to Cloudinary (Frontend Guide):**

Before calling this endpoint, you must upload the image directly to Cloudinary.

**Make a POST request to:**
\`https://api.cloudinary.com/v1_1/dmudqzggn/image/upload\`

**Body (multipart/form-data):**
- \`file\`: (The actual image file - Binary)
- \`timestamp\`: (The timestamp returned with the signature)
- \`signature\`: (The generated signature from the backend)
- \`folder\`: (Target folder path returned with the signature)
- \`api_key\`: (Cloudinary API Key returned with the signature)
- \`upload_preset\`: (The specific upload preset returned with the signature)

After a successful upload, Cloudinary will return the image IDs. Send those IDs in THIS request body. 
*Note: Use \`changeDraftToActive: true\` to automatically flip the item status from DRAFT to ACTIVE.* `,
  })
  @Patch('images/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  addImages(
    @Param('id', ParseIntPipe) id: number,
    @Body() addImagesToItemDto: AddImagesToItemDto,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.itemsService.addImagesToItem(
      id,
      addImagesToItemDto,
      jwtPayload.id,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all items with optional filters',
    description:
      'Returns only `ACTIVE` or `SOLD` items. Excludes `DRAFT` and `EXPIRED`.',
  })
  findAll(@Query() findItemsDto: FindItemsDto) {
    return this.itemsService.findAll(findItemsDto);
  }

  @Get('admin')
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '(Admin only) Get all items regardless of status' })
  findAllForAdmins(@Query() findItemsDto: FindItemsDto) {
    return this.itemsService.findAllForAdmins(findItemsDto);
  }

  //<deprecated> use find all with user query
  // @Get('user/:userId')
  // findItemsByUser(
  //   @Param('userId', ParseIntPipe) userId: number,
  //   @Query('page', new ParseIntPipe({ optional: true })) page: number,
  // ) {
  //   return this.itemsService.findItemsByUser(userId, page);
  // }

  @Get('locations')
  @ApiOperation({
    summary: 'Get ALL geographical locations:country,region,city',
  })
  findAllLocations() {
    return this.itemsService.getAllLocations();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific item by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update an existing item by ID',
    description:
      'Returns a new Cloudinary signature if image updates are required.',
  })
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateItemDto: UpdateItemDto,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.itemsService.update(id, updateItemDto, jwtPayload);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete an item by ID',
    description:
      'Cascades database image records and dispatches a background queue to wipe Cloudinary files.',
  })
  remove(
    @Param('id', ParseIntPipe) id: string,
    @User() jwtPayload: JwtPayloadType,
  ) {
    return this.itemsService.remove(+id, jwtPayload);
  }
}

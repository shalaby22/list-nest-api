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

  // =========================================================================

  /**
   * [POST] /api/items
   * Access: verified Users
   * Description: Create a new item (Draft or Active based on signature flag)
   */
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

  // =========================================================================

  /**
   * [PATCH] /api/items/images/:id
   * Access: verified Users (Owner Only)
   * Description: Attach uploaded Cloudinary image IDs to a specific item
   */

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

  // =========================================================================

  /**
   * [GET] /api/items
   * Access: Public
   * Description: Get all ACTIVE/SOLD items with multiple filters
   */
  @Get()
  @ApiOperation({
    summary: 'Get all items with optional filters',
    description:
      'Returns only `ACTIVE` or `SOLD` items. Excludes `DRAFT` and `EXPIRED`.',
  })
  findAll(@Query() findItemsDto: FindItemsDto) {
    return this.itemsService.findAll(findItemsDto);
  }

  // =========================================================================

  /**
   * [GET] /api/items/admin
   * Access: Admins Only
   * Description: GET all system items ignoring the status restrictions
   */
  @Get('admin')
  @Roles([UserType.ADMIN])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '(Admin only) Get all items regardless of status' })
  findAllForAdmins(@Query() findItemsDto: FindItemsDto) {
    return this.itemsService.findAllForAdmins(findItemsDto);
  }

  // =========================================================================

  /**
   * [GET] /api/items/locations
   * Access: Public
   * Description: GET the entire database layout tree (Country > Region > City)
   */
  @Get('locations')
  @ApiOperation({
    summary: 'Get ALL geographical locations:country,region,city',
  })
  findAllLocations() {
    return this.itemsService.getAllLocations();
  }

  // =========================================================================

  /**
   * [GET] /api/items/:id
   * Access: Public
   * Description: GET detailed data about a specific item
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific item by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.itemsService.findOne(id);
  }

  // =========================================================================

  /**
   * [PUT] /api/items/:id
   * Access: verified Users (Owner or Admin)
   * Description: Update core details of an item or remove specific images
   */
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

  // =========================================================================

  /**
   * [DELETE] /api/items/:id
   * Access: verified Users (Owner or Admin)
   * Description: Delete an item completely and dispatch Cloudinary cleanup queue
   */
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

//replaced that ; made create and update returns signature
// @Get('signature/:id')
// @UseGuards(JwtAuthGuard)
// getSignature(
//   @Param('id', ParseIntPipe) id: number,
//   @User() jwtPayload: JwtPayloadType,
// ) {
//   return this.itemsService.getSignature(id, jwtPayload.id);
// }

//<deprecated> use find all with user query
// @Get('user/:userId')
// findItemsByUser(
//   @Param('userId', ParseIntPipe) userId: number,
//   @Query('page', new ParseIntPipe({ optional: true })) page: number,
// ) {
//   return this.itemsService.findItemsByUser(userId, page);
// }

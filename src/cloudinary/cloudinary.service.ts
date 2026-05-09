import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {}

  generateSignature(itemId: number, userId: number) {
    //made its Lifespan 10 minutes
    const desiredLifespan = 60 * 10;
    const timeOffset = 3600 - desiredLifespan;
    const timestamp = Math.round(new Date().getTime() / 1000);
    const fakeTimestamp = timestamp - timeOffset;

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: fakeTimestamp,
        folder: `items/user_${userId}/${itemId}`,
        upload_preset: 'List_Nest_preset',
      },
      this.configService.get<string>('CLOUDINARY_API_SECRET') as string,
    );

    return {
      signature,
      timestamp: fakeTimestamp,
      folder: `items/user_${userId}/${itemId}`,
      cloudName: this.configService.get<string>('CLOUDINARY_NAME'),
      apiKey: this.configService.get<string>('CLOUDINARY_API_KEY'),
      upload_preset: 'List_Nest_preset',
    };
  }

  async deleteImage(PublicID: string) {
    await cloudinary.uploader.destroy(PublicID);
    //todo can make queue system here to track if deleted

    return 'deleted successfully';
  }

  async deleteFolder(folderPath: string) {
    await cloudinary.api.delete_resources_by_prefix(folderPath);
    await cloudinary.api.delete_folder(folderPath);
    //todo can make queue system here to track if deleted
    return 'deleted successfully';
  }
}

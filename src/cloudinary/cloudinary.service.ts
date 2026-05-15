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
    // console.log(await cloudinary.api.resource(PublicID));
    await cloudinary.uploader.destroy(PublicID);
    //todo can make queue system here to track if deleted and catch errors if there was wrong path

    return 'deleted successfully';
  }

  async deleteFolder(folderPath: string) {
    await cloudinary.api.delete_resources_by_prefix(folderPath);
    await cloudinary.api.delete_folder(folderPath);
    //todo can make queue system here to track if deleted and catch errors if there was wrong path
    return 'deleted successfully';
  }

  async imageExists(PublicID: string) {
    try {
      await cloudinary.api.resource(PublicID);
    } catch (_err) {
      console.log('not found image');

      return false;
    }
    return true;
  }

  async getAllImagesOfThreeDays() {
    const allRemotePublicIds: string[] = [];
    let nextCursor = null;

    do {
      let searchApi = cloudinary.search
        .expression('folder:items/* AND uploaded_at>3d AND uploaded_at<1h')
        .max_results(500);

      if (nextCursor) {
        searchApi = searchApi.next_cursor(nextCursor);
      }

      const recentUploads = (await searchApi.execute()) as {
        resources: { public_id: string }[];
        next_cursor: any;
      };
      // console.log(recentUploads.resources);

      const batchIds: string[] = recentUploads.resources.map((img) => {
        return `https://res.cloudinary.com/${this.configService.get<string>('CLOUDINARY_NAME')}/${img.public_id}`;
      });

      allRemotePublicIds.push(...batchIds);

      nextCursor = recentUploads.next_cursor as null;
    } while (nextCursor);

    return allRemotePublicIds;
  }

  async deleteArrayOfPublicIds(PublicIds: string[]) {
    return (await cloudinary.api.delete_resources(PublicIds)) as unknown;
  }
}

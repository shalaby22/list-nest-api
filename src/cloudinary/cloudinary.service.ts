import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CloudinaryService {
  constructor(
    private configService: ConfigService,
    @InjectQueue('deleteImage-queue')
    private deleteImageQueue: Queue,
    @InjectQueue('deleteFolder-queue')
    private deleteFolderQueue: Queue,
  ) {}
  private readonly logger = new Logger('CloudinaryService');

  // =========================================================================

  /**
   * Generates a secure, time-limited signature required for client-side Cloudinary uploads.
   * @param itemId - Target item id
   * @param userId - Requesting user id
   * @returns signature and payload metadata
   */
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

  // =========================================================================

  /**
   * delete an image by assigning it to processing background queue.
   * @param PublicID - The unique Cloudinary asset public id
   */
  async deleteImage(PublicID: string) {
    // await cloudinary.uploader.destroy(PublicID);
    await this.deleteImageQueue.add('delete-image', {
      PublicID: PublicID,
    });
  }

  // =========================================================================

  /**
   * delete a folder by assigning it to processing background queue.
   * @param folderPath - The remote directory string path
   * @returns a message of 'deleted successfully'
   */
  async deleteFolder(folderPath: string) {
    await this.deleteFolderQueue.add('delete-folder', {
      folderPath: folderPath,
    });
    return 'deleted successfully';
  }

  // =========================================================================

  /**
   * Verifies whether an asset exists inside the remote Cloudinary storage server.
   * @param PublicID - The unique Cloudinary asset public id
   * @returns Boolean
   */
  async imageExists(PublicID: string) {
    try {
      await cloudinary.api.resource(PublicID);
    } catch (err) {
      const error = err as {
        error?: {
          http_code?: number;
        };
      };
      if (!(error.error?.http_code === 404)) {
        this.logger.error(
          `something went wrong when checking if image exists ${JSON.stringify(error)}`,
        );
      }
      return false;
    }
    return true;
  }

  // =========================================================================

  /**
   * Scans and aggregates remote image urls within last 3 days
   * @returns An array containing target public URL addresses
   */
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

      const batchIds: string[] = recentUploads.resources.map((img) => {
        return `https://res.cloudinary.com/${this.configService.get<string>('CLOUDINARY_NAME')}/${img.public_id}`;
      });

      allRemotePublicIds.push(...batchIds);

      nextCursor = recentUploads.next_cursor as null;
    } while (nextCursor);

    return allRemotePublicIds;
  }

  // =========================================================================

  /**
   * delete multiple Cloudinary asset targets by Public Ids
   * @param PublicIds - array containing Public Ids targets
   * @returns void
   */
  async deleteArrayOfPublicIds(PublicIds: string[]) {
    await cloudinary.api.delete_resources(PublicIds);
    return;
  }
}

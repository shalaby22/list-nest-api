import { MigrationInterface, QueryRunner } from 'typeorm';

export class Initial1779094300913 implements MigrationInterface {
  name = 'Initial1779094300913';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);
    await queryRunner.query(
      `CREATE TABLE "category" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "parentCategoryId" integer, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9e5435ba76dbc1f1a0705d4db4" ON "category" ("parentCategoryId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "image_item" ("id" SERIAL NOT NULL, "link" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "itemId" integer, CONSTRAINT "PK_09b7f87f787f24a29480a31e458" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_2ba1b7e11a80250ca9a89f309f" ON "image_item" ("itemId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "country" ("id" SERIAL NOT NULL, "country" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bf6e37c231c4f4ea56dcd887269" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "region" ("id" SERIAL NOT NULL, "region" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "countryId" integer, CONSTRAINT "PK_5f48ffc3af96bc486f5f3f3a6da" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "city" ("id" SERIAL NOT NULL, "city" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "regionId" integer, CONSTRAINT "PK_b222f51ce26f7e5ca86944a6739" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "wishlist" ("userId" integer NOT NULL, "itemId" integer NOT NULL, CONSTRAINT "PK_c070a619bdee4743b51fa222b91" PRIMARY KEY ("userId", "itemId"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "message" ("id" SERIAL NOT NULL, "content" character varying NOT NULL, "isRead" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "senderId" integer, "receiverId" integer, "chatId" integer, CONSTRAINT "PK_ba01f0a3e0123651915008bc578" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_572f2366d5e28c97e838a58c64" ON "message" ("receiverId", "chatId") WHERE "isRead" = false`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_93a28d680f3f131dea7415e0bf" ON "message" ("chatId", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TABLE "chat" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "sellerId" integer, "buyerId" integer, "itemId" integer, CONSTRAINT "UQ_90094ff65942edc4ef3cc4fb1d3" UNIQUE ("itemId", "buyerId"), CONSTRAINT "CHK_9ef1babe775ebcba7bda3792f4" CHECK ("buyerId" != "sellerId"), CONSTRAINT "PK_9d0b2ba74336710fd31154738a5" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_26499c6b47f1dfa19063d9b9e5" ON "chat" ("buyerId", "updatedAt") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_22950249a08297ee33e9883f1e" ON "chat" ("sellerId", "updatedAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."item_status_enum" AS ENUM('active', 'draft', 'sold', 'expired')`,
    );
    await queryRunner.query(
      `INSERT INTO "typeorm_metadata"("database", "schema", "table", "type", "name", "value") VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'neondb',
        'public',
        'item',
        'GENERATED_COLUMN',
        'searchVector',
        "\n      setweight(to_tsvector('english', coalesce(title, '')), 'A') || \n      setweight(to_tsvector('english', coalesce(description, '')), 'B')\n    ",
      ],
    );
    await queryRunner.query(`CREATE TABLE "item" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "status" "public"."item_status_enum" NOT NULL DEFAULT 'draft', "price" integer NOT NULL, "point" geography(Point,4326) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "searchVector" tsvector GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(title, '')), 'A') || 
      setweight(to_tsvector('english', coalesce(description, '')), 'B')
    ) STORED, "userId" integer, "categoryId" integer, "cityId" integer, CONSTRAINT "PK_d3c0c71f23e7adcf952a1d13423" PRIMARY KEY ("id"))`);
    await queryRunner.query(
      `CREATE INDEX "IDX_ffed4bd61dc9cbc9ded5f05e3d" ON "item" ("price") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_efa0888edea58676c238f49796" ON "item" USING GiST ("point") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5369db3bd33839fd3b0dd5525d" ON "item" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c0c8f47a702c974a77812169bc" ON "item" ("categoryId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a5651e043b3d3d79ee2e65de4c" ON "item" ("cityId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_4a8b93627cf3092b5bc84a50e3" ON "item" ("status", "createdAt") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_usertype_enum" AS ENUM('admin', 'normalUser')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "phone" character varying NOT NULL, "username" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "userType" "public"."user_usertype_enum" NOT NULL DEFAULT 'normalUser', "isVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD CONSTRAINT "FK_9e5435ba76dbc1f1a0705d4db43" FOREIGN KEY ("parentCategoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "image_item" ADD CONSTRAINT "FK_2ba1b7e11a80250ca9a89f309f6" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "region" ADD CONSTRAINT "FK_75ceb9efda6c228a50d88dcdfb8" FOREIGN KEY ("countryId") REFERENCES "country"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "city" ADD CONSTRAINT "FK_a702dde63cef536819298d776b5" FOREIGN KEY ("regionId") REFERENCES "region"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist" ADD CONSTRAINT "FK_2847eb91f63b3c547dbfe80cf16" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist" ADD CONSTRAINT "FK_f6eeb74a295e2aad03b76b0ba87" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_bc096b4e18b1f9508197cd98066" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_71fb36906595c602056d936fc13" FOREIGN KEY ("receiverId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" ADD CONSTRAINT "FK_619bc7b78eba833d2044153bacc" FOREIGN KEY ("chatId") REFERENCES "chat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" ADD CONSTRAINT "FK_ee546e48ed12ba2d307df85cd11" FOREIGN KEY ("sellerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" ADD CONSTRAINT "FK_c169da4a873ca09ff3460da64dc" FOREIGN KEY ("buyerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" ADD CONSTRAINT "FK_81e3d379fbc1ed9a9aa319fb51a" FOREIGN KEY ("itemId") REFERENCES "item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD CONSTRAINT "FK_5369db3bd33839fd3b0dd5525d1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD CONSTRAINT "FK_c0c8f47a702c974a77812169bc2" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" ADD CONSTRAINT "FK_a5651e043b3d3d79ee2e65de4cf" FOREIGN KEY ("cityId") REFERENCES "city"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_items_search ON public.item USING GIN("searchVector");`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_items_title_trgm ON public.item USING GIN(title gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "item" DROP CONSTRAINT "FK_a5651e043b3d3d79ee2e65de4cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" DROP CONSTRAINT "FK_c0c8f47a702c974a77812169bc2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "item" DROP CONSTRAINT "FK_5369db3bd33839fd3b0dd5525d1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" DROP CONSTRAINT "FK_81e3d379fbc1ed9a9aa319fb51a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" DROP CONSTRAINT "FK_c169da4a873ca09ff3460da64dc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat" DROP CONSTRAINT "FK_ee546e48ed12ba2d307df85cd11"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_619bc7b78eba833d2044153bacc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_71fb36906595c602056d936fc13"`,
    );
    await queryRunner.query(
      `ALTER TABLE "message" DROP CONSTRAINT "FK_bc096b4e18b1f9508197cd98066"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist" DROP CONSTRAINT "FK_f6eeb74a295e2aad03b76b0ba87"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist" DROP CONSTRAINT "FK_2847eb91f63b3c547dbfe80cf16"`,
    );
    await queryRunner.query(
      `ALTER TABLE "city" DROP CONSTRAINT "FK_a702dde63cef536819298d776b5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "region" DROP CONSTRAINT "FK_75ceb9efda6c228a50d88dcdfb8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "image_item" DROP CONSTRAINT "FK_2ba1b7e11a80250ca9a89f309f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" DROP CONSTRAINT "FK_9e5435ba76dbc1f1a0705d4db43"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."user_usertype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_4a8b93627cf3092b5bc84a50e3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_a5651e043b3d3d79ee2e65de4c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c0c8f47a702c974a77812169bc"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_5369db3bd33839fd3b0dd5525d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_efa0888edea58676c238f49796"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ffed4bd61dc9cbc9ded5f05e3d"`,
    );
    await queryRunner.query(`DROP TABLE "item"`);
    await queryRunner.query(
      `DELETE FROM "typeorm_metadata" WHERE "type" = $1 AND "name" = $2 AND "database" = $3 AND "schema" = $4 AND "table" = $5`,
      ['GENERATED_COLUMN', 'searchVector', 'neondb', 'public', 'item'],
    );
    await queryRunner.query(`DROP TYPE "public"."item_status_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_22950249a08297ee33e9883f1e"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_26499c6b47f1dfa19063d9b9e5"`,
    );
    await queryRunner.query(`DROP TABLE "chat"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_93a28d680f3f131dea7415e0bf"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_572f2366d5e28c97e838a58c64"`,
    );
    await queryRunner.query(`DROP TABLE "message"`);
    await queryRunner.query(`DROP TABLE "wishlist"`);
    await queryRunner.query(`DROP TABLE "city"`);
    await queryRunner.query(`DROP TABLE "region"`);
    await queryRunner.query(`DROP TABLE "country"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_2ba1b7e11a80250ca9a89f309f"`,
    );
    await queryRunner.query(`DROP TABLE "image_item"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9e5435ba76dbc1f1a0705d4db4"`,
    );
    await queryRunner.query(`DROP TABLE "category"`);
  }
}

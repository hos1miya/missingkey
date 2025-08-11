export class AdvancedMuting1754836750000 {
		name = 'AdvancedMuting1754836750000';

		async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "advanced_muting" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "muteeId" character varying(32) NOT NULL, "muterId" character varying(32) NOT NULL, "renoteMuted" boolean NOT NULL DEFAULT false, "mediaMuted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_972cb7c02f26cb96d9c2b86daad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a9ccd01acf4bf198d43244ee68" ON "advanced_muting" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_773e6b1f0e965512f86bfa1a88" ON "advanced_muting" ("muteeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_51d548d9de9be841043873e5da" ON "advanced_muting" ("muterId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_55b854a3046b2271c9b391c075" ON "advanced_muting" ("muterId", "muteeId") `);
        await queryRunner.query(`ALTER TABLE "advanced_muting" ADD CONSTRAINT "FK_6b4b0453ffc3998f2efed1c9d62" FOREIGN KEY ("muteeId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "advanced_muting" ADD CONSTRAINT "FK_e4d9ccd92d02e09380235afb2c9" FOREIGN KEY ("muterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`COMMENT ON COLUMN "advanced_muting"."createdAt" IS 'The created date of the Muting.'`);
        await queryRunner.query(`COMMENT ON COLUMN "advanced_muting"."muteeId" IS 'The mutee user ID.'`);
        await queryRunner.query(`COMMENT ON COLUMN "advanced_muting"."muterId" IS 'The muter user ID.'`);
        await queryRunner.query(`COMMENT ON COLUMN "advanced_muting"."renoteMuted" IS 'Renote is muted.'`);
        await queryRunner.query(`COMMENT ON COLUMN "advanced_muting"."mediaMuted" IS 'Media note is muted.'`);
		}
		async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "advanced_muting" DROP CONSTRAINT "FK_e4d9ccd92d02e09380235afb2c9"`);
        await queryRunner.query(`ALTER TABLE "advanced_muting" DROP CONSTRAINT "FK_6b4b0453ffc3998f2efed1c9d62"`);
        await queryRunner.query(`DROP INDEX "IDX_55b854a3046b2271c9b391c075"`);
        await queryRunner.query(`DROP INDEX "IDX_51d548d9de9be841043873e5da"`);
        await queryRunner.query(`DROP INDEX "IDX_773e6b1f0e965512f86bfa1a88"`);
        await queryRunner.query(`DROP INDEX "IDX_a9ccd01acf4bf198d43244ee68"`);
        await queryRunner.query(`DROP TABLE "advanced_muting"`);
		}
}

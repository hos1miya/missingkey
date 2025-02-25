export class AddNoteVia1740493940000 {
	name = 'AddNoteVia1740493940000'

	async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "note" ADD "via" character varying(256)`);
			await queryRunner.query(`COMMENT ON COLUMN "note"."via" IS 'Application used to post.'`);
	}

	async down(queryRunner) {
			await queryRunner.query(`COMMENT ON COLUMN "note"."via" IS 'Application used to post.'`);
			await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "via"`);
	}
}

export class EmojiErrorImageUrl1748843830000 {
		name = 'EmojiErrorImageUrl1748843830000'

		async up(queryRunner) {
				await queryRunner.query(`ALTER TABLE "meta" ADD "emojiErrorImageUrl" character varying(1024)`);
		}

		async down(queryRunner) {
				await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "emojiErrorImageUrl"`);
		}
}

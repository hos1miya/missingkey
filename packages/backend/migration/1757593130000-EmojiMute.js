/*
 * SPDX-FileCopyrightText: hos1miya
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class EmojiMute1757593130000 {
	name = 'EmojiMute1757593130000';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_profile" ADD "mutedEmojis" jsonb NOT NULL DEFAULT '[]'`);
	}
	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "mutedEmojis"`);
	}
}

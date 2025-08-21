/*
 * SPDX-FileCopyrightText: hos1miya
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SoftDelete1755659650000 {
    name = 'SoftDelete1755659650000';

    async up(queryRunner) {
        // 1. isDeleted カラム追加
        await queryRunner.query(`
            ALTER TABLE "note"
            ADD COLUMN "isDeleted" boolean NOT NULL DEFAULT false
        `);

        // 2. deletedAt カラム追加（削除日時を記録）
        await queryRunner.query(`
            ALTER TABLE "note"
            ADD COLUMN "deletedAt" TIMESTAMP WITH TIME ZONE
        `);

        // 3. 既存の外部キー制約を削除（CASCADE を外す）
        await queryRunner.query(`
            ALTER TABLE "note" DROP CONSTRAINT "FK_17cb3553c700a4985dff5a30ff5"
        `);
        await queryRunner.query(`
            ALTER TABLE "note" DROP CONSTRAINT "FK_52ccc804d7c69037d558bac4c96"
        `);

        // 4. 外部キーを CASCADE なしで再作成（参照先が消えても削除されない）
        await queryRunner.query(`
            ALTER TABLE "note"
            ADD CONSTRAINT "FK_17cb3553c700a4985dff5a30ff5"
            FOREIGN KEY ("replyId") REFERENCES "note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "note"
            ADD CONSTRAINT "FK_52ccc804d7c69037d558bac4c96"
            FOREIGN KEY ("renoteId") REFERENCES "note"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    async down(queryRunner) {
        // 逆順に戻す

        // 1. 外部キーを CASCADE に戻す
        await queryRunner.query(`
            ALTER TABLE "note" DROP CONSTRAINT "FK_17cb3553c700a4985dff5a30ff5"
        `);
        await queryRunner.query(`
            ALTER TABLE "note" DROP CONSTRAINT "FK_52ccc804d7c69037d558bac4c96"
        `);
        await queryRunner.query(`
            ALTER TABLE "note"
            ADD CONSTRAINT "FK_17cb3553c700a4985dff5a30ff5"
            FOREIGN KEY ("replyId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "note"
            ADD CONSTRAINT "FK_52ccc804d7c69037d558bac4c96"
            FOREIGN KEY ("renoteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
				

        // 2. deletedAt カラム削除
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "deletedAt"`);

        // 3. isDeleted カラム削除
        await queryRunner.query(`
            ALTER TABLE "note"
            DROP COLUMN "isDeleted"
        `);
    }
}

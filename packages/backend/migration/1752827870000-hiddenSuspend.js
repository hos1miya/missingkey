export class HiddenSuspend1752827870000 {
		name = 'HiddenSuspend1752827870000'

		async up(queryRunner) {
				await queryRunner.query(`ALTER TABLE "instance" ADD "hiddenSuspended" boolean NOT NULL DEFAULT false`, undefined);
				await queryRunner.query(`CREATE INDEX "IDX_563e4c71998ade39c2d61e9336" ON "instance" ("hiddenSuspended") `, undefined);
		}
		async down(queryRunner) {
				await queryRunner.query(`DROP INDEX "IDX_563e4c71998ade39c2d61e9336"`, undefined);
				await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "hiddenSuspended"`, undefined);
		}
}

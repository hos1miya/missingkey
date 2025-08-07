export class PrivateActivities1754579730000 {
		name = 'PrivateActivities1754579730000';

		async up(queryRunner) {
				await queryRunner.query(`ALTER TABLE "user_profile" ADD "privateActivities" boolean NOT NULL DEFAULT false`);
		}
		async down(queryRunner) {
				await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "privateActivities"`);
		}
}

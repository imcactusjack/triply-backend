import { MigrationInterface, QueryRunner } from "typeorm";

export class FixScheduleEntity1765804286238 implements MigrationInterface {
    name = 'FixScheduleEntity1765804286238'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`schedule\` DROP COLUMN \`recommended_destinations\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`schedule\` ADD \`recommended_destinations\` text NOT NULL COMMENT '추천 여행지 목록(JSON 문자열)'`);
    }

}

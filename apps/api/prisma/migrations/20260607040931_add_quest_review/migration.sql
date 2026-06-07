-- AlterTable
ALTER TABLE `quests` ADD COLUMN `approved_at` DATETIME(3) NULL,
    ADD COLUMN `published_at` DATETIME(3) NULL,
    ADD COLUMN `reject_reason` VARCHAR(512) NULL,
    ADD COLUMN `submitted_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `quest_audit_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `quest_id` BIGINT UNSIGNED NOT NULL,
    `operator_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(64) NOT NULL,
    `from_status` VARCHAR(32) NULL,
    `to_status` VARCHAR(32) NULL,
    `remark` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `quest_audit_logs_quest_id_idx`(`quest_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `quest_audit_logs` ADD CONSTRAINT `quest_audit_logs_quest_id_fkey` FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

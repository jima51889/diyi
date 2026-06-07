-- AlterTable
ALTER TABLE `quests` ADD COLUMN `city` VARCHAR(64) NOT NULL DEFAULT '重庆',
    ADD COLUMN `commission_rule_id` BIGINT UNSIGNED NULL,
    ADD COLUMN `config` JSON NULL,
    ADD COLUMN `creator_id` BIGINT UNSIGNED NULL,
    ADD COLUMN `season` VARCHAR(32) NULL;

-- CreateTable
CREATE TABLE `creators` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `display_name` VARCHAR(80) NOT NULL,
    `real_name` VARCHAR(80) NULL,
    `phone` VARCHAR(32) NULL,
    `id_card_no` VARCHAR(64) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `reject_reason` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `creators_user_id_key`(`user_id`),
    INDEX `creators_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `creator_profiles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `creator_id` BIGINT UNSIGNED NOT NULL,
    `bio` TEXT NULL,
    `city` VARCHAR(64) NULL,
    `portfolio_url` VARCHAR(512) NULL,
    `settlement_account` JSON NULL,
    `risk_note` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `creator_profiles_creator_id_key`(`creator_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission_rules` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(80) NOT NULL,
    `target_type` VARCHAR(32) NOT NULL DEFAULT 'quest',
    `platform_rate` DECIMAL(5, 2) NOT NULL DEFAULT 30.00,
    `creator_rate` DECIMAL(5, 2) NOT NULL DEFAULT 70.00,
    `npc_budget_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `payment_fee_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0.60,
    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `commission_rules_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission_records` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT UNSIGNED NOT NULL,
    `quest_id` BIGINT UNSIGNED NOT NULL,
    `creator_id` BIGINT UNSIGNED NULL,
    `rule_id` BIGINT UNSIGNED NULL,
    `gross_amount` DECIMAL(10, 2) NOT NULL,
    `payment_fee_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `platform_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `creator_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `frozen_reason` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `settled_at` DATETIME(3) NULL,

    UNIQUE INDEX `commission_records_order_id_key`(`order_id`),
    INDEX `commission_records_creator_id_idx`(`creator_id`),
    INDEX `commission_records_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settlement_batches` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `batch_no` VARCHAR(64) NOT NULL,
    `target_type` VARCHAR(32) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
    `total_amount` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    `record_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `operator_id` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approved_at` DATETIME(3) NULL,
    `paid_at` DATETIME(3) NULL,

    UNIQUE INDEX `settlement_batches_batch_no_key`(`batch_no`),
    INDEX `settlement_batches_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `settlement_records` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `batch_id` BIGINT UNSIGNED NULL,
    `target_type` VARCHAR(32) NOT NULL,
    `target_id` BIGINT UNSIGNED NOT NULL,
    `source_type` VARCHAR(32) NOT NULL,
    `source_id` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'payable',
    `paid_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `settlement_records_target_type_target_id_idx`(`target_type`, `target_id`),
    INDEX `settlement_records_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `npc_profiles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `display_name` VARCHAR(80) NOT NULL,
    `real_name` VARCHAR(80) NULL,
    `phone` VARCHAR(32) NULL,
    `city` VARCHAR(64) NOT NULL DEFAULT '重庆',
    `skills` JSON NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `reject_reason` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `npc_profiles_user_id_key`(`user_id`),
    INDEX `npc_profiles_city_status_idx`(`city`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `npc_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `quest_id` BIGINT UNSIGNED NULL,
    `node_id` BIGINT UNSIGNED NULL,
    `title` VARCHAR(120) NOT NULL,
    `city` VARCHAR(64) NOT NULL DEFAULT '重庆',
    `location_name` VARCHAR(120) NULL,
    `lat` DECIMAL(10, 6) NULL,
    `lng` DECIMAL(10, 6) NULL,
    `service_start` DATETIME(3) NULL,
    `service_end` DATETIME(3) NULL,
    `recruit_count` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `role_requirement` TEXT NULL,
    `service_script` TEXT NULL,
    `acceptance_standard` TEXT NULL,
    `commission_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
    `created_by` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `npc_jobs_city_status_idx`(`city`, `status`),
    INDEX `npc_jobs_quest_id_node_id_idx`(`quest_id`, `node_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `npc_job_applications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_id` BIGINT UNSIGNED NOT NULL,
    `npc_id` BIGINT UNSIGNED NOT NULL,
    `message` VARCHAR(512) NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `reviewed_by` BIGINT UNSIGNED NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `npc_job_applications_status_idx`(`status`),
    UNIQUE INDEX `npc_job_applications_job_id_npc_id_key`(`job_id`, `npc_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `npc_assignments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `job_id` BIGINT UNSIGNED NOT NULL,
    `npc_id` BIGINT UNSIGNED NOT NULL,
    `application_id` BIGINT UNSIGNED NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'assigned',
    `commission_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,

    INDEX `npc_assignments_job_id_idx`(`job_id`),
    INDEX `npc_assignments_npc_id_status_idx`(`npc_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `npc_checkins` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `assignment_id` BIGINT UNSIGNED NOT NULL,
    `lat` DECIMAL(10, 6) NULL,
    `lng` DECIMAL(10, 6) NULL,
    `photo_url` VARCHAR(512) NULL,
    `checked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `npc_checkins_assignment_id_idx`(`assignment_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `npc_submissions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `assignment_id` BIGINT UNSIGNED NOT NULL,
    `proof_type` VARCHAR(32) NOT NULL DEFAULT 'photo',
    `proof_payload` JSON NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `review_remark` VARCHAR(512) NULL,
    `reviewed_by` BIGINT UNSIGNED NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `npc_submissions_assignment_id_idx`(`assignment_id`),
    INDEX `npc_submissions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `npc_settlements` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `assignment_id` BIGINT UNSIGNED NOT NULL,
    `npc_id` BIGINT UNSIGNED NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'pending',
    `frozen_reason` VARCHAR(512) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `settled_at` DATETIME(3) NULL,

    UNIQUE INDEX `npc_settlements_assignment_id_key`(`assignment_id`),
    INDEX `npc_settlements_npc_id_status_idx`(`npc_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complaints` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `target_type` VARCHAR(32) NOT NULL,
    `target_id` BIGINT UNSIGNED NOT NULL,
    `content` TEXT NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'open',
    `handled_by` BIGINT UNSIGNED NULL,
    `handled_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `complaints_target_type_target_id_idx`(`target_type`, `target_id`),
    INDEX `complaints_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `risk_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `target_type` VARCHAR(32) NOT NULL,
    `target_id` BIGINT UNSIGNED NOT NULL,
    `risk_type` VARCHAR(64) NOT NULL,
    `level` VARCHAR(32) NOT NULL DEFAULT 'notice',
    `message` VARCHAR(512) NOT NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `risk_logs_target_type_target_id_idx`(`target_type`, `target_id`),
    INDEX `risk_logs_level_idx`(`level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `quests_creator_id_idx` ON `quests`(`creator_id`);

-- CreateIndex
CREATE INDEX `quests_commission_rule_id_idx` ON `quests`(`commission_rule_id`);

-- AddForeignKey
ALTER TABLE `quests` ADD CONSTRAINT `quests_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quests` ADD CONSTRAINT `quests_commission_rule_id_fkey` FOREIGN KEY (`commission_rule_id`) REFERENCES `commission_rules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `creators` ADD CONSTRAINT `creators_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `creator_profiles` ADD CONSTRAINT `creator_profiles_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_records` ADD CONSTRAINT `commission_records_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_records` ADD CONSTRAINT `commission_records_quest_id_fkey` FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_records` ADD CONSTRAINT `commission_records_creator_id_fkey` FOREIGN KEY (`creator_id`) REFERENCES `creators`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_records` ADD CONSTRAINT `commission_records_rule_id_fkey` FOREIGN KEY (`rule_id`) REFERENCES `commission_rules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `settlement_records` ADD CONSTRAINT `settlement_records_batch_id_fkey` FOREIGN KEY (`batch_id`) REFERENCES `settlement_batches`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `npc_profiles` ADD CONSTRAINT `npc_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `npc_jobs` ADD CONSTRAINT `npc_jobs_quest_id_fkey` FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `npc_jobs` ADD CONSTRAINT `npc_jobs_node_id_fkey` FOREIGN KEY (`node_id`) REFERENCES `quest_nodes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `npc_job_applications` ADD CONSTRAINT `npc_job_applications_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `npc_jobs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `npc_job_applications` ADD CONSTRAINT `npc_job_applications_npc_id_fkey` FOREIGN KEY (`npc_id`) REFERENCES `npc_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `npc_assignments` ADD CONSTRAINT `npc_assignments_job_id_fkey` FOREIGN KEY (`job_id`) REFERENCES `npc_jobs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `npc_assignments` ADD CONSTRAINT `npc_assignments_npc_id_fkey` FOREIGN KEY (`npc_id`) REFERENCES `npc_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `npc_assignments` ADD CONSTRAINT `npc_assignments_application_id_fkey` FOREIGN KEY (`application_id`) REFERENCES `npc_job_applications`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `npc_checkins` ADD CONSTRAINT `npc_checkins_assignment_id_fkey` FOREIGN KEY (`assignment_id`) REFERENCES `npc_assignments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `npc_submissions` ADD CONSTRAINT `npc_submissions_assignment_id_fkey` FOREIGN KEY (`assignment_id`) REFERENCES `npc_assignments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `npc_settlements` ADD CONSTRAINT `npc_settlements_assignment_id_fkey` FOREIGN KEY (`assignment_id`) REFERENCES `npc_assignments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `npc_settlements` ADD CONSTRAINT `npc_settlements_npc_id_fkey` FOREIGN KEY (`npc_id`) REFERENCES `npc_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `complaints` ADD CONSTRAINT `complaints_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

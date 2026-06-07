-- CreateTable
CREATE TABLE `city_events` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `city` VARCHAR(64) NOT NULL DEFAULT '重庆',
    `title` VARCHAR(120) NOT NULL,
    `event_type` VARCHAR(32) NOT NULL DEFAULT 'daily',
    `rarity` VARCHAR(32) NOT NULL DEFAULT 'normal',
    `summary` TEXT NOT NULL,
    `cover` VARCHAR(512) NULL,
    `reward` JSON NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'online',
    `starts_at` DATETIME(3) NOT NULL,
    `ends_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `city_events_city_status_starts_at_ends_at_idx`(`city`, `status`, `starts_at`, `ends_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_tasks` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `event_id` BIGINT UNSIGNED NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `task_type` VARCHAR(32) NOT NULL DEFAULT 'qa',
    `content` TEXT NOT NULL,
    `location_name` VARCHAR(120) NULL,
    `lat` DECIMAL(10, 6) NULL,
    `lng` DECIMAL(10, 6) NULL,
    `radius` INTEGER UNSIGNED NULL,
    `answer` VARCHAR(255) NULL,
    `payload` JSON NULL,
    `reward` JSON NULL,
    `weight` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_tasks_event_id_idx`(`event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `player_roles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(32) NOT NULL,
    `name` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `ability` JSON NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `player_roles_code_key`(`code`),
    INDEX `player_roles_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_event_assignments` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `event_id` BIGINT UNSIGNED NOT NULL,
    `task_id` BIGINT UNSIGNED NOT NULL,
    `role_id` BIGINT UNSIGNED NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'claimed',
    `progress` JSON NULL,
    `share_payload` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,

    INDEX `user_event_assignments_event_id_status_idx`(`event_id`, `status`),
    UNIQUE INDEX `user_event_assignments_user_id_event_id_key`(`user_id`, `event_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clue_drops` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `city` VARCHAR(64) NOT NULL DEFAULT '重庆',
    `title` VARCHAR(120) NOT NULL,
    `location_name` VARCHAR(120) NOT NULL,
    `partner_name` VARCHAR(120) NULL,
    `clue_type` VARCHAR(32) NOT NULL DEFAULT 'envelope',
    `lat` DECIMAL(10, 6) NULL,
    `lng` DECIMAL(10, 6) NULL,
    `payload` JSON NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `clue_drops_city_status_idx`(`city`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `event_tasks` ADD CONSTRAINT `event_tasks_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `city_events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_event_assignments` ADD CONSTRAINT `user_event_assignments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_event_assignments` ADD CONSTRAINT `user_event_assignments_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `city_events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_event_assignments` ADD CONSTRAINT `user_event_assignments_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `event_tasks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_event_assignments` ADD CONSTRAINT `user_event_assignments_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `player_roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

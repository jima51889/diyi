CREATE TABLE `mce_templates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `template_type` VARCHAR(32) NOT NULL,
    `code` VARCHAR(64) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `audience` VARCHAR(120) NULL,
    `description` TEXT NULL,
    `config` JSON NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `mce_templates_code_key`(`code`),
    INDEX `mce_templates_template_type_status_idx`(`template_type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

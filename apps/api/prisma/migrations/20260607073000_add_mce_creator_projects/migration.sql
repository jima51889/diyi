CREATE TABLE `mce_creator_projects` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `creator_id` BIGINT UNSIGNED NULL,
  `quest_id` BIGINT UNSIGNED NULL,
  `city` VARCHAR(64) NOT NULL,
  `title` VARCHAR(120) NOT NULL,
  `target_audience` VARCHAR(120) NULL,
  `route_template_id` BIGINT UNSIGNED NULL,
  `story_template_id` BIGINT UNSIGNED NULL,
  `challenge_template_ids` JSON NULL,
  `interaction_template_ids` JSON NULL,
  `reward_template_ids` JSON NULL,
  `experience_ratio` JSON NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'draft',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  INDEX `mce_creator_projects_creator_id_status_idx` (`creator_id`, `status`),
  INDEX `mce_creator_projects_city_status_idx` (`city`, `status`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

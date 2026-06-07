-- MCE V1.0 extension draft
-- Mystery City Engine: standardized creator templates and review scoring.

CREATE TABLE mce_templates (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  template_type VARCHAR(32) NOT NULL COMMENT 'story, challenge, interaction, reward, route',
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  audience VARCHAR(120) NULL,
  description TEXT NULL,
  config JSON NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mce_templates_type_status (template_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE mce_creator_projects (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  creator_id BIGINT UNSIGNED NOT NULL,
  quest_id BIGINT UNSIGNED NULL,
  city VARCHAR(64) NOT NULL,
  title VARCHAR(120) NOT NULL,
  target_audience VARCHAR(120) NULL,
  route_template_id BIGINT UNSIGNED NULL,
  story_template_id BIGINT UNSIGNED NULL,
  challenge_template_ids JSON NULL,
  interaction_template_ids JSON NULL,
  reward_template_ids JSON NULL,
  experience_ratio JSON NULL COMMENT 'cityExploration/challengeMechanism/realHumanInteraction/storyImmersion',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_mce_creator_projects_creator_status (creator_id, status),
  INDEX idx_mce_creator_projects_city_status (city, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE mce_project_scores (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  story_score INT UNSIGNED NOT NULL DEFAULT 0,
  challenge_score INT UNSIGNED NOT NULL DEFAULT 0,
  interaction_score INT UNSIGNED NOT NULL DEFAULT 0,
  share_score INT UNSIGNED NOT NULL DEFAULT 0,
  total_score INT UNSIGNED NOT NULL DEFAULT 0,
  traffic_level VARCHAR(32) NOT NULL DEFAULT 'none',
  review_notes TEXT NULL,
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mce_project_scores_project (project_id),
  INDEX idx_mce_project_scores_total (total_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE mce_project_audit_items (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  project_id BIGINT UNSIGNED NOT NULL,
  audit_type VARCHAR(32) NOT NULL COMMENT 'safety, legal, executable, experience, interaction, share',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  note VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mce_project_audit_items_project (project_id),
  INDEX idx_mce_project_audit_items_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

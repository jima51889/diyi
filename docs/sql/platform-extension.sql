-- 城市探秘平台版扩展表草案
-- 说明：本文件用于 V2/V3 数据库设计评审，暂不作为 V1 必跑迁移。

ALTER TABLE quests
  ADD COLUMN creator_id BIGINT UNSIGNED NULL AFTER id,
  ADD COLUMN commission_rule_id BIGINT UNSIGNED NULL AFTER price,
  ADD COLUMN city VARCHAR(64) NOT NULL DEFAULT '重庆' AFTER description,
  ADD COLUMN season VARCHAR(32) NULL AFTER city,
  ADD COLUMN config JSON NULL AFTER reward,
  ADD INDEX idx_quests_creator (creator_id),
  ADD INDEX idx_quests_commission_rule (commission_rule_id);

CREATE TABLE creators (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  real_name VARCHAR(80),
  phone VARCHAR(32),
  id_card_no VARCHAR(64),
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  reject_reason VARCHAR(512),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_creators_user (user_id),
  INDEX idx_creators_status (status),
  CONSTRAINT fk_creators_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE creator_profiles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  creator_id BIGINT UNSIGNED NOT NULL,
  bio TEXT,
  city VARCHAR(64),
  portfolio_url VARCHAR(512),
  settlement_account JSON,
  risk_note VARCHAR(512),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_creator_profiles_creator (creator_id),
  CONSTRAINT fk_creator_profiles_creator FOREIGN KEY (creator_id) REFERENCES creators(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE commission_rules (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  target_type VARCHAR(32) NOT NULL DEFAULT 'quest',
  platform_rate DECIMAL(5,2) NOT NULL DEFAULT 30.00,
  creator_rate DECIMAL(5,2) NOT NULL DEFAULT 70.00,
  npc_budget_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  payment_fee_rate DECIMAL(5,2) NOT NULL DEFAULT 0.60,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_commission_rules_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE commission_records (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  quest_id BIGINT UNSIGNED NOT NULL,
  creator_id BIGINT UNSIGNED,
  rule_id BIGINT UNSIGNED,
  gross_amount DECIMAL(10,2) NOT NULL,
  payment_fee_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  platform_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  creator_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  frozen_reason VARCHAR(512),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at DATETIME,
  UNIQUE KEY uk_commission_records_order (order_id),
  INDEX idx_commission_records_creator (creator_id),
  INDEX idx_commission_records_status (status),
  CONSTRAINT fk_commission_records_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_commission_records_quest FOREIGN KEY (quest_id) REFERENCES quests(id),
  CONSTRAINT fk_commission_records_creator FOREIGN KEY (creator_id) REFERENCES creators(id),
  CONSTRAINT fk_commission_records_rule FOREIGN KEY (rule_id) REFERENCES commission_rules(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE settlement_batches (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  batch_no VARCHAR(64) NOT NULL UNIQUE,
  target_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  record_count INT UNSIGNED NOT NULL DEFAULT 0,
  operator_id BIGINT UNSIGNED,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at DATETIME,
  paid_at DATETIME,
  INDEX idx_settlement_batches_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE settlement_records (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  batch_id BIGINT UNSIGNED,
  target_type VARCHAR(32) NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  source_type VARCHAR(32) NOT NULL,
  source_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'payable',
  paid_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_settlement_records_target (target_type, target_id),
  INDEX idx_settlement_records_status (status),
  CONSTRAINT fk_settlement_records_batch FOREIGN KEY (batch_id) REFERENCES settlement_batches(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE npc_profiles (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  display_name VARCHAR(80) NOT NULL,
  real_name VARCHAR(80),
  phone VARCHAR(32),
  city VARCHAR(64) NOT NULL DEFAULT '重庆',
  skills JSON,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  reject_reason VARCHAR(512),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_npc_profiles_user (user_id),
  INDEX idx_npc_profiles_city_status (city, status),
  CONSTRAINT fk_npc_profiles_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE npc_jobs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  quest_id BIGINT UNSIGNED,
  node_id BIGINT UNSIGNED,
  title VARCHAR(120) NOT NULL,
  city VARCHAR(64) NOT NULL DEFAULT '重庆',
  location_name VARCHAR(120),
  lat DECIMAL(10,6),
  lng DECIMAL(10,6),
  service_start DATETIME,
  service_end DATETIME,
  recruit_count INT UNSIGNED NOT NULL DEFAULT 1,
  role_requirement TEXT,
  service_script TEXT,
  acceptance_standard TEXT,
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  created_by BIGINT UNSIGNED,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_npc_jobs_city_status (city, status),
  INDEX idx_npc_jobs_quest_node (quest_id, node_id),
  CONSTRAINT fk_npc_jobs_quest FOREIGN KEY (quest_id) REFERENCES quests(id),
  CONSTRAINT fk_npc_jobs_node FOREIGN KEY (node_id) REFERENCES quest_nodes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE npc_job_applications (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  job_id BIGINT UNSIGNED NOT NULL,
  npc_id BIGINT UNSIGNED NOT NULL,
  message VARCHAR(512),
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  reviewed_by BIGINT UNSIGNED,
  reviewed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_npc_job_applications_job_npc (job_id, npc_id),
  INDEX idx_npc_job_applications_status (status),
  CONSTRAINT fk_npc_job_applications_job FOREIGN KEY (job_id) REFERENCES npc_jobs(id),
  CONSTRAINT fk_npc_job_applications_npc FOREIGN KEY (npc_id) REFERENCES npc_profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE npc_assignments (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  job_id BIGINT UNSIGNED NOT NULL,
  npc_id BIGINT UNSIGNED NOT NULL,
  application_id BIGINT UNSIGNED,
  status VARCHAR(32) NOT NULL DEFAULT 'assigned',
  commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  INDEX idx_npc_assignments_job (job_id),
  INDEX idx_npc_assignments_npc_status (npc_id, status),
  CONSTRAINT fk_npc_assignments_job FOREIGN KEY (job_id) REFERENCES npc_jobs(id),
  CONSTRAINT fk_npc_assignments_npc FOREIGN KEY (npc_id) REFERENCES npc_profiles(id),
  CONSTRAINT fk_npc_assignments_application FOREIGN KEY (application_id) REFERENCES npc_job_applications(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE npc_checkins (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT UNSIGNED NOT NULL,
  lat DECIMAL(10,6),
  lng DECIMAL(10,6),
  photo_url VARCHAR(512),
  checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_npc_checkins_assignment (assignment_id),
  CONSTRAINT fk_npc_checkins_assignment FOREIGN KEY (assignment_id) REFERENCES npc_assignments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE npc_submissions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT UNSIGNED NOT NULL,
  proof_type VARCHAR(32) NOT NULL DEFAULT 'photo',
  proof_payload JSON,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  review_remark VARCHAR(512),
  reviewed_by BIGINT UNSIGNED,
  reviewed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_npc_submissions_assignment (assignment_id),
  INDEX idx_npc_submissions_status (status),
  CONSTRAINT fk_npc_submissions_assignment FOREIGN KEY (assignment_id) REFERENCES npc_assignments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE npc_settlements (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  assignment_id BIGINT UNSIGNED NOT NULL,
  npc_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  frozen_reason VARCHAR(512),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at DATETIME,
  UNIQUE KEY uk_npc_settlements_assignment (assignment_id),
  INDEX idx_npc_settlements_npc_status (npc_id, status),
  CONSTRAINT fk_npc_settlements_assignment FOREIGN KEY (assignment_id) REFERENCES npc_assignments(id),
  CONSTRAINT fk_npc_settlements_npc FOREIGN KEY (npc_id) REFERENCES npc_profiles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE complaints (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  target_type VARCHAR(32) NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  handled_by BIGINT UNSIGNED,
  handled_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_complaints_target (target_type, target_id),
  INDEX idx_complaints_status (status),
  CONSTRAINT fk_complaints_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE risk_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  target_type VARCHAR(32) NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  risk_type VARCHAR(64) NOT NULL,
  level VARCHAR(32) NOT NULL DEFAULT 'notice',
  message VARCHAR(512) NOT NULL,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_risk_logs_target (target_type, target_id),
  INDEX idx_risk_logs_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

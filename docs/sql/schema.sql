CREATE TABLE users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL UNIQUE,
  nickname VARCHAR(64),
  avatar VARCHAR(512),
  phone VARCHAR(32),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quests (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  cover VARCHAR(512),
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  duration INT UNSIGNED NOT NULL DEFAULT 0,
  distance DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  difficulty VARCHAR(32) NOT NULL DEFAULT 'easy',
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  reject_reason VARCHAR(512),
  submitted_at DATETIME,
  approved_at DATETIME,
  published_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_quests_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quest_audit_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  quest_id BIGINT UNSIGNED NOT NULL,
  operator_id BIGINT UNSIGNED,
  action VARCHAR(64) NOT NULL,
  from_status VARCHAR(32),
  to_status VARCHAR(32),
  remark VARCHAR(512),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_quest_audit_logs_quest (quest_id),
  CONSTRAINT fk_quest_audit_logs_quest FOREIGN KEY (quest_id) REFERENCES quests(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quest_nodes (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  quest_id BIGINT UNSIGNED NOT NULL,
  node_index INT UNSIGNED NOT NULL,
  node_type VARCHAR(32) NOT NULL,
  title VARCHAR(120) NOT NULL,
  content TEXT,
  lat DECIMAL(10,6),
  lng DECIMAL(10,6),
  radius INT UNSIGNED,
  answer VARCHAR(255),
  reward JSON,
  next_node BIGINT UNSIGNED,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_quest_node_index (quest_id, node_index),
  INDEX idx_quest_nodes_quest (quest_id),
  CONSTRAINT fk_quest_nodes_quest FOREIGN KEY (quest_id) REFERENCES quests(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  quest_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  pay_time DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_quest (quest_id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_orders_quest FOREIGN KEY (quest_id) REFERENCES quests(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_progress (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  quest_id BIGINT UNSIGNED NOT NULL,
  current_node BIGINT UNSIGNED,
  progress JSON,
  status VARCHAR(32) NOT NULL DEFAULT 'not_started',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_progress (user_id, quest_id),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_progress_quest FOREIGN KEY (quest_id) REFERENCES quests(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE finish_records (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  quest_id BIGINT UNSIGNED NOT NULL,
  finish_time DATETIME NOT NULL,
  duration INT UNSIGNED NOT NULL DEFAULT 0,
  certificate_url VARCHAR(512),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_finish_user (user_id),
  CONSTRAINT fk_finish_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_finish_quest FOREIGN KEY (quest_id) REFERENCES quests(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE admins (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

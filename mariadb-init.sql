-- STEMgraph database schema
-- Applied automatically on first MariaDB container start.
-- Re-running with an existing volume has no effect (IF NOT EXISTS :) ).

-- Progress tracking: stores per-user which nodes are completed or on the to-do list
CREATE TABLE IF NOT EXISTS user_nodes (
    user_id VARCHAR(36)  NOT NULL,
    node_id VARCHAR(255) NOT NULL,
    type    ENUM('todo', 'completed') NOT NULL,
    PRIMARY KEY (user_id, node_id)
);

-- Learning paths: ordered node selections created by teachers
CREATE TABLE IF NOT EXISTS learning_paths (
    id         VARCHAR(36)  NOT NULL,
    name       VARCHAR(255) NOT NULL,
    creator_id VARCHAR(36)  NOT NULL,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Node assignments to learning paths (m:n), ordered by position
CREATE TABLE IF NOT EXISTS learning_path_nodes (
    path_id  VARCHAR(36)  NOT NULL,
    node_id  VARCHAR(255) NOT NULL,
    position INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (path_id, node_id),
    FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE CASCADE
);

-- Example learning paths (creator_id = system user, publicly visible to all)
INSERT IGNORE INTO learning_paths (id, name, creator_id) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Terminal Overlord', '00000000-0000-0000-0000-000000000001'),
  ('11111111-0000-0000-0000-000000000002', 'Fork Yeah!',        '00000000-0000-0000-0000-000000000001');

INSERT IGNORE INTO learning_path_nodes (path_id, node_id, position) VALUES
  -- Terminal Overlord: Shell fundamentals
  ('11111111-0000-0000-0000-000000000001', 'c25a4d2d-dd76-4b3c-868f-aaef175c0f89',  0),
  ('11111111-0000-0000-0000-000000000001', 'e46ffb8b-00d6-44a2-ad40-552ea03b4e3a',  1),
  ('11111111-0000-0000-0000-000000000001', '341f55bf-db2f-4c98-b7c1-b6b3e6b75ddb',  2),
  ('11111111-0000-0000-0000-000000000001', 'b668e389-98db-4777-bc4c-190de535836c',  3),
  ('11111111-0000-0000-0000-000000000001', '8acee03e-6020-4e3b-86b7-d7747b216258',  4),
  ('11111111-0000-0000-0000-000000000001', '3193c311-8662-4aed-a77a-d595bbf1c1e4',  5),
  ('11111111-0000-0000-0000-000000000001', '2c7334b3-b07d-48d6-a562-79072d8e166e',  6),
  ('11111111-0000-0000-0000-000000000001', '7f50ba23-f5a6-4bc7-887f-ed9247220544',  7),
  ('11111111-0000-0000-0000-000000000001', 'e2b7c9f1-4d2a-4a3e-9f1b-2c3d4e5f6a7b',  8),
  ('11111111-0000-0000-0000-000000000001', 'be5c2a4a-756f-4303-961c-e616e0cdab11',  9),
  -- Fork Yeah!: Git & GitHub workflow
  ('11111111-0000-0000-0000-000000000002', 'e46ffb8b-00d6-44a2-ad40-552ea03b4e3a',  0),
  ('11111111-0000-0000-0000-000000000002', '341f55bf-db2f-4c98-b7c1-b6b3e6b75ddb',  1),
  ('11111111-0000-0000-0000-000000000002', '3193c311-8662-4aed-a77a-d595bbf1c1e4',  2),
  ('11111111-0000-0000-0000-000000000002', '2c7334b3-b07d-48d6-a562-79072d8e166e',  3),
  ('11111111-0000-0000-0000-000000000002', '474307f2-a30c-4639-9379-298bf1a4c00b',  4),
  ('11111111-0000-0000-0000-000000000002', '2f4d1f4f-a53b-485e-a290-2da6b69353b2',  5),
  ('11111111-0000-0000-0000-000000000002', '35eb6085-0a91-4740-a611-b7f7077e91fc',  6),
  ('11111111-0000-0000-0000-000000000002', '8c79cd1f-f6bd-4930-b62c-b2970c412735',  7),
  ('11111111-0000-0000-0000-000000000002', '650920e2-edbe-4dc5-8a0c-96e7d76344e3',  8),
  ('11111111-0000-0000-0000-000000000002', '722698f1-d030-4813-ab8a-b9fd0c92bf27',  9),
  ('11111111-0000-0000-0000-000000000002', '60b25ba1-4dd1-4ab9-a0b4-95408b08f6dc', 10);

-- Event tracking: logs user interactions for admin analytics
CREATE TABLE IF NOT EXISTS frontend_events (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    VARCHAR(36)  NOT NULL,
    event_type VARCHAR(50)  NOT NULL,
    node_id    VARCHAR(255) DEFAULT NULL,
    path_id    VARCHAR(36)  DEFAULT NULL,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);

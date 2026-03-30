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

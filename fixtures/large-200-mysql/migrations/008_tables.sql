CREATE TABLE `batch_asset_175` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `payment_0` char(36),
  `event_1` bigint(20) NOT NULL,
  `claim_2` char(36),
  `policy_3` longtext NOT NULL,
  `zone_4` date,
  `note_5` date,
  `order_6` varchar(120) NOT NULL,
  `policy_7` varchar(120),
  `invoice_8` date NOT NULL,
  `audit_ref_0` int(11) DEFAULT NULL,
  KEY `batch_asset_175_audit_ref_0_idx` (`audit_ref_0`),
  CONSTRAINT `batch_asset_175_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_batch_93` (`id`),
  `event_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `batch_asset_175_event_ref_1_fk` FOREIGN KEY (`event_ref_1`) REFERENCES `event_asset_21` (`id`),
  UNIQUE KEY `batch_asset_175_u2` (`payment_0`, `event_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `order_lease_176` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `claim_0` char(36),
  `grant_1` bigint(20),
  `grant_2` date,
  `audit_3` date NOT NULL,
  `session_ref_0` int(11) DEFAULT NULL,
  KEY `order_lease_176_session_ref_0_idx` (`session_ref_0`),
  CONSTRAINT `order_lease_176_session_ref_0_fk` FOREIGN KEY (`session_ref_0`) REFERENCES `session_invoice_172` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_grant_177` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `ticket_0` longtext,
  `shipment_1` varchar(120),
  `audit_2` int(11),
  `asset_3` datetime NOT NULL,
  `zone_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `audit_grant_177_zone_ref_0_fk` FOREIGN KEY (`zone_ref_0`) REFERENCES `zone_grant_137` (`id`),
  `lease_ref_1` int(11) DEFAULT NULL,
  KEY `audit_grant_177_lease_ref_1_idx` (`lease_ref_1`),
  CONSTRAINT `audit_grant_177_lease_ref_1_fk` FOREIGN KEY (`lease_ref_1`) REFERENCES `lease_event_114` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `ticket_session_178` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `policy_0` varchar(120),
  `batch_1` datetime,
  `audit_2` bigint(20),
  `lease_3` int(11) NOT NULL,
  `zone_4` char(36) NOT NULL,
  `note_ref_0` int(11) DEFAULT NULL,
  KEY `ticket_session_178_note_ref_0_idx` (`note_ref_0`),
  CONSTRAINT `ticket_session_178_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_shipment_143` (`id`),
  `audit_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `ticket_session_178_audit_ref_1_fk` FOREIGN KEY (`audit_ref_1`) REFERENCES `audit_device_29` (`id`),
  UNIQUE KEY `ticket_session_178_u2` (`policy_0`, `batch_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `ticket_route_179` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `note_0` int(11),
  `zone_1` bigint(20) NOT NULL,
  `grant_2` json NOT NULL,
  `policy_3` json NOT NULL,
  `route_4` bigint(20),
  `grant_ref_0` int(11) DEFAULT NULL,
  KEY `ticket_route_179_grant_ref_0_idx` (`grant_ref_0`),
  CONSTRAINT `ticket_route_179_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_batch_40` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `account_zone_180` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `order_0` json NOT NULL,
  `claim_1` json NOT NULL,
  `account_2` datetime NOT NULL,
  `order_3` tinyint(1) NOT NULL,
  `grant_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `account_zone_180_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_asset_62` (`id`),
  `shipment_ref_1` int(11) DEFAULT NULL,
  KEY `account_zone_180_shipment_ref_1_idx` (`shipment_ref_1`),
  CONSTRAINT `account_zone_180_shipment_ref_1_fk` FOREIGN KEY (`shipment_ref_1`) REFERENCES `shipment_route_79` (`id`),
  `audit_ref_2` int(11) DEFAULT NULL,
  KEY `account_zone_180_audit_ref_2_idx` (`audit_ref_2`),
  CONSTRAINT `account_zone_180_audit_ref_2_fk` FOREIGN KEY (`audit_ref_2`) REFERENCES `audit_policy_145` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `device_batch_181` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `device_0` char(36) NOT NULL,
  `claim_1` tinyint(1) NOT NULL,
  `invoice_2` varchar(120) NOT NULL,
  `shipment_3` char(36) NOT NULL,
  `plan_4` json NOT NULL,
  `payment_5` int(11),
  `lease_6` decimal(12,2) NOT NULL,
  `policy_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `device_batch_181_policy_ref_0_fk` FOREIGN KEY (`policy_ref_0`) REFERENCES `policy_grant_17` (`id`),
  UNIQUE KEY `device_batch_181_u2` (`device_0`, `claim_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `zone_lease_182` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `audit_0` json,
  `account_1` int(11) NOT NULL,
  `zone_2` char(36) NOT NULL,
  `route_3` tinyint(1),
  `device_4` tinyint(1),
  `order_5` json NOT NULL,
  `batch_6` decimal(12,2) NOT NULL,
  `route_7` date NOT NULL,
  `shipment_8` int(11) NOT NULL,
  `claim_ref_0` int(11) DEFAULT NULL,
  KEY `zone_lease_182_claim_ref_0_idx` (`claim_ref_0`),
  CONSTRAINT `zone_lease_182_claim_ref_0_fk` FOREIGN KEY (`claim_ref_0`) REFERENCES `claim_event_32` (`id`),
  UNIQUE KEY `zone_lease_182_u2` (`audit_0`, `account_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `claim_lease_183` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `event_0` decimal(12,2) NOT NULL,
  `session_1` decimal(12,2) NOT NULL,
  `note_2` bigint(20),
  `device_3` datetime,
  `invoice_4` varchar(120),
  `lease_5` date,
  `batch_6` bigint(20) NOT NULL,
  `account_7` json NOT NULL,
  `audit_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `claim_lease_183_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_device_64` (`id`),
  `note_ref_1` int(11) DEFAULT NULL,
  KEY `claim_lease_183_note_ref_1_idx` (`note_ref_1`),
  CONSTRAINT `claim_lease_183_note_ref_1_fk` FOREIGN KEY (`note_ref_1`) REFERENCES `note_shipment_143` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `device_session_184` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `device_0` longtext NOT NULL,
  `order_1` json,
  `plan_2` date,
  `grant_3` longtext NOT NULL,
  `ticket_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `device_session_184_ticket_ref_0_fk` FOREIGN KEY (`ticket_ref_0`) REFERENCES `ticket_audit_98` (`id`),
  `audit_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `device_session_184_audit_ref_1_fk` FOREIGN KEY (`audit_ref_1`) REFERENCES `audit_payment_45` (`id`),
  `invoice_ref_2` int(11) DEFAULT NULL,
  KEY `device_session_184_invoice_ref_2_idx` (`invoice_ref_2`),
  CONSTRAINT `device_session_184_invoice_ref_2_fk` FOREIGN KEY (`invoice_ref_2`) REFERENCES `invoice_event_59` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `device_session_184_u` ON `device_session_184` (`invoice_ref_2`);
CREATE TABLE `grant_lease_185` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `asset_0` longtext,
  `grant_1` date,
  `ticket_2` date,
  `policy_ref_0` int(11) DEFAULT NULL,
  KEY `grant_lease_185_policy_ref_0_idx` (`policy_ref_0`),
  CONSTRAINT `grant_lease_185_policy_ref_0_fk` FOREIGN KEY (`policy_ref_0`) REFERENCES `policy_grant_9` (`id`),
  `event_ref_1` int(11) DEFAULT NULL,
  KEY `grant_lease_185_event_ref_1_idx` (`event_ref_1`),
  CONSTRAINT `grant_lease_185_event_ref_1_fk` FOREIGN KEY (`event_ref_1`) REFERENCES `event_asset_21` (`id`),
  UNIQUE KEY `grant_lease_185_u2` (`asset_0`, `grant_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `event_zone_186` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `session_0` json,
  `device_1` varchar(120) NOT NULL,
  `plan_2` int(11),
  `claim_3` date NOT NULL,
  `lease_4` bigint(20),
  `note_5` longtext NOT NULL,
  `order_6` decimal(12,2),
  `event_7` tinyint(1) NOT NULL,
  `grant_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `event_zone_186_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_lease_185` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `shipment_batch_187` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `policy_0` json,
  `session_1` varchar(120),
  `account_2` datetime,
  `audit_3` datetime,
  `order_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `shipment_batch_187_order_ref_0_fk` FOREIGN KEY (`order_ref_0`) REFERENCES `order_device_133` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `shipment_route_188` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `asset_0` decimal(12,2),
  `route_1` json,
  `session_2` tinyint(1),
  `session_3` longtext,
  `ticket_4` datetime,
  `account_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `shipment_route_188_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_order_43` (`id`),
  `event_ref_1` int(11) DEFAULT NULL,
  KEY `shipment_route_188_event_ref_1_idx` (`event_ref_1`),
  CONSTRAINT `shipment_route_188_event_ref_1_fk` FOREIGN KEY (`event_ref_1`) REFERENCES `event_asset_56` (`id`),
  UNIQUE KEY `shipment_route_188_u2` (`asset_0`, `route_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `plan_lease_189` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `grant_0` longtext NOT NULL,
  `note_1` tinyint(1),
  `audit_2` tinyint(1) NOT NULL,
  `payment_ref_0` int(11) DEFAULT NULL,
  KEY `plan_lease_189_payment_ref_0_idx` (`payment_ref_0`),
  CONSTRAINT `plan_lease_189_payment_ref_0_fk` FOREIGN KEY (`payment_ref_0`) REFERENCES `payment_claim_159` (`id`),
  `claim_ref_1` int(11) DEFAULT NULL,
  KEY `plan_lease_189_claim_ref_1_idx` (`claim_ref_1`),
  CONSTRAINT `plan_lease_189_claim_ref_1_fk` FOREIGN KEY (`claim_ref_1`) REFERENCES `claim_ticket_135` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `claim_lease_190` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `ticket_0` char(36),
  `account_1` decimal(12,2) NOT NULL,
  `ticket_2` date NOT NULL,
  `plan_3` int(11) NOT NULL,
  `lease_4` json,
  `order_5` date,
  `batch_6` datetime,
  `invoice_7` longtext NOT NULL,
  `claim_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `claim_lease_190_claim_ref_0_fk` FOREIGN KEY (`claim_ref_0`) REFERENCES `claim_route_54` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `event_event_191` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `event_0` longtext,
  `batch_1` json,
  `claim_2` datetime,
  `event_3` datetime,
  `account_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `event_event_191_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_zone_25` (`id`),
  `event_ref_1` int(11) DEFAULT NULL,
  KEY `event_event_191_event_ref_1_idx` (`event_ref_1`),
  CONSTRAINT `event_event_191_event_ref_1_fk` FOREIGN KEY (`event_ref_1`) REFERENCES `event_asset_21` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `plan_account_192` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `invoice_0` char(36),
  `shipment_1` int(11),
  `shipment_2` decimal(12,2),
  `claim_3` int(11),
  `account_ref_0` int(11) DEFAULT NULL,
  KEY `plan_account_192_account_ref_0_idx` (`account_ref_0`),
  CONSTRAINT `plan_account_192_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_lease_57` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `ticket_audit_193` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `device_0` decimal(12,2) NOT NULL,
  `shipment_1` char(36) NOT NULL,
  `event_2` bigint(20),
  `claim_3` datetime,
  `batch_4` tinyint(1) NOT NULL,
  `lease_5` json NOT NULL,
  `payment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `ticket_audit_193_payment_ref_0_fk` FOREIGN KEY (`payment_ref_0`) REFERENCES `payment_claim_159` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `invoice_payment_194` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `device_0` tinyint(1) NOT NULL,
  `account_1` tinyint(1) NOT NULL,
  `event_2` datetime,
  `plan_3` tinyint(1),
  `shipment_4` int(11) NOT NULL,
  `plan_5` char(36),
  `claim_6` tinyint(1),
  `session_ref_0` int(11) DEFAULT NULL,
  KEY `invoice_payment_194_session_ref_0_idx` (`session_ref_0`),
  CONSTRAINT `invoice_payment_194_session_ref_0_fk` FOREIGN KEY (`session_ref_0`) REFERENCES `session_batch_88` (`id`),
  `invoice_ref_1` int(11) DEFAULT NULL,
  KEY `invoice_payment_194_invoice_ref_1_idx` (`invoice_ref_1`),
  CONSTRAINT `invoice_payment_194_invoice_ref_1_fk` FOREIGN KEY (`invoice_ref_1`) REFERENCES `invoice_lease_65` (`id`),
  `ticket_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `invoice_payment_194_ticket_ref_2_fk` FOREIGN KEY (`ticket_ref_2`) REFERENCES `ticket_audit_193` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `route_device_195` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `route_0` char(36),
  `device_1` date,
  `batch_2` date NOT NULL,
  `event_3` int(11),
  `note_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `route_device_195_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_lease_102` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `route_route_196` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `claim_0` datetime,
  `lease_1` datetime,
  `batch_2` tinyint(1) NOT NULL,
  `payment_3` bigint(20),
  `lease_4` datetime,
  `batch_5` int(11) NOT NULL,
  `plan_6` int(11),
  `audit_7` date,
  `audit_ref_0` int(11) DEFAULT NULL,
  KEY `route_route_196_audit_ref_0_idx` (`audit_ref_0`),
  CONSTRAINT `route_route_196_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_batch_139` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `shipment_device_197` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `grant_0` char(36),
  `note_1` varchar(120),
  `lease_2` datetime,
  `claim_3` bigint(20) NOT NULL,
  `zone_4` decimal(12,2),
  `shipment_ref_0` int(11) DEFAULT NULL,
  KEY `shipment_device_197_shipment_ref_0_idx` (`shipment_ref_0`),
  CONSTRAINT `shipment_device_197_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_shipment_149` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `lease_policy_198` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_0` longtext,
  `shipment_1` json,
  `payment_2` tinyint(1) NOT NULL,
  `plan_3` tinyint(1),
  `note_4` int(11) NOT NULL,
  `policy_5` datetime NOT NULL,
  `invoice_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `lease_policy_198_invoice_ref_0_fk` FOREIGN KEY (`invoice_ref_0`) REFERENCES `invoice_batch_86` (`id`),
  `audit_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `lease_policy_198_audit_ref_1_fk` FOREIGN KEY (`audit_ref_1`) REFERENCES `audit_grant_177` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `payment_batch_199` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `shipment_0` tinyint(1) NOT NULL,
  `shipment_1` bigint(20),
  `policy_2` int(11),
  `payment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `payment_batch_199_payment_ref_0_fk` FOREIGN KEY (`payment_ref_0`) REFERENCES `payment_invoice_169` (`id`),
  `note_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `payment_batch_199_note_ref_1_fk` FOREIGN KEY (`note_ref_1`) REFERENCES `note_shipment_143` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `payment_batch_199_u` ON `payment_batch_199` (`note_ref_1`);

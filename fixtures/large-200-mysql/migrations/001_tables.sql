CREATE TABLE `ticket_session_0` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `account_0` json NOT NULL,
  `order_1` int(11),
  `grant_2` datetime NOT NULL,
  `payment_3` decimal(12,2),
  `claim_4` tinyint(1) NOT NULL,
  `audit_5` varchar(120) NOT NULL,
  `order_6` char(36)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `ticket_session_0_u` ON `ticket_session_0` (`order_6`);
CREATE TABLE `grant_invoice_1` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `invoice_0` bigint(20),
  `claim_1` int(11),
  `session_2` longtext,
  `plan_3` varchar(120),
  `batch_4` varchar(120) NOT NULL,
  `audit_5` decimal(12,2) NOT NULL,
  `ticket_ref_0` int(11) DEFAULT NULL,
  KEY `grant_invoice_1_ticket_ref_0_idx` (`ticket_ref_0`),
  CONSTRAINT `grant_invoice_1_ticket_ref_0_fk` FOREIGN KEY (`ticket_ref_0`) REFERENCES `ticket_session_0` (`id`),
  `ticket_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `grant_invoice_1_ticket_ref_1_fk` FOREIGN KEY (`ticket_ref_1`) REFERENCES `ticket_session_0` (`id`),
  `ticket_ref_2` int(11) DEFAULT NULL,
  KEY `grant_invoice_1_ticket_ref_2_idx` (`ticket_ref_2`),
  CONSTRAINT `grant_invoice_1_ticket_ref_2_fk` FOREIGN KEY (`ticket_ref_2`) REFERENCES `ticket_session_0` (`id`),
  UNIQUE KEY `grant_invoice_1_u2` (`invoice_0`, `claim_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `shipment_account_2` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `invoice_0` datetime,
  `audit_1` varchar(120) NOT NULL,
  `zone_2` json,
  `lease_3` char(36),
  `event_4` json NOT NULL,
  `note_5` date,
  `ticket_6` int(11) NOT NULL,
  `grant_ref_0` int(11) DEFAULT NULL,
  KEY `shipment_account_2_grant_ref_0_idx` (`grant_ref_0`),
  CONSTRAINT `shipment_account_2_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_invoice_1` (`id`),
  `grant_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `shipment_account_2_grant_ref_1_fk` FOREIGN KEY (`grant_ref_1`) REFERENCES `grant_invoice_1` (`id`),
  `ticket_ref_2` int(11) DEFAULT NULL,
  KEY `shipment_account_2_ticket_ref_2_idx` (`ticket_ref_2`),
  CONSTRAINT `shipment_account_2_ticket_ref_2_fk` FOREIGN KEY (`ticket_ref_2`) REFERENCES `ticket_session_0` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_ticket_3` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `asset_0` longtext,
  `event_1` bigint(20) NOT NULL,
  `lease_2` char(36),
  `claim_3` longtext,
  `device_4` int(11),
  `policy_5` datetime,
  `order_6` char(36) NOT NULL,
  `shipment_ref_0` int(11) DEFAULT NULL,
  KEY `audit_ticket_3_shipment_ref_0_idx` (`shipment_ref_0`),
  CONSTRAINT `audit_ticket_3_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_account_2` (`id`),
  `ticket_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `audit_ticket_3_ticket_ref_1_fk` FOREIGN KEY (`ticket_ref_1`) REFERENCES `ticket_session_0` (`id`),
  `shipment_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `audit_ticket_3_shipment_ref_2_fk` FOREIGN KEY (`shipment_ref_2`) REFERENCES `shipment_account_2` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `audit_ticket_3_u` ON `audit_ticket_3` (`shipment_ref_2`);
CREATE TABLE `audit_ticket_4` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `session_0` json,
  `device_1` varchar(120) NOT NULL,
  `account_2` int(11) NOT NULL,
  `claim_3` int(11) NOT NULL,
  `lease_4` date NOT NULL,
  `device_5` datetime NOT NULL,
  `payment_6` int(11),
  `ticket_7` tinyint(1) NOT NULL,
  `batch_8` char(36) NOT NULL,
  `audit_ref_0` int(11) DEFAULT NULL,
  KEY `audit_ticket_4_audit_ref_0_idx` (`audit_ref_0`),
  CONSTRAINT `audit_ticket_4_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_ticket_3` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `audit_ticket_4_u` ON `audit_ticket_4` (`audit_ref_0`);
CREATE TABLE `policy_plan_5` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `note_0` varchar(120),
  `event_1` int(11),
  `device_2` decimal(12,2),
  `payment_3` longtext NOT NULL,
  `grant_4` char(36) NOT NULL,
  `event_5` datetime NOT NULL,
  `payment_6` date NOT NULL,
  `ticket_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `policy_plan_5_ticket_ref_0_fk` FOREIGN KEY (`ticket_ref_0`) REFERENCES `ticket_session_0` (`id`),
  `grant_ref_1` int(11) DEFAULT NULL,
  KEY `policy_plan_5_grant_ref_1_idx` (`grant_ref_1`),
  CONSTRAINT `policy_plan_5_grant_ref_1_fk` FOREIGN KEY (`grant_ref_1`) REFERENCES `grant_invoice_1` (`id`),
  `audit_ref_2` int(11) DEFAULT NULL,
  KEY `policy_plan_5_audit_ref_2_idx` (`audit_ref_2`),
  CONSTRAINT `policy_plan_5_audit_ref_2_fk` FOREIGN KEY (`audit_ref_2`) REFERENCES `audit_ticket_4` (`id`),
  UNIQUE KEY `policy_plan_5_u2` (`note_0`, `event_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `invoice_event_6` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `shipment_0` decimal(12,2),
  `asset_1` int(11),
  `lease_2` int(11),
  `grant_ref_0` int(11) DEFAULT NULL,
  KEY `invoice_event_6_grant_ref_0_idx` (`grant_ref_0`),
  CONSTRAINT `invoice_event_6_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_invoice_1` (`id`),
  `audit_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `invoice_event_6_audit_ref_1_fk` FOREIGN KEY (`audit_ref_1`) REFERENCES `audit_ticket_3` (`id`),
  `policy_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `invoice_event_6_policy_ref_2_fk` FOREIGN KEY (`policy_ref_2`) REFERENCES `policy_plan_5` (`id`),
  UNIQUE KEY `invoice_event_6_u2` (`shipment_0`, `asset_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `invoice_event_6_u` ON `invoice_event_6` (`policy_ref_2`);
CREATE TABLE `shipment_session_7` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `route_0` char(36) NOT NULL,
  `route_1` longtext NOT NULL,
  `session_2` datetime NOT NULL,
  `audit_3` json,
  `account_4` tinyint(1),
  `session_5` char(36) NOT NULL,
  `grant_6` int(11),
  `audit_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `shipment_session_7_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_ticket_3` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `batch_policy_8` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `note_0` varchar(120) NOT NULL,
  `batch_1` json NOT NULL,
  `invoice_2` char(36) NOT NULL,
  `route_3` json NOT NULL,
  `audit_4` char(36) NOT NULL,
  `asset_5` varchar(120) NOT NULL,
  `audit_ref_0` int(11) DEFAULT NULL,
  KEY `batch_policy_8_audit_ref_0_idx` (`audit_ref_0`),
  CONSTRAINT `batch_policy_8_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_ticket_3` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `batch_policy_8_u` ON `batch_policy_8` (`audit_ref_0`);
CREATE TABLE `policy_grant_9` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `zone_0` json NOT NULL,
  `claim_1` varchar(120) NOT NULL,
  `shipment_2` json NOT NULL,
  `account_3` tinyint(1) NOT NULL,
  `lease_4` json NOT NULL,
  `batch_5` int(11),
  `lease_6` datetime NOT NULL,
  `audit_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `policy_grant_9_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_ticket_3` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `asset_shipment_10` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `audit_0` json,
  `grant_1` bigint(20),
  `batch_2` varchar(120) NOT NULL,
  `batch_3` date NOT NULL,
  `shipment_ref_0` int(11) DEFAULT NULL,
  KEY `asset_shipment_10_shipment_ref_0_idx` (`shipment_ref_0`),
  CONSTRAINT `asset_shipment_10_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_account_2` (`id`),
  `ticket_ref_1` int(11) DEFAULT NULL,
  KEY `asset_shipment_10_ticket_ref_1_idx` (`ticket_ref_1`),
  CONSTRAINT `asset_shipment_10_ticket_ref_1_fk` FOREIGN KEY (`ticket_ref_1`) REFERENCES `ticket_session_0` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `account_note_11` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `plan_0` datetime,
  `shipment_1` decimal(12,2),
  `payment_2` int(11) NOT NULL,
  `session_3` char(36) NOT NULL,
  `asset_4` longtext,
  `policy_5` int(11) NOT NULL,
  `note_6` date NOT NULL,
  `event_7` varchar(120) NOT NULL,
  `shipment_ref_0` int(11) DEFAULT NULL,
  KEY `account_note_11_shipment_ref_0_idx` (`shipment_ref_0`),
  CONSTRAINT `account_note_11_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_session_7` (`id`),
  `asset_ref_1` int(11) DEFAULT NULL,
  KEY `account_note_11_asset_ref_1_idx` (`asset_ref_1`),
  CONSTRAINT `account_note_11_asset_ref_1_fk` FOREIGN KEY (`asset_ref_1`) REFERENCES `asset_shipment_10` (`id`),
  UNIQUE KEY `account_note_11_u2` (`plan_0`, `shipment_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `account_audit_12` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `event_0` bigint(20),
  `audit_1` longtext NOT NULL,
  `batch_2` varchar(120) NOT NULL,
  `device_3` datetime,
  `ticket_4` longtext,
  `session_5` bigint(20),
  `lease_6` bigint(20) NOT NULL,
  `policy_7` varchar(120) NOT NULL,
  `account_8` char(36),
  `shipment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `account_audit_12_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_session_7` (`id`),
  UNIQUE KEY `account_audit_12_u2` (`event_0`, `audit_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `plan_note_13` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `payment_0` decimal(12,2) NOT NULL,
  `shipment_1` varchar(120),
  `shipment_2` date NOT NULL,
  `invoice_3` datetime NOT NULL,
  `batch_4` longtext NOT NULL,
  `audit_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `plan_note_13_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_ticket_4` (`id`),
  `batch_ref_1` int(11) DEFAULT NULL,
  KEY `plan_note_13_batch_ref_1_idx` (`batch_ref_1`),
  CONSTRAINT `plan_note_13_batch_ref_1_fk` FOREIGN KEY (`batch_ref_1`) REFERENCES `batch_policy_8` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `plan_note_13_u` ON `plan_note_13` (`batch_ref_1`);
CREATE TABLE `shipment_asset_14` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_0` int(11),
  `batch_1` longtext,
  `session_2` bigint(20) NOT NULL,
  `grant_ref_0` int(11) DEFAULT NULL,
  KEY `shipment_asset_14_grant_ref_0_idx` (`grant_ref_0`),
  CONSTRAINT `shipment_asset_14_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_invoice_1` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `shipment_asset_14_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_note_13` (`id`),
  UNIQUE KEY `shipment_asset_14_u2` (`invoice_0`, `batch_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `event_audit_15` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `route_0` decimal(12,2),
  `policy_1` date,
  `batch_2` tinyint(1) NOT NULL,
  `account_3` bigint(20),
  `session_4` char(36) NOT NULL,
  `audit_5` datetime NOT NULL,
  `invoice_6` tinyint(1) NOT NULL,
  `policy_7` char(36),
  `shipment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `event_audit_15_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_asset_14` (`id`),
  `invoice_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `event_audit_15_invoice_ref_1_fk` FOREIGN KEY (`invoice_ref_1`) REFERENCES `invoice_event_6` (`id`),
  `account_ref_2` int(11) DEFAULT NULL,
  KEY `event_audit_15_account_ref_2_idx` (`account_ref_2`),
  CONSTRAINT `event_audit_15_account_ref_2_fk` FOREIGN KEY (`account_ref_2`) REFERENCES `account_note_11` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_shipment_16` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `event_0` int(11),
  `grant_1` char(36),
  `asset_2` varchar(120),
  `invoice_3` tinyint(1) NOT NULL,
  `invoice_4` longtext NOT NULL,
  `ticket_5` char(36) NOT NULL,
  `plan_6` decimal(12,2) NOT NULL,
  `grant_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `audit_shipment_16_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_invoice_1` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  KEY `audit_shipment_16_account_ref_1_idx` (`account_ref_1`),
  CONSTRAINT `audit_shipment_16_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_audit_12` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `policy_grant_17` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `order_0` char(36),
  `batch_1` longtext,
  `device_2` int(11),
  `invoice_3` decimal(12,2) NOT NULL,
  `asset_4` json,
  `audit_ref_0` int(11) DEFAULT NULL,
  KEY `policy_grant_17_audit_ref_0_idx` (`audit_ref_0`),
  CONSTRAINT `policy_grant_17_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_ticket_3` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `session_zone_18` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_0` json NOT NULL,
  `asset_1` decimal(12,2),
  `zone_2` char(36) NOT NULL,
  `payment_3` varchar(120),
  `route_4` datetime,
  `order_5` bigint(20),
  `grant_6` longtext,
  `ticket_7` datetime NOT NULL,
  `audit_8` decimal(12,2),
  `audit_ref_0` int(11) DEFAULT NULL,
  KEY `session_zone_18_audit_ref_0_idx` (`audit_ref_0`),
  CONSTRAINT `session_zone_18_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_shipment_16` (`id`),
  UNIQUE KEY `session_zone_18_u2` (`order_0`, `asset_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `account_policy_19` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `invoice_0` decimal(12,2),
  `device_1` date,
  `lease_2` tinyint(1),
  `payment_3` varchar(120) NOT NULL,
  `audit_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `account_policy_19_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_ticket_3` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `account_plan_20` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_0` longtext,
  `shipment_1` decimal(12,2),
  `lease_2` varchar(120),
  `shipment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `account_plan_20_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_asset_14` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `event_asset_21` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `note_0` date NOT NULL,
  `shipment_1` date,
  `order_2` longtext,
  `shipment_3` tinyint(1),
  `plan_ref_0` int(11) DEFAULT NULL,
  KEY `event_asset_21_plan_ref_0_idx` (`plan_ref_0`),
  CONSTRAINT `event_asset_21_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_note_13` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `event_asset_21_u` ON `event_asset_21` (`plan_ref_0`);
CREATE TABLE `ticket_claim_22` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `ticket_0` bigint(20),
  `route_1` bigint(20) NOT NULL,
  `payment_2` longtext NOT NULL,
  `session_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `ticket_claim_22_session_ref_0_fk` FOREIGN KEY (`session_ref_0`) REFERENCES `session_zone_18` (`id`),
  `shipment_ref_1` int(11) DEFAULT NULL,
  KEY `ticket_claim_22_shipment_ref_1_idx` (`shipment_ref_1`),
  CONSTRAINT `ticket_claim_22_shipment_ref_1_fk` FOREIGN KEY (`shipment_ref_1`) REFERENCES `shipment_account_2` (`id`),
  UNIQUE KEY `ticket_claim_22_u2` (`ticket_0`, `route_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `note_policy_23` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `order_0` bigint(20),
  `account_1` bigint(20) NOT NULL,
  `order_2` tinyint(1) NOT NULL,
  `device_3` int(11),
  `grant_4` datetime,
  `event_5` bigint(20),
  `shipment_6` char(36),
  `account_ref_0` int(11) DEFAULT NULL,
  KEY `note_policy_23_account_ref_0_idx` (`account_ref_0`),
  CONSTRAINT `note_policy_23_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_note_11` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `account_claim_24` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `plan_0` date,
  `payment_1` decimal(12,2) NOT NULL,
  `route_2` json,
  `device_3` bigint(20),
  `grant_4` longtext NOT NULL,
  `batch_5` decimal(12,2) NOT NULL,
  `batch_6` bigint(20),
  `shipment_7` tinyint(1) NOT NULL,
  `event_ref_0` int(11) DEFAULT NULL,
  KEY `account_claim_24_event_ref_0_idx` (`event_ref_0`),
  CONSTRAINT `account_claim_24_event_ref_0_fk` FOREIGN KEY (`event_ref_0`) REFERENCES `event_audit_15` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';

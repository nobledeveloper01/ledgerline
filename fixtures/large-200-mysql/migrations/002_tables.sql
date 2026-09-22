CREATE TABLE `account_zone_25` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_0` char(36) NOT NULL,
  `order_1` decimal(12,2) NOT NULL,
  `device_2` int(11),
  `ticket_3` json,
  `invoice_4` tinyint(1) NOT NULL,
  `plan_5` datetime,
  `note_ref_0` int(11) DEFAULT NULL,
  KEY `account_zone_25_note_ref_0_idx` (`note_ref_0`),
  CONSTRAINT `account_zone_25_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_policy_23` (`id`),
  `policy_ref_1` int(11) DEFAULT NULL,
  KEY `account_zone_25_policy_ref_1_idx` (`policy_ref_1`),
  CONSTRAINT `account_zone_25_policy_ref_1_fk` FOREIGN KEY (`policy_ref_1`) REFERENCES `policy_grant_9` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `plan_device_26` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `event_0` longtext,
  `plan_1` tinyint(1) NOT NULL,
  `event_2` int(11) NOT NULL,
  `lease_3` tinyint(1),
  `ticket_4` decimal(12,2) NOT NULL,
  `policy_5` datetime NOT NULL,
  `lease_6` json NOT NULL,
  `claim_7` char(36),
  `payment_8` json NOT NULL,
  `account_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `plan_device_26_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_policy_19` (`id`),
  `ticket_ref_1` int(11) DEFAULT NULL,
  KEY `plan_device_26_ticket_ref_1_idx` (`ticket_ref_1`),
  CONSTRAINT `plan_device_26_ticket_ref_1_fk` FOREIGN KEY (`ticket_ref_1`) REFERENCES `ticket_session_0` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `batch_batch_27` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `audit_0` date,
  `invoice_1` char(36) NOT NULL,
  `session_2` json,
  `session_3` datetime,
  `event_4` longtext,
  `audit_5` json,
  `payment_6` int(11),
  `plan_7` int(11),
  `route_8` decimal(12,2),
  `shipment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `batch_batch_27_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_session_7` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  KEY `batch_batch_27_account_ref_1_idx` (`account_ref_1`),
  CONSTRAINT `batch_batch_27_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_zone_25` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `batch_batch_27_u` ON `batch_batch_27` (`account_ref_1`);
CREATE TABLE `account_invoice_28` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_0` varchar(120),
  `policy_1` longtext NOT NULL,
  `device_2` decimal(12,2) NOT NULL,
  `invoice_3` longtext NOT NULL,
  `policy_4` varchar(120),
  `account_5` date NOT NULL,
  `account_6` char(36) NOT NULL,
  `audit_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `account_invoice_28_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_ticket_4` (`id`),
  `shipment_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `account_invoice_28_shipment_ref_1_fk` FOREIGN KEY (`shipment_ref_1`) REFERENCES `shipment_account_2` (`id`),
  `asset_ref_2` int(11) DEFAULT NULL,
  KEY `account_invoice_28_asset_ref_2_idx` (`asset_ref_2`),
  CONSTRAINT `account_invoice_28_asset_ref_2_fk` FOREIGN KEY (`asset_ref_2`) REFERENCES `asset_shipment_10` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_device_29` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `payment_0` tinyint(1) NOT NULL,
  `claim_1` datetime NOT NULL,
  `route_2` varchar(120) NOT NULL,
  `grant_3` decimal(12,2) NOT NULL,
  `route_4` datetime NOT NULL,
  `invoice_5` varchar(120),
  `payment_6` bigint(20),
  `note_7` varchar(120) NOT NULL,
  `account_ref_0` int(11) DEFAULT NULL,
  KEY `audit_device_29_account_ref_0_idx` (`account_ref_0`),
  CONSTRAINT `audit_device_29_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_plan_20` (`id`),
  `batch_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `audit_device_29_batch_ref_1_fk` FOREIGN KEY (`batch_ref_1`) REFERENCES `batch_batch_27` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `route_shipment_30` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `shipment_0` char(36) NOT NULL,
  `event_1` json NOT NULL,
  `audit_2` bigint(20) NOT NULL,
  `shipment_3` decimal(12,2) NOT NULL,
  `zone_4` longtext NOT NULL,
  `policy_ref_0` int(11) DEFAULT NULL,
  KEY `route_shipment_30_policy_ref_0_idx` (`policy_ref_0`),
  CONSTRAINT `route_shipment_30_policy_ref_0_fk` FOREIGN KEY (`policy_ref_0`) REFERENCES `policy_grant_9` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `lease_note_31` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `device_0` longtext NOT NULL,
  `note_1` longtext NOT NULL,
  `account_2` date,
  `event_3` bigint(20),
  `plan_4` date NOT NULL,
  `note_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `lease_note_31_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_policy_23` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `claim_event_32` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `grant_0` int(11),
  `shipment_1` decimal(12,2) NOT NULL,
  `zone_2` date NOT NULL,
  `zone_3` varchar(120) NOT NULL,
  `note_ref_0` int(11) DEFAULT NULL,
  KEY `claim_event_32_note_ref_0_idx` (`note_ref_0`),
  CONSTRAINT `claim_event_32_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_policy_23` (`id`),
  `grant_ref_1` int(11) DEFAULT NULL,
  KEY `claim_event_32_grant_ref_1_idx` (`grant_ref_1`),
  CONSTRAINT `claim_event_32_grant_ref_1_fk` FOREIGN KEY (`grant_ref_1`) REFERENCES `grant_invoice_1` (`id`),
  `plan_ref_2` int(11) DEFAULT NULL,
  KEY `claim_event_32_plan_ref_2_idx` (`plan_ref_2`),
  CONSTRAINT `claim_event_32_plan_ref_2_fk` FOREIGN KEY (`plan_ref_2`) REFERENCES `plan_device_26` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `plan_lease_33` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `payment_0` json,
  `zone_1` decimal(12,2),
  `lease_2` int(11),
  `grant_3` char(36),
  `event_4` date NOT NULL,
  `order_5` longtext NOT NULL,
  `event_6` json,
  `audit_ref_0` int(11) DEFAULT NULL,
  KEY `plan_lease_33_audit_ref_0_idx` (`audit_ref_0`),
  CONSTRAINT `plan_lease_33_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_ticket_3` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `plan_lease_33_u` ON `plan_lease_33` (`audit_ref_0`);
CREATE TABLE `claim_session_34` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `audit_0` datetime,
  `ticket_1` varchar(120) NOT NULL,
  `ticket_2` int(11) NOT NULL,
  `claim_3` date,
  `note_4` json NOT NULL,
  `account_ref_0` int(11) DEFAULT NULL,
  KEY `claim_session_34_account_ref_0_idx` (`account_ref_0`),
  CONSTRAINT `claim_session_34_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_claim_24` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `claim_session_34_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_claim_24` (`id`),
  `shipment_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `claim_session_34_shipment_ref_2_fk` FOREIGN KEY (`shipment_ref_2`) REFERENCES `shipment_asset_14` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `shipment_account_35` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `account_0` bigint(20) NOT NULL,
  `asset_1` tinyint(1),
  `device_2` tinyint(1) NOT NULL,
  `zone_3` tinyint(1),
  `event_ref_0` int(11) DEFAULT NULL,
  KEY `shipment_account_35_event_ref_0_idx` (`event_ref_0`),
  CONSTRAINT `shipment_account_35_event_ref_0_fk` FOREIGN KEY (`event_ref_0`) REFERENCES `event_asset_21` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `shipment_account_35_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_plan_20` (`id`),
  `shipment_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `shipment_account_35_shipment_ref_2_fk` FOREIGN KEY (`shipment_ref_2`) REFERENCES `shipment_session_7` (`id`),
  UNIQUE KEY `shipment_account_35_u2` (`account_0`, `asset_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `session_note_36` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `shipment_0` varchar(120) NOT NULL,
  `payment_1` json NOT NULL,
  `event_2` bigint(20) NOT NULL,
  `shipment_3` date,
  `device_4` int(11) NOT NULL,
  `account_5` date,
  `claim_6` varchar(120) NOT NULL,
  `grant_7` longtext,
  `account_ref_0` int(11) DEFAULT NULL,
  KEY `session_note_36_account_ref_0_idx` (`account_ref_0`),
  CONSTRAINT `session_note_36_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_invoice_28` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `ticket_note_37` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_0` int(11),
  `plan_1` longtext NOT NULL,
  `ticket_2` int(11),
  `lease_3` longtext NOT NULL,
  `shipment_4` datetime NOT NULL,
  `plan_5` int(11),
  `event_6` json,
  `shipment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `ticket_note_37_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_account_2` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  KEY `ticket_note_37_plan_ref_1_idx` (`plan_ref_1`),
  CONSTRAINT `ticket_note_37_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_lease_33` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `ticket_note_37_u` ON `ticket_note_37` (`plan_ref_1`);
CREATE TABLE `session_order_38` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `payment_0` decimal(12,2) NOT NULL,
  `lease_1` datetime,
  `claim_2` int(11),
  `ticket_3` datetime,
  `account_4` decimal(12,2) NOT NULL,
  `grant_5` bigint(20) NOT NULL,
  `lease_6` datetime NOT NULL,
  `zone_7` decimal(12,2) NOT NULL,
  `shipment_ref_0` int(11) DEFAULT NULL,
  KEY `session_order_38_shipment_ref_0_idx` (`shipment_ref_0`),
  CONSTRAINT `session_order_38_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_account_2` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `plan_grant_39` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `device_0` date NOT NULL,
  `route_1` int(11) NOT NULL,
  `zone_2` datetime,
  `batch_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `plan_grant_39_batch_ref_0_fk` FOREIGN KEY (`batch_ref_0`) REFERENCES `batch_batch_27` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  KEY `plan_grant_39_account_ref_1_idx` (`account_ref_1`),
  CONSTRAINT `plan_grant_39_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_audit_12` (`id`),
  `shipment_ref_2` int(11) DEFAULT NULL,
  KEY `plan_grant_39_shipment_ref_2_idx` (`shipment_ref_2`),
  CONSTRAINT `plan_grant_39_shipment_ref_2_fk` FOREIGN KEY (`shipment_ref_2`) REFERENCES `shipment_account_35` (`id`),
  UNIQUE KEY `plan_grant_39_u2` (`device_0`, `route_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `grant_batch_40` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `lease_0` varchar(120),
  `plan_1` char(36) NOT NULL,
  `session_2` date NOT NULL,
  `session_3` longtext,
  `asset_4` varchar(120),
  `batch_5` decimal(12,2),
  `payment_6` bigint(20) NOT NULL,
  `device_7` char(36),
  `route_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `grant_batch_40_route_ref_0_fk` FOREIGN KEY (`route_ref_0`) REFERENCES `route_shipment_30` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `grant_batch_40_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_note_13` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `claim_note_41` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `policy_0` longtext NOT NULL,
  `claim_1` datetime,
  `invoice_2` decimal(12,2) NOT NULL,
  `plan_3` decimal(12,2),
  `event_4` decimal(12,2),
  `plan_5` tinyint(1),
  `account_6` varchar(120) NOT NULL,
  `payment_7` int(11),
  `payment_8` varchar(120),
  `ticket_ref_0` int(11) DEFAULT NULL,
  KEY `claim_note_41_ticket_ref_0_idx` (`ticket_ref_0`),
  CONSTRAINT `claim_note_41_ticket_ref_0_fk` FOREIGN KEY (`ticket_ref_0`) REFERENCES `ticket_claim_22` (`id`),
  `grant_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `claim_note_41_grant_ref_1_fk` FOREIGN KEY (`grant_ref_1`) REFERENCES `grant_invoice_1` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `asset_plan_42` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `plan_0` datetime NOT NULL,
  `shipment_1` bigint(20) NOT NULL,
  `zone_2` decimal(12,2),
  `shipment_3` bigint(20),
  `route_4` bigint(20),
  `device_5` int(11) NOT NULL,
  `claim_6` char(36),
  `session_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `asset_plan_42_session_ref_0_fk` FOREIGN KEY (`session_ref_0`) REFERENCES `session_note_36` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `asset_plan_42_u` ON `asset_plan_42` (`session_ref_0`);
CREATE TABLE `account_order_43` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `grant_0` datetime NOT NULL,
  `order_1` char(36) NOT NULL,
  `shipment_2` tinyint(1) NOT NULL,
  `invoice_3` json,
  `shipment_4` json NOT NULL,
  `asset_5` json,
  `zone_6` bigint(20) NOT NULL,
  `zone_7` tinyint(1) NOT NULL,
  `event_8` decimal(12,2) NOT NULL,
  `plan_ref_0` int(11) DEFAULT NULL,
  KEY `account_order_43_plan_ref_0_idx` (`plan_ref_0`),
  CONSTRAINT `account_order_43_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_note_13` (`id`),
  `session_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `account_order_43_session_ref_1_fk` FOREIGN KEY (`session_ref_1`) REFERENCES `session_note_36` (`id`),
  `account_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `account_order_43_account_ref_2_fk` FOREIGN KEY (`account_ref_2`) REFERENCES `account_invoice_28` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `plan_asset_44` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `invoice_0` bigint(20),
  `session_1` tinyint(1) NOT NULL,
  `payment_2` json,
  `claim_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `plan_asset_44_claim_ref_0_fk` FOREIGN KEY (`claim_ref_0`) REFERENCES `claim_note_41` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_payment_45` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `claim_0` json,
  `plan_1` int(11),
  `policy_2` datetime,
  `claim_3` bigint(20) NOT NULL,
  `policy_4` varchar(120) NOT NULL,
  `note_5` bigint(20) NOT NULL,
  `zone_6` longtext NOT NULL,
  `device_7` longtext NOT NULL,
  `plan_8` decimal(12,2),
  `plan_ref_0` int(11) DEFAULT NULL,
  KEY `audit_payment_45_plan_ref_0_idx` (`plan_ref_0`),
  CONSTRAINT `audit_payment_45_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_lease_33` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  KEY `audit_payment_45_account_ref_1_idx` (`account_ref_1`),
  CONSTRAINT `audit_payment_45_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_zone_25` (`id`),
  `plan_ref_2` int(11) DEFAULT NULL,
  KEY `audit_payment_45_plan_ref_2_idx` (`plan_ref_2`),
  CONSTRAINT `audit_payment_45_plan_ref_2_fk` FOREIGN KEY (`plan_ref_2`) REFERENCES `plan_lease_33` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `event_audit_46` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `claim_0` char(36),
  `invoice_1` int(11),
  `ticket_2` datetime,
  `device_3` longtext NOT NULL,
  `route_4` int(11),
  `invoice_5` datetime NOT NULL,
  `ticket_ref_0` int(11) DEFAULT NULL,
  KEY `event_audit_46_ticket_ref_0_idx` (`ticket_ref_0`),
  CONSTRAINT `event_audit_46_ticket_ref_0_fk` FOREIGN KEY (`ticket_ref_0`) REFERENCES `ticket_claim_22` (`id`),
  UNIQUE KEY `event_audit_46_u2` (`claim_0`, `invoice_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `route_zone_47` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `event_0` decimal(12,2) NOT NULL,
  `invoice_1` json,
  `order_2` date,
  `asset_3` varchar(120) NOT NULL,
  `zone_4` decimal(12,2) NOT NULL,
  `zone_5` json,
  `invoice_6` int(11) NOT NULL,
  `order_7` bigint(20),
  `event_ref_0` int(11) DEFAULT NULL,
  KEY `route_zone_47_event_ref_0_idx` (`event_ref_0`),
  CONSTRAINT `route_zone_47_event_ref_0_fk` FOREIGN KEY (`event_ref_0`) REFERENCES `event_audit_46` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  KEY `route_zone_47_account_ref_1_idx` (`account_ref_1`),
  CONSTRAINT `route_zone_47_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_audit_12` (`id`),
  `session_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `route_zone_47_session_ref_2_fk` FOREIGN KEY (`session_ref_2`) REFERENCES `session_note_36` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `batch_event_48` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `payment_0` longtext NOT NULL,
  `payment_1` tinyint(1) NOT NULL,
  `shipment_2` tinyint(1),
  `plan_3` int(11) NOT NULL,
  `audit_4` int(11),
  `payment_5` bigint(20) NOT NULL,
  `audit_6` char(36),
  `zone_7` decimal(12,2),
  `shipment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `batch_event_48_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_account_35` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `lease_order_49` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `asset_0` int(11) NOT NULL,
  `policy_1` decimal(12,2) NOT NULL,
  `claim_2` longtext NOT NULL,
  `event_3` longtext,
  `device_4` char(36),
  `batch_5` decimal(12,2) NOT NULL,
  `event_6` date,
  `device_7` json NOT NULL,
  `shipment_ref_0` int(11) DEFAULT NULL,
  KEY `lease_order_49_shipment_ref_0_idx` (`shipment_ref_0`),
  CONSTRAINT `lease_order_49_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_account_2` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';

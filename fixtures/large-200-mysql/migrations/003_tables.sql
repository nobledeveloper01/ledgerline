CREATE TABLE `note_lease_50` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `payment_0` int(11),
  `audit_1` datetime,
  `ticket_2` decimal(12,2) NOT NULL,
  `device_3` bigint(20),
  `asset_4` char(36) NOT NULL,
  `plan_5` bigint(20) NOT NULL,
  `asset_6` int(11),
  `claim_7` varchar(120),
  `note_8` datetime NOT NULL,
  `audit_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `note_lease_50_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_ticket_4` (`id`),
  `grant_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `note_lease_50_grant_ref_1_fk` FOREIGN KEY (`grant_ref_1`) REFERENCES `grant_batch_40` (`id`),
  `ticket_ref_2` int(11) DEFAULT NULL,
  KEY `note_lease_50_ticket_ref_2_idx` (`ticket_ref_2`),
  CONSTRAINT `note_lease_50_ticket_ref_2_fk` FOREIGN KEY (`ticket_ref_2`) REFERENCES `ticket_note_37` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `claim_audit_51` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `grant_0` json NOT NULL,
  `claim_1` int(11) NOT NULL,
  `asset_2` tinyint(1) NOT NULL,
  `audit_3` decimal(12,2),
  `audit_4` tinyint(1),
  `audit_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `claim_audit_51_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_device_29` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `claim_audit_51_u` ON `claim_audit_51` (`audit_ref_0`);
CREATE TABLE `order_order_52` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `plan_0` datetime NOT NULL,
  `policy_1` json NOT NULL,
  `route_2` bigint(20) NOT NULL,
  `account_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `order_order_52_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_order_43` (`id`),
  UNIQUE KEY `order_order_52_u2` (`plan_0`, `policy_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `session_route_53` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `policy_0` tinyint(1) NOT NULL,
  `payment_1` tinyint(1),
  `invoice_2` longtext,
  `plan_3` date NOT NULL,
  `invoice_4` tinyint(1) NOT NULL,
  `zone_5` varchar(120) NOT NULL,
  `invoice_6` int(11) NOT NULL,
  `order_7` bigint(20),
  `lease_8` char(36) NOT NULL,
  `grant_ref_0` int(11) DEFAULT NULL,
  KEY `session_route_53_grant_ref_0_idx` (`grant_ref_0`),
  CONSTRAINT `session_route_53_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_batch_40` (`id`),
  `policy_ref_1` int(11) DEFAULT NULL,
  KEY `session_route_53_policy_ref_1_idx` (`policy_ref_1`),
  CONSTRAINT `session_route_53_policy_ref_1_fk` FOREIGN KEY (`policy_ref_1`) REFERENCES `policy_grant_9` (`id`),
  `account_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `session_route_53_account_ref_2_fk` FOREIGN KEY (`account_ref_2`) REFERENCES `account_claim_24` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `claim_route_54` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `policy_0` datetime NOT NULL,
  `claim_1` int(11) NOT NULL,
  `policy_2` char(36),
  `order_3` varchar(120),
  `shipment_4` decimal(12,2) NOT NULL,
  `grant_5` varchar(120) NOT NULL,
  `payment_6` decimal(12,2) NOT NULL,
  `account_7` char(36),
  `note_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `claim_route_54_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_policy_23` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `claim_route_54_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_note_11` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `note_session_55` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `note_0` char(36) NOT NULL,
  `lease_1` tinyint(1),
  `policy_2` int(11),
  `ticket_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `note_session_55_ticket_ref_0_fk` FOREIGN KEY (`ticket_ref_0`) REFERENCES `ticket_claim_22` (`id`),
  `claim_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `note_session_55_claim_ref_1_fk` FOREIGN KEY (`claim_ref_1`) REFERENCES `claim_note_41` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `note_session_55_u` ON `note_session_55` (`claim_ref_1`);
CREATE TABLE `event_asset_56` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `grant_0` json,
  `zone_1` char(36) NOT NULL,
  `asset_2` date,
  `lease_3` longtext NOT NULL,
  `batch_4` decimal(12,2),
  `shipment_5` bigint(20) NOT NULL,
  `claim_6` bigint(20),
  `session_ref_0` int(11) DEFAULT NULL,
  KEY `event_asset_56_session_ref_0_idx` (`session_ref_0`),
  CONSTRAINT `event_asset_56_session_ref_0_fk` FOREIGN KEY (`session_ref_0`) REFERENCES `session_zone_18` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `account_lease_57` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `note_0` date,
  `order_1` datetime NOT NULL,
  `payment_2` longtext NOT NULL,
  `lease_3` date,
  `account_4` bigint(20) NOT NULL,
  `note_ref_0` int(11) DEFAULT NULL,
  KEY `account_lease_57_note_ref_0_idx` (`note_ref_0`),
  CONSTRAINT `account_lease_57_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_lease_50` (`id`),
  `session_ref_1` int(11) DEFAULT NULL,
  KEY `account_lease_57_session_ref_1_idx` (`session_ref_1`),
  CONSTRAINT `account_lease_57_session_ref_1_fk` FOREIGN KEY (`session_ref_1`) REFERENCES `session_route_53` (`id`),
  `ticket_ref_2` int(11) DEFAULT NULL,
  KEY `account_lease_57_ticket_ref_2_idx` (`ticket_ref_2`),
  CONSTRAINT `account_lease_57_ticket_ref_2_fk` FOREIGN KEY (`ticket_ref_2`) REFERENCES `ticket_session_0` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `plan_payment_58` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `ticket_0` datetime NOT NULL,
  `event_1` char(36),
  `order_2` decimal(12,2),
  `order_3` json NOT NULL,
  `note_4` varchar(120) NOT NULL,
  `zone_5` varchar(120),
  `account_ref_0` int(11) DEFAULT NULL,
  KEY `plan_payment_58_account_ref_0_idx` (`account_ref_0`),
  CONSTRAINT `plan_payment_58_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_claim_24` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `plan_payment_58_u` ON `plan_payment_58` (`account_ref_0`);
CREATE TABLE `invoice_event_59` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `note_0` decimal(12,2) NOT NULL,
  `lease_1` bigint(20) NOT NULL,
  `invoice_2` json,
  `route_3` decimal(12,2) NOT NULL,
  `lease_4` date,
  `plan_5` decimal(12,2),
  `claim_6` date,
  `ticket_7` bigint(20),
  `ticket_ref_0` int(11) DEFAULT NULL,
  KEY `invoice_event_59_ticket_ref_0_idx` (`ticket_ref_0`),
  CONSTRAINT `invoice_event_59_ticket_ref_0_fk` FOREIGN KEY (`ticket_ref_0`) REFERENCES `ticket_note_37` (`id`),
  `lease_ref_1` int(11) DEFAULT NULL,
  KEY `invoice_event_59_lease_ref_1_idx` (`lease_ref_1`),
  CONSTRAINT `invoice_event_59_lease_ref_1_fk` FOREIGN KEY (`lease_ref_1`) REFERENCES `lease_order_49` (`id`),
  `claim_ref_2` int(11) DEFAULT NULL,
  KEY `invoice_event_59_claim_ref_2_idx` (`claim_ref_2`),
  CONSTRAINT `invoice_event_59_claim_ref_2_fk` FOREIGN KEY (`claim_ref_2`) REFERENCES `claim_event_32` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `asset_shipment_60` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_0` longtext NOT NULL,
  `route_1` int(11) NOT NULL,
  `plan_2` json NOT NULL,
  `policy_3` datetime NOT NULL,
  `shipment_4` decimal(12,2) NOT NULL,
  `zone_5` longtext,
  `claim_6` datetime,
  `policy_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `asset_shipment_60_policy_ref_0_fk` FOREIGN KEY (`policy_ref_0`) REFERENCES `policy_grant_9` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `asset_shipment_60_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_policy_19` (`id`),
  `lease_ref_2` int(11) DEFAULT NULL,
  KEY `asset_shipment_60_lease_ref_2_idx` (`lease_ref_2`),
  CONSTRAINT `asset_shipment_60_lease_ref_2_fk` FOREIGN KEY (`lease_ref_2`) REFERENCES `lease_order_49` (`id`),
  UNIQUE KEY `asset_shipment_60_u2` (`invoice_0`, `route_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `plan_policy_61` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `account_0` datetime,
  `batch_1` bigint(20),
  `device_2` char(36),
  `route_3` decimal(12,2),
  `grant_4` tinyint(1) NOT NULL,
  `plan_ref_0` int(11) DEFAULT NULL,
  KEY `plan_policy_61_plan_ref_0_idx` (`plan_ref_0`),
  CONSTRAINT `plan_policy_61_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_payment_58` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `grant_asset_62` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `plan_0` longtext NOT NULL,
  `order_1` json NOT NULL,
  `lease_2` bigint(20) NOT NULL,
  `account_3` json NOT NULL,
  `session_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `grant_asset_62_session_ref_0_fk` FOREIGN KEY (`session_ref_0`) REFERENCES `session_route_53` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  KEY `grant_asset_62_account_ref_1_idx` (`account_ref_1`),
  CONSTRAINT `grant_asset_62_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_invoice_28` (`id`),
  `audit_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `grant_asset_62_audit_ref_2_fk` FOREIGN KEY (`audit_ref_2`) REFERENCES `audit_payment_45` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `grant_asset_62_u` ON `grant_asset_62` (`audit_ref_2`);
CREATE TABLE `note_device_63` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `ticket_0` char(36) NOT NULL,
  `payment_1` longtext,
  `payment_2` longtext,
  `session_3` decimal(12,2) NOT NULL,
  `audit_4` bigint(20) NOT NULL,
  `zone_5` json,
  `zone_6` json NOT NULL,
  `order_7` tinyint(1),
  `lease_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `note_device_63_lease_ref_0_fk` FOREIGN KEY (`lease_ref_0`) REFERENCES `lease_note_31` (`id`),
  UNIQUE KEY `note_device_63_u2` (`ticket_0`, `payment_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_device_64` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `shipment_0` json NOT NULL,
  `ticket_1` int(11),
  `plan_2` char(36) NOT NULL,
  `invoice_3` tinyint(1),
  `claim_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `audit_device_64_claim_ref_0_fk` FOREIGN KEY (`claim_ref_0`) REFERENCES `claim_note_41` (`id`),
  `shipment_ref_1` int(11) DEFAULT NULL,
  KEY `audit_device_64_shipment_ref_1_idx` (`shipment_ref_1`),
  CONSTRAINT `audit_device_64_shipment_ref_1_fk` FOREIGN KEY (`shipment_ref_1`) REFERENCES `shipment_account_2` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `invoice_lease_65` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `batch_0` int(11),
  `event_1` tinyint(1) NOT NULL,
  `invoice_2` date NOT NULL,
  `route_3` char(36) NOT NULL,
  `account_4` datetime,
  `account_5` bigint(20),
  `session_6` decimal(12,2) NOT NULL,
  `order_7` tinyint(1),
  `policy_8` bigint(20),
  `order_ref_0` int(11) DEFAULT NULL,
  KEY `invoice_lease_65_order_ref_0_idx` (`order_ref_0`),
  CONSTRAINT `invoice_lease_65_order_ref_0_fk` FOREIGN KEY (`order_ref_0`) REFERENCES `order_order_52` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  KEY `invoice_lease_65_plan_ref_1_idx` (`plan_ref_1`),
  CONSTRAINT `invoice_lease_65_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_lease_33` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `invoice_lease_65_u` ON `invoice_lease_65` (`plan_ref_1`);
CREATE TABLE `session_batch_66` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `invoice_0` char(36),
  `route_1` datetime NOT NULL,
  `batch_2` longtext,
  `shipment_3` json,
  `plan_4` decimal(12,2) NOT NULL,
  `claim_5` bigint(20),
  `route_6` json NOT NULL,
  `route_7` tinyint(1) NOT NULL,
  `account_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `session_batch_66_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_invoice_28` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `session_batch_66_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_device_26` (`id`),
  UNIQUE KEY `session_batch_66_u2` (`invoice_0`, `route_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `order_event_67` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `ticket_0` tinyint(1) NOT NULL,
  `claim_1` longtext,
  `order_2` char(36),
  `asset_3` decimal(12,2) NOT NULL,
  `audit_4` varchar(120),
  `shipment_5` json,
  `zone_6` tinyint(1) NOT NULL,
  `zone_7` datetime NOT NULL,
  `ticket_8` json NOT NULL,
  `claim_ref_0` int(11) DEFAULT NULL,
  KEY `order_event_67_claim_ref_0_idx` (`claim_ref_0`),
  CONSTRAINT `order_event_67_claim_ref_0_fk` FOREIGN KEY (`claim_ref_0`) REFERENCES `claim_route_54` (`id`),
  `note_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `order_event_67_note_ref_1_fk` FOREIGN KEY (`note_ref_1`) REFERENCES `note_session_55` (`id`),
  `note_ref_2` int(11) DEFAULT NULL,
  KEY `order_event_67_note_ref_2_idx` (`note_ref_2`),
  CONSTRAINT `order_event_67_note_ref_2_fk` FOREIGN KEY (`note_ref_2`) REFERENCES `note_device_63` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `order_event_67_u` ON `order_event_67` (`note_ref_2`);
CREATE TABLE `plan_payment_68` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `lease_0` int(11) NOT NULL,
  `account_1` int(11),
  `order_2` bigint(20) NOT NULL,
  `device_3` longtext,
  `device_4` varchar(120) NOT NULL,
  `plan_5` char(36),
  `asset_6` tinyint(1),
  `note_ref_0` int(11) DEFAULT NULL,
  KEY `plan_payment_68_note_ref_0_idx` (`note_ref_0`),
  CONSTRAINT `plan_payment_68_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_session_55` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  KEY `plan_payment_68_plan_ref_1_idx` (`plan_ref_1`),
  CONSTRAINT `plan_payment_68_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_note_13` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `asset_note_69` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `route_0` int(11),
  `note_1` tinyint(1) NOT NULL,
  `batch_2` decimal(12,2) NOT NULL,
  `payment_3` date NOT NULL,
  `asset_4` json,
  `invoice_5` longtext NOT NULL,
  `batch_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `asset_note_69_batch_ref_0_fk` FOREIGN KEY (`batch_ref_0`) REFERENCES `batch_event_48` (`id`),
  `session_ref_1` int(11) DEFAULT NULL,
  KEY `asset_note_69_session_ref_1_idx` (`session_ref_1`),
  CONSTRAINT `asset_note_69_session_ref_1_fk` FOREIGN KEY (`session_ref_1`) REFERENCES `session_zone_18` (`id`),
  `claim_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `asset_note_69_claim_ref_2_fk` FOREIGN KEY (`claim_ref_2`) REFERENCES `claim_audit_51` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `asset_note_69_u` ON `asset_note_69` (`claim_ref_2`);
CREATE TABLE `grant_invoice_70` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `payment_0` date,
  `grant_1` json NOT NULL,
  `claim_2` datetime,
  `ticket_3` bigint(20) NOT NULL,
  `claim_4` varchar(120) NOT NULL,
  `claim_ref_0` int(11) DEFAULT NULL,
  KEY `grant_invoice_70_claim_ref_0_idx` (`claim_ref_0`),
  CONSTRAINT `grant_invoice_70_claim_ref_0_fk` FOREIGN KEY (`claim_ref_0`) REFERENCES `claim_session_34` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `grant_invoice_70_u` ON `grant_invoice_70` (`claim_ref_0`);
CREATE TABLE `lease_route_71` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `order_0` char(36),
  `plan_1` decimal(12,2) NOT NULL,
  `grant_2` datetime NOT NULL,
  `grant_3` date NOT NULL,
  `order_4` date NOT NULL,
  `account_5` tinyint(1) NOT NULL,
  `ticket_6` datetime NOT NULL,
  `device_7` tinyint(1) NOT NULL,
  `grant_8` decimal(12,2),
  `lease_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `lease_route_71_lease_ref_0_fk` FOREIGN KEY (`lease_ref_0`) REFERENCES `lease_note_31` (`id`),
  `shipment_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `lease_route_71_shipment_ref_1_fk` FOREIGN KEY (`shipment_ref_1`) REFERENCES `shipment_account_35` (`id`),
  `claim_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `lease_route_71_claim_ref_2_fk` FOREIGN KEY (`claim_ref_2`) REFERENCES `claim_session_34` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `grant_device_72` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `asset_0` json,
  `account_1` datetime NOT NULL,
  `order_2` date,
  `ticket_3` int(11) NOT NULL,
  `device_4` longtext,
  `lease_5` date,
  `asset_6` int(11) NOT NULL,
  `audit_ref_0` int(11) DEFAULT NULL,
  KEY `grant_device_72_audit_ref_0_idx` (`audit_ref_0`),
  CONSTRAINT `grant_device_72_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_shipment_16` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  KEY `grant_device_72_plan_ref_1_idx` (`plan_ref_1`),
  CONSTRAINT `grant_device_72_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_grant_39` (`id`),
  `policy_ref_2` int(11) DEFAULT NULL,
  KEY `grant_device_72_policy_ref_2_idx` (`policy_ref_2`),
  CONSTRAINT `grant_device_72_policy_ref_2_fk` FOREIGN KEY (`policy_ref_2`) REFERENCES `policy_grant_17` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `grant_device_72_u` ON `grant_device_72` (`policy_ref_2`);
CREATE TABLE `policy_session_73` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `zone_0` varchar(120),
  `claim_1` date NOT NULL,
  `audit_2` datetime NOT NULL,
  `zone_3` decimal(12,2) NOT NULL,
  `invoice_4` json NOT NULL,
  `account_5` bigint(20) NOT NULL,
  `batch_6` json NOT NULL,
  `order_ref_0` int(11) DEFAULT NULL,
  KEY `policy_session_73_order_ref_0_idx` (`order_ref_0`),
  CONSTRAINT `policy_session_73_order_ref_0_fk` FOREIGN KEY (`order_ref_0`) REFERENCES `order_event_67` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `order_session_74` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `batch_0` decimal(12,2) NOT NULL,
  `batch_1` datetime,
  `account_2` char(36),
  `plan_3` datetime NOT NULL,
  `shipment_4` bigint(20),
  `claim_ref_0` int(11) DEFAULT NULL,
  KEY `order_session_74_claim_ref_0_idx` (`claim_ref_0`),
  CONSTRAINT `order_session_74_claim_ref_0_fk` FOREIGN KEY (`claim_ref_0`) REFERENCES `claim_session_34` (`id`),
  `shipment_ref_1` int(11) DEFAULT NULL,
  KEY `order_session_74_shipment_ref_1_idx` (`shipment_ref_1`),
  CONSTRAINT `order_session_74_shipment_ref_1_fk` FOREIGN KEY (`shipment_ref_1`) REFERENCES `shipment_account_35` (`id`),
  `audit_ref_2` int(11) DEFAULT NULL,
  KEY `order_session_74_audit_ref_2_idx` (`audit_ref_2`),
  CONSTRAINT `order_session_74_audit_ref_2_fk` FOREIGN KEY (`audit_ref_2`) REFERENCES `audit_shipment_16` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';

CREATE TABLE `claim_device_125` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `event_0` tinyint(1) NOT NULL,
  `audit_1` json,
  `policy_2` json,
  `note_ref_0` int(11) DEFAULT NULL,
  KEY `claim_device_125_note_ref_0_idx` (`note_ref_0`),
  CONSTRAINT `claim_device_125_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_policy_23` (`id`),
  `shipment_ref_1` int(11) DEFAULT NULL,
  KEY `claim_device_125_shipment_ref_1_idx` (`shipment_ref_1`),
  CONSTRAINT `claim_device_125_shipment_ref_1_fk` FOREIGN KEY (`shipment_ref_1`) REFERENCES `shipment_account_2` (`id`),
  UNIQUE KEY `claim_device_125_u2` (`event_0`, `audit_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `claim_device_125_u` ON `claim_device_125` (`shipment_ref_1`);
CREATE TABLE `plan_asset_126` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `claim_0` int(11),
  `audit_1` longtext NOT NULL,
  `route_2` json NOT NULL,
  `event_3` tinyint(1) NOT NULL,
  `device_4` tinyint(1),
  `event_ref_0` int(11) DEFAULT NULL,
  KEY `plan_asset_126_event_ref_0_idx` (`event_ref_0`),
  CONSTRAINT `plan_asset_126_event_ref_0_fk` FOREIGN KEY (`event_ref_0`) REFERENCES `event_policy_80` (`id`),
  `asset_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `plan_asset_126_asset_ref_1_fk` FOREIGN KEY (`asset_ref_1`) REFERENCES `asset_shipment_60` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `lease_zone_127` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `event_0` date NOT NULL,
  `ticket_1` char(36),
  `plan_2` varchar(120),
  `note_3` json,
  `ticket_ref_0` int(11) DEFAULT NULL,
  KEY `lease_zone_127_ticket_ref_0_idx` (`ticket_ref_0`),
  CONSTRAINT `lease_zone_127_ticket_ref_0_fk` FOREIGN KEY (`ticket_ref_0`) REFERENCES `ticket_audit_98` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `policy_policy_128` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `audit_0` longtext,
  `asset_1` char(36) NOT NULL,
  `claim_2` datetime,
  `payment_3` int(11),
  `session_4` bigint(20),
  `invoice_5` char(36),
  `invoice_6` decimal(12,2) NOT NULL,
  `event_7` datetime,
  `event_ref_0` int(11) DEFAULT NULL,
  KEY `policy_policy_128_event_ref_0_idx` (`event_ref_0`),
  CONSTRAINT `policy_policy_128_event_ref_0_fk` FOREIGN KEY (`event_ref_0`) REFERENCES `event_asset_56` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  KEY `policy_policy_128_plan_ref_1_idx` (`plan_ref_1`),
  CONSTRAINT `policy_policy_128_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_payment_68` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `note_plan_129` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `shipment_0` longtext NOT NULL,
  `note_1` varchar(120) NOT NULL,
  `audit_2` longtext,
  `zone_3` datetime NOT NULL,
  `route_ref_0` int(11) DEFAULT NULL,
  KEY `note_plan_129_route_ref_0_idx` (`route_ref_0`),
  CONSTRAINT `note_plan_129_route_ref_0_fk` FOREIGN KEY (`route_ref_0`) REFERENCES `route_zone_47` (`id`),
  `session_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `note_plan_129_session_ref_1_fk` FOREIGN KEY (`session_ref_1`) REFERENCES `session_order_38` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `policy_claim_130` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_0` decimal(12,2) NOT NULL,
  `ticket_1` char(36),
  `batch_2` json NOT NULL,
  `session_3` date,
  `route_4` json,
  `asset_5` tinyint(1) NOT NULL,
  `session_6` json NOT NULL,
  `zone_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `policy_claim_130_zone_ref_0_fk` FOREIGN KEY (`zone_ref_0`) REFERENCES `zone_audit_123` (`id`),
  `audit_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `policy_claim_130_audit_ref_1_fk` FOREIGN KEY (`audit_ref_1`) REFERENCES `audit_ticket_4` (`id`),
  `session_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `policy_claim_130_session_ref_2_fk` FOREIGN KEY (`session_ref_2`) REFERENCES `session_order_38` (`id`),
  UNIQUE KEY `policy_claim_130_u2` (`order_0`, `ticket_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `account_order_131` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `batch_0` datetime,
  `account_1` longtext,
  `account_2` json NOT NULL,
  `order_3` json,
  `shipment_4` decimal(12,2) NOT NULL,
  `session_5` date,
  `route_6` varchar(120) NOT NULL,
  `grant_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `account_order_131_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_device_72` (`id`),
  UNIQUE KEY `account_order_131_u2` (`batch_0`, `account_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `account_order_131_u` ON `account_order_131` (`grant_ref_0`);
CREATE TABLE `order_ticket_132` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `audit_0` int(11) NOT NULL,
  `account_1` int(11),
  `zone_2` bigint(20),
  `account_ref_0` int(11) DEFAULT NULL,
  KEY `order_ticket_132_account_ref_0_idx` (`account_ref_0`),
  CONSTRAINT `order_ticket_132_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_lease_57` (`id`),
  `claim_ref_1` int(11) DEFAULT NULL,
  KEY `order_ticket_132_claim_ref_1_idx` (`claim_ref_1`),
  CONSTRAINT `order_ticket_132_claim_ref_1_fk` FOREIGN KEY (`claim_ref_1`) REFERENCES `claim_session_34` (`id`),
  `event_ref_2` int(11) DEFAULT NULL,
  KEY `order_ticket_132_event_ref_2_idx` (`event_ref_2`),
  CONSTRAINT `order_ticket_132_event_ref_2_fk` FOREIGN KEY (`event_ref_2`) REFERENCES `event_asset_56` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `order_device_133` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `zone_0` char(36) NOT NULL,
  `plan_1` decimal(12,2) NOT NULL,
  `ticket_2` varchar(120),
  `invoice_3` longtext,
  `event_4` tinyint(1),
  `grant_5` varchar(120),
  `lease_6` char(36) NOT NULL,
  `grant_ref_0` int(11) DEFAULT NULL,
  KEY `order_device_133_grant_ref_0_idx` (`grant_ref_0`),
  CONSTRAINT `order_device_133_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_device_72` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `order_device_133_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_asset_126` (`id`),
  `claim_ref_2` int(11) DEFAULT NULL,
  KEY `order_device_133_claim_ref_2_idx` (`claim_ref_2`),
  CONSTRAINT `order_device_133_claim_ref_2_fk` FOREIGN KEY (`claim_ref_2`) REFERENCES `claim_route_54` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `note_device_134` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `device_0` datetime,
  `session_1` bigint(20) NOT NULL,
  `session_2` tinyint(1),
  `event_3` tinyint(1),
  `policy_4` date NOT NULL,
  `audit_5` decimal(12,2) NOT NULL,
  `ticket_6` json,
  `plan_7` longtext,
  `order_ref_0` int(11) DEFAULT NULL,
  KEY `note_device_134_order_ref_0_idx` (`order_ref_0`),
  CONSTRAINT `note_device_134_order_ref_0_fk` FOREIGN KEY (`order_ref_0`) REFERENCES `order_event_67` (`id`),
  `policy_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `note_device_134_policy_ref_1_fk` FOREIGN KEY (`policy_ref_1`) REFERENCES `policy_grant_9` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `claim_ticket_135` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `payment_0` date,
  `plan_1` longtext,
  `note_2` tinyint(1) NOT NULL,
  `audit_3` varchar(120) NOT NULL,
  `order_ref_0` int(11) DEFAULT NULL,
  KEY `claim_ticket_135_order_ref_0_idx` (`order_ref_0`),
  CONSTRAINT `claim_ticket_135_order_ref_0_fk` FOREIGN KEY (`order_ref_0`) REFERENCES `order_device_133` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `claim_ticket_135_u` ON `claim_ticket_135` (`order_ref_0`);
CREATE TABLE `route_plan_136` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `asset_0` char(36),
  `asset_1` decimal(12,2),
  `batch_2` bigint(20) NOT NULL,
  `zone_3` char(36),
  `account_4` decimal(12,2),
  `batch_5` json NOT NULL,
  `event_6` date NOT NULL,
  `event_7` date NOT NULL,
  `route_8` decimal(12,2),
  `note_ref_0` int(11) DEFAULT NULL,
  KEY `route_plan_136_note_ref_0_idx` (`note_ref_0`),
  CONSTRAINT `route_plan_136_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_plan_129` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `zone_grant_137` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_0` longtext,
  `audit_1` date,
  `route_2` int(11) NOT NULL,
  `invoice_3` char(36) NOT NULL,
  `lease_4` date NOT NULL,
  `account_5` date,
  `lease_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `zone_grant_137_lease_ref_0_fk` FOREIGN KEY (`lease_ref_0`) REFERENCES `lease_zone_127` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_grant_138` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `zone_0` datetime,
  `note_1` tinyint(1),
  `payment_2` date,
  `grant_3` char(36),
  `session_ref_0` int(11) DEFAULT NULL,
  KEY `audit_grant_138_session_ref_0_idx` (`session_ref_0`),
  CONSTRAINT `audit_grant_138_session_ref_0_fk` FOREIGN KEY (`session_ref_0`) REFERENCES `session_plan_124` (`id`),
  `session_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `audit_grant_138_session_ref_1_fk` FOREIGN KEY (`session_ref_1`) REFERENCES `session_note_36` (`id`),
  `plan_ref_2` int(11) DEFAULT NULL,
  KEY `audit_grant_138_plan_ref_2_idx` (`plan_ref_2`),
  CONSTRAINT `audit_grant_138_plan_ref_2_fk` FOREIGN KEY (`plan_ref_2`) REFERENCES `plan_lease_33` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_batch_139` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `note_0` json NOT NULL,
  `policy_1` varchar(120) NOT NULL,
  `note_2` int(11) NOT NULL,
  `ticket_3` date,
  `invoice_4` json,
  `shipment_5` varchar(120),
  `lease_6` bigint(20),
  `session_7` datetime,
  `lease_8` char(36) NOT NULL,
  `shipment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `audit_batch_139_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_zone_115` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `invoice_plan_140` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `note_0` char(36),
  `claim_1` longtext NOT NULL,
  `session_2` decimal(12,2),
  `shipment_3` datetime NOT NULL,
  `payment_4` longtext,
  `audit_5` longtext NOT NULL,
  `audit_6` char(36) NOT NULL,
  `audit_7` char(36) NOT NULL,
  `route_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `invoice_plan_140_route_ref_0_fk` FOREIGN KEY (`route_ref_0`) REFERENCES `route_claim_94` (`id`),
  `note_ref_1` int(11) DEFAULT NULL,
  KEY `invoice_plan_140_note_ref_1_idx` (`note_ref_1`),
  CONSTRAINT `invoice_plan_140_note_ref_1_fk` FOREIGN KEY (`note_ref_1`) REFERENCES `note_plan_129` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `batch_invoice_141` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `session_0` tinyint(1) NOT NULL,
  `zone_1` json,
  `shipment_2` longtext NOT NULL,
  `account_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `batch_invoice_141_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_claim_24` (`id`),
  `audit_ref_1` int(11) DEFAULT NULL,
  KEY `batch_invoice_141_audit_ref_1_idx` (`audit_ref_1`),
  CONSTRAINT `batch_invoice_141_audit_ref_1_fk` FOREIGN KEY (`audit_ref_1`) REFERENCES `audit_zone_87` (`id`),
  `audit_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `batch_invoice_141_audit_ref_2_fk` FOREIGN KEY (`audit_ref_2`) REFERENCES `audit_zone_87` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `lease_lease_142` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `shipment_0` char(36) NOT NULL,
  `note_1` int(11),
  `route_2` json,
  `payment_3` int(11) NOT NULL,
  `audit_4` json NOT NULL,
  `invoice_5` date NOT NULL,
  `audit_6` bigint(20),
  `lease_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `lease_lease_142_lease_ref_0_fk` FOREIGN KEY (`lease_ref_0`) REFERENCES `lease_note_31` (`id`),
  `policy_ref_1` int(11) DEFAULT NULL,
  KEY `lease_lease_142_policy_ref_1_idx` (`policy_ref_1`),
  CONSTRAINT `lease_lease_142_policy_ref_1_fk` FOREIGN KEY (`policy_ref_1`) REFERENCES `policy_order_119` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `note_shipment_143` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `batch_0` longtext,
  `plan_1` char(36),
  `session_2` datetime,
  `policy_3` char(36) NOT NULL,
  `device_ref_0` int(11) DEFAULT NULL,
  KEY `note_shipment_143_device_ref_0_idx` (`device_ref_0`),
  CONSTRAINT `note_shipment_143_device_ref_0_fk` FOREIGN KEY (`device_ref_0`) REFERENCES `device_event_100` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `note_shipment_143_u` ON `note_shipment_143` (`device_ref_0`);
CREATE TABLE `event_order_144` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `ticket_0` varchar(120),
  `audit_1` bigint(20) NOT NULL,
  `grant_2` datetime,
  `ticket_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `event_order_144_ticket_ref_0_fk` FOREIGN KEY (`ticket_ref_0`) REFERENCES `ticket_audit_98` (`id`),
  `lease_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `event_order_144_lease_ref_1_fk` FOREIGN KEY (`lease_ref_1`) REFERENCES `lease_route_71` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_policy_145` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `plan_0` json NOT NULL,
  `policy_1` tinyint(1),
  `device_2` longtext NOT NULL,
  `zone_3` decimal(12,2),
  `route_4` datetime,
  `grant_5` char(36),
  `claim_6` decimal(12,2) NOT NULL,
  `lease_7` char(36),
  `device_8` json NOT NULL,
  `invoice_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `audit_policy_145_invoice_ref_0_fk` FOREIGN KEY (`invoice_ref_0`) REFERENCES `invoice_plan_140` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  KEY `audit_policy_145_account_ref_1_idx` (`account_ref_1`),
  CONSTRAINT `audit_policy_145_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_policy_19` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `ticket_event_146` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `audit_0` int(11),
  `shipment_1` json NOT NULL,
  `audit_2` tinyint(1),
  `lease_3` varchar(120),
  `asset_4` tinyint(1) NOT NULL,
  `audit_5` bigint(20) NOT NULL,
  `grant_6` varchar(120),
  `account_ref_0` int(11) DEFAULT NULL,
  KEY `ticket_event_146_account_ref_0_idx` (`account_ref_0`),
  CONSTRAINT `ticket_event_146_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_zone_25` (`id`),
  `audit_ref_1` int(11) DEFAULT NULL,
  KEY `ticket_event_146_audit_ref_1_idx` (`audit_ref_1`),
  CONSTRAINT `ticket_event_146_audit_ref_1_fk` FOREIGN KEY (`audit_ref_1`) REFERENCES `audit_device_64` (`id`),
  `event_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `ticket_event_146_event_ref_2_fk` FOREIGN KEY (`event_ref_2`) REFERENCES `event_zone_111` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `ticket_event_146_u` ON `ticket_event_146` (`event_ref_2`);
CREATE TABLE `order_device_147` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `device_0` bigint(20),
  `invoice_1` datetime,
  `order_2` json,
  `note_ref_0` int(11) DEFAULT NULL,
  KEY `order_device_147_note_ref_0_idx` (`note_ref_0`),
  CONSTRAINT `order_device_147_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_lease_102` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  KEY `order_device_147_plan_ref_1_idx` (`plan_ref_1`),
  CONSTRAINT `order_device_147_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_payment_58` (`id`),
  UNIQUE KEY `order_device_147_u2` (`device_0`, `invoice_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `route_device_148` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `plan_0` bigint(20),
  `ticket_1` int(11) NOT NULL,
  `plan_2` datetime,
  `grant_ref_0` int(11) DEFAULT NULL,
  KEY `route_device_148_grant_ref_0_idx` (`grant_ref_0`),
  CONSTRAINT `route_device_148_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_zone_108` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `shipment_shipment_149` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `payment_0` datetime,
  `shipment_1` int(11) NOT NULL,
  `claim_2` longtext,
  `plan_3` longtext,
  `asset_ref_0` int(11) DEFAULT NULL,
  KEY `shipment_shipment_149_asset_ref_0_idx` (`asset_ref_0`),
  CONSTRAINT `shipment_shipment_149_asset_ref_0_fk` FOREIGN KEY (`asset_ref_0`) REFERENCES `asset_note_69` (`id`),
  `order_ref_1` int(11) DEFAULT NULL,
  KEY `shipment_shipment_149_order_ref_1_idx` (`order_ref_1`),
  CONSTRAINT `shipment_shipment_149_order_ref_1_fk` FOREIGN KEY (`order_ref_1`) REFERENCES `order_device_133` (`id`),
  UNIQUE KEY `shipment_shipment_149_u2` (`payment_0`, `shipment_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';

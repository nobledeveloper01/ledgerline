CREATE TABLE `zone_grant_150` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `zone_0` decimal(12,2) NOT NULL,
  `route_1` int(11) NOT NULL,
  `payment_2` date,
  `ticket_3` bigint(20),
  `invoice_4` decimal(12,2) NOT NULL,
  `device_5` char(36) NOT NULL,
  `plan_6` char(36) NOT NULL,
  `session_7` varchar(120) NOT NULL,
  `claim_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `zone_grant_150_claim_ref_0_fk` FOREIGN KEY (`claim_ref_0`) REFERENCES `claim_note_41` (`id`),
  `lease_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `zone_grant_150_lease_ref_1_fk` FOREIGN KEY (`lease_ref_1`) REFERENCES `lease_account_76` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `route_audit_151` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `route_0` varchar(120) NOT NULL,
  `grant_1` int(11) NOT NULL,
  `claim_2` varchar(120),
  `shipment_3` int(11) NOT NULL,
  `claim_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `route_audit_151_claim_ref_0_fk` FOREIGN KEY (`claim_ref_0`) REFERENCES `claim_device_125` (`id`),
  `order_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `route_audit_151_order_ref_1_fk` FOREIGN KEY (`order_ref_1`) REFERENCES `order_event_67` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `session_grant_152` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `zone_0` bigint(20) NOT NULL,
  `route_1` bigint(20) NOT NULL,
  `grant_2` date NOT NULL,
  `audit_3` tinyint(1),
  `note_4` int(11),
  `order_5` date,
  `shipment_ref_0` int(11) DEFAULT NULL,
  KEY `session_grant_152_shipment_ref_0_idx` (`shipment_ref_0`),
  CONSTRAINT `session_grant_152_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_zone_115` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `payment_grant_153` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `route_0` bigint(20),
  `device_1` bigint(20) NOT NULL,
  `invoice_2` varchar(120),
  `policy_3` date NOT NULL,
  `invoice_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `payment_grant_153_invoice_ref_0_fk` FOREIGN KEY (`invoice_ref_0`) REFERENCES `invoice_payment_96` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  KEY `payment_grant_153_account_ref_1_idx` (`account_ref_1`),
  CONSTRAINT `payment_grant_153_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_lease_57` (`id`),
  `order_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `payment_grant_153_order_ref_2_fk` FOREIGN KEY (`order_ref_2`) REFERENCES `order_device_133` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `zone_event_154` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `payment_0` bigint(20),
  `asset_1` json,
  `zone_2` tinyint(1),
  `claim_3` json NOT NULL,
  `device_4` bigint(20),
  `route_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `zone_event_154_route_ref_0_fk` FOREIGN KEY (`route_ref_0`) REFERENCES `route_device_148` (`id`),
  `lease_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `zone_event_154_lease_ref_1_fk` FOREIGN KEY (`lease_ref_1`) REFERENCES `lease_lease_142` (`id`),
  `invoice_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `zone_event_154_invoice_ref_2_fk` FOREIGN KEY (`invoice_ref_2`) REFERENCES `invoice_plan_140` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `invoice_shipment_155` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `event_0` tinyint(1),
  `zone_1` tinyint(1),
  `invoice_2` decimal(12,2),
  `session_3` longtext,
  `claim_4` decimal(12,2) NOT NULL,
  `audit_5` decimal(12,2) NOT NULL,
  `route_ref_0` int(11) DEFAULT NULL,
  KEY `invoice_shipment_155_route_ref_0_idx` (`route_ref_0`),
  CONSTRAINT `invoice_shipment_155_route_ref_0_fk` FOREIGN KEY (`route_ref_0`) REFERENCES `route_zone_47` (`id`),
  `event_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `invoice_shipment_155_event_ref_1_fk` FOREIGN KEY (`event_ref_1`) REFERENCES `event_audit_15` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `ticket_lease_156` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `zone_0` varchar(120),
  `account_1` decimal(12,2),
  `batch_2` longtext,
  `note_3` tinyint(1) NOT NULL,
  `policy_4` tinyint(1),
  `order_5` int(11),
  `shipment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `ticket_lease_156_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_asset_14` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `grant_order_157` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `lease_0` varchar(120),
  `batch_1` bigint(20),
  `session_2` json,
  `batch_3` date,
  `audit_4` varchar(120),
  `order_5` int(11),
  `asset_6` varchar(120),
  `batch_7` varchar(120) NOT NULL,
  `account_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `grant_order_157_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_note_11` (`id`),
  `zone_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `grant_order_157_zone_ref_1_fk` FOREIGN KEY (`zone_ref_1`) REFERENCES `zone_device_101` (`id`),
  `audit_ref_2` int(11) DEFAULT NULL,
  KEY `grant_order_157_audit_ref_2_idx` (`audit_ref_2`),
  CONSTRAINT `grant_order_157_audit_ref_2_fk` FOREIGN KEY (`audit_ref_2`) REFERENCES `audit_grant_138` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `claim_batch_158` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `asset_0` tinyint(1) NOT NULL,
  `batch_1` bigint(20),
  `session_2` longtext,
  `plan_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `claim_batch_158_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_payment_68` (`id`),
  `lease_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `claim_batch_158_lease_ref_1_fk` FOREIGN KEY (`lease_ref_1`) REFERENCES `lease_account_76` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `payment_claim_159` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `claim_0` int(11) NOT NULL,
  `note_1` date NOT NULL,
  `session_2` longtext,
  `ticket_3` int(11),
  `claim_4` int(11) NOT NULL,
  `account_5` datetime,
  `claim_6` date,
  `device_7` tinyint(1) NOT NULL,
  `order_8` datetime NOT NULL,
  `ticket_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `payment_claim_159_ticket_ref_0_fk` FOREIGN KEY (`ticket_ref_0`) REFERENCES `ticket_lease_156` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `batch_shipment_160` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `shipment_0` datetime,
  `lease_1` json,
  `payment_2` bigint(20) NOT NULL,
  `device_3` char(36) NOT NULL,
  `payment_4` tinyint(1) NOT NULL,
  `zone_5` date NOT NULL,
  `plan_ref_0` int(11) DEFAULT NULL,
  KEY `batch_shipment_160_plan_ref_0_idx` (`plan_ref_0`),
  CONSTRAINT `batch_shipment_160_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_device_26` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `batch_shipment_160_u` ON `batch_shipment_160` (`plan_ref_0`);
CREATE TABLE `claim_event_161` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `claim_0` json,
  `asset_1` longtext NOT NULL,
  `event_2` longtext,
  `plan_3` tinyint(1) NOT NULL,
  `lease_ref_0` int(11) DEFAULT NULL,
  KEY `claim_event_161_lease_ref_0_idx` (`lease_ref_0`),
  CONSTRAINT `claim_event_161_lease_ref_0_fk` FOREIGN KEY (`lease_ref_0`) REFERENCES `lease_note_31` (`id`),
  `audit_ref_1` int(11) DEFAULT NULL,
  KEY `claim_event_161_audit_ref_1_idx` (`audit_ref_1`),
  CONSTRAINT `claim_event_161_audit_ref_1_fk` FOREIGN KEY (`audit_ref_1`) REFERENCES `audit_device_29` (`id`),
  `zone_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `claim_event_161_zone_ref_2_fk` FOREIGN KEY (`zone_ref_2`) REFERENCES `zone_audit_123` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `device_grant_162` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `ticket_0` varchar(120) NOT NULL,
  `lease_1` datetime,
  `ticket_2` varchar(120) NOT NULL,
  `note_3` json NOT NULL,
  `invoice_4` decimal(12,2) NOT NULL,
  `payment_5` date,
  `note_6` decimal(12,2),
  `lease_7` longtext,
  `session_8` date,
  `shipment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `device_grant_162_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_shipment_149` (`id`),
  `order_ref_1` int(11) DEFAULT NULL,
  KEY `device_grant_162_order_ref_1_idx` (`order_ref_1`),
  CONSTRAINT `device_grant_162_order_ref_1_fk` FOREIGN KEY (`order_ref_1`) REFERENCES `order_audit_103` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `device_grant_162_u` ON `device_grant_162` (`order_ref_1`);
CREATE TABLE `shipment_device_163` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `event_0` tinyint(1) NOT NULL,
  `shipment_1` varchar(120) NOT NULL,
  `batch_2` int(11) NOT NULL,
  `audit_3` date,
  `audit_4` decimal(12,2) NOT NULL,
  `route_5` date NOT NULL,
  `route_6` bigint(20) NOT NULL,
  `asset_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `shipment_device_163_asset_ref_0_fk` FOREIGN KEY (`asset_ref_0`) REFERENCES `asset_shipment_78` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `account_grant_164` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `session_0` varchar(120),
  `payment_1` tinyint(1),
  `payment_2` varchar(120) NOT NULL,
  `plan_3` tinyint(1),
  `grant_4` datetime NOT NULL,
  `zone_5` date NOT NULL,
  `ticket_6` int(11),
  `shipment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `account_grant_164_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_account_2` (`id`),
  `ticket_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `account_grant_164_ticket_ref_1_fk` FOREIGN KEY (`ticket_ref_1`) REFERENCES `ticket_lease_156` (`id`),
  `grant_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `account_grant_164_grant_ref_2_fk` FOREIGN KEY (`grant_ref_2`) REFERENCES `grant_invoice_70` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `invoice_device_165` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `order_0` json,
  `shipment_1` bigint(20),
  `asset_2` date,
  `order_3` varchar(120) NOT NULL,
  `account_4` bigint(20),
  `zone_5` json NOT NULL,
  `route_6` decimal(12,2),
  `account_7` varchar(120) NOT NULL,
  `shipment_8` json NOT NULL,
  `order_ref_0` int(11) DEFAULT NULL,
  KEY `invoice_device_165_order_ref_0_idx` (`order_ref_0`),
  CONSTRAINT `invoice_device_165_order_ref_0_fk` FOREIGN KEY (`order_ref_0`) REFERENCES `order_event_67` (`id`),
  `invoice_ref_1` int(11) DEFAULT NULL,
  KEY `invoice_device_165_invoice_ref_1_idx` (`invoice_ref_1`),
  CONSTRAINT `invoice_device_165_invoice_ref_1_fk` FOREIGN KEY (`invoice_ref_1`) REFERENCES `invoice_payment_96` (`id`),
  `lease_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `invoice_device_165_lease_ref_2_fk` FOREIGN KEY (`lease_ref_2`) REFERENCES `lease_note_83` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `session_event_166` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `asset_0` json,
  `claim_1` decimal(12,2),
  `event_2` date,
  `batch_3` varchar(120),
  `zone_4` char(36),
  `session_5` bigint(20) NOT NULL,
  `zone_6` decimal(12,2) NOT NULL,
  `device_7` date NOT NULL,
  `plan_8` varchar(120) NOT NULL,
  `event_ref_0` int(11) DEFAULT NULL,
  KEY `session_event_166_event_ref_0_idx` (`event_ref_0`),
  CONSTRAINT `session_event_166_event_ref_0_fk` FOREIGN KEY (`event_ref_0`) REFERENCES `event_asset_21` (`id`),
  `shipment_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `session_event_166_shipment_ref_1_fk` FOREIGN KEY (`shipment_ref_1`) REFERENCES `shipment_account_35` (`id`),
  `ticket_ref_2` int(11) DEFAULT NULL,
  KEY `session_event_166_ticket_ref_2_idx` (`ticket_ref_2`),
  CONSTRAINT `session_event_166_ticket_ref_2_fk` FOREIGN KEY (`ticket_ref_2`) REFERENCES `ticket_claim_22` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `policy_zone_167` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `device_0` date NOT NULL,
  `grant_1` longtext,
  `session_2` char(36) NOT NULL,
  `invoice_3` char(36),
  `order_ref_0` int(11) DEFAULT NULL,
  KEY `policy_zone_167_order_ref_0_idx` (`order_ref_0`),
  CONSTRAINT `policy_zone_167_order_ref_0_fk` FOREIGN KEY (`order_ref_0`) REFERENCES `order_session_74` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `zone_payment_168` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `grant_0` longtext,
  `route_1` varchar(120),
  `lease_2` datetime,
  `claim_3` decimal(12,2),
  `audit_4` char(36) NOT NULL,
  `policy_ref_0` int(11) DEFAULT NULL,
  KEY `zone_payment_168_policy_ref_0_idx` (`policy_ref_0`),
  CONSTRAINT `zone_payment_168_policy_ref_0_fk` FOREIGN KEY (`policy_ref_0`) REFERENCES `policy_policy_128` (`id`),
  `batch_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `zone_payment_168_batch_ref_1_fk` FOREIGN KEY (`batch_ref_1`) REFERENCES `batch_shipment_160` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `payment_invoice_169` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `lease_0` varchar(120),
  `claim_1` varchar(120) NOT NULL,
  `event_2` bigint(20),
  `route_3` tinyint(1),
  `route_4` json NOT NULL,
  `grant_5` longtext,
  `payment_6` int(11) NOT NULL,
  `grant_7` bigint(20) NOT NULL,
  `invoice_8` json NOT NULL,
  `lease_ref_0` int(11) DEFAULT NULL,
  KEY `payment_invoice_169_lease_ref_0_idx` (`lease_ref_0`),
  CONSTRAINT `payment_invoice_169_lease_ref_0_fk` FOREIGN KEY (`lease_ref_0`) REFERENCES `lease_zone_127` (`id`),
  UNIQUE KEY `payment_invoice_169_u2` (`lease_0`, `claim_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `grant_plan_170` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `ticket_0` tinyint(1) NOT NULL,
  `asset_1` bigint(20),
  `invoice_2` char(36) NOT NULL,
  `batch_3` int(11),
  `payment_4` date,
  `account_5` datetime NOT NULL,
  `account_6` int(11) NOT NULL,
  `session_7` varchar(120) NOT NULL,
  `audit_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `grant_plan_170_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_payment_45` (`id`),
  `route_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `grant_plan_170_route_ref_1_fk` FOREIGN KEY (`route_ref_1`) REFERENCES `route_zone_84` (`id`),
  `shipment_ref_2` int(11) DEFAULT NULL,
  KEY `grant_plan_170_shipment_ref_2_idx` (`shipment_ref_2`),
  CONSTRAINT `grant_plan_170_shipment_ref_2_fk` FOREIGN KEY (`shipment_ref_2`) REFERENCES `shipment_claim_85` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `batch_payment_171` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `invoice_0` datetime,
  `asset_1` decimal(12,2) NOT NULL,
  `invoice_2` json NOT NULL,
  `asset_3` datetime NOT NULL,
  `asset_4` char(36),
  `note_5` varchar(120) NOT NULL,
  `grant_6` int(11),
  `policy_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `batch_payment_171_policy_ref_0_fk` FOREIGN KEY (`policy_ref_0`) REFERENCES `policy_order_119` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `batch_payment_171_u` ON `batch_payment_171` (`policy_ref_0`);
CREATE TABLE `session_invoice_172` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `claim_0` char(36) NOT NULL,
  `asset_1` int(11) NOT NULL,
  `grant_2` json NOT NULL,
  `batch_3` varchar(120),
  `asset_4` date,
  `account_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `session_invoice_172_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_audit_12` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `order_zone_173` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `policy_0` decimal(12,2) NOT NULL,
  `session_1` json NOT NULL,
  `lease_2` char(36) NOT NULL,
  `batch_3` tinyint(1) NOT NULL,
  `claim_ref_0` int(11) DEFAULT NULL,
  KEY `order_zone_173_claim_ref_0_idx` (`claim_ref_0`),
  CONSTRAINT `order_zone_173_claim_ref_0_fk` FOREIGN KEY (`claim_ref_0`) REFERENCES `claim_audit_51` (`id`),
  `route_ref_1` int(11) DEFAULT NULL,
  KEY `order_zone_173_route_ref_1_idx` (`route_ref_1`),
  CONSTRAINT `order_zone_173_route_ref_1_fk` FOREIGN KEY (`route_ref_1`) REFERENCES `route_claim_94` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `account_payment_174` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `grant_0` tinyint(1) NOT NULL,
  `order_1` tinyint(1),
  `invoice_2` date NOT NULL,
  `account_3` bigint(20) NOT NULL,
  `order_4` date NOT NULL,
  `claim_5` varchar(120) NOT NULL,
  `zone_6` decimal(12,2),
  `note_ref_0` int(11) DEFAULT NULL,
  KEY `account_payment_174_note_ref_0_idx` (`note_ref_0`),
  CONSTRAINT `account_payment_174_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_device_63` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';

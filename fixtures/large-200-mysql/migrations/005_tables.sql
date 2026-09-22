CREATE TABLE `device_event_100` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `audit_0` tinyint(1),
  `session_1` varchar(120),
  `session_2` json,
  `account_3` decimal(12,2) NOT NULL,
  `ticket_4` datetime NOT NULL,
  `grant_5` char(36),
  `batch_6` date,
  `event_7` varchar(120),
  `policy_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `device_event_100_policy_ref_0_fk` FOREIGN KEY (`policy_ref_0`) REFERENCES `policy_session_73` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `device_event_100_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_device_26` (`id`),
  UNIQUE KEY `device_event_100_u2` (`audit_0`, `session_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `zone_device_101` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `ticket_0` bigint(20),
  `ticket_1` date,
  `device_2` datetime,
  `note_3` decimal(12,2) NOT NULL,
  `asset_4` longtext NOT NULL,
  `account_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `zone_device_101_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_order_43` (`id`),
  `ticket_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `zone_device_101_ticket_ref_1_fk` FOREIGN KEY (`ticket_ref_1`) REFERENCES `ticket_note_37` (`id`),
  `account_ref_2` int(11) DEFAULT NULL,
  KEY `zone_device_101_account_ref_2_idx` (`account_ref_2`),
  CONSTRAINT `zone_device_101_account_ref_2_fk` FOREIGN KEY (`account_ref_2`) REFERENCES `account_claim_24` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `note_lease_102` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `session_0` tinyint(1) NOT NULL,
  `lease_1` tinyint(1),
  `audit_2` tinyint(1),
  `lease_3` datetime NOT NULL,
  `account_ref_0` int(11) DEFAULT NULL,
  KEY `note_lease_102_account_ref_0_idx` (`account_ref_0`),
  CONSTRAINT `note_lease_102_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_invoice_28` (`id`),
  `audit_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `note_lease_102_audit_ref_1_fk` FOREIGN KEY (`audit_ref_1`) REFERENCES `audit_payment_45` (`id`),
  `session_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `note_lease_102_session_ref_2_fk` FOREIGN KEY (`session_ref_2`) REFERENCES `session_route_53` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `order_audit_103` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `asset_0` date,
  `event_1` varchar(120) NOT NULL,
  `order_2` varchar(120),
  `route_3` datetime,
  `device_4` longtext NOT NULL,
  `event_5` decimal(12,2) NOT NULL,
  `plan_6` longtext NOT NULL,
  `policy_7` longtext NOT NULL,
  `grant_8` bigint(20),
  `account_ref_0` int(11) DEFAULT NULL,
  KEY `order_audit_103_account_ref_0_idx` (`account_ref_0`),
  CONSTRAINT `order_audit_103_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_note_11` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  KEY `order_audit_103_account_ref_1_idx` (`account_ref_1`),
  CONSTRAINT `order_audit_103_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_claim_24` (`id`),
  `grant_ref_2` int(11) DEFAULT NULL,
  KEY `order_audit_103_grant_ref_2_idx` (`grant_ref_2`),
  CONSTRAINT `order_audit_103_grant_ref_2_fk` FOREIGN KEY (`grant_ref_2`) REFERENCES `grant_invoice_70` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `account_note_104` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `asset_0` tinyint(1) NOT NULL,
  `shipment_1` tinyint(1),
  `note_2` tinyint(1) NOT NULL,
  `asset_3` date,
  `route_4` bigint(20),
  `audit_5` date NOT NULL,
  `plan_6` varchar(120) NOT NULL,
  `zone_7` decimal(12,2) NOT NULL,
  `asset_ref_0` int(11) DEFAULT NULL,
  KEY `account_note_104_asset_ref_0_idx` (`asset_ref_0`),
  CONSTRAINT `account_note_104_asset_ref_0_fk` FOREIGN KEY (`asset_ref_0`) REFERENCES `asset_note_69` (`id`),
  `grant_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `account_note_104_grant_ref_1_fk` FOREIGN KEY (`grant_ref_1`) REFERENCES `grant_invoice_1` (`id`),
  `asset_ref_2` int(11) DEFAULT NULL,
  KEY `account_note_104_asset_ref_2_idx` (`asset_ref_2`),
  CONSTRAINT `account_note_104_asset_ref_2_fk` FOREIGN KEY (`asset_ref_2`) REFERENCES `asset_shipment_60` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `account_audit_105` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `session_0` datetime,
  `ticket_1` int(11),
  `zone_2` longtext,
  `session_3` int(11),
  `audit_4` bigint(20),
  `account_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `account_audit_105_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_plan_20` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `route_event_106` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `plan_0` varchar(120),
  `invoice_1` tinyint(1) NOT NULL,
  `payment_2` date,
  `payment_3` int(11) NOT NULL,
  `audit_4` char(36) NOT NULL,
  `lease_5` decimal(12,2) NOT NULL,
  `zone_6` json NOT NULL,
  `claim_7` bigint(20),
  `claim_8` decimal(12,2),
  `account_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `route_event_106_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_lease_57` (`id`),
  `audit_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `route_event_106_audit_ref_1_fk` FOREIGN KEY (`audit_ref_1`) REFERENCES `audit_payment_45` (`id`),
  UNIQUE KEY `route_event_106_u2` (`plan_0`, `invoice_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `plan_batch_107` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `audit_0` decimal(12,2) NOT NULL,
  `asset_1` int(11) NOT NULL,
  `lease_2` decimal(12,2),
  `grant_3` bigint(20) NOT NULL,
  `policy_4` json,
  `policy_5` bigint(20) NOT NULL,
  `invoice_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `plan_batch_107_invoice_ref_0_fk` FOREIGN KEY (`invoice_ref_0`) REFERENCES `invoice_event_6` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `grant_zone_108` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `policy_0` json NOT NULL,
  `asset_1` tinyint(1) NOT NULL,
  `route_2` json NOT NULL,
  `route_3` char(36),
  `zone_4` longtext NOT NULL,
  `audit_5` longtext NOT NULL,
  `lease_6` bigint(20) NOT NULL,
  `shipment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `grant_zone_108_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_session_7` (`id`),
  `session_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `grant_zone_108_session_ref_1_fk` FOREIGN KEY (`session_ref_1`) REFERENCES `session_zone_18` (`id`),
  `plan_ref_2` int(11) DEFAULT NULL,
  KEY `grant_zone_108_plan_ref_2_idx` (`plan_ref_2`),
  CONSTRAINT `grant_zone_108_plan_ref_2_fk` FOREIGN KEY (`plan_ref_2`) REFERENCES `plan_payment_58` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `batch_plan_109` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `claim_0` date NOT NULL,
  `batch_1` tinyint(1) NOT NULL,
  `device_2` bigint(20) NOT NULL,
  `policy_3` varchar(120) NOT NULL,
  `order_4` json,
  `plan_5` varchar(120) NOT NULL,
  `lease_6` char(36) NOT NULL,
  `invoice_7` json,
  `asset_ref_0` int(11) DEFAULT NULL,
  KEY `batch_plan_109_asset_ref_0_idx` (`asset_ref_0`),
  CONSTRAINT `batch_plan_109_asset_ref_0_fk` FOREIGN KEY (`asset_ref_0`) REFERENCES `asset_shipment_60` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `lease_zone_110` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `asset_0` bigint(20),
  `device_1` int(11),
  `device_2` longtext NOT NULL,
  `session_3` int(11) NOT NULL,
  `asset_4` date,
  `event_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `lease_zone_110_event_ref_0_fk` FOREIGN KEY (`event_ref_0`) REFERENCES `event_policy_80` (`id`),
  UNIQUE KEY `lease_zone_110_u2` (`asset_0`, `device_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `event_zone_111` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `device_0` char(36) NOT NULL,
  `note_1` tinyint(1),
  `note_2` decimal(12,2),
  `note_3` varchar(120),
  `audit_4` tinyint(1),
  `grant_ref_0` int(11) DEFAULT NULL,
  KEY `event_zone_111_grant_ref_0_idx` (`grant_ref_0`),
  CONSTRAINT `event_zone_111_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_invoice_70` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  KEY `event_zone_111_plan_ref_1_idx` (`plan_ref_1`),
  CONSTRAINT `event_zone_111_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_policy_61` (`id`),
  `shipment_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `event_zone_111_shipment_ref_2_fk` FOREIGN KEY (`shipment_ref_2`) REFERENCES `shipment_asset_14` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `payment_invoice_112` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `asset_0` date,
  `audit_1` longtext,
  `device_2` json NOT NULL,
  `plan_3` tinyint(1) NOT NULL,
  `session_4` decimal(12,2),
  `route_5` varchar(120) NOT NULL,
  `shipment_6` date NOT NULL,
  `note_7` json,
  `account_8` bigint(20) NOT NULL,
  `plan_ref_0` int(11) DEFAULT NULL,
  KEY `payment_invoice_112_plan_ref_0_idx` (`plan_ref_0`),
  CONSTRAINT `payment_invoice_112_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_payment_68` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  KEY `payment_invoice_112_account_ref_1_idx` (`account_ref_1`),
  CONSTRAINT `payment_invoice_112_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_note_104` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `shipment_shipment_113` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `zone_0` decimal(12,2) NOT NULL,
  `claim_1` datetime,
  `device_2` date NOT NULL,
  `lease_3` bigint(20),
  `plan_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `shipment_shipment_113_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_payment_68` (`id`),
  UNIQUE KEY `shipment_shipment_113_u2` (`zone_0`, `claim_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `lease_event_114` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `route_0` decimal(12,2),
  `asset_1` decimal(12,2),
  `ticket_2` date NOT NULL,
  `zone_3` char(36),
  `account_4` varchar(120),
  `plan_5` longtext,
  `grant_ref_0` int(11) DEFAULT NULL,
  KEY `lease_event_114_grant_ref_0_idx` (`grant_ref_0`),
  CONSTRAINT `lease_event_114_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_batch_40` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `lease_event_114_u` ON `lease_event_114` (`grant_ref_0`);
CREATE TABLE `shipment_zone_115` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `policy_0` decimal(12,2),
  `policy_1` longtext NOT NULL,
  `claim_2` date NOT NULL,
  `ticket_3` date,
  `batch_4` int(11) NOT NULL,
  `payment_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `shipment_zone_115_payment_ref_0_fk` FOREIGN KEY (`payment_ref_0`) REFERENCES `payment_batch_95` (`id`),
  `batch_ref_1` int(11) DEFAULT NULL,
  KEY `shipment_zone_115_batch_ref_1_idx` (`batch_ref_1`),
  CONSTRAINT `shipment_zone_115_batch_ref_1_fk` FOREIGN KEY (`batch_ref_1`) REFERENCES `batch_event_48` (`id`),
  `route_ref_2` int(11) DEFAULT NULL,
  KEY `shipment_zone_115_route_ref_2_idx` (`route_ref_2`),
  CONSTRAINT `shipment_zone_115_route_ref_2_fk` FOREIGN KEY (`route_ref_2`) REFERENCES `route_zone_47` (`id`),
  UNIQUE KEY `shipment_zone_115_u2` (`policy_0`, `policy_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `invoice_plan_116` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `route_0` tinyint(1),
  `route_1` longtext NOT NULL,
  `order_2` datetime,
  `event_3` date NOT NULL,
  `audit_4` datetime,
  `audit_5` bigint(20),
  `account_6` json NOT NULL,
  `account_7` json,
  `asset_ref_0` int(11) DEFAULT NULL,
  KEY `invoice_plan_116_asset_ref_0_idx` (`asset_ref_0`),
  CONSTRAINT `invoice_plan_116_asset_ref_0_fk` FOREIGN KEY (`asset_ref_0`) REFERENCES `asset_shipment_10` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  KEY `invoice_plan_116_account_ref_1_idx` (`account_ref_1`),
  CONSTRAINT `invoice_plan_116_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_order_43` (`id`),
  UNIQUE KEY `invoice_plan_116_u2` (`route_0`, `route_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_payment_117` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `route_0` decimal(12,2) NOT NULL,
  `claim_1` longtext NOT NULL,
  `policy_2` tinyint(1),
  `invoice_3` longtext,
  `route_4` char(36) NOT NULL,
  `note_5` datetime,
  `shipment_6` longtext,
  `invoice_7` json NOT NULL,
  `grant_8` datetime NOT NULL,
  `batch_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `audit_payment_117_batch_ref_0_fk` FOREIGN KEY (`batch_ref_0`) REFERENCES `batch_batch_27` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `asset_audit_118` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `route_0` longtext,
  `event_1` tinyint(1) NOT NULL,
  `note_2` varchar(120) NOT NULL,
  `grant_3` date NOT NULL,
  `invoice_4` date,
  `policy_5` decimal(12,2),
  `plan_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `asset_audit_118_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_lease_33` (`id`),
  `audit_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `asset_audit_118_audit_ref_1_fk` FOREIGN KEY (`audit_ref_1`) REFERENCES `audit_ticket_3` (`id`),
  `audit_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `asset_audit_118_audit_ref_2_fk` FOREIGN KEY (`audit_ref_2`) REFERENCES `audit_device_29` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `asset_audit_118_u` ON `asset_audit_118` (`audit_ref_2`);
CREATE TABLE `policy_order_119` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `claim_0` json,
  `lease_1` int(11),
  `zone_2` decimal(12,2) NOT NULL,
  `plan_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `policy_order_119_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_lease_33` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `device_plan_120` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `order_0` decimal(12,2),
  `policy_1` bigint(20) NOT NULL,
  `grant_2` json,
  `event_3` date,
  `ticket_4` datetime NOT NULL,
  `note_5` varchar(120) NOT NULL,
  `session_6` char(36) NOT NULL,
  `plan_7` longtext,
  `shipment_ref_0` int(11) DEFAULT NULL,
  KEY `device_plan_120_shipment_ref_0_idx` (`shipment_ref_0`),
  CONSTRAINT `device_plan_120_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_account_2` (`id`),
  UNIQUE KEY `device_plan_120_u2` (`order_0`, `policy_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `claim_audit_121` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `payment_0` date,
  `invoice_1` decimal(12,2),
  `device_2` varchar(120) NOT NULL,
  `grant_3` varchar(120),
  `audit_4` tinyint(1) NOT NULL,
  `asset_5` json NOT NULL,
  `note_6` json,
  `zone_7` char(36),
  `policy_ref_0` int(11) DEFAULT NULL,
  KEY `claim_audit_121_policy_ref_0_idx` (`policy_ref_0`),
  CONSTRAINT `claim_audit_121_policy_ref_0_fk` FOREIGN KEY (`policy_ref_0`) REFERENCES `policy_session_73` (`id`),
  `grant_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `claim_audit_121_grant_ref_1_fk` FOREIGN KEY (`grant_ref_1`) REFERENCES `grant_invoice_70` (`id`),
  UNIQUE KEY `claim_audit_121_u2` (`payment_0`, `invoice_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `grant_policy_122` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `policy_0` char(36),
  `policy_1` datetime NOT NULL,
  `payment_2` bigint(20),
  `shipment_3` varchar(120) NOT NULL,
  `lease_4` varchar(120) NOT NULL,
  `claim_5` longtext,
  `claim_6` decimal(12,2) NOT NULL,
  `shipment_ref_0` int(11) DEFAULT NULL,
  KEY `grant_policy_122_shipment_ref_0_idx` (`shipment_ref_0`),
  CONSTRAINT `grant_policy_122_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_zone_115` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `zone_audit_123` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `grant_0` decimal(12,2),
  `audit_1` longtext NOT NULL,
  `session_2` tinyint(1) NOT NULL,
  `ticket_3` json,
  `grant_4` json,
  `lease_ref_0` int(11) DEFAULT NULL,
  KEY `zone_audit_123_lease_ref_0_idx` (`lease_ref_0`),
  CONSTRAINT `zone_audit_123_lease_ref_0_fk` FOREIGN KEY (`lease_ref_0`) REFERENCES `lease_account_76` (`id`),
  `shipment_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `zone_audit_123_shipment_ref_1_fk` FOREIGN KEY (`shipment_ref_1`) REFERENCES `shipment_session_7` (`id`),
  `account_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `zone_audit_123_account_ref_2_fk` FOREIGN KEY (`account_ref_2`) REFERENCES `account_audit_105` (`id`),
  UNIQUE KEY `zone_audit_123_u2` (`grant_0`, `audit_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `session_plan_124` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `event_0` int(11),
  `claim_1` int(11) NOT NULL,
  `lease_2` tinyint(1),
  `audit_ref_0` int(11) DEFAULT NULL,
  KEY `session_plan_124_audit_ref_0_idx` (`audit_ref_0`),
  CONSTRAINT `session_plan_124_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_ticket_3` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';

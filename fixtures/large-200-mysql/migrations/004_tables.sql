CREATE TABLE `payment_event_75` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `route_0` bigint(20) NOT NULL,
  `payment_1` decimal(12,2) NOT NULL,
  `claim_2` longtext,
  `zone_3` tinyint(1) NOT NULL,
  `lease_4` tinyint(1) NOT NULL,
  `policy_5` longtext NOT NULL,
  `payment_6` longtext NOT NULL,
  `note_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `payment_event_75_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_device_63` (`id`),
  `batch_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `payment_event_75_batch_ref_1_fk` FOREIGN KEY (`batch_ref_1`) REFERENCES `batch_batch_27` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `lease_account_76` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `payment_0` char(36) NOT NULL,
  `session_1` char(36),
  `account_2` char(36),
  `route_ref_0` int(11) DEFAULT NULL,
  KEY `lease_account_76_route_ref_0_idx` (`route_ref_0`),
  CONSTRAINT `lease_account_76_route_ref_0_fk` FOREIGN KEY (`route_ref_0`) REFERENCES `route_shipment_30` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `lease_account_76_u` ON `lease_account_76` (`route_ref_0`);
CREATE TABLE `order_device_77` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `session_0` date NOT NULL,
  `ticket_1` tinyint(1),
  `zone_2` bigint(20) NOT NULL,
  `shipment_3` int(11),
  `asset_4` varchar(120),
  `route_5` datetime NOT NULL,
  `account_ref_0` int(11) DEFAULT NULL,
  KEY `order_device_77_account_ref_0_idx` (`account_ref_0`),
  CONSTRAINT `order_device_77_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_audit_12` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `order_device_77_u` ON `order_device_77` (`account_ref_0`);
CREATE TABLE `asset_shipment_78` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `event_0` char(36),
  `grant_1` decimal(12,2),
  `policy_2` char(36) NOT NULL,
  `note_3` tinyint(1) NOT NULL,
  `batch_4` bigint(20) NOT NULL,
  `claim_5` json,
  `note_6` json,
  `shipment_7` json,
  `plan_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `asset_shipment_78_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_payment_58` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `asset_shipment_78_u` ON `asset_shipment_78` (`plan_ref_0`);
CREATE TABLE `shipment_route_79` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `asset_0` varchar(120),
  `event_1` longtext NOT NULL,
  `policy_2` tinyint(1) NOT NULL,
  `session_3` longtext NOT NULL,
  `account_4` longtext NOT NULL,
  `audit_5` json NOT NULL,
  `note_ref_0` int(11) DEFAULT NULL,
  KEY `shipment_route_79_note_ref_0_idx` (`note_ref_0`),
  CONSTRAINT `shipment_route_79_note_ref_0_fk` FOREIGN KEY (`note_ref_0`) REFERENCES `note_lease_50` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `shipment_route_79_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_payment_68` (`id`),
  `shipment_ref_2` int(11) DEFAULT NULL,
  KEY `shipment_route_79_shipment_ref_2_idx` (`shipment_ref_2`),
  CONSTRAINT `shipment_route_79_shipment_ref_2_fk` FOREIGN KEY (`shipment_ref_2`) REFERENCES `shipment_account_35` (`id`),
  UNIQUE KEY `shipment_route_79_u2` (`asset_0`, `event_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `event_policy_80` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `audit_0` char(36),
  `device_1` datetime NOT NULL,
  `session_2` json NOT NULL,
  `grant_ref_0` int(11) DEFAULT NULL,
  KEY `event_policy_80_grant_ref_0_idx` (`grant_ref_0`),
  CONSTRAINT `event_policy_80_grant_ref_0_fk` FOREIGN KEY (`grant_ref_0`) REFERENCES `grant_invoice_70` (`id`),
  `invoice_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `event_policy_80_invoice_ref_1_fk` FOREIGN KEY (`invoice_ref_1`) REFERENCES `invoice_lease_65` (`id`),
  `audit_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `event_policy_80_audit_ref_2_fk` FOREIGN KEY (`audit_ref_2`) REFERENCES `audit_device_29` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `device_route_81` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `zone_0` varchar(120) NOT NULL,
  `invoice_1` tinyint(1) NOT NULL,
  `ticket_2` decimal(12,2),
  `device_3` tinyint(1) NOT NULL,
  `device_4` int(11),
  `policy_5` json,
  `lease_6` json,
  `grant_7` datetime,
  `session_8` int(11),
  `plan_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `device_route_81_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_payment_58` (`id`),
  UNIQUE KEY `device_route_81_u2` (`zone_0`, `invoice_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `zone_invoice_82` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `lease_0` char(36),
  `event_1` int(11) NOT NULL,
  `order_2` date,
  `event_3` tinyint(1) NOT NULL,
  `plan_ref_0` int(11) DEFAULT NULL,
  KEY `zone_invoice_82_plan_ref_0_idx` (`plan_ref_0`),
  CONSTRAINT `zone_invoice_82_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_policy_61` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `lease_note_83` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `payment_0` tinyint(1),
  `ticket_1` bigint(20),
  `session_2` int(11),
  `ticket_3` longtext,
  `policy_ref_0` int(11) DEFAULT NULL,
  KEY `lease_note_83_policy_ref_0_idx` (`policy_ref_0`),
  CONSTRAINT `lease_note_83_policy_ref_0_fk` FOREIGN KEY (`policy_ref_0`) REFERENCES `policy_session_73` (`id`),
  `account_ref_1` int(11) DEFAULT NULL,
  KEY `lease_note_83_account_ref_1_idx` (`account_ref_1`),
  CONSTRAINT `lease_note_83_account_ref_1_fk` FOREIGN KEY (`account_ref_1`) REFERENCES `account_zone_25` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `route_zone_84` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `claim_0` datetime NOT NULL,
  `audit_1` int(11) NOT NULL,
  `grant_2` date,
  `claim_3` varchar(120),
  `route_4` datetime,
  `device_5` datetime,
  `claim_ref_0` int(11) DEFAULT NULL,
  KEY `route_zone_84_claim_ref_0_idx` (`claim_ref_0`),
  CONSTRAINT `route_zone_84_claim_ref_0_fk` FOREIGN KEY (`claim_ref_0`) REFERENCES `claim_session_34` (`id`),
  `policy_ref_1` int(11) DEFAULT NULL,
  KEY `route_zone_84_policy_ref_1_idx` (`policy_ref_1`),
  CONSTRAINT `route_zone_84_policy_ref_1_fk` FOREIGN KEY (`policy_ref_1`) REFERENCES `policy_plan_5` (`id`),
  `invoice_ref_2` int(11) DEFAULT NULL,
  KEY `route_zone_84_invoice_ref_2_idx` (`invoice_ref_2`),
  CONSTRAINT `route_zone_84_invoice_ref_2_fk` FOREIGN KEY (`invoice_ref_2`) REFERENCES `invoice_event_59` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `route_zone_84_u` ON `route_zone_84` (`invoice_ref_2`);
CREATE TABLE `shipment_claim_85` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `policy_0` decimal(12,2),
  `account_1` int(11) NOT NULL,
  `audit_2` longtext NOT NULL,
  `session_3` datetime NOT NULL,
  `device_4` date NOT NULL,
  `note_5` json NOT NULL,
  `zone_6` date NOT NULL,
  `order_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `shipment_claim_85_order_ref_0_fk` FOREIGN KEY (`order_ref_0`) REFERENCES `order_order_52` (`id`),
  UNIQUE KEY `shipment_claim_85_u2` (`policy_0`, `account_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `invoice_batch_86` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `zone_0` longtext,
  `asset_1` char(36) NOT NULL,
  `claim_2` int(11),
  `audit_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `invoice_batch_86_audit_ref_0_fk` FOREIGN KEY (`audit_ref_0`) REFERENCES `audit_device_64` (`id`),
  `invoice_ref_1` int(11) DEFAULT NULL,
  KEY `invoice_batch_86_invoice_ref_1_idx` (`invoice_ref_1`),
  CONSTRAINT `invoice_batch_86_invoice_ref_1_fk` FOREIGN KEY (`invoice_ref_1`) REFERENCES `invoice_event_59` (`id`),
  `audit_ref_2` int(11) DEFAULT NULL,
  KEY `invoice_batch_86_audit_ref_2_idx` (`audit_ref_2`),
  CONSTRAINT `invoice_batch_86_audit_ref_2_fk` FOREIGN KEY (`audit_ref_2`) REFERENCES `audit_shipment_16` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_zone_87` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `session_0` longtext,
  `session_1` tinyint(1) NOT NULL,
  `device_2` longtext,
  `order_3` bigint(20),
  `session_4` varchar(120) NOT NULL,
  `zone_5` char(36) NOT NULL,
  `lease_6` varchar(120) NOT NULL,
  `event_7` tinyint(1) NOT NULL,
  `session_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `audit_zone_87_session_ref_0_fk` FOREIGN KEY (`session_ref_0`) REFERENCES `session_note_36` (`id`),
  `note_ref_1` int(11) DEFAULT NULL,
  KEY `audit_zone_87_note_ref_1_idx` (`note_ref_1`),
  CONSTRAINT `audit_zone_87_note_ref_1_fk` FOREIGN KEY (`note_ref_1`) REFERENCES `note_session_55` (`id`),
  `batch_ref_2` int(11) DEFAULT NULL,
  KEY `audit_zone_87_batch_ref_2_idx` (`batch_ref_2`),
  CONSTRAINT `audit_zone_87_batch_ref_2_fk` FOREIGN KEY (`batch_ref_2`) REFERENCES `batch_policy_8` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `audit_zone_87_u` ON `audit_zone_87` (`batch_ref_2`);
CREATE TABLE `session_batch_88` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `policy_0` longtext NOT NULL,
  `route_1` datetime NOT NULL,
  `ticket_2` bigint(20) NOT NULL,
  `device_3` decimal(12,2),
  `claim_ref_0` int(11) DEFAULT NULL,
  KEY `session_batch_88_claim_ref_0_idx` (`claim_ref_0`),
  CONSTRAINT `session_batch_88_claim_ref_0_fk` FOREIGN KEY (`claim_ref_0`) REFERENCES `claim_event_32` (`id`),
  `route_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `session_batch_88_route_ref_1_fk` FOREIGN KEY (`route_ref_1`) REFERENCES `route_zone_47` (`id`),
  `ticket_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `session_batch_88_ticket_ref_2_fk` FOREIGN KEY (`ticket_ref_2`) REFERENCES `ticket_session_0` (`id`),
  UNIQUE KEY `session_batch_88_u2` (`policy_0`, `route_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `invoice_invoice_89` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `grant_0` json NOT NULL,
  `lease_1` char(36),
  `shipment_2` decimal(12,2),
  `account_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `invoice_invoice_89_account_ref_0_fk` FOREIGN KEY (`account_ref_0`) REFERENCES `account_order_43` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_claim_90` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `note_0` json,
  `shipment_1` varchar(120),
  `account_2` decimal(12,2) NOT NULL,
  `audit_3` bigint(20),
  `lease_4` tinyint(1) NOT NULL,
  `zone_5` longtext,
  `batch_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `audit_claim_90_batch_ref_0_fk` FOREIGN KEY (`batch_ref_0`) REFERENCES `batch_batch_27` (`id`),
  `claim_ref_1` int(11) DEFAULT NULL,
  KEY `audit_claim_90_claim_ref_1_idx` (`claim_ref_1`),
  CONSTRAINT `audit_claim_90_claim_ref_1_fk` FOREIGN KEY (`claim_ref_1`) REFERENCES `claim_event_32` (`id`),
  `plan_ref_2` int(11) DEFAULT NULL,
  KEY `audit_claim_90_plan_ref_2_idx` (`plan_ref_2`),
  CONSTRAINT `audit_claim_90_plan_ref_2_fk` FOREIGN KEY (`plan_ref_2`) REFERENCES `plan_lease_33` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_account_91` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `lease_0` longtext,
  `ticket_1` bigint(20),
  `policy_2` longtext,
  `event_3` int(11) NOT NULL,
  `lease_ref_0` int(11) DEFAULT NULL,
  KEY `audit_account_91_lease_ref_0_idx` (`lease_ref_0`),
  CONSTRAINT `audit_account_91_lease_ref_0_fk` FOREIGN KEY (`lease_ref_0`) REFERENCES `lease_note_31` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `audit_account_91_u` ON `audit_account_91` (`lease_ref_0`);
CREATE TABLE `account_invoice_92` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `claim_0` date NOT NULL,
  `ticket_1` tinyint(1),
  `batch_2` decimal(12,2) NOT NULL,
  `device_3` bigint(20),
  `note_4` bigint(20),
  `batch_5` char(36),
  `session_ref_0` int(11) DEFAULT NULL,
  KEY `account_invoice_92_session_ref_0_idx` (`session_ref_0`),
  CONSTRAINT `account_invoice_92_session_ref_0_fk` FOREIGN KEY (`session_ref_0`) REFERENCES `session_route_53` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `account_invoice_92_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_payment_58` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `audit_batch_93` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `route_0` varchar(120),
  `payment_1` varchar(120),
  `invoice_2` decimal(12,2) NOT NULL,
  `device_3` int(11),
  `route_4` date,
  `ticket_5` bigint(20),
  `note_6` datetime,
  `note_7` json,
  `batch_ref_0` int(11) DEFAULT NULL,
  KEY `audit_batch_93_batch_ref_0_idx` (`batch_ref_0`),
  CONSTRAINT `audit_batch_93_batch_ref_0_fk` FOREIGN KEY (`batch_ref_0`) REFERENCES `batch_batch_27` (`id`),
  `plan_ref_1` int(11) DEFAULT NULL,
  KEY `audit_batch_93_plan_ref_1_idx` (`plan_ref_1`),
  CONSTRAINT `audit_batch_93_plan_ref_1_fk` FOREIGN KEY (`plan_ref_1`) REFERENCES `plan_device_26` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `route_claim_94` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `asset_0` tinyint(1),
  `invoice_1` tinyint(1),
  `plan_2` bigint(20),
  `order_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `route_claim_94_order_ref_0_fk` FOREIGN KEY (`order_ref_0`) REFERENCES `order_order_52` (`id`),
  `session_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `route_claim_94_session_ref_1_fk` FOREIGN KEY (`session_ref_1`) REFERENCES `session_batch_66` (`id`),
  `note_ref_2` int(11) DEFAULT NULL,
  KEY `route_claim_94_note_ref_2_idx` (`note_ref_2`),
  CONSTRAINT `route_claim_94_note_ref_2_fk` FOREIGN KEY (`note_ref_2`) REFERENCES `note_policy_23` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `payment_batch_95` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `note_0` tinyint(1) NOT NULL,
  `plan_1` tinyint(1),
  `note_2` decimal(12,2),
  `shipment_ref_0` int(11) DEFAULT NULL,
  KEY `payment_batch_95_shipment_ref_0_idx` (`shipment_ref_0`),
  CONSTRAINT `payment_batch_95_shipment_ref_0_fk` FOREIGN KEY (`shipment_ref_0`) REFERENCES `shipment_claim_85` (`id`),
  `audit_ref_1` int(11) DEFAULT NULL,
  CONSTRAINT `payment_batch_95_audit_ref_1_fk` FOREIGN KEY (`audit_ref_1`) REFERENCES `audit_shipment_16` (`id`),
  `grant_ref_2` int(11) DEFAULT NULL,
  CONSTRAINT `payment_batch_95_grant_ref_2_fk` FOREIGN KEY (`grant_ref_2`) REFERENCES `grant_asset_62` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `invoice_payment_96` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `shipment_0` datetime NOT NULL,
  `audit_1` char(36) NOT NULL,
  `grant_2` int(11),
  `payment_3` char(36),
  `zone_4` longtext NOT NULL,
  `plan_ref_0` int(11) DEFAULT NULL,
  KEY `invoice_payment_96_plan_ref_0_idx` (`plan_ref_0`),
  CONSTRAINT `invoice_payment_96_plan_ref_0_fk` FOREIGN KEY (`plan_ref_0`) REFERENCES `plan_device_26` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `lease_policy_97` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `asset_0` datetime NOT NULL,
  `invoice_1` datetime NOT NULL,
  `lease_2` tinyint(1),
  `note_3` datetime NOT NULL,
  `route_4` longtext NOT NULL,
  `account_5` varchar(120),
  `device_6` varchar(120),
  `shipment_7` json,
  `invoice_8` date,
  `device_ref_0` int(11) DEFAULT NULL,
  KEY `lease_policy_97_device_ref_0_idx` (`device_ref_0`),
  CONSTRAINT `lease_policy_97_device_ref_0_fk` FOREIGN KEY (`device_ref_0`) REFERENCES `device_route_81` (`id`),
  UNIQUE KEY `lease_policy_97_u2` (`asset_0`, `invoice_1`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `lease_policy_97_u` ON `lease_policy_97` (`device_ref_0`);
CREATE TABLE `ticket_audit_98` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `lease_0` int(11),
  `ticket_1` date NOT NULL,
  `route_2` tinyint(1),
  `claim_3` char(36),
  `payment_4` varchar(120),
  `grant_5` longtext,
  `ticket_6` char(36) NOT NULL,
  `session_ref_0` int(11) DEFAULT NULL,
  KEY `ticket_audit_98_session_ref_0_idx` (`session_ref_0`),
  CONSTRAINT `ticket_audit_98_session_ref_0_fk` FOREIGN KEY (`session_ref_0`) REFERENCES `session_batch_88` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE TABLE `grant_account_99` (
  `id` int(11) NOT NULL PRIMARY KEY,
  `claim_0` int(11),
  `audit_1` date,
  `event_2` int(11) NOT NULL,
  `payment_3` json,
  `shipment_4` decimal(12,2),
  `claim_5` varchar(120),
  `ticket_6` json,
  `grant_7` bigint(20) NOT NULL,
  `session_ref_0` int(11) DEFAULT NULL,
  CONSTRAINT `grant_account_99_session_ref_0_fk` FOREIGN KEY (`session_ref_0`) REFERENCES `session_batch_88` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT 'generated';
CREATE UNIQUE INDEX `grant_account_99_u` ON `grant_account_99` (`session_ref_0`);

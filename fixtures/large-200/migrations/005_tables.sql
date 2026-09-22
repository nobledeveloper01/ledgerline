CREATE TABLE public.device_event_100 (
  id integer PRIMARY KEY,
  audit_0 boolean,
  session_1 varchar(120),
  session_2 jsonb,
  account_3 numeric(12,2) NOT NULL,
  ticket_4 timestamptz NOT NULL,
  grant_5 uuid,
  batch_6 date,
  event_7 varchar(120),
  policy_ref_0 integer,
  CONSTRAINT device_event_100_policy_ref_0_fk FOREIGN KEY (policy_ref_0) REFERENCES public.policy_session_73 (id),
  plan_ref_1 integer,
  CONSTRAINT device_event_100_plan_ref_1_fk FOREIGN KEY (plan_ref_1) REFERENCES public.plan_device_26 (id),
  UNIQUE (audit_0, session_1)
);
CREATE TABLE public.zone_device_101 (
  id integer PRIMARY KEY,
  ticket_0 bigint,
  ticket_1 date,
  device_2 timestamptz,
  note_3 numeric(12,2) NOT NULL,
  asset_4 text NOT NULL,
  account_ref_0 integer,
  CONSTRAINT zone_device_101_account_ref_0_fk FOREIGN KEY (account_ref_0) REFERENCES public.account_order_43 (id),
  ticket_ref_1 integer,
  CONSTRAINT zone_device_101_ticket_ref_1_fk FOREIGN KEY (ticket_ref_1) REFERENCES public.ticket_note_37 (id),
  account_ref_2 integer REFERENCES public.account_claim_24
);
CREATE TABLE public.note_lease_102 (
  id integer PRIMARY KEY,
  session_0 boolean NOT NULL,
  lease_1 boolean,
  audit_2 boolean,
  lease_3 timestamptz NOT NULL,
  account_ref_0 integer REFERENCES billing.account_invoice_28,
  audit_ref_1 integer,
  CONSTRAINT note_lease_102_audit_ref_1_fk FOREIGN KEY (audit_ref_1) REFERENCES public.audit_payment_45 (id),
  session_ref_2 integer,
  CONSTRAINT note_lease_102_session_ref_2_fk FOREIGN KEY (session_ref_2) REFERENCES public.session_route_53 (id)
);
CREATE TABLE public.order_audit_103 (
  id integer PRIMARY KEY,
  asset_0 date,
  event_1 varchar(120) NOT NULL,
  order_2 varchar(120),
  route_3 timestamptz,
  device_4 text NOT NULL,
  event_5 numeric(12,2) NOT NULL,
  plan_6 text NOT NULL,
  policy_7 text NOT NULL,
  grant_8 bigint,
  account_ref_0 integer REFERENCES ops.account_note_11,
  account_ref_1 integer REFERENCES public.account_claim_24,
  grant_ref_2 integer REFERENCES billing.grant_invoice_70
);
CREATE TABLE public.account_note_104 (
  id bigserial PRIMARY KEY,
  asset_0 boolean NOT NULL,
  shipment_1 boolean,
  note_2 boolean NOT NULL,
  asset_3 date,
  route_4 bigint,
  audit_5 date NOT NULL,
  plan_6 varchar(120) NOT NULL,
  zone_7 numeric(12,2) NOT NULL,
  asset_ref_0 integer REFERENCES public.asset_note_69,
  grant_ref_1 integer,
  CONSTRAINT account_note_104_grant_ref_1_fk FOREIGN KEY (grant_ref_1) REFERENCES public.grant_invoice_1 (id),
  asset_ref_2 integer REFERENCES public.asset_shipment_60
);
CREATE TABLE billing.account_audit_105 (
  id bigserial PRIMARY KEY,
  session_0 timestamptz,
  ticket_1 integer,
  zone_2 text,
  session_3 integer,
  audit_4 bigint,
  account_ref_0 integer,
  CONSTRAINT account_audit_105_account_ref_0_fk FOREIGN KEY (account_ref_0) REFERENCES public.account_plan_20 (id)
);
CREATE TABLE public.route_event_106 (
  id integer PRIMARY KEY,
  plan_0 varchar(120),
  invoice_1 boolean NOT NULL,
  payment_2 date,
  payment_3 integer NOT NULL,
  audit_4 uuid NOT NULL,
  lease_5 numeric(12,2) NOT NULL,
  zone_6 jsonb NOT NULL,
  claim_7 bigint,
  claim_8 numeric(12,2),
  account_ref_0 integer,
  CONSTRAINT route_event_106_account_ref_0_fk FOREIGN KEY (account_ref_0) REFERENCES public.account_lease_57 (id),
  audit_ref_1 integer,
  CONSTRAINT route_event_106_audit_ref_1_fk FOREIGN KEY (audit_ref_1) REFERENCES public.audit_payment_45 (id),
  UNIQUE (plan_0, invoice_1)
);
CREATE TABLE public.plan_batch_107 (
  id bigserial PRIMARY KEY,
  audit_0 numeric(12,2) NOT NULL,
  asset_1 integer NOT NULL,
  lease_2 numeric(12,2),
  grant_3 bigint NOT NULL,
  policy_4 jsonb,
  policy_5 bigint NOT NULL,
  invoice_ref_0 integer,
  CONSTRAINT plan_batch_107_invoice_ref_0_fk FOREIGN KEY (invoice_ref_0) REFERENCES public.invoice_event_6 (id)
);
CREATE TABLE public.grant_zone_108 (
  id integer PRIMARY KEY,
  policy_0 jsonb NOT NULL,
  asset_1 boolean NOT NULL,
  route_2 jsonb NOT NULL,
  route_3 uuid,
  zone_4 text NOT NULL,
  audit_5 text NOT NULL,
  lease_6 bigint NOT NULL,
  shipment_ref_0 integer,
  CONSTRAINT grant_zone_108_shipment_ref_0_fk FOREIGN KEY (shipment_ref_0) REFERENCES billing.shipment_session_7 (id),
  session_ref_1 integer,
  CONSTRAINT grant_zone_108_session_ref_1_fk FOREIGN KEY (session_ref_1) REFERENCES public.session_zone_18 (id),
  plan_ref_2 integer REFERENCES public.plan_payment_58
);
CREATE TABLE public.batch_plan_109 (
  id integer PRIMARY KEY,
  claim_0 date NOT NULL,
  batch_1 boolean NOT NULL,
  device_2 bigint NOT NULL,
  policy_3 varchar(120) NOT NULL,
  order_4 jsonb,
  plan_5 varchar(120) NOT NULL,
  lease_6 uuid NOT NULL,
  invoice_7 jsonb,
  asset_ref_0 integer REFERENCES public.asset_shipment_60
);
CREATE TABLE ops.lease_zone_110 (
  id bigserial PRIMARY KEY,
  asset_0 bigint,
  device_1 integer,
  device_2 text NOT NULL,
  session_3 integer NOT NULL,
  asset_4 date,
  event_ref_0 integer,
  CONSTRAINT lease_zone_110_event_ref_0_fk FOREIGN KEY (event_ref_0) REFERENCES public.event_policy_80 (id),
  UNIQUE (asset_0, device_1)
);
CREATE TABLE public.event_zone_111 (
  id bigserial PRIMARY KEY,
  device_0 uuid NOT NULL,
  note_1 boolean,
  note_2 numeric(12,2),
  note_3 varchar(120),
  audit_4 boolean,
  grant_ref_0 integer REFERENCES billing.grant_invoice_70,
  plan_ref_1 integer REFERENCES public.plan_policy_61,
  shipment_ref_2 integer,
  CONSTRAINT event_zone_111_shipment_ref_2_fk FOREIGN KEY (shipment_ref_2) REFERENCES billing.shipment_asset_14 (id)
);
CREATE TABLE billing.payment_invoice_112 (
  id bigserial PRIMARY KEY,
  asset_0 date,
  audit_1 text,
  device_2 jsonb NOT NULL,
  plan_3 boolean NOT NULL,
  session_4 numeric(12,2),
  route_5 varchar(120) NOT NULL,
  shipment_6 date NOT NULL,
  note_7 jsonb,
  account_8 bigint NOT NULL,
  plan_ref_0 integer REFERENCES public.plan_payment_68,
  account_ref_1 integer REFERENCES public.account_note_104
);
CREATE TABLE public.shipment_shipment_113 (
  id integer PRIMARY KEY,
  zone_0 numeric(12,2) NOT NULL,
  claim_1 timestamptz,
  device_2 date NOT NULL,
  lease_3 bigint,
  plan_ref_0 integer,
  CONSTRAINT shipment_shipment_113_plan_ref_0_fk FOREIGN KEY (plan_ref_0) REFERENCES public.plan_payment_68 (id),
  UNIQUE (zone_0, claim_1)
);
CREATE TABLE public.lease_event_114 (
  id bigserial PRIMARY KEY,
  route_0 numeric(12,2),
  asset_1 numeric(12,2),
  ticket_2 date NOT NULL,
  zone_3 uuid,
  account_4 varchar(120),
  plan_5 text,
  grant_ref_0 integer REFERENCES public.grant_batch_40
);
CREATE UNIQUE INDEX lease_event_114_u ON public.lease_event_114 (grant_ref_0);
CREATE TABLE public.shipment_zone_115 (
  id integer PRIMARY KEY,
  policy_0 numeric(12,2),
  policy_1 text NOT NULL,
  claim_2 date NOT NULL,
  ticket_3 date,
  batch_4 integer NOT NULL,
  payment_ref_0 integer,
  CONSTRAINT shipment_zone_115_payment_ref_0_fk FOREIGN KEY (payment_ref_0) REFERENCES public.payment_batch_95 (id),
  batch_ref_1 integer REFERENCES public.batch_event_48,
  route_ref_2 integer REFERENCES public.route_zone_47,
  UNIQUE (policy_0, policy_1)
);
CREATE TABLE public.invoice_plan_116 (
  id bigserial PRIMARY KEY,
  route_0 boolean,
  route_1 text NOT NULL,
  order_2 timestamptz,
  event_3 date NOT NULL,
  audit_4 timestamptz,
  audit_5 bigint,
  account_6 jsonb NOT NULL,
  account_7 jsonb,
  asset_ref_0 integer REFERENCES public.asset_shipment_10,
  account_ref_1 integer REFERENCES public.account_order_43,
  UNIQUE (route_0, route_1)
);
CREATE TABLE public.audit_payment_117 (
  id integer PRIMARY KEY,
  route_0 numeric(12,2) NOT NULL,
  claim_1 text NOT NULL,
  policy_2 boolean,
  invoice_3 text,
  route_4 uuid NOT NULL,
  note_5 timestamptz,
  shipment_6 text,
  invoice_7 jsonb NOT NULL,
  grant_8 timestamptz NOT NULL,
  batch_ref_0 integer,
  CONSTRAINT audit_payment_117_batch_ref_0_fk FOREIGN KEY (batch_ref_0) REFERENCES public.batch_batch_27 (id)
);
CREATE TABLE public.asset_audit_118 (
  id integer PRIMARY KEY,
  route_0 text,
  event_1 boolean NOT NULL,
  note_2 varchar(120) NOT NULL,
  grant_3 date NOT NULL,
  invoice_4 date,
  policy_5 numeric(12,2),
  plan_ref_0 integer,
  CONSTRAINT asset_audit_118_plan_ref_0_fk FOREIGN KEY (plan_ref_0) REFERENCES ops.plan_lease_33 (id),
  audit_ref_1 integer,
  CONSTRAINT asset_audit_118_audit_ref_1_fk FOREIGN KEY (audit_ref_1) REFERENCES public.audit_ticket_3 (id),
  audit_ref_2 integer,
  CONSTRAINT asset_audit_118_audit_ref_2_fk FOREIGN KEY (audit_ref_2) REFERENCES public.audit_device_29 (id)
);
CREATE UNIQUE INDEX asset_audit_118_u ON public.asset_audit_118 (audit_ref_2);
CREATE TABLE billing.policy_order_119 (
  id integer PRIMARY KEY,
  claim_0 jsonb,
  lease_1 integer,
  zone_2 numeric(12,2) NOT NULL,
  plan_ref_0 integer,
  CONSTRAINT policy_order_119_plan_ref_0_fk FOREIGN KEY (plan_ref_0) REFERENCES ops.plan_lease_33 (id)
);
CREATE TABLE public.device_plan_120 (
  id bigserial PRIMARY KEY,
  order_0 numeric(12,2),
  policy_1 bigint NOT NULL,
  grant_2 jsonb,
  event_3 date,
  ticket_4 timestamptz NOT NULL,
  note_5 varchar(120) NOT NULL,
  session_6 uuid NOT NULL,
  plan_7 text,
  shipment_ref_0 integer REFERENCES public.shipment_account_2,
  UNIQUE (order_0, policy_1)
);
CREATE TABLE ops.claim_audit_121 (
  id integer PRIMARY KEY,
  payment_0 date,
  invoice_1 numeric(12,2),
  device_2 varchar(120) NOT NULL,
  grant_3 varchar(120),
  audit_4 boolean NOT NULL,
  asset_5 jsonb NOT NULL,
  note_6 jsonb,
  zone_7 uuid,
  policy_ref_0 integer REFERENCES public.policy_session_73,
  grant_ref_1 integer,
  CONSTRAINT claim_audit_121_grant_ref_1_fk FOREIGN KEY (grant_ref_1) REFERENCES billing.grant_invoice_70 (id),
  UNIQUE (payment_0, invoice_1)
);
CREATE TABLE public.grant_policy_122 (
  id integer PRIMARY KEY,
  policy_0 uuid,
  policy_1 timestamptz NOT NULL,
  payment_2 bigint,
  shipment_3 varchar(120) NOT NULL,
  lease_4 varchar(120) NOT NULL,
  claim_5 text,
  claim_6 numeric(12,2) NOT NULL,
  shipment_ref_0 integer REFERENCES public.shipment_zone_115
);
CREATE TABLE public.zone_audit_123 (
  id integer PRIMARY KEY,
  grant_0 numeric(12,2),
  audit_1 text NOT NULL,
  session_2 boolean NOT NULL,
  ticket_3 jsonb,
  grant_4 jsonb,
  lease_ref_0 integer REFERENCES public.lease_account_76,
  shipment_ref_1 integer,
  CONSTRAINT zone_audit_123_shipment_ref_1_fk FOREIGN KEY (shipment_ref_1) REFERENCES billing.shipment_session_7 (id),
  account_ref_2 integer,
  CONSTRAINT zone_audit_123_account_ref_2_fk FOREIGN KEY (account_ref_2) REFERENCES billing.account_audit_105 (id),
  UNIQUE (grant_0, audit_1)
);
CREATE TABLE public.session_plan_124 (
  id integer PRIMARY KEY,
  event_0 integer,
  claim_1 integer NOT NULL,
  lease_2 boolean,
  audit_ref_0 integer REFERENCES public.audit_ticket_3
);

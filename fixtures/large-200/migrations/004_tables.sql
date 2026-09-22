CREATE TABLE public.payment_event_75 (
  id bigserial PRIMARY KEY,
  route_0 bigint NOT NULL,
  payment_1 numeric(12,2) NOT NULL,
  claim_2 text,
  zone_3 boolean NOT NULL,
  lease_4 boolean NOT NULL,
  policy_5 text NOT NULL,
  payment_6 text NOT NULL,
  note_ref_0 integer,
  CONSTRAINT payment_event_75_note_ref_0_fk FOREIGN KEY (note_ref_0) REFERENCES billing.note_device_63 (id),
  batch_ref_1 integer,
  CONSTRAINT payment_event_75_batch_ref_1_fk FOREIGN KEY (batch_ref_1) REFERENCES public.batch_batch_27 (id)
);
CREATE TABLE public.lease_account_76 (
  id bigserial PRIMARY KEY,
  payment_0 uuid NOT NULL,
  session_1 uuid,
  account_2 uuid,
  route_ref_0 integer REFERENCES public.route_shipment_30
);
CREATE UNIQUE INDEX lease_account_76_u ON public.lease_account_76 (route_ref_0);
CREATE TABLE billing.order_device_77 (
  id bigserial PRIMARY KEY,
  session_0 date NOT NULL,
  ticket_1 boolean,
  zone_2 bigint NOT NULL,
  shipment_3 integer,
  asset_4 varchar(120),
  route_5 timestamptz NOT NULL,
  account_ref_0 integer REFERENCES public.account_audit_12
);
CREATE UNIQUE INDEX order_device_77_u ON billing.order_device_77 (account_ref_0);
CREATE TABLE public.asset_shipment_78 (
  id bigserial PRIMARY KEY,
  event_0 uuid,
  grant_1 numeric(12,2),
  policy_2 uuid NOT NULL,
  note_3 boolean NOT NULL,
  batch_4 bigint NOT NULL,
  claim_5 jsonb,
  note_6 jsonb,
  shipment_7 jsonb,
  plan_ref_0 integer,
  CONSTRAINT asset_shipment_78_plan_ref_0_fk FOREIGN KEY (plan_ref_0) REFERENCES public.plan_payment_58 (id)
);
CREATE UNIQUE INDEX asset_shipment_78_u ON public.asset_shipment_78 (plan_ref_0);
CREATE TABLE public.shipment_route_79 (
  id integer PRIMARY KEY,
  asset_0 varchar(120),
  event_1 text NOT NULL,
  policy_2 boolean NOT NULL,
  session_3 text NOT NULL,
  account_4 text NOT NULL,
  audit_5 jsonb NOT NULL,
  note_ref_0 integer REFERENCES public.note_lease_50,
  plan_ref_1 integer,
  CONSTRAINT shipment_route_79_plan_ref_1_fk FOREIGN KEY (plan_ref_1) REFERENCES public.plan_payment_68 (id),
  shipment_ref_2 integer REFERENCES billing.shipment_account_35,
  UNIQUE (asset_0, event_1)
);
CREATE TABLE public.event_policy_80 (
  id integer PRIMARY KEY,
  audit_0 uuid,
  device_1 timestamptz NOT NULL,
  session_2 jsonb NOT NULL,
  grant_ref_0 integer REFERENCES billing.grant_invoice_70,
  invoice_ref_1 integer,
  CONSTRAINT event_policy_80_invoice_ref_1_fk FOREIGN KEY (invoice_ref_1) REFERENCES public.invoice_lease_65 (id),
  audit_ref_2 integer,
  CONSTRAINT event_policy_80_audit_ref_2_fk FOREIGN KEY (audit_ref_2) REFERENCES public.audit_device_29 (id)
);
CREATE TABLE public.device_route_81 (
  id integer PRIMARY KEY,
  zone_0 varchar(120) NOT NULL,
  invoice_1 boolean NOT NULL,
  ticket_2 numeric(12,2),
  device_3 boolean NOT NULL,
  device_4 integer,
  policy_5 jsonb,
  lease_6 jsonb,
  grant_7 timestamptz,
  session_8 integer,
  plan_ref_0 integer,
  CONSTRAINT device_route_81_plan_ref_0_fk FOREIGN KEY (plan_ref_0) REFERENCES public.plan_payment_58 (id),
  UNIQUE (zone_0, invoice_1)
);
CREATE TABLE public.zone_invoice_82 (
  id integer PRIMARY KEY,
  lease_0 uuid,
  event_1 integer NOT NULL,
  order_2 date,
  event_3 boolean NOT NULL,
  plan_ref_0 integer REFERENCES public.plan_policy_61
);
CREATE TABLE public.lease_note_83 (
  id integer PRIMARY KEY,
  payment_0 boolean,
  ticket_1 bigint,
  session_2 integer,
  ticket_3 text,
  policy_ref_0 integer REFERENCES public.policy_session_73,
  account_ref_1 integer REFERENCES public.account_zone_25
);
CREATE TABLE billing.route_zone_84 (
  id integer PRIMARY KEY,
  claim_0 timestamptz NOT NULL,
  audit_1 integer NOT NULL,
  grant_2 date,
  claim_3 varchar(120),
  route_4 timestamptz,
  device_5 timestamptz,
  claim_ref_0 integer REFERENCES public.claim_session_34,
  policy_ref_1 integer REFERENCES public.policy_plan_5,
  invoice_ref_2 integer REFERENCES public.invoice_event_59
);
CREATE UNIQUE INDEX route_zone_84_u ON billing.route_zone_84 (invoice_ref_2);
CREATE TABLE public.shipment_claim_85 (
  id integer PRIMARY KEY,
  policy_0 numeric(12,2),
  account_1 integer NOT NULL,
  audit_2 text NOT NULL,
  session_3 timestamptz NOT NULL,
  device_4 date NOT NULL,
  note_5 jsonb NOT NULL,
  zone_6 date NOT NULL,
  order_ref_0 integer,
  CONSTRAINT shipment_claim_85_order_ref_0_fk FOREIGN KEY (order_ref_0) REFERENCES public.order_order_52 (id),
  UNIQUE (policy_0, account_1)
);
CREATE TABLE public.invoice_batch_86 (
  id integer PRIMARY KEY,
  zone_0 text,
  asset_1 uuid NOT NULL,
  claim_2 integer,
  audit_ref_0 integer,
  CONSTRAINT invoice_batch_86_audit_ref_0_fk FOREIGN KEY (audit_ref_0) REFERENCES public.audit_device_64 (id),
  invoice_ref_1 integer REFERENCES public.invoice_event_59,
  audit_ref_2 integer REFERENCES public.audit_shipment_16
);
CREATE TABLE public.audit_zone_87 (
  id bigserial PRIMARY KEY,
  session_0 text,
  session_1 boolean NOT NULL,
  device_2 text,
  order_3 bigint,
  session_4 varchar(120) NOT NULL,
  zone_5 uuid NOT NULL,
  lease_6 varchar(120) NOT NULL,
  event_7 boolean NOT NULL,
  session_ref_0 integer,
  CONSTRAINT audit_zone_87_session_ref_0_fk FOREIGN KEY (session_ref_0) REFERENCES public.session_note_36 (id),
  note_ref_1 integer REFERENCES ops.note_session_55,
  batch_ref_2 integer REFERENCES public.batch_policy_8
);
CREATE UNIQUE INDEX audit_zone_87_u ON public.audit_zone_87 (batch_ref_2);
CREATE TABLE ops.session_batch_88 (
  id integer PRIMARY KEY,
  policy_0 text NOT NULL,
  route_1 timestamptz NOT NULL,
  ticket_2 bigint NOT NULL,
  device_3 numeric(12,2),
  claim_ref_0 integer REFERENCES public.claim_event_32,
  route_ref_1 integer,
  CONSTRAINT session_batch_88_route_ref_1_fk FOREIGN KEY (route_ref_1) REFERENCES public.route_zone_47 (id),
  ticket_ref_2 integer,
  CONSTRAINT session_batch_88_ticket_ref_2_fk FOREIGN KEY (ticket_ref_2) REFERENCES billing.ticket_session_0 (id),
  UNIQUE (policy_0, route_1)
);
CREATE TABLE public.invoice_invoice_89 (
  id bigserial PRIMARY KEY,
  grant_0 jsonb NOT NULL,
  lease_1 uuid,
  shipment_2 numeric(12,2),
  account_ref_0 integer,
  CONSTRAINT invoice_invoice_89_account_ref_0_fk FOREIGN KEY (account_ref_0) REFERENCES public.account_order_43 (id)
);
CREATE TABLE public.audit_claim_90 (
  id bigserial PRIMARY KEY,
  note_0 jsonb,
  shipment_1 varchar(120),
  account_2 numeric(12,2) NOT NULL,
  audit_3 bigint,
  lease_4 boolean NOT NULL,
  zone_5 text,
  batch_ref_0 integer,
  CONSTRAINT audit_claim_90_batch_ref_0_fk FOREIGN KEY (batch_ref_0) REFERENCES public.batch_batch_27 (id),
  claim_ref_1 integer REFERENCES public.claim_event_32,
  plan_ref_2 integer REFERENCES ops.plan_lease_33
);
CREATE TABLE billing.audit_account_91 (
  id integer PRIMARY KEY,
  lease_0 text,
  ticket_1 bigint,
  policy_2 text,
  event_3 integer NOT NULL,
  lease_ref_0 integer REFERENCES public.lease_note_31
);
CREATE UNIQUE INDEX audit_account_91_u ON billing.audit_account_91 (lease_ref_0);
CREATE TABLE public.account_invoice_92 (
  id integer PRIMARY KEY,
  claim_0 date NOT NULL,
  ticket_1 boolean,
  batch_2 numeric(12,2) NOT NULL,
  device_3 bigint,
  note_4 bigint,
  batch_5 uuid,
  session_ref_0 integer REFERENCES public.session_route_53,
  plan_ref_1 integer,
  CONSTRAINT account_invoice_92_plan_ref_1_fk FOREIGN KEY (plan_ref_1) REFERENCES public.plan_payment_58 (id)
);
CREATE TABLE public.audit_batch_93 (
  id integer PRIMARY KEY,
  route_0 varchar(120),
  payment_1 varchar(120),
  invoice_2 numeric(12,2) NOT NULL,
  device_3 integer,
  route_4 date,
  ticket_5 bigint,
  note_6 timestamptz,
  note_7 jsonb,
  batch_ref_0 integer REFERENCES public.batch_batch_27,
  plan_ref_1 integer REFERENCES public.plan_device_26
);
CREATE TABLE public.route_claim_94 (
  id integer PRIMARY KEY,
  asset_0 boolean,
  invoice_1 boolean,
  plan_2 bigint,
  order_ref_0 integer,
  CONSTRAINT route_claim_94_order_ref_0_fk FOREIGN KEY (order_ref_0) REFERENCES public.order_order_52 (id),
  session_ref_1 integer,
  CONSTRAINT route_claim_94_session_ref_1_fk FOREIGN KEY (session_ref_1) REFERENCES ops.session_batch_66 (id),
  note_ref_2 integer REFERENCES public.note_policy_23
);
CREATE TABLE public.payment_batch_95 (
  id bigserial PRIMARY KEY,
  note_0 boolean NOT NULL,
  plan_1 boolean,
  note_2 numeric(12,2),
  shipment_ref_0 integer REFERENCES public.shipment_claim_85,
  audit_ref_1 integer,
  CONSTRAINT payment_batch_95_audit_ref_1_fk FOREIGN KEY (audit_ref_1) REFERENCES public.audit_shipment_16 (id),
  grant_ref_2 integer,
  CONSTRAINT payment_batch_95_grant_ref_2_fk FOREIGN KEY (grant_ref_2) REFERENCES public.grant_asset_62 (id)
);
CREATE TABLE public.invoice_payment_96 (
  id integer PRIMARY KEY,
  shipment_0 timestamptz NOT NULL,
  audit_1 uuid NOT NULL,
  grant_2 integer,
  payment_3 uuid,
  zone_4 text NOT NULL,
  plan_ref_0 integer REFERENCES public.plan_device_26
);
CREATE TABLE public.lease_policy_97 (
  id integer PRIMARY KEY,
  asset_0 timestamptz NOT NULL,
  invoice_1 timestamptz NOT NULL,
  lease_2 boolean,
  note_3 timestamptz NOT NULL,
  route_4 text NOT NULL,
  account_5 varchar(120),
  device_6 varchar(120),
  shipment_7 jsonb,
  invoice_8 date,
  device_ref_0 integer REFERENCES public.device_route_81,
  UNIQUE (asset_0, invoice_1)
);
CREATE UNIQUE INDEX lease_policy_97_u ON public.lease_policy_97 (device_ref_0);
CREATE TABLE billing.ticket_audit_98 (
  id integer PRIMARY KEY,
  lease_0 integer,
  ticket_1 date NOT NULL,
  route_2 boolean,
  claim_3 uuid,
  payment_4 varchar(120),
  grant_5 text,
  ticket_6 uuid NOT NULL,
  session_ref_0 integer REFERENCES ops.session_batch_88
);
CREATE TABLE ops.grant_account_99 (
  id integer PRIMARY KEY,
  claim_0 integer,
  audit_1 date,
  event_2 integer NOT NULL,
  payment_3 jsonb,
  shipment_4 numeric(12,2),
  claim_5 varchar(120),
  ticket_6 jsonb,
  grant_7 bigint NOT NULL,
  session_ref_0 integer,
  CONSTRAINT grant_account_99_session_ref_0_fk FOREIGN KEY (session_ref_0) REFERENCES ops.session_batch_88 (id)
);
CREATE UNIQUE INDEX grant_account_99_u ON ops.grant_account_99 (session_ref_0);

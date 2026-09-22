CREATE SCHEMA billing;
CREATE SCHEMA ops;
CREATE TABLE billing.ticket_session_0 (
  id integer PRIMARY KEY,
  account_0 jsonb NOT NULL,
  order_1 integer,
  grant_2 timestamptz NOT NULL,
  payment_3 numeric(12,2),
  claim_4 boolean NOT NULL,
  audit_5 varchar(120) NOT NULL,
  order_6 uuid
);
CREATE UNIQUE INDEX ticket_session_0_u ON billing.ticket_session_0 (order_6);
CREATE TABLE public.grant_invoice_1 (
  id integer PRIMARY KEY,
  invoice_0 bigint,
  claim_1 integer,
  session_2 text,
  plan_3 varchar(120),
  batch_4 varchar(120) NOT NULL,
  audit_5 numeric(12,2) NOT NULL,
  ticket_ref_0 integer REFERENCES billing.ticket_session_0,
  ticket_ref_1 integer,
  CONSTRAINT grant_invoice_1_ticket_ref_1_fk FOREIGN KEY (ticket_ref_1) REFERENCES billing.ticket_session_0 (id),
  ticket_ref_2 integer REFERENCES billing.ticket_session_0,
  UNIQUE (invoice_0, claim_1)
);
CREATE TABLE public.shipment_account_2 (
  id integer PRIMARY KEY,
  invoice_0 timestamptz,
  audit_1 varchar(120) NOT NULL,
  zone_2 jsonb,
  lease_3 uuid,
  event_4 jsonb NOT NULL,
  note_5 date,
  ticket_6 integer NOT NULL,
  grant_ref_0 integer REFERENCES public.grant_invoice_1,
  grant_ref_1 integer,
  CONSTRAINT shipment_account_2_grant_ref_1_fk FOREIGN KEY (grant_ref_1) REFERENCES public.grant_invoice_1 (id),
  ticket_ref_2 integer REFERENCES billing.ticket_session_0
);
CREATE TABLE public.audit_ticket_3 (
  id integer PRIMARY KEY,
  asset_0 text,
  event_1 bigint NOT NULL,
  lease_2 uuid,
  claim_3 text,
  device_4 integer,
  policy_5 timestamptz,
  order_6 uuid NOT NULL,
  shipment_ref_0 integer REFERENCES public.shipment_account_2,
  ticket_ref_1 integer,
  CONSTRAINT audit_ticket_3_ticket_ref_1_fk FOREIGN KEY (ticket_ref_1) REFERENCES billing.ticket_session_0 (id),
  shipment_ref_2 integer,
  CONSTRAINT audit_ticket_3_shipment_ref_2_fk FOREIGN KEY (shipment_ref_2) REFERENCES public.shipment_account_2 (id)
);
CREATE UNIQUE INDEX audit_ticket_3_u ON public.audit_ticket_3 (shipment_ref_2);
CREATE TABLE public.audit_ticket_4 (
  id bigserial PRIMARY KEY,
  session_0 jsonb,
  device_1 varchar(120) NOT NULL,
  account_2 integer NOT NULL,
  claim_3 integer NOT NULL,
  lease_4 date NOT NULL,
  device_5 timestamptz NOT NULL,
  payment_6 integer,
  ticket_7 boolean NOT NULL,
  batch_8 uuid NOT NULL,
  audit_ref_0 integer REFERENCES public.audit_ticket_3
);
CREATE UNIQUE INDEX audit_ticket_4_u ON public.audit_ticket_4 (audit_ref_0);
CREATE TABLE public.policy_plan_5 (
  id integer PRIMARY KEY,
  note_0 varchar(120),
  event_1 integer,
  device_2 numeric(12,2),
  payment_3 text NOT NULL,
  grant_4 uuid NOT NULL,
  event_5 timestamptz NOT NULL,
  payment_6 date NOT NULL,
  ticket_ref_0 integer,
  CONSTRAINT policy_plan_5_ticket_ref_0_fk FOREIGN KEY (ticket_ref_0) REFERENCES billing.ticket_session_0 (id),
  grant_ref_1 integer REFERENCES public.grant_invoice_1,
  audit_ref_2 integer REFERENCES public.audit_ticket_4,
  UNIQUE (note_0, event_1)
);
CREATE TABLE public.invoice_event_6 (
  id integer PRIMARY KEY,
  shipment_0 numeric(12,2),
  asset_1 integer,
  lease_2 integer,
  grant_ref_0 integer REFERENCES public.grant_invoice_1,
  audit_ref_1 integer,
  CONSTRAINT invoice_event_6_audit_ref_1_fk FOREIGN KEY (audit_ref_1) REFERENCES public.audit_ticket_3 (id),
  policy_ref_2 integer,
  CONSTRAINT invoice_event_6_policy_ref_2_fk FOREIGN KEY (policy_ref_2) REFERENCES public.policy_plan_5 (id),
  UNIQUE (shipment_0, asset_1)
);
CREATE UNIQUE INDEX invoice_event_6_u ON public.invoice_event_6 (policy_ref_2);
CREATE TABLE billing.shipment_session_7 (
  id integer PRIMARY KEY,
  route_0 uuid NOT NULL,
  route_1 text NOT NULL,
  session_2 timestamptz NOT NULL,
  audit_3 jsonb,
  account_4 boolean,
  session_5 uuid NOT NULL,
  grant_6 integer,
  audit_ref_0 integer,
  CONSTRAINT shipment_session_7_audit_ref_0_fk FOREIGN KEY (audit_ref_0) REFERENCES public.audit_ticket_3 (id)
);
CREATE TABLE public.batch_policy_8 (
  id bigserial PRIMARY KEY,
  note_0 varchar(120) NOT NULL,
  batch_1 jsonb NOT NULL,
  invoice_2 uuid NOT NULL,
  route_3 jsonb NOT NULL,
  audit_4 uuid NOT NULL,
  asset_5 varchar(120) NOT NULL,
  audit_ref_0 integer REFERENCES public.audit_ticket_3
);
CREATE UNIQUE INDEX batch_policy_8_u ON public.batch_policy_8 (audit_ref_0);
CREATE TABLE public.policy_grant_9 (
  id bigserial PRIMARY KEY,
  zone_0 jsonb NOT NULL,
  claim_1 varchar(120) NOT NULL,
  shipment_2 jsonb NOT NULL,
  account_3 boolean NOT NULL,
  lease_4 jsonb NOT NULL,
  batch_5 integer,
  lease_6 timestamptz NOT NULL,
  audit_ref_0 integer,
  CONSTRAINT policy_grant_9_audit_ref_0_fk FOREIGN KEY (audit_ref_0) REFERENCES public.audit_ticket_3 (id)
);
CREATE TABLE public.asset_shipment_10 (
  id integer PRIMARY KEY,
  audit_0 jsonb,
  grant_1 bigint,
  batch_2 varchar(120) NOT NULL,
  batch_3 date NOT NULL,
  shipment_ref_0 integer REFERENCES public.shipment_account_2,
  ticket_ref_1 integer REFERENCES billing.ticket_session_0
);
CREATE TABLE ops.account_note_11 (
  id integer PRIMARY KEY,
  plan_0 timestamptz,
  shipment_1 numeric(12,2),
  payment_2 integer NOT NULL,
  session_3 uuid NOT NULL,
  asset_4 text,
  policy_5 integer NOT NULL,
  note_6 date NOT NULL,
  event_7 varchar(120) NOT NULL,
  shipment_ref_0 integer REFERENCES billing.shipment_session_7,
  asset_ref_1 integer REFERENCES public.asset_shipment_10,
  UNIQUE (plan_0, shipment_1)
);
CREATE TABLE public.account_audit_12 (
  id integer PRIMARY KEY,
  event_0 bigint,
  audit_1 text NOT NULL,
  batch_2 varchar(120) NOT NULL,
  device_3 timestamptz,
  ticket_4 text,
  session_5 bigint,
  lease_6 bigint NOT NULL,
  policy_7 varchar(120) NOT NULL,
  account_8 uuid,
  shipment_ref_0 integer,
  CONSTRAINT account_audit_12_shipment_ref_0_fk FOREIGN KEY (shipment_ref_0) REFERENCES billing.shipment_session_7 (id),
  UNIQUE (event_0, audit_1)
);
CREATE TABLE public.plan_note_13 (
  id integer PRIMARY KEY,
  payment_0 numeric(12,2) NOT NULL,
  shipment_1 varchar(120),
  shipment_2 date NOT NULL,
  invoice_3 timestamptz NOT NULL,
  batch_4 text NOT NULL,
  audit_ref_0 integer,
  CONSTRAINT plan_note_13_audit_ref_0_fk FOREIGN KEY (audit_ref_0) REFERENCES public.audit_ticket_4 (id),
  batch_ref_1 integer REFERENCES public.batch_policy_8
);
CREATE UNIQUE INDEX plan_note_13_u ON public.plan_note_13 (batch_ref_1);
CREATE TABLE billing.shipment_asset_14 (
  id bigserial PRIMARY KEY,
  invoice_0 integer,
  batch_1 text,
  session_2 bigint NOT NULL,
  grant_ref_0 integer REFERENCES public.grant_invoice_1,
  plan_ref_1 integer,
  CONSTRAINT shipment_asset_14_plan_ref_1_fk FOREIGN KEY (plan_ref_1) REFERENCES public.plan_note_13 (id),
  UNIQUE (invoice_0, batch_1)
);
CREATE TABLE public.event_audit_15 (
  id bigserial PRIMARY KEY,
  route_0 numeric(12,2),
  policy_1 date,
  batch_2 boolean NOT NULL,
  account_3 bigint,
  session_4 uuid NOT NULL,
  audit_5 timestamptz NOT NULL,
  invoice_6 boolean NOT NULL,
  policy_7 uuid,
  shipment_ref_0 integer,
  CONSTRAINT event_audit_15_shipment_ref_0_fk FOREIGN KEY (shipment_ref_0) REFERENCES billing.shipment_asset_14 (id),
  invoice_ref_1 integer,
  CONSTRAINT event_audit_15_invoice_ref_1_fk FOREIGN KEY (invoice_ref_1) REFERENCES public.invoice_event_6 (id),
  account_ref_2 integer REFERENCES ops.account_note_11
);
CREATE TABLE public.audit_shipment_16 (
  id integer PRIMARY KEY,
  event_0 integer,
  grant_1 uuid,
  asset_2 varchar(120),
  invoice_3 boolean NOT NULL,
  invoice_4 text NOT NULL,
  ticket_5 uuid NOT NULL,
  plan_6 numeric(12,2) NOT NULL,
  grant_ref_0 integer,
  CONSTRAINT audit_shipment_16_grant_ref_0_fk FOREIGN KEY (grant_ref_0) REFERENCES public.grant_invoice_1 (id),
  account_ref_1 integer REFERENCES public.account_audit_12
);
CREATE TABLE public.policy_grant_17 (
  id integer PRIMARY KEY,
  order_0 uuid,
  batch_1 text,
  device_2 integer,
  invoice_3 numeric(12,2) NOT NULL,
  asset_4 jsonb,
  audit_ref_0 integer REFERENCES public.audit_ticket_3
);
CREATE TABLE public.session_zone_18 (
  id bigserial PRIMARY KEY,
  order_0 jsonb NOT NULL,
  asset_1 numeric(12,2),
  zone_2 uuid NOT NULL,
  payment_3 varchar(120),
  route_4 timestamptz,
  order_5 bigint,
  grant_6 text,
  ticket_7 timestamptz NOT NULL,
  audit_8 numeric(12,2),
  audit_ref_0 integer REFERENCES public.audit_shipment_16,
  UNIQUE (order_0, asset_1)
);
CREATE TABLE public.account_policy_19 (
  id integer PRIMARY KEY,
  invoice_0 numeric(12,2),
  device_1 date,
  lease_2 boolean,
  payment_3 varchar(120) NOT NULL,
  audit_ref_0 integer,
  CONSTRAINT account_policy_19_audit_ref_0_fk FOREIGN KEY (audit_ref_0) REFERENCES public.audit_ticket_3 (id)
);
CREATE TABLE public.account_plan_20 (
  id bigserial PRIMARY KEY,
  invoice_0 text,
  shipment_1 numeric(12,2),
  lease_2 varchar(120),
  shipment_ref_0 integer,
  CONSTRAINT account_plan_20_shipment_ref_0_fk FOREIGN KEY (shipment_ref_0) REFERENCES billing.shipment_asset_14 (id)
);
CREATE TABLE billing.event_asset_21 (
  id integer PRIMARY KEY,
  note_0 date NOT NULL,
  shipment_1 date,
  order_2 text,
  shipment_3 boolean,
  plan_ref_0 integer REFERENCES public.plan_note_13
);
CREATE UNIQUE INDEX event_asset_21_u ON billing.event_asset_21 (plan_ref_0);
CREATE TABLE ops.ticket_claim_22 (
  id integer PRIMARY KEY,
  ticket_0 bigint,
  route_1 bigint NOT NULL,
  payment_2 text NOT NULL,
  session_ref_0 integer,
  CONSTRAINT ticket_claim_22_session_ref_0_fk FOREIGN KEY (session_ref_0) REFERENCES public.session_zone_18 (id),
  shipment_ref_1 integer REFERENCES public.shipment_account_2,
  UNIQUE (ticket_0, route_1)
);
CREATE TABLE public.note_policy_23 (
  id integer PRIMARY KEY,
  order_0 bigint,
  account_1 bigint NOT NULL,
  order_2 boolean NOT NULL,
  device_3 integer,
  grant_4 timestamptz,
  event_5 bigint,
  shipment_6 uuid,
  account_ref_0 integer REFERENCES ops.account_note_11
);
CREATE TABLE public.account_claim_24 (
  id bigserial PRIMARY KEY,
  plan_0 date,
  payment_1 numeric(12,2) NOT NULL,
  route_2 jsonb,
  device_3 bigint,
  grant_4 text NOT NULL,
  batch_5 numeric(12,2) NOT NULL,
  batch_6 bigint,
  shipment_7 boolean NOT NULL,
  event_ref_0 integer REFERENCES public.event_audit_15
);

CREATE TABLE public.account_zone_25 (
  id bigserial PRIMARY KEY,
  invoice_0 uuid NOT NULL,
  order_1 numeric(12,2) NOT NULL,
  device_2 integer,
  ticket_3 jsonb,
  invoice_4 boolean NOT NULL,
  plan_5 timestamptz,
  note_ref_0 integer REFERENCES public.note_policy_23,
  policy_ref_1 integer REFERENCES public.policy_grant_9
);
CREATE TABLE public.plan_device_26 (
  id integer PRIMARY KEY,
  event_0 text,
  plan_1 boolean NOT NULL,
  event_2 integer NOT NULL,
  lease_3 boolean,
  ticket_4 numeric(12,2) NOT NULL,
  policy_5 timestamptz NOT NULL,
  lease_6 jsonb NOT NULL,
  claim_7 uuid,
  payment_8 jsonb NOT NULL,
  account_ref_0 integer,
  CONSTRAINT plan_device_26_account_ref_0_fk FOREIGN KEY (account_ref_0) REFERENCES public.account_policy_19 (id),
  ticket_ref_1 integer REFERENCES billing.ticket_session_0
);
CREATE TABLE public.batch_batch_27 (
  id integer PRIMARY KEY,
  audit_0 date,
  invoice_1 uuid NOT NULL,
  session_2 jsonb,
  session_3 timestamptz,
  event_4 text,
  audit_5 jsonb,
  payment_6 integer,
  plan_7 integer,
  route_8 numeric(12,2),
  shipment_ref_0 integer,
  CONSTRAINT batch_batch_27_shipment_ref_0_fk FOREIGN KEY (shipment_ref_0) REFERENCES billing.shipment_session_7 (id),
  account_ref_1 integer REFERENCES public.account_zone_25
);
CREATE UNIQUE INDEX batch_batch_27_u ON public.batch_batch_27 (account_ref_1);
CREATE TABLE billing.account_invoice_28 (
  id bigserial PRIMARY KEY,
  invoice_0 varchar(120),
  policy_1 text NOT NULL,
  device_2 numeric(12,2) NOT NULL,
  invoice_3 text NOT NULL,
  policy_4 varchar(120),
  account_5 date NOT NULL,
  account_6 uuid NOT NULL,
  audit_ref_0 integer,
  CONSTRAINT account_invoice_28_audit_ref_0_fk FOREIGN KEY (audit_ref_0) REFERENCES public.audit_ticket_4 (id),
  shipment_ref_1 integer,
  CONSTRAINT account_invoice_28_shipment_ref_1_fk FOREIGN KEY (shipment_ref_1) REFERENCES public.shipment_account_2 (id),
  asset_ref_2 integer REFERENCES public.asset_shipment_10
);
CREATE TABLE public.audit_device_29 (
  id integer PRIMARY KEY,
  payment_0 boolean NOT NULL,
  claim_1 timestamptz NOT NULL,
  route_2 varchar(120) NOT NULL,
  grant_3 numeric(12,2) NOT NULL,
  route_4 timestamptz NOT NULL,
  invoice_5 varchar(120),
  payment_6 bigint,
  note_7 varchar(120) NOT NULL,
  account_ref_0 integer REFERENCES public.account_plan_20,
  batch_ref_1 integer,
  CONSTRAINT audit_device_29_batch_ref_1_fk FOREIGN KEY (batch_ref_1) REFERENCES public.batch_batch_27 (id)
);
CREATE TABLE public.route_shipment_30 (
  id bigserial PRIMARY KEY,
  shipment_0 uuid NOT NULL,
  event_1 jsonb NOT NULL,
  audit_2 bigint NOT NULL,
  shipment_3 numeric(12,2) NOT NULL,
  zone_4 text NOT NULL,
  policy_ref_0 integer REFERENCES public.policy_grant_9
);
CREATE TABLE public.lease_note_31 (
  id integer PRIMARY KEY,
  device_0 text NOT NULL,
  note_1 text NOT NULL,
  account_2 date,
  event_3 bigint,
  plan_4 date NOT NULL,
  note_ref_0 integer,
  CONSTRAINT lease_note_31_note_ref_0_fk FOREIGN KEY (note_ref_0) REFERENCES public.note_policy_23 (id)
);
CREATE TABLE public.claim_event_32 (
  id bigserial PRIMARY KEY,
  grant_0 integer,
  shipment_1 numeric(12,2) NOT NULL,
  zone_2 date NOT NULL,
  zone_3 varchar(120) NOT NULL,
  note_ref_0 integer REFERENCES public.note_policy_23,
  grant_ref_1 integer REFERENCES public.grant_invoice_1,
  plan_ref_2 integer REFERENCES public.plan_device_26
);
CREATE TABLE ops.plan_lease_33 (
  id integer PRIMARY KEY,
  payment_0 jsonb,
  zone_1 numeric(12,2),
  lease_2 integer,
  grant_3 uuid,
  event_4 date NOT NULL,
  order_5 text NOT NULL,
  event_6 jsonb,
  audit_ref_0 integer REFERENCES public.audit_ticket_3
);
CREATE UNIQUE INDEX plan_lease_33_u ON ops.plan_lease_33 (audit_ref_0);
CREATE TABLE public.claim_session_34 (
  id integer PRIMARY KEY,
  audit_0 timestamptz,
  ticket_1 varchar(120) NOT NULL,
  ticket_2 integer NOT NULL,
  claim_3 date,
  note_4 jsonb NOT NULL,
  account_ref_0 integer REFERENCES public.account_claim_24,
  account_ref_1 integer,
  CONSTRAINT claim_session_34_account_ref_1_fk FOREIGN KEY (account_ref_1) REFERENCES public.account_claim_24 (id),
  shipment_ref_2 integer,
  CONSTRAINT claim_session_34_shipment_ref_2_fk FOREIGN KEY (shipment_ref_2) REFERENCES billing.shipment_asset_14 (id)
);
CREATE TABLE billing.shipment_account_35 (
  id integer PRIMARY KEY,
  account_0 bigint NOT NULL,
  asset_1 boolean,
  device_2 boolean NOT NULL,
  zone_3 boolean,
  event_ref_0 integer REFERENCES billing.event_asset_21,
  account_ref_1 integer,
  CONSTRAINT shipment_account_35_account_ref_1_fk FOREIGN KEY (account_ref_1) REFERENCES public.account_plan_20 (id),
  shipment_ref_2 integer,
  CONSTRAINT shipment_account_35_shipment_ref_2_fk FOREIGN KEY (shipment_ref_2) REFERENCES billing.shipment_session_7 (id),
  UNIQUE (account_0, asset_1)
);
CREATE TABLE public.session_note_36 (
  id bigserial PRIMARY KEY,
  shipment_0 varchar(120) NOT NULL,
  payment_1 jsonb NOT NULL,
  event_2 bigint NOT NULL,
  shipment_3 date,
  device_4 integer NOT NULL,
  account_5 date,
  claim_6 varchar(120) NOT NULL,
  grant_7 text,
  account_ref_0 integer REFERENCES billing.account_invoice_28
);
CREATE TABLE public.ticket_note_37 (
  id bigserial PRIMARY KEY,
  invoice_0 integer,
  plan_1 text NOT NULL,
  ticket_2 integer,
  lease_3 text NOT NULL,
  shipment_4 timestamptz NOT NULL,
  plan_5 integer,
  event_6 jsonb,
  shipment_ref_0 integer,
  CONSTRAINT ticket_note_37_shipment_ref_0_fk FOREIGN KEY (shipment_ref_0) REFERENCES public.shipment_account_2 (id),
  plan_ref_1 integer REFERENCES ops.plan_lease_33
);
CREATE UNIQUE INDEX ticket_note_37_u ON public.ticket_note_37 (plan_ref_1);
CREATE TABLE public.session_order_38 (
  id integer PRIMARY KEY,
  payment_0 numeric(12,2) NOT NULL,
  lease_1 timestamptz,
  claim_2 integer,
  ticket_3 timestamptz,
  account_4 numeric(12,2) NOT NULL,
  grant_5 bigint NOT NULL,
  lease_6 timestamptz NOT NULL,
  zone_7 numeric(12,2) NOT NULL,
  shipment_ref_0 integer REFERENCES public.shipment_account_2
);
CREATE TABLE public.plan_grant_39 (
  id integer PRIMARY KEY,
  device_0 date NOT NULL,
  route_1 integer NOT NULL,
  zone_2 timestamptz,
  batch_ref_0 integer,
  CONSTRAINT plan_grant_39_batch_ref_0_fk FOREIGN KEY (batch_ref_0) REFERENCES public.batch_batch_27 (id),
  account_ref_1 integer REFERENCES public.account_audit_12,
  shipment_ref_2 integer REFERENCES billing.shipment_account_35,
  UNIQUE (device_0, route_1)
);
CREATE TABLE public.grant_batch_40 (
  id integer PRIMARY KEY,
  lease_0 varchar(120),
  plan_1 uuid NOT NULL,
  session_2 date NOT NULL,
  session_3 text,
  asset_4 varchar(120),
  batch_5 numeric(12,2),
  payment_6 bigint NOT NULL,
  device_7 uuid,
  route_ref_0 integer,
  CONSTRAINT grant_batch_40_route_ref_0_fk FOREIGN KEY (route_ref_0) REFERENCES public.route_shipment_30 (id),
  plan_ref_1 integer,
  CONSTRAINT grant_batch_40_plan_ref_1_fk FOREIGN KEY (plan_ref_1) REFERENCES public.plan_note_13 (id)
);
CREATE TABLE public.claim_note_41 (
  id bigserial PRIMARY KEY,
  policy_0 text NOT NULL,
  claim_1 timestamptz,
  invoice_2 numeric(12,2) NOT NULL,
  plan_3 numeric(12,2),
  event_4 numeric(12,2),
  plan_5 boolean,
  account_6 varchar(120) NOT NULL,
  payment_7 integer,
  payment_8 varchar(120),
  ticket_ref_0 integer REFERENCES ops.ticket_claim_22,
  grant_ref_1 integer,
  CONSTRAINT claim_note_41_grant_ref_1_fk FOREIGN KEY (grant_ref_1) REFERENCES public.grant_invoice_1 (id)
);
CREATE TABLE billing.asset_plan_42 (
  id integer PRIMARY KEY,
  plan_0 timestamptz NOT NULL,
  shipment_1 bigint NOT NULL,
  zone_2 numeric(12,2),
  shipment_3 bigint,
  route_4 bigint,
  device_5 integer NOT NULL,
  claim_6 uuid,
  session_ref_0 integer,
  CONSTRAINT asset_plan_42_session_ref_0_fk FOREIGN KEY (session_ref_0) REFERENCES public.session_note_36 (id)
);
CREATE UNIQUE INDEX asset_plan_42_u ON billing.asset_plan_42 (session_ref_0);
CREATE TABLE public.account_order_43 (
  id integer PRIMARY KEY,
  grant_0 timestamptz NOT NULL,
  order_1 uuid NOT NULL,
  shipment_2 boolean NOT NULL,
  invoice_3 jsonb,
  shipment_4 jsonb NOT NULL,
  asset_5 jsonb,
  zone_6 bigint NOT NULL,
  zone_7 boolean NOT NULL,
  event_8 numeric(12,2) NOT NULL,
  plan_ref_0 integer REFERENCES public.plan_note_13,
  session_ref_1 integer,
  CONSTRAINT account_order_43_session_ref_1_fk FOREIGN KEY (session_ref_1) REFERENCES public.session_note_36 (id),
  account_ref_2 integer,
  CONSTRAINT account_order_43_account_ref_2_fk FOREIGN KEY (account_ref_2) REFERENCES billing.account_invoice_28 (id)
);
CREATE TABLE ops.plan_asset_44 (
  id integer PRIMARY KEY,
  invoice_0 bigint,
  session_1 boolean NOT NULL,
  payment_2 jsonb,
  claim_ref_0 integer,
  CONSTRAINT plan_asset_44_claim_ref_0_fk FOREIGN KEY (claim_ref_0) REFERENCES public.claim_note_41 (id)
);
CREATE TABLE public.audit_payment_45 (
  id bigserial PRIMARY KEY,
  claim_0 jsonb,
  plan_1 integer,
  policy_2 timestamptz,
  claim_3 bigint NOT NULL,
  policy_4 varchar(120) NOT NULL,
  note_5 bigint NOT NULL,
  zone_6 text NOT NULL,
  device_7 text NOT NULL,
  plan_8 numeric(12,2),
  plan_ref_0 integer REFERENCES ops.plan_lease_33,
  account_ref_1 integer REFERENCES public.account_zone_25,
  plan_ref_2 integer REFERENCES ops.plan_lease_33
);
CREATE TABLE public.event_audit_46 (
  id integer PRIMARY KEY,
  claim_0 uuid,
  invoice_1 integer,
  ticket_2 timestamptz,
  device_3 text NOT NULL,
  route_4 integer,
  invoice_5 timestamptz NOT NULL,
  ticket_ref_0 integer REFERENCES ops.ticket_claim_22,
  UNIQUE (claim_0, invoice_1)
);
CREATE TABLE public.route_zone_47 (
  id integer PRIMARY KEY,
  event_0 numeric(12,2) NOT NULL,
  invoice_1 jsonb,
  order_2 date,
  asset_3 varchar(120) NOT NULL,
  zone_4 numeric(12,2) NOT NULL,
  zone_5 jsonb,
  invoice_6 integer NOT NULL,
  order_7 bigint,
  event_ref_0 integer REFERENCES public.event_audit_46,
  account_ref_1 integer REFERENCES public.account_audit_12,
  session_ref_2 integer,
  CONSTRAINT route_zone_47_session_ref_2_fk FOREIGN KEY (session_ref_2) REFERENCES public.session_note_36 (id)
);
CREATE TABLE public.batch_event_48 (
  id bigserial PRIMARY KEY,
  payment_0 text NOT NULL,
  payment_1 boolean NOT NULL,
  shipment_2 boolean,
  plan_3 integer NOT NULL,
  audit_4 integer,
  payment_5 bigint NOT NULL,
  audit_6 uuid,
  zone_7 numeric(12,2),
  shipment_ref_0 integer,
  CONSTRAINT batch_event_48_shipment_ref_0_fk FOREIGN KEY (shipment_ref_0) REFERENCES billing.shipment_account_35 (id)
);
CREATE TABLE billing.lease_order_49 (
  id integer PRIMARY KEY,
  asset_0 integer NOT NULL,
  policy_1 numeric(12,2) NOT NULL,
  claim_2 text NOT NULL,
  event_3 text,
  device_4 uuid,
  batch_5 numeric(12,2) NOT NULL,
  event_6 date,
  device_7 jsonb NOT NULL,
  shipment_ref_0 integer REFERENCES public.shipment_account_2
);

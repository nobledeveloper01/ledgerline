CREATE TABLE public.note_lease_50 (
  id integer PRIMARY KEY,
  payment_0 integer,
  audit_1 timestamptz,
  ticket_2 numeric(12,2) NOT NULL,
  device_3 bigint,
  asset_4 uuid NOT NULL,
  plan_5 bigint NOT NULL,
  asset_6 integer,
  claim_7 varchar(120),
  note_8 timestamptz NOT NULL,
  audit_ref_0 integer,
  CONSTRAINT note_lease_50_audit_ref_0_fk FOREIGN KEY (audit_ref_0) REFERENCES public.audit_ticket_4 (id),
  grant_ref_1 integer,
  CONSTRAINT note_lease_50_grant_ref_1_fk FOREIGN KEY (grant_ref_1) REFERENCES public.grant_batch_40 (id),
  ticket_ref_2 integer REFERENCES public.ticket_note_37
);
CREATE TABLE public.claim_audit_51 (
  id bigserial PRIMARY KEY,
  grant_0 jsonb NOT NULL,
  claim_1 integer NOT NULL,
  asset_2 boolean NOT NULL,
  audit_3 numeric(12,2),
  audit_4 boolean,
  audit_ref_0 integer,
  CONSTRAINT claim_audit_51_audit_ref_0_fk FOREIGN KEY (audit_ref_0) REFERENCES public.audit_device_29 (id)
);
CREATE UNIQUE INDEX claim_audit_51_u ON public.claim_audit_51 (audit_ref_0);
CREATE TABLE public.order_order_52 (
  id integer PRIMARY KEY,
  plan_0 timestamptz NOT NULL,
  policy_1 jsonb NOT NULL,
  route_2 bigint NOT NULL,
  account_ref_0 integer,
  CONSTRAINT order_order_52_account_ref_0_fk FOREIGN KEY (account_ref_0) REFERENCES public.account_order_43 (id),
  UNIQUE (plan_0, policy_1)
);
CREATE TABLE public.session_route_53 (
  id integer PRIMARY KEY,
  policy_0 boolean NOT NULL,
  payment_1 boolean,
  invoice_2 text,
  plan_3 date NOT NULL,
  invoice_4 boolean NOT NULL,
  zone_5 varchar(120) NOT NULL,
  invoice_6 integer NOT NULL,
  order_7 bigint,
  lease_8 uuid NOT NULL,
  grant_ref_0 integer REFERENCES public.grant_batch_40,
  policy_ref_1 integer REFERENCES public.policy_grant_9,
  account_ref_2 integer,
  CONSTRAINT session_route_53_account_ref_2_fk FOREIGN KEY (account_ref_2) REFERENCES public.account_claim_24 (id)
);
CREATE TABLE public.claim_route_54 (
  id bigserial PRIMARY KEY,
  policy_0 timestamptz NOT NULL,
  claim_1 integer NOT NULL,
  policy_2 uuid,
  order_3 varchar(120),
  shipment_4 numeric(12,2) NOT NULL,
  grant_5 varchar(120) NOT NULL,
  payment_6 numeric(12,2) NOT NULL,
  account_7 uuid,
  note_ref_0 integer,
  CONSTRAINT claim_route_54_note_ref_0_fk FOREIGN KEY (note_ref_0) REFERENCES public.note_policy_23 (id),
  account_ref_1 integer,
  CONSTRAINT claim_route_54_account_ref_1_fk FOREIGN KEY (account_ref_1) REFERENCES ops.account_note_11 (id)
);
CREATE TABLE ops.note_session_55 (
  id integer PRIMARY KEY,
  note_0 uuid NOT NULL,
  lease_1 boolean,
  policy_2 integer,
  ticket_ref_0 integer,
  CONSTRAINT note_session_55_ticket_ref_0_fk FOREIGN KEY (ticket_ref_0) REFERENCES ops.ticket_claim_22 (id),
  claim_ref_1 integer,
  CONSTRAINT note_session_55_claim_ref_1_fk FOREIGN KEY (claim_ref_1) REFERENCES public.claim_note_41 (id)
);
CREATE UNIQUE INDEX note_session_55_u ON ops.note_session_55 (claim_ref_1);
CREATE TABLE billing.event_asset_56 (
  id integer PRIMARY KEY,
  grant_0 jsonb,
  zone_1 uuid NOT NULL,
  asset_2 date,
  lease_3 text NOT NULL,
  batch_4 numeric(12,2),
  shipment_5 bigint NOT NULL,
  claim_6 bigint,
  session_ref_0 integer REFERENCES public.session_zone_18
);
CREATE TABLE public.account_lease_57 (
  id bigserial PRIMARY KEY,
  note_0 date,
  order_1 timestamptz NOT NULL,
  payment_2 text NOT NULL,
  lease_3 date,
  account_4 bigint NOT NULL,
  note_ref_0 integer REFERENCES public.note_lease_50,
  session_ref_1 integer REFERENCES public.session_route_53,
  ticket_ref_2 integer REFERENCES billing.ticket_session_0
);
CREATE TABLE public.plan_payment_58 (
  id integer PRIMARY KEY,
  ticket_0 timestamptz NOT NULL,
  event_1 uuid,
  order_2 numeric(12,2),
  order_3 jsonb NOT NULL,
  note_4 varchar(120) NOT NULL,
  zone_5 varchar(120),
  account_ref_0 integer REFERENCES public.account_claim_24
);
CREATE UNIQUE INDEX plan_payment_58_u ON public.plan_payment_58 (account_ref_0);
CREATE TABLE public.invoice_event_59 (
  id bigserial PRIMARY KEY,
  note_0 numeric(12,2) NOT NULL,
  lease_1 bigint NOT NULL,
  invoice_2 jsonb,
  route_3 numeric(12,2) NOT NULL,
  lease_4 date,
  plan_5 numeric(12,2),
  claim_6 date,
  ticket_7 bigint,
  ticket_ref_0 integer REFERENCES public.ticket_note_37,
  lease_ref_1 integer REFERENCES billing.lease_order_49,
  claim_ref_2 integer REFERENCES public.claim_event_32
);
CREATE TABLE public.asset_shipment_60 (
  id bigserial PRIMARY KEY,
  invoice_0 text NOT NULL,
  route_1 integer NOT NULL,
  plan_2 jsonb NOT NULL,
  policy_3 timestamptz NOT NULL,
  shipment_4 numeric(12,2) NOT NULL,
  zone_5 text,
  claim_6 timestamptz,
  policy_ref_0 integer,
  CONSTRAINT asset_shipment_60_policy_ref_0_fk FOREIGN KEY (policy_ref_0) REFERENCES public.policy_grant_9 (id),
  account_ref_1 integer,
  CONSTRAINT asset_shipment_60_account_ref_1_fk FOREIGN KEY (account_ref_1) REFERENCES public.account_policy_19 (id),
  lease_ref_2 integer REFERENCES billing.lease_order_49,
  UNIQUE (invoice_0, route_1)
);
CREATE TABLE public.plan_policy_61 (
  id integer PRIMARY KEY,
  account_0 timestamptz,
  batch_1 bigint,
  device_2 uuid,
  route_3 numeric(12,2),
  grant_4 boolean NOT NULL,
  plan_ref_0 integer REFERENCES public.plan_payment_58
);
CREATE TABLE public.grant_asset_62 (
  id integer PRIMARY KEY,
  plan_0 text NOT NULL,
  order_1 jsonb NOT NULL,
  lease_2 bigint NOT NULL,
  account_3 jsonb NOT NULL,
  session_ref_0 integer,
  CONSTRAINT grant_asset_62_session_ref_0_fk FOREIGN KEY (session_ref_0) REFERENCES public.session_route_53 (id),
  account_ref_1 integer REFERENCES billing.account_invoice_28,
  audit_ref_2 integer,
  CONSTRAINT grant_asset_62_audit_ref_2_fk FOREIGN KEY (audit_ref_2) REFERENCES public.audit_payment_45 (id)
);
CREATE UNIQUE INDEX grant_asset_62_u ON public.grant_asset_62 (audit_ref_2);
CREATE TABLE billing.note_device_63 (
  id integer PRIMARY KEY,
  ticket_0 uuid NOT NULL,
  payment_1 text,
  payment_2 text,
  session_3 numeric(12,2) NOT NULL,
  audit_4 bigint NOT NULL,
  zone_5 jsonb,
  zone_6 jsonb NOT NULL,
  order_7 boolean,
  lease_ref_0 integer,
  CONSTRAINT note_device_63_lease_ref_0_fk FOREIGN KEY (lease_ref_0) REFERENCES public.lease_note_31 (id),
  UNIQUE (ticket_0, payment_1)
);
CREATE TABLE public.audit_device_64 (
  id integer PRIMARY KEY,
  shipment_0 jsonb NOT NULL,
  ticket_1 integer,
  plan_2 uuid NOT NULL,
  invoice_3 boolean,
  claim_ref_0 integer,
  CONSTRAINT audit_device_64_claim_ref_0_fk FOREIGN KEY (claim_ref_0) REFERENCES public.claim_note_41 (id),
  shipment_ref_1 integer REFERENCES public.shipment_account_2
);
CREATE TABLE public.invoice_lease_65 (
  id bigserial PRIMARY KEY,
  batch_0 integer,
  event_1 boolean NOT NULL,
  invoice_2 date NOT NULL,
  route_3 uuid NOT NULL,
  account_4 timestamptz,
  account_5 bigint,
  session_6 numeric(12,2) NOT NULL,
  order_7 boolean,
  policy_8 bigint,
  order_ref_0 integer REFERENCES public.order_order_52,
  plan_ref_1 integer REFERENCES ops.plan_lease_33
);
CREATE UNIQUE INDEX invoice_lease_65_u ON public.invoice_lease_65 (plan_ref_1);
CREATE TABLE ops.session_batch_66 (
  id integer PRIMARY KEY,
  invoice_0 uuid,
  route_1 timestamptz NOT NULL,
  batch_2 text,
  shipment_3 jsonb,
  plan_4 numeric(12,2) NOT NULL,
  claim_5 bigint,
  route_6 jsonb NOT NULL,
  route_7 boolean NOT NULL,
  account_ref_0 integer,
  CONSTRAINT session_batch_66_account_ref_0_fk FOREIGN KEY (account_ref_0) REFERENCES billing.account_invoice_28 (id),
  plan_ref_1 integer,
  CONSTRAINT session_batch_66_plan_ref_1_fk FOREIGN KEY (plan_ref_1) REFERENCES public.plan_device_26 (id),
  UNIQUE (invoice_0, route_1)
);
CREATE TABLE public.order_event_67 (
  id integer PRIMARY KEY,
  ticket_0 boolean NOT NULL,
  claim_1 text,
  order_2 uuid,
  asset_3 numeric(12,2) NOT NULL,
  audit_4 varchar(120),
  shipment_5 jsonb,
  zone_6 boolean NOT NULL,
  zone_7 timestamptz NOT NULL,
  ticket_8 jsonb NOT NULL,
  claim_ref_0 integer REFERENCES public.claim_route_54,
  note_ref_1 integer,
  CONSTRAINT order_event_67_note_ref_1_fk FOREIGN KEY (note_ref_1) REFERENCES ops.note_session_55 (id),
  note_ref_2 integer REFERENCES billing.note_device_63
);
CREATE UNIQUE INDEX order_event_67_u ON public.order_event_67 (note_ref_2);
CREATE TABLE public.plan_payment_68 (
  id integer PRIMARY KEY,
  lease_0 integer NOT NULL,
  account_1 integer,
  order_2 bigint NOT NULL,
  device_3 text,
  device_4 varchar(120) NOT NULL,
  plan_5 uuid,
  asset_6 boolean,
  note_ref_0 integer REFERENCES ops.note_session_55,
  plan_ref_1 integer REFERENCES public.plan_note_13
);
CREATE TABLE public.asset_note_69 (
  id integer PRIMARY KEY,
  route_0 integer,
  note_1 boolean NOT NULL,
  batch_2 numeric(12,2) NOT NULL,
  payment_3 date NOT NULL,
  asset_4 jsonb,
  invoice_5 text NOT NULL,
  batch_ref_0 integer,
  CONSTRAINT asset_note_69_batch_ref_0_fk FOREIGN KEY (batch_ref_0) REFERENCES public.batch_event_48 (id),
  session_ref_1 integer REFERENCES public.session_zone_18,
  claim_ref_2 integer,
  CONSTRAINT asset_note_69_claim_ref_2_fk FOREIGN KEY (claim_ref_2) REFERENCES public.claim_audit_51 (id)
);
CREATE UNIQUE INDEX asset_note_69_u ON public.asset_note_69 (claim_ref_2);
CREATE TABLE billing.grant_invoice_70 (
  id bigserial PRIMARY KEY,
  payment_0 date,
  grant_1 jsonb NOT NULL,
  claim_2 timestamptz,
  ticket_3 bigint NOT NULL,
  claim_4 varchar(120) NOT NULL,
  claim_ref_0 integer REFERENCES public.claim_session_34
);
CREATE UNIQUE INDEX grant_invoice_70_u ON billing.grant_invoice_70 (claim_ref_0);
CREATE TABLE public.lease_route_71 (
  id integer PRIMARY KEY,
  order_0 uuid,
  plan_1 numeric(12,2) NOT NULL,
  grant_2 timestamptz NOT NULL,
  grant_3 date NOT NULL,
  order_4 date NOT NULL,
  account_5 boolean NOT NULL,
  ticket_6 timestamptz NOT NULL,
  device_7 boolean NOT NULL,
  grant_8 numeric(12,2),
  lease_ref_0 integer,
  CONSTRAINT lease_route_71_lease_ref_0_fk FOREIGN KEY (lease_ref_0) REFERENCES public.lease_note_31 (id),
  shipment_ref_1 integer,
  CONSTRAINT lease_route_71_shipment_ref_1_fk FOREIGN KEY (shipment_ref_1) REFERENCES billing.shipment_account_35 (id),
  claim_ref_2 integer,
  CONSTRAINT lease_route_71_claim_ref_2_fk FOREIGN KEY (claim_ref_2) REFERENCES public.claim_session_34 (id)
);
CREATE TABLE public.grant_device_72 (
  id bigserial PRIMARY KEY,
  asset_0 jsonb,
  account_1 timestamptz NOT NULL,
  order_2 date,
  ticket_3 integer NOT NULL,
  device_4 text,
  lease_5 date,
  asset_6 integer NOT NULL,
  audit_ref_0 integer REFERENCES public.audit_shipment_16,
  plan_ref_1 integer REFERENCES public.plan_grant_39,
  policy_ref_2 integer REFERENCES public.policy_grant_17
);
CREATE UNIQUE INDEX grant_device_72_u ON public.grant_device_72 (policy_ref_2);
CREATE TABLE public.policy_session_73 (
  id integer PRIMARY KEY,
  zone_0 varchar(120),
  claim_1 date NOT NULL,
  audit_2 timestamptz NOT NULL,
  zone_3 numeric(12,2) NOT NULL,
  invoice_4 jsonb NOT NULL,
  account_5 bigint NOT NULL,
  batch_6 jsonb NOT NULL,
  order_ref_0 integer REFERENCES public.order_event_67
);
CREATE TABLE public.order_session_74 (
  id integer PRIMARY KEY,
  batch_0 numeric(12,2) NOT NULL,
  batch_1 timestamptz,
  account_2 uuid,
  plan_3 timestamptz NOT NULL,
  shipment_4 bigint,
  claim_ref_0 integer REFERENCES public.claim_session_34,
  shipment_ref_1 integer REFERENCES billing.shipment_account_35,
  audit_ref_2 integer REFERENCES public.audit_shipment_16
);

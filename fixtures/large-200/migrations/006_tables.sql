CREATE TABLE public.claim_device_125 (
  id integer PRIMARY KEY,
  event_0 boolean NOT NULL,
  audit_1 jsonb,
  policy_2 jsonb,
  note_ref_0 integer REFERENCES public.note_policy_23,
  shipment_ref_1 integer REFERENCES public.shipment_account_2,
  UNIQUE (event_0, audit_1)
);
CREATE UNIQUE INDEX claim_device_125_u ON public.claim_device_125 (shipment_ref_1);
CREATE TABLE billing.plan_asset_126 (
  id integer PRIMARY KEY,
  claim_0 integer,
  audit_1 text NOT NULL,
  route_2 jsonb NOT NULL,
  event_3 boolean NOT NULL,
  device_4 boolean,
  event_ref_0 integer REFERENCES public.event_policy_80,
  asset_ref_1 integer,
  CONSTRAINT plan_asset_126_asset_ref_1_fk FOREIGN KEY (asset_ref_1) REFERENCES public.asset_shipment_60 (id)
);
CREATE TABLE public.lease_zone_127 (
  id integer PRIMARY KEY,
  event_0 date NOT NULL,
  ticket_1 uuid,
  plan_2 varchar(120),
  note_3 jsonb,
  ticket_ref_0 integer REFERENCES billing.ticket_audit_98
);
CREATE TABLE public.policy_policy_128 (
  id integer PRIMARY KEY,
  audit_0 text,
  asset_1 uuid NOT NULL,
  claim_2 timestamptz,
  payment_3 integer,
  session_4 bigint,
  invoice_5 uuid,
  invoice_6 numeric(12,2) NOT NULL,
  event_7 timestamptz,
  event_ref_0 integer REFERENCES billing.event_asset_56,
  plan_ref_1 integer REFERENCES public.plan_payment_68
);
CREATE TABLE public.note_plan_129 (
  id integer PRIMARY KEY,
  shipment_0 text NOT NULL,
  note_1 varchar(120) NOT NULL,
  audit_2 text,
  zone_3 timestamptz NOT NULL,
  route_ref_0 integer REFERENCES public.route_zone_47,
  session_ref_1 integer,
  CONSTRAINT note_plan_129_session_ref_1_fk FOREIGN KEY (session_ref_1) REFERENCES public.session_order_38 (id)
);
CREATE TABLE public.policy_claim_130 (
  id bigserial PRIMARY KEY,
  order_0 numeric(12,2) NOT NULL,
  ticket_1 uuid,
  batch_2 jsonb NOT NULL,
  session_3 date,
  route_4 jsonb,
  asset_5 boolean NOT NULL,
  session_6 jsonb NOT NULL,
  zone_ref_0 integer,
  CONSTRAINT policy_claim_130_zone_ref_0_fk FOREIGN KEY (zone_ref_0) REFERENCES public.zone_audit_123 (id),
  audit_ref_1 integer,
  CONSTRAINT policy_claim_130_audit_ref_1_fk FOREIGN KEY (audit_ref_1) REFERENCES public.audit_ticket_4 (id),
  session_ref_2 integer,
  CONSTRAINT policy_claim_130_session_ref_2_fk FOREIGN KEY (session_ref_2) REFERENCES public.session_order_38 (id),
  UNIQUE (order_0, ticket_1)
);
CREATE TABLE public.account_order_131 (
  id integer PRIMARY KEY,
  batch_0 timestamptz,
  account_1 text,
  account_2 jsonb NOT NULL,
  order_3 jsonb,
  shipment_4 numeric(12,2) NOT NULL,
  session_5 date,
  route_6 varchar(120) NOT NULL,
  grant_ref_0 integer,
  CONSTRAINT account_order_131_grant_ref_0_fk FOREIGN KEY (grant_ref_0) REFERENCES public.grant_device_72 (id),
  UNIQUE (batch_0, account_1)
);
CREATE UNIQUE INDEX account_order_131_u ON public.account_order_131 (grant_ref_0);
CREATE TABLE ops.order_ticket_132 (
  id integer PRIMARY KEY,
  audit_0 integer NOT NULL,
  account_1 integer,
  zone_2 bigint,
  account_ref_0 integer REFERENCES public.account_lease_57,
  claim_ref_1 integer REFERENCES public.claim_session_34,
  event_ref_2 integer REFERENCES billing.event_asset_56
);
CREATE TABLE billing.order_device_133 (
  id bigserial PRIMARY KEY,
  zone_0 uuid NOT NULL,
  plan_1 numeric(12,2) NOT NULL,
  ticket_2 varchar(120),
  invoice_3 text,
  event_4 boolean,
  grant_5 varchar(120),
  lease_6 uuid NOT NULL,
  grant_ref_0 integer REFERENCES public.grant_device_72,
  plan_ref_1 integer,
  CONSTRAINT order_device_133_plan_ref_1_fk FOREIGN KEY (plan_ref_1) REFERENCES billing.plan_asset_126 (id),
  claim_ref_2 integer REFERENCES public.claim_route_54
);
CREATE TABLE public.note_device_134 (
  id integer PRIMARY KEY,
  device_0 timestamptz,
  session_1 bigint NOT NULL,
  session_2 boolean,
  event_3 boolean,
  policy_4 date NOT NULL,
  audit_5 numeric(12,2) NOT NULL,
  ticket_6 jsonb,
  plan_7 text,
  order_ref_0 integer REFERENCES public.order_event_67,
  policy_ref_1 integer,
  CONSTRAINT note_device_134_policy_ref_1_fk FOREIGN KEY (policy_ref_1) REFERENCES public.policy_grant_9 (id)
);
CREATE TABLE public.claim_ticket_135 (
  id bigserial PRIMARY KEY,
  payment_0 date,
  plan_1 text,
  note_2 boolean NOT NULL,
  audit_3 varchar(120) NOT NULL,
  order_ref_0 integer REFERENCES billing.order_device_133
);
CREATE UNIQUE INDEX claim_ticket_135_u ON public.claim_ticket_135 (order_ref_0);
CREATE TABLE public.route_plan_136 (
  id integer PRIMARY KEY,
  asset_0 uuid,
  asset_1 numeric(12,2),
  batch_2 bigint NOT NULL,
  zone_3 uuid,
  account_4 numeric(12,2),
  batch_5 jsonb NOT NULL,
  event_6 date NOT NULL,
  event_7 date NOT NULL,
  route_8 numeric(12,2),
  note_ref_0 integer REFERENCES public.note_plan_129
);
CREATE TABLE public.zone_grant_137 (
  id bigserial PRIMARY KEY,
  invoice_0 text,
  audit_1 date,
  route_2 integer NOT NULL,
  invoice_3 uuid NOT NULL,
  lease_4 date NOT NULL,
  account_5 date,
  lease_ref_0 integer,
  CONSTRAINT zone_grant_137_lease_ref_0_fk FOREIGN KEY (lease_ref_0) REFERENCES public.lease_zone_127 (id)
);
CREATE TABLE public.audit_grant_138 (
  id bigserial PRIMARY KEY,
  zone_0 timestamptz,
  note_1 boolean,
  payment_2 date,
  grant_3 uuid,
  session_ref_0 integer REFERENCES public.session_plan_124,
  session_ref_1 integer,
  CONSTRAINT audit_grant_138_session_ref_1_fk FOREIGN KEY (session_ref_1) REFERENCES public.session_note_36 (id),
  plan_ref_2 integer REFERENCES ops.plan_lease_33
);
CREATE TABLE public.audit_batch_139 (
  id bigserial PRIMARY KEY,
  note_0 jsonb NOT NULL,
  policy_1 varchar(120) NOT NULL,
  note_2 integer NOT NULL,
  ticket_3 date,
  invoice_4 jsonb,
  shipment_5 varchar(120),
  lease_6 bigint,
  session_7 timestamptz,
  lease_8 uuid NOT NULL,
  shipment_ref_0 integer,
  CONSTRAINT audit_batch_139_shipment_ref_0_fk FOREIGN KEY (shipment_ref_0) REFERENCES public.shipment_zone_115 (id)
);
CREATE TABLE billing.invoice_plan_140 (
  id integer PRIMARY KEY,
  note_0 uuid,
  claim_1 text NOT NULL,
  session_2 numeric(12,2),
  shipment_3 timestamptz NOT NULL,
  payment_4 text,
  audit_5 text NOT NULL,
  audit_6 uuid NOT NULL,
  audit_7 uuid NOT NULL,
  route_ref_0 integer,
  CONSTRAINT invoice_plan_140_route_ref_0_fk FOREIGN KEY (route_ref_0) REFERENCES public.route_claim_94 (id),
  note_ref_1 integer REFERENCES public.note_plan_129
);
CREATE TABLE public.batch_invoice_141 (
  id integer PRIMARY KEY,
  session_0 boolean NOT NULL,
  zone_1 jsonb,
  shipment_2 text NOT NULL,
  account_ref_0 integer,
  CONSTRAINT batch_invoice_141_account_ref_0_fk FOREIGN KEY (account_ref_0) REFERENCES public.account_claim_24 (id),
  audit_ref_1 integer REFERENCES public.audit_zone_87,
  audit_ref_2 integer,
  CONSTRAINT batch_invoice_141_audit_ref_2_fk FOREIGN KEY (audit_ref_2) REFERENCES public.audit_zone_87 (id)
);
CREATE TABLE public.lease_lease_142 (
  id integer PRIMARY KEY,
  shipment_0 uuid NOT NULL,
  note_1 integer,
  route_2 jsonb,
  payment_3 integer NOT NULL,
  audit_4 jsonb NOT NULL,
  invoice_5 date NOT NULL,
  audit_6 bigint,
  lease_ref_0 integer,
  CONSTRAINT lease_lease_142_lease_ref_0_fk FOREIGN KEY (lease_ref_0) REFERENCES public.lease_note_31 (id),
  policy_ref_1 integer REFERENCES billing.policy_order_119
);
CREATE TABLE ops.note_shipment_143 (
  id integer PRIMARY KEY,
  batch_0 text,
  plan_1 uuid,
  session_2 timestamptz,
  policy_3 uuid NOT NULL,
  device_ref_0 integer REFERENCES public.device_event_100
);
CREATE UNIQUE INDEX note_shipment_143_u ON ops.note_shipment_143 (device_ref_0);
CREATE TABLE public.event_order_144 (
  id integer PRIMARY KEY,
  ticket_0 varchar(120),
  audit_1 bigint NOT NULL,
  grant_2 timestamptz,
  ticket_ref_0 integer,
  CONSTRAINT event_order_144_ticket_ref_0_fk FOREIGN KEY (ticket_ref_0) REFERENCES billing.ticket_audit_98 (id),
  lease_ref_1 integer,
  CONSTRAINT event_order_144_lease_ref_1_fk FOREIGN KEY (lease_ref_1) REFERENCES public.lease_route_71 (id)
);
CREATE TABLE public.audit_policy_145 (
  id bigserial PRIMARY KEY,
  plan_0 jsonb NOT NULL,
  policy_1 boolean,
  device_2 text NOT NULL,
  zone_3 numeric(12,2),
  route_4 timestamptz,
  grant_5 uuid,
  claim_6 numeric(12,2) NOT NULL,
  lease_7 uuid,
  device_8 jsonb NOT NULL,
  invoice_ref_0 integer,
  CONSTRAINT audit_policy_145_invoice_ref_0_fk FOREIGN KEY (invoice_ref_0) REFERENCES billing.invoice_plan_140 (id),
  account_ref_1 integer REFERENCES public.account_policy_19
);
CREATE TABLE public.ticket_event_146 (
  id bigserial PRIMARY KEY,
  audit_0 integer,
  shipment_1 jsonb NOT NULL,
  audit_2 boolean,
  lease_3 varchar(120),
  asset_4 boolean NOT NULL,
  audit_5 bigint NOT NULL,
  grant_6 varchar(120),
  account_ref_0 integer REFERENCES public.account_zone_25,
  audit_ref_1 integer REFERENCES public.audit_device_64,
  event_ref_2 integer,
  CONSTRAINT ticket_event_146_event_ref_2_fk FOREIGN KEY (event_ref_2) REFERENCES public.event_zone_111 (id)
);
CREATE UNIQUE INDEX ticket_event_146_u ON public.ticket_event_146 (event_ref_2);
CREATE TABLE billing.order_device_147 (
  id bigserial PRIMARY KEY,
  device_0 bigint,
  invoice_1 timestamptz,
  order_2 jsonb,
  note_ref_0 integer REFERENCES public.note_lease_102,
  plan_ref_1 integer REFERENCES public.plan_payment_58,
  UNIQUE (device_0, invoice_1)
);
CREATE TABLE public.route_device_148 (
  id integer PRIMARY KEY,
  plan_0 bigint,
  ticket_1 integer NOT NULL,
  plan_2 timestamptz,
  grant_ref_0 integer REFERENCES public.grant_zone_108
);
CREATE TABLE public.shipment_shipment_149 (
  id integer PRIMARY KEY,
  payment_0 timestamptz,
  shipment_1 integer NOT NULL,
  claim_2 text,
  plan_3 text,
  asset_ref_0 integer REFERENCES public.asset_note_69,
  order_ref_1 integer REFERENCES billing.order_device_133,
  UNIQUE (payment_0, shipment_1)
);

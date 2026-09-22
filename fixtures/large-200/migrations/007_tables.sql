CREATE TABLE public.zone_grant_150 (
  id integer PRIMARY KEY,
  zone_0 numeric(12,2) NOT NULL,
  route_1 integer NOT NULL,
  payment_2 date,
  ticket_3 bigint,
  invoice_4 numeric(12,2) NOT NULL,
  device_5 uuid NOT NULL,
  plan_6 uuid NOT NULL,
  session_7 varchar(120) NOT NULL,
  claim_ref_0 integer,
  CONSTRAINT zone_grant_150_claim_ref_0_fk FOREIGN KEY (claim_ref_0) REFERENCES public.claim_note_41 (id),
  lease_ref_1 integer,
  CONSTRAINT zone_grant_150_lease_ref_1_fk FOREIGN KEY (lease_ref_1) REFERENCES public.lease_account_76 (id)
);
CREATE TABLE public.route_audit_151 (
  id integer PRIMARY KEY,
  route_0 varchar(120) NOT NULL,
  grant_1 integer NOT NULL,
  claim_2 varchar(120),
  shipment_3 integer NOT NULL,
  claim_ref_0 integer,
  CONSTRAINT route_audit_151_claim_ref_0_fk FOREIGN KEY (claim_ref_0) REFERENCES public.claim_device_125 (id),
  order_ref_1 integer,
  CONSTRAINT route_audit_151_order_ref_1_fk FOREIGN KEY (order_ref_1) REFERENCES public.order_event_67 (id)
);
CREATE TABLE public.session_grant_152 (
  id bigserial PRIMARY KEY,
  zone_0 bigint NOT NULL,
  route_1 bigint NOT NULL,
  grant_2 date NOT NULL,
  audit_3 boolean,
  note_4 integer,
  order_5 date,
  shipment_ref_0 integer REFERENCES public.shipment_zone_115
);
CREATE TABLE public.payment_grant_153 (
  id bigserial PRIMARY KEY,
  route_0 bigint,
  device_1 bigint NOT NULL,
  invoice_2 varchar(120),
  policy_3 date NOT NULL,
  invoice_ref_0 integer,
  CONSTRAINT payment_grant_153_invoice_ref_0_fk FOREIGN KEY (invoice_ref_0) REFERENCES public.invoice_payment_96 (id),
  account_ref_1 integer REFERENCES public.account_lease_57,
  order_ref_2 integer,
  CONSTRAINT payment_grant_153_order_ref_2_fk FOREIGN KEY (order_ref_2) REFERENCES billing.order_device_133 (id)
);
CREATE TABLE billing.zone_event_154 (
  id integer PRIMARY KEY,
  payment_0 bigint,
  asset_1 jsonb,
  zone_2 boolean,
  claim_3 jsonb NOT NULL,
  device_4 bigint,
  route_ref_0 integer,
  CONSTRAINT zone_event_154_route_ref_0_fk FOREIGN KEY (route_ref_0) REFERENCES public.route_device_148 (id),
  lease_ref_1 integer,
  CONSTRAINT zone_event_154_lease_ref_1_fk FOREIGN KEY (lease_ref_1) REFERENCES public.lease_lease_142 (id),
  invoice_ref_2 integer,
  CONSTRAINT zone_event_154_invoice_ref_2_fk FOREIGN KEY (invoice_ref_2) REFERENCES billing.invoice_plan_140 (id)
);
CREATE TABLE public.invoice_shipment_155 (
  id integer PRIMARY KEY,
  event_0 boolean,
  zone_1 boolean,
  invoice_2 numeric(12,2),
  session_3 text,
  claim_4 numeric(12,2) NOT NULL,
  audit_5 numeric(12,2) NOT NULL,
  route_ref_0 integer REFERENCES public.route_zone_47,
  event_ref_1 integer,
  CONSTRAINT invoice_shipment_155_event_ref_1_fk FOREIGN KEY (event_ref_1) REFERENCES public.event_audit_15 (id)
);
CREATE TABLE public.ticket_lease_156 (
  id bigserial PRIMARY KEY,
  zone_0 varchar(120),
  account_1 numeric(12,2),
  batch_2 text,
  note_3 boolean NOT NULL,
  policy_4 boolean,
  order_5 integer,
  shipment_ref_0 integer,
  CONSTRAINT ticket_lease_156_shipment_ref_0_fk FOREIGN KEY (shipment_ref_0) REFERENCES billing.shipment_asset_14 (id)
);
CREATE TABLE public.grant_order_157 (
  id integer PRIMARY KEY,
  lease_0 varchar(120),
  batch_1 bigint,
  session_2 jsonb,
  batch_3 date,
  audit_4 varchar(120),
  order_5 integer,
  asset_6 varchar(120),
  batch_7 varchar(120) NOT NULL,
  account_ref_0 integer,
  CONSTRAINT grant_order_157_account_ref_0_fk FOREIGN KEY (account_ref_0) REFERENCES ops.account_note_11 (id),
  zone_ref_1 integer,
  CONSTRAINT grant_order_157_zone_ref_1_fk FOREIGN KEY (zone_ref_1) REFERENCES public.zone_device_101 (id),
  audit_ref_2 integer REFERENCES public.audit_grant_138
);
CREATE TABLE public.claim_batch_158 (
  id integer PRIMARY KEY,
  asset_0 boolean NOT NULL,
  batch_1 bigint,
  session_2 text,
  plan_ref_0 integer,
  CONSTRAINT claim_batch_158_plan_ref_0_fk FOREIGN KEY (plan_ref_0) REFERENCES public.plan_payment_68 (id),
  lease_ref_1 integer,
  CONSTRAINT claim_batch_158_lease_ref_1_fk FOREIGN KEY (lease_ref_1) REFERENCES public.lease_account_76 (id)
);
CREATE TABLE public.payment_claim_159 (
  id integer PRIMARY KEY,
  claim_0 integer NOT NULL,
  note_1 date NOT NULL,
  session_2 text,
  ticket_3 integer,
  claim_4 integer NOT NULL,
  account_5 timestamptz,
  claim_6 date,
  device_7 boolean NOT NULL,
  order_8 timestamptz NOT NULL,
  ticket_ref_0 integer,
  CONSTRAINT payment_claim_159_ticket_ref_0_fk FOREIGN KEY (ticket_ref_0) REFERENCES public.ticket_lease_156 (id)
);
CREATE TABLE public.batch_shipment_160 (
  id integer PRIMARY KEY,
  shipment_0 timestamptz,
  lease_1 jsonb,
  payment_2 bigint NOT NULL,
  device_3 uuid NOT NULL,
  payment_4 boolean NOT NULL,
  zone_5 date NOT NULL,
  plan_ref_0 integer REFERENCES public.plan_device_26
);
CREATE UNIQUE INDEX batch_shipment_160_u ON public.batch_shipment_160 (plan_ref_0);
CREATE TABLE billing.claim_event_161 (
  id bigserial PRIMARY KEY,
  claim_0 jsonb,
  asset_1 text NOT NULL,
  event_2 text,
  plan_3 boolean NOT NULL,
  lease_ref_0 integer REFERENCES public.lease_note_31,
  audit_ref_1 integer REFERENCES public.audit_device_29,
  zone_ref_2 integer,
  CONSTRAINT claim_event_161_zone_ref_2_fk FOREIGN KEY (zone_ref_2) REFERENCES public.zone_audit_123 (id)
);
CREATE TABLE public.device_grant_162 (
  id bigserial PRIMARY KEY,
  ticket_0 varchar(120) NOT NULL,
  lease_1 timestamptz,
  ticket_2 varchar(120) NOT NULL,
  note_3 jsonb NOT NULL,
  invoice_4 numeric(12,2) NOT NULL,
  payment_5 date,
  note_6 numeric(12,2),
  lease_7 text,
  session_8 date,
  shipment_ref_0 integer,
  CONSTRAINT device_grant_162_shipment_ref_0_fk FOREIGN KEY (shipment_ref_0) REFERENCES public.shipment_shipment_149 (id),
  order_ref_1 integer REFERENCES public.order_audit_103
);
CREATE UNIQUE INDEX device_grant_162_u ON public.device_grant_162 (order_ref_1);
CREATE TABLE public.shipment_device_163 (
  id integer PRIMARY KEY,
  event_0 boolean NOT NULL,
  shipment_1 varchar(120) NOT NULL,
  batch_2 integer NOT NULL,
  audit_3 date,
  audit_4 numeric(12,2) NOT NULL,
  route_5 date NOT NULL,
  route_6 bigint NOT NULL,
  asset_ref_0 integer,
  CONSTRAINT shipment_device_163_asset_ref_0_fk FOREIGN KEY (asset_ref_0) REFERENCES public.asset_shipment_78 (id)
);
CREATE TABLE public.account_grant_164 (
  id bigserial PRIMARY KEY,
  session_0 varchar(120),
  payment_1 boolean,
  payment_2 varchar(120) NOT NULL,
  plan_3 boolean,
  grant_4 timestamptz NOT NULL,
  zone_5 date NOT NULL,
  ticket_6 integer,
  shipment_ref_0 integer,
  CONSTRAINT account_grant_164_shipment_ref_0_fk FOREIGN KEY (shipment_ref_0) REFERENCES public.shipment_account_2 (id),
  ticket_ref_1 integer,
  CONSTRAINT account_grant_164_ticket_ref_1_fk FOREIGN KEY (ticket_ref_1) REFERENCES public.ticket_lease_156 (id),
  grant_ref_2 integer,
  CONSTRAINT account_grant_164_grant_ref_2_fk FOREIGN KEY (grant_ref_2) REFERENCES billing.grant_invoice_70 (id)
);
CREATE TABLE ops.invoice_device_165 (
  id integer PRIMARY KEY,
  order_0 jsonb,
  shipment_1 bigint,
  asset_2 date,
  order_3 varchar(120) NOT NULL,
  account_4 bigint,
  zone_5 jsonb NOT NULL,
  route_6 numeric(12,2),
  account_7 varchar(120) NOT NULL,
  shipment_8 jsonb NOT NULL,
  order_ref_0 integer REFERENCES public.order_event_67,
  invoice_ref_1 integer REFERENCES public.invoice_payment_96,
  lease_ref_2 integer,
  CONSTRAINT invoice_device_165_lease_ref_2_fk FOREIGN KEY (lease_ref_2) REFERENCES public.lease_note_83 (id)
);
CREATE TABLE public.session_event_166 (
  id integer PRIMARY KEY,
  asset_0 jsonb,
  claim_1 numeric(12,2),
  event_2 date,
  batch_3 varchar(120),
  zone_4 uuid,
  session_5 bigint NOT NULL,
  zone_6 numeric(12,2) NOT NULL,
  device_7 date NOT NULL,
  plan_8 varchar(120) NOT NULL,
  event_ref_0 integer REFERENCES billing.event_asset_21,
  shipment_ref_1 integer,
  CONSTRAINT session_event_166_shipment_ref_1_fk FOREIGN KEY (shipment_ref_1) REFERENCES billing.shipment_account_35 (id),
  ticket_ref_2 integer REFERENCES ops.ticket_claim_22
);
CREATE TABLE public.policy_zone_167 (
  id bigserial PRIMARY KEY,
  device_0 date NOT NULL,
  grant_1 text,
  session_2 uuid NOT NULL,
  invoice_3 uuid,
  order_ref_0 integer REFERENCES public.order_session_74
);
CREATE TABLE billing.zone_payment_168 (
  id integer PRIMARY KEY,
  grant_0 text,
  route_1 varchar(120),
  lease_2 timestamptz,
  claim_3 numeric(12,2),
  audit_4 uuid NOT NULL,
  policy_ref_0 integer REFERENCES public.policy_policy_128,
  batch_ref_1 integer,
  CONSTRAINT zone_payment_168_batch_ref_1_fk FOREIGN KEY (batch_ref_1) REFERENCES public.batch_shipment_160 (id)
);
CREATE TABLE public.payment_invoice_169 (
  id integer PRIMARY KEY,
  lease_0 varchar(120),
  claim_1 varchar(120) NOT NULL,
  event_2 bigint,
  route_3 boolean,
  route_4 jsonb NOT NULL,
  grant_5 text,
  payment_6 integer NOT NULL,
  grant_7 bigint NOT NULL,
  invoice_8 jsonb NOT NULL,
  lease_ref_0 integer REFERENCES public.lease_zone_127,
  UNIQUE (lease_0, claim_1)
);
CREATE TABLE public.grant_plan_170 (
  id integer PRIMARY KEY,
  ticket_0 boolean NOT NULL,
  asset_1 bigint,
  invoice_2 uuid NOT NULL,
  batch_3 integer,
  payment_4 date,
  account_5 timestamptz NOT NULL,
  account_6 integer NOT NULL,
  session_7 varchar(120) NOT NULL,
  audit_ref_0 integer,
  CONSTRAINT grant_plan_170_audit_ref_0_fk FOREIGN KEY (audit_ref_0) REFERENCES public.audit_payment_45 (id),
  route_ref_1 integer,
  CONSTRAINT grant_plan_170_route_ref_1_fk FOREIGN KEY (route_ref_1) REFERENCES billing.route_zone_84 (id),
  shipment_ref_2 integer REFERENCES public.shipment_claim_85
);
CREATE TABLE public.batch_payment_171 (
  id bigserial PRIMARY KEY,
  invoice_0 timestamptz,
  asset_1 numeric(12,2) NOT NULL,
  invoice_2 jsonb NOT NULL,
  asset_3 timestamptz NOT NULL,
  asset_4 uuid,
  note_5 varchar(120) NOT NULL,
  grant_6 integer,
  policy_ref_0 integer,
  CONSTRAINT batch_payment_171_policy_ref_0_fk FOREIGN KEY (policy_ref_0) REFERENCES billing.policy_order_119 (id)
);
CREATE UNIQUE INDEX batch_payment_171_u ON public.batch_payment_171 (policy_ref_0);
CREATE TABLE public.session_invoice_172 (
  id integer PRIMARY KEY,
  claim_0 uuid NOT NULL,
  asset_1 integer NOT NULL,
  grant_2 jsonb NOT NULL,
  batch_3 varchar(120),
  asset_4 date,
  account_ref_0 integer,
  CONSTRAINT session_invoice_172_account_ref_0_fk FOREIGN KEY (account_ref_0) REFERENCES public.account_audit_12 (id)
);
CREATE TABLE public.order_zone_173 (
  id integer PRIMARY KEY,
  policy_0 numeric(12,2) NOT NULL,
  session_1 jsonb NOT NULL,
  lease_2 uuid NOT NULL,
  batch_3 boolean NOT NULL,
  claim_ref_0 integer REFERENCES public.claim_audit_51,
  route_ref_1 integer REFERENCES public.route_claim_94
);
CREATE TABLE public.account_payment_174 (
  id bigserial PRIMARY KEY,
  grant_0 boolean NOT NULL,
  order_1 boolean,
  invoice_2 date NOT NULL,
  account_3 bigint NOT NULL,
  order_4 date NOT NULL,
  claim_5 varchar(120) NOT NULL,
  zone_6 numeric(12,2),
  note_ref_0 integer REFERENCES billing.note_device_63
);

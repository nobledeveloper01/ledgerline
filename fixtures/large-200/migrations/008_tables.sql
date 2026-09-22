CREATE TABLE billing.batch_asset_175 (
  id integer PRIMARY KEY,
  payment_0 uuid,
  event_1 bigint NOT NULL,
  claim_2 uuid,
  policy_3 text NOT NULL,
  zone_4 date,
  note_5 date,
  order_6 varchar(120) NOT NULL,
  policy_7 varchar(120),
  invoice_8 date NOT NULL,
  audit_ref_0 integer REFERENCES public.audit_batch_93,
  event_ref_1 integer,
  CONSTRAINT batch_asset_175_event_ref_1_fk FOREIGN KEY (event_ref_1) REFERENCES billing.event_asset_21 (id),
  UNIQUE (payment_0, event_1)
);
CREATE TABLE ops.order_lease_176 (
  id integer PRIMARY KEY,
  claim_0 uuid,
  grant_1 bigint,
  grant_2 date,
  audit_3 date NOT NULL,
  session_ref_0 integer REFERENCES public.session_invoice_172
);
CREATE TABLE public.audit_grant_177 (
  id integer PRIMARY KEY,
  ticket_0 text,
  shipment_1 varchar(120),
  audit_2 integer,
  asset_3 timestamptz NOT NULL,
  zone_ref_0 integer,
  CONSTRAINT audit_grant_177_zone_ref_0_fk FOREIGN KEY (zone_ref_0) REFERENCES public.zone_grant_137 (id),
  lease_ref_1 integer REFERENCES public.lease_event_114
);
CREATE TABLE public.ticket_session_178 (
  id integer PRIMARY KEY,
  policy_0 varchar(120),
  batch_1 timestamptz,
  audit_2 bigint,
  lease_3 integer NOT NULL,
  zone_4 uuid NOT NULL,
  note_ref_0 integer REFERENCES ops.note_shipment_143,
  audit_ref_1 integer,
  CONSTRAINT ticket_session_178_audit_ref_1_fk FOREIGN KEY (audit_ref_1) REFERENCES public.audit_device_29 (id),
  UNIQUE (policy_0, batch_1)
);
CREATE TABLE public.ticket_route_179 (
  id integer PRIMARY KEY,
  note_0 integer,
  zone_1 bigint NOT NULL,
  grant_2 jsonb NOT NULL,
  policy_3 jsonb NOT NULL,
  route_4 bigint,
  grant_ref_0 integer REFERENCES public.grant_batch_40
);
CREATE TABLE public.account_zone_180 (
  id integer PRIMARY KEY,
  order_0 jsonb NOT NULL,
  claim_1 jsonb NOT NULL,
  account_2 timestamptz NOT NULL,
  order_3 boolean NOT NULL,
  grant_ref_0 integer,
  CONSTRAINT account_zone_180_grant_ref_0_fk FOREIGN KEY (grant_ref_0) REFERENCES public.grant_asset_62 (id),
  shipment_ref_1 integer REFERENCES public.shipment_route_79,
  audit_ref_2 integer REFERENCES public.audit_policy_145
);
CREATE TABLE public.device_batch_181 (
  id integer PRIMARY KEY,
  device_0 uuid NOT NULL,
  claim_1 boolean NOT NULL,
  invoice_2 varchar(120) NOT NULL,
  shipment_3 uuid NOT NULL,
  plan_4 jsonb NOT NULL,
  payment_5 integer,
  lease_6 numeric(12,2) NOT NULL,
  policy_ref_0 integer,
  CONSTRAINT device_batch_181_policy_ref_0_fk FOREIGN KEY (policy_ref_0) REFERENCES public.policy_grant_17 (id),
  UNIQUE (device_0, claim_1)
);
CREATE TABLE billing.zone_lease_182 (
  id bigserial PRIMARY KEY,
  audit_0 jsonb,
  account_1 integer NOT NULL,
  zone_2 uuid NOT NULL,
  route_3 boolean,
  device_4 boolean,
  order_5 jsonb NOT NULL,
  batch_6 numeric(12,2) NOT NULL,
  route_7 date NOT NULL,
  shipment_8 integer NOT NULL,
  claim_ref_0 integer REFERENCES public.claim_event_32,
  UNIQUE (audit_0, account_1)
);
CREATE TABLE public.claim_lease_183 (
  id integer PRIMARY KEY,
  event_0 numeric(12,2) NOT NULL,
  session_1 numeric(12,2) NOT NULL,
  note_2 bigint,
  device_3 timestamptz,
  invoice_4 varchar(120),
  lease_5 date,
  batch_6 bigint NOT NULL,
  account_7 jsonb NOT NULL,
  audit_ref_0 integer,
  CONSTRAINT claim_lease_183_audit_ref_0_fk FOREIGN KEY (audit_ref_0) REFERENCES public.audit_device_64 (id),
  note_ref_1 integer REFERENCES ops.note_shipment_143
);
CREATE TABLE public.device_session_184 (
  id integer PRIMARY KEY,
  device_0 text NOT NULL,
  order_1 jsonb,
  plan_2 date,
  grant_3 text NOT NULL,
  ticket_ref_0 integer,
  CONSTRAINT device_session_184_ticket_ref_0_fk FOREIGN KEY (ticket_ref_0) REFERENCES billing.ticket_audit_98 (id),
  audit_ref_1 integer,
  CONSTRAINT device_session_184_audit_ref_1_fk FOREIGN KEY (audit_ref_1) REFERENCES public.audit_payment_45 (id),
  invoice_ref_2 integer REFERENCES public.invoice_event_59
);
CREATE UNIQUE INDEX device_session_184_u ON public.device_session_184 (invoice_ref_2);
CREATE TABLE public.grant_lease_185 (
  id bigserial PRIMARY KEY,
  asset_0 text,
  grant_1 date,
  ticket_2 date,
  policy_ref_0 integer REFERENCES public.policy_grant_9,
  event_ref_1 integer REFERENCES billing.event_asset_21,
  UNIQUE (asset_0, grant_1)
);
CREATE TABLE public.event_zone_186 (
  id integer PRIMARY KEY,
  session_0 jsonb,
  device_1 varchar(120) NOT NULL,
  plan_2 integer,
  claim_3 date NOT NULL,
  lease_4 bigint,
  note_5 text NOT NULL,
  order_6 numeric(12,2),
  event_7 boolean NOT NULL,
  grant_ref_0 integer,
  CONSTRAINT event_zone_186_grant_ref_0_fk FOREIGN KEY (grant_ref_0) REFERENCES public.grant_lease_185 (id)
);
CREATE TABLE ops.shipment_batch_187 (
  id integer PRIMARY KEY,
  policy_0 jsonb,
  session_1 varchar(120),
  account_2 timestamptz,
  audit_3 timestamptz,
  order_ref_0 integer,
  CONSTRAINT shipment_batch_187_order_ref_0_fk FOREIGN KEY (order_ref_0) REFERENCES billing.order_device_133 (id)
);
CREATE TABLE public.shipment_route_188 (
  id integer PRIMARY KEY,
  asset_0 numeric(12,2),
  route_1 jsonb,
  session_2 boolean,
  session_3 text,
  ticket_4 timestamptz,
  account_ref_0 integer,
  CONSTRAINT shipment_route_188_account_ref_0_fk FOREIGN KEY (account_ref_0) REFERENCES public.account_order_43 (id),
  event_ref_1 integer REFERENCES billing.event_asset_56,
  UNIQUE (asset_0, route_1)
);
CREATE TABLE billing.plan_lease_189 (
  id integer PRIMARY KEY,
  grant_0 text NOT NULL,
  note_1 boolean,
  audit_2 boolean NOT NULL,
  payment_ref_0 integer REFERENCES public.payment_claim_159,
  claim_ref_1 integer REFERENCES public.claim_ticket_135
);
CREATE TABLE public.claim_lease_190 (
  id integer PRIMARY KEY,
  ticket_0 uuid,
  account_1 numeric(12,2) NOT NULL,
  ticket_2 date NOT NULL,
  plan_3 integer NOT NULL,
  lease_4 jsonb,
  order_5 date,
  batch_6 timestamptz,
  invoice_7 text NOT NULL,
  claim_ref_0 integer,
  CONSTRAINT claim_lease_190_claim_ref_0_fk FOREIGN KEY (claim_ref_0) REFERENCES public.claim_route_54 (id)
);
CREATE TABLE public.event_event_191 (
  id bigserial PRIMARY KEY,
  event_0 text,
  batch_1 jsonb,
  claim_2 timestamptz,
  event_3 timestamptz,
  account_ref_0 integer,
  CONSTRAINT event_event_191_account_ref_0_fk FOREIGN KEY (account_ref_0) REFERENCES public.account_zone_25 (id),
  event_ref_1 integer REFERENCES billing.event_asset_21
);
CREATE TABLE public.plan_account_192 (
  id integer PRIMARY KEY,
  invoice_0 uuid,
  shipment_1 integer,
  shipment_2 numeric(12,2),
  claim_3 integer,
  account_ref_0 integer REFERENCES public.account_lease_57
);
CREATE TABLE public.ticket_audit_193 (
  id bigserial PRIMARY KEY,
  device_0 numeric(12,2) NOT NULL,
  shipment_1 uuid NOT NULL,
  event_2 bigint,
  claim_3 timestamptz,
  batch_4 boolean NOT NULL,
  lease_5 jsonb NOT NULL,
  payment_ref_0 integer,
  CONSTRAINT ticket_audit_193_payment_ref_0_fk FOREIGN KEY (payment_ref_0) REFERENCES public.payment_claim_159 (id)
);
CREATE TABLE public.invoice_payment_194 (
  id integer PRIMARY KEY,
  device_0 boolean NOT NULL,
  account_1 boolean NOT NULL,
  event_2 timestamptz,
  plan_3 boolean,
  shipment_4 integer NOT NULL,
  plan_5 uuid,
  claim_6 boolean,
  session_ref_0 integer REFERENCES ops.session_batch_88,
  invoice_ref_1 integer REFERENCES public.invoice_lease_65,
  ticket_ref_2 integer,
  CONSTRAINT invoice_payment_194_ticket_ref_2_fk FOREIGN KEY (ticket_ref_2) REFERENCES public.ticket_audit_193 (id)
);
CREATE TABLE public.route_device_195 (
  id integer PRIMARY KEY,
  route_0 uuid,
  device_1 date,
  batch_2 date NOT NULL,
  event_3 integer,
  note_ref_0 integer,
  CONSTRAINT route_device_195_note_ref_0_fk FOREIGN KEY (note_ref_0) REFERENCES public.note_lease_102 (id)
);
CREATE TABLE billing.route_route_196 (
  id integer PRIMARY KEY,
  claim_0 timestamptz,
  lease_1 timestamptz,
  batch_2 boolean NOT NULL,
  payment_3 bigint,
  lease_4 timestamptz,
  batch_5 integer NOT NULL,
  plan_6 integer,
  audit_7 date,
  audit_ref_0 integer REFERENCES public.audit_batch_139
);
CREATE TABLE public.shipment_device_197 (
  id bigserial PRIMARY KEY,
  grant_0 uuid,
  note_1 varchar(120),
  lease_2 timestamptz,
  claim_3 bigint NOT NULL,
  zone_4 numeric(12,2),
  shipment_ref_0 integer REFERENCES public.shipment_shipment_149
);
CREATE TABLE ops.lease_policy_198 (
  id bigserial PRIMARY KEY,
  order_0 text,
  shipment_1 jsonb,
  payment_2 boolean NOT NULL,
  plan_3 boolean,
  note_4 integer NOT NULL,
  policy_5 timestamptz NOT NULL,
  invoice_ref_0 integer,
  CONSTRAINT lease_policy_198_invoice_ref_0_fk FOREIGN KEY (invoice_ref_0) REFERENCES public.invoice_batch_86 (id),
  audit_ref_1 integer,
  CONSTRAINT lease_policy_198_audit_ref_1_fk FOREIGN KEY (audit_ref_1) REFERENCES public.audit_grant_177 (id)
);
CREATE TABLE public.payment_batch_199 (
  id bigserial PRIMARY KEY,
  shipment_0 boolean NOT NULL,
  shipment_1 bigint,
  policy_2 integer,
  payment_ref_0 integer,
  CONSTRAINT payment_batch_199_payment_ref_0_fk FOREIGN KEY (payment_ref_0) REFERENCES public.payment_invoice_169 (id),
  note_ref_1 integer,
  CONSTRAINT payment_batch_199_note_ref_1_fk FOREIGN KEY (note_ref_1) REFERENCES ops.note_shipment_143 (id)
);
CREATE UNIQUE INDEX payment_batch_199_u ON public.payment_batch_199 (note_ref_1);

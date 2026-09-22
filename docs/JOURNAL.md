# Journal

What we did, and what surprised us. One entry per working session, newest first.
The surprises are the point.

---

## 2026-09-23, later still — the check meets a real repository

**Did.** Ran `ledgerline check` against Mastodon: a Rails application, 116
tables, 613 source files. Not the Phase 4 gate — that needs three repositories
and a person reading every finding — but the first half of the work, and it
found six bugs in an afternoon that the whole fixture corpus had never
touched.

### What surprised us

**The very first run went green on a repository it could not read.** *schema
from nothing · 0 statements in 0 sources* followed by *No findings. Every
relationship the queries rely on is declared.* and exit 0. That is the worst
failure this tool is capable of: put it in a pipeline, move the migrations,
and the build passes for ever. A check that reads no schema now fails and
prints where it looked. It is embarrassing that the tool whose whole thesis is
*a claim is only worth having if something checks it* shipped a check that
claimed everything was fine after checking nothing.

**Rails puts Ruby in `db/migrate`.** So the directory existed, matched the
list of places migrations live, and yielded not one table — while `db/schema.rb`
sat beside it holding the entire schema. The fallback from migrations to an
ORM file was written to turn on *existence*, and had to turn on *emptiness*.
The bug was one line and was invisible without a real Rails repository, which
is exactly the argument for this gate being a real repository.

**148 true warnings, none of them worth reading.** Every foreign key in
Mastodon came back as *used by no query that was read* — true, and worthless,
because an ActiveRecord application speaks to its database through the ORM and
leaves almost no SQL to find. Absence of a query is not evidence of an unused
relationship when the sample is empty. `declared_unused` is now claimed only
about a table some query actually named, and the size of the blind spot is
stated once: *90 of 116 tables were named by no query that was read.* That is
the honest sentence, and it is one line instead of a hundred and forty-eight.

The first attempt at the rule was wrong in an instructive way: it passed an
edge if *either* end had been queried, so `accounts` — read everywhere —
vouched for all forty tables pointing at it, and the count fell from 148 to
130. The claim is about the side that carries the key.

**And 1947 statements the parser refused were English.** The test for *is this
string a query* was its first word, and `"delete"`, `"Delete & re-draft"` and
`"Select your favourite fruit or not. Up to you."` all begin with a SQL verb.
Testing the shape instead — a SELECT with a FROM, an UPDATE with a SET —
took it from 1947 to 2, and the files reported as containing SQL from 613 to
36. Both statements still unread were queries with Ruby's `#{…}` in them,
which is a placeholder like every other placeholder; one of them now parses
and the other interpolates its own FROM clause and is beyond honest reading.

**A dangling symlink ended the run.** Exit 70, nothing read, on one broken
link in six hundred files. A repository does not hold still: a build deletes
things, a link points nowhere, a directory is not readable. All three are
skipped now.

### Then Outline, which could not be read at all

A Sequelize repository has no file that is the schema. The migrations are
*JavaScript* calling `queryInterface.createTable`; the models are decorated
TypeScript classes. Outline is 30 MB of it, with 56 real SQL statements in its
own source, and this tool could read none of its 41 tables. So there is a
sixth reader now, and the roadmap never listed it — which is the argument for
the gate being a real repository instead of a corpus, made in one sentence.

**Writing it produced the best bug of the session.** `class IdModel<T extends
object = any> extends Model<T>` contains two `extends`, and the first is a
constraint on a type parameter. Taking the first gave every model in Outline
the base class `object`, which meant every model lost the columns its base
lends it — including `id`. Fifty-four tables came back with no primary key,
and a schema with no primary keys still *looks* like a schema: it lays out, it
renders, every relationship is there. Nothing would have said a word. The
fix reads `extends` at angle-bracket depth zero and has a test that is three
strings long.

**Then Outline gave up three parser bugs in return**, each found by reading a
failing finding and going to look at the SQL it named:

- `WITH lockable AS (…) UPDATE documents …` reported `lockable` as a table the
  queries use and no schema declares. `WITH` had been read for `SELECT` and
  for nothing else, so a name that exists inside one statement became a
  failing finding about the schema.
- `DELETE FROM stars WHERE NOT EXISTS (SELECT NULL FROM documents doc WHERE
  doc.id = "documentId")` invented `documents.documentId` and a self-join on
  `documents`. The column is `stars`', one scope out. An unqualified column
  now walks out through the enclosing scopes, which is what a correlated
  reference *is*.
- Two more failures were about `collection_users`, a table that was real in
  April 2023 and has since been renamed. The finding was true about 2023 and
  useless about today, because the tool was reading `server/migrations` as a
  source of *queries*. A migration's DDL is the schema; its DML is history.
  Migration directories are now excluded from the query scan — which also
  turned up `config.ignore`, resolved from the configuration file since Phase
  4 and never once used by anything.

Seven failing findings on Outline before; zero after, and every one of the
seven was the tool's fault rather than Outline's.

### And then NetBox, and the gate turning out to be the wrong question

Django's real style is nothing like the `models.py` the reader was written
for: the models are a *package*, every field spans five or six lines, and a
`ForeignKey('dcim.Cable')` reaches into another file. The app label — half of
every table name — is the directory *above* `models/`, and getting it wrong
renames every table in the schema. Rewritten, NetBox goes from no schema at
all to 91 tables.

**Then the gate failed in a way no code change can fix.** It asks for a true
*undeclared relationship* in each of three repositories, and all three speak
to their databases through an ORM: 22 SQL statements for Mastodon's 116
tables, 3 for NetBox's 91. With no queries there are no query-versus-constraint
disagreements, and the tool correctly found none. The gate as written can only
be met by repositories that contain raw SQL, and reading three ORM-first
repositories as a pass would be exactly the green this repository exists to
refuse. Written up in `docs/GATE-PHASE-4.md` as a decision for a person, not
quietly re-scoped.

**The single most useful finding was a false one.**
`announcement_reactions.custom_emoji_id → custom_emojis` was reported as
undeclared, and `schema.rb` declares it on line 1509. Rails derives that
column by singularising `custom_emojis`, and the inflector here had a rule
saying *a word ending in `is` is already singular* — true of `analysis`,
false of `custom_emojis`. Nine true findings taught less than that one false
one. Note what the reader did *not* do: it did not invent a `custom_emojis_id`
column, it reported the line as unread, exactly as ADR-0005 says. The safety
rule held and the inflector was still wrong, which is the whole argument for
having both.

### And then memos, which is what the product is for

Three ORM-first repositories could not meet a gate that asks for a query
disagreeing with a constraint, so the fourth was chosen for the opposite
property: a Go application that writes its own SQL. memos has 187 readable
statements across 64 files and **exactly one `FOREIGN KEY` in its entire
schema**.

Four failing findings, each a real join in real source, each verified by
opening the file the tool named:

- `attachment.memo_id → memo.id` — `LEFT JOIN memo ON attachment.memo_id =
  memo.id`, and the column is `INTEGER DEFAULT NULL` with nothing checking it.
- `memo.space_id → space.id` — from `LEFT JOIN space AS attachment_space ON
  memo.space_id = attachment_space.id`, alias and all.
- `space_member.space_id → space.id` and `space_member.user_id → user.id` —
  a composite-key join table with no constraints at all.

That is the product doing the thing it was written to do, on somebody else's
code, with the file and line in the sentence. It is one repository and the
gate asks for three, so nothing is claimed.

**memos also said something about the tool's shape.** *187 not parsed* was
mostly MySQL: memos keeps `store/db/postgres`, `store/db/mysql` and
`store/db/sqlite` beside each other, and `dialect` was one setting for a whole
repository. That was an assumption nobody had noticed making. It takes a path
map now — and the summary says *120 not parsed (68 of them in backticks — set
"dialect" for those paths)*, because a bare count is not a thing you can act
on.

And `"delete member from nested name"` was still being handed to the parser,
four hours after the *looks like SQL* test was supposedly fixed, because the
test allowed anything between `DELETE` and `FROM`. `DELETE FROM` is the only
legal spelling. Every heuristic gets one more counterexample than you expect.

### Still open

- The gate. Four repositories are run, every finding is checked, and the
  evidence is in `docs/GATE-PHASE-4.md`. One of the four meets the gate's
  actual criterion; it asks for three. What is left is finding two more
  applications that write their own SQL — a search, not a script — and a
  person reading the findings. It is still not claimed.

## 2026-09-23, later — Phase 5: MySQL, and two ORMs read without running them

**Did.** The MySQL rewrite (ADR-0004) grew `MODIFY`/`CHANGE COLUMN` and the
`ADD KEY` forms; a second 200-table corpus generated from the *same seed* as
the PostgreSQL one and written the way MySQL writes it; a test that asserts
the two corpora are the same schema; the Phase 2 property test repeated in
MySQL's spelling; and all five ORM readers — Rails `schema.rb`, Django
`models.py`, SQLAlchemy, TypeORM entities, EF Core model snapshots (ADR-0005)
— wired into the CLI behind migrations, with a CLI test that runs `check` on a
repository whose only schema is two TypeORM files. 74 tests, 6 fixtures,
5 ADRs. Then `ledgerline usage`, because ADR-0003 #2 turned out to be a rule
with no command behind it.

### What surprised us

**A rule in the model is not a feature, and only grep knew.** ADR-0003 #2 —
dead columns from a query log — had `usage()` written, tested and pure in
`packages/model`, and *nothing called it*. Phase 4 said its code was built;
`make ci` was green; the roadmap said usage was on the diagram. All true of
the rule, none of it true of the product. The audit that found it was
`grep -rn usage packages/cli packages/render`, which printed nothing. Every
other one of the fifteen had a command or a gate behind it; this one had a
unit test, which is exactly the kind of green that means nothing.

So the gate that should have existed now does: `make reach` (ADR-0006), every
model export must have a caller outside the model or a written reason why not.
It found five more the moment it ran — two constants spelled out a second time
by hand elsewhere, one genuinely dead, one public contract nobody could reach.

**And the new gate could not read one of its own files.** `schema.ts` held two
raw NUL bytes where the escape was meant — a `join()` separator written as the
byte itself. `file` called it data, `grep` skipped it silently, and seven of
the model's exports were invisible to the gate written to find exactly that.
The gate now refuses a source file it cannot read as text, which is the second
time today the lesson was *a check that silently sees less than it thinks is
worse than no check*.

Building `usage` found two more: the query walker only ever read *join predicates*,
so `SELECT id, email FROM users` recorded `id` (from the WHERE) and not
`email`, and `SELECT *` recorded nothing at all. Both were invisible while the
only question asked of a query was *what does it join*.

**And then walking more of the query claimed the same join twice.** The new
mentions walk reaches a sub-select the join walk has usually reached already,
so `IN (SELECT …)` produced its relationship twice. The fix is a `WeakSet` of
sub-selects already walked — one set, whichever walk arrives first — and the
test that caught it was one written three phases ago for a different reason.

**MySQL and PostgreSQL disagree about what an alter that omits something
means.** `ALTER TABLE t ALTER COLUMN c TYPE text` in PostgreSQL changes the
type and leaves the nullability alone. `ALTER TABLE t MODIFY COLUMN c text` in
MySQL restates the *whole column*, so a column that was `NOT NULL` becomes
nullable — the omission is the instruction. The rewrite had this right and the
corpus generator had it wrong, so four of two hundred tables came out with a
column nullable on one side and required on the other. The diff that found it
compared the two corpora table by table; no single-dialect test could have.

**A property test asserted something true for the wrong reason.** The MySQL
query property passed on the first run — and would have passed just as green
if the dialect switch had been a no-op, because PostgreSQL's parser is
forgiving enough to be worth checking against. The test now asserts the
*negative* as well: the same SQL read as PostgreSQL must fail to parse. That
caught the empty-query-set case immediately, which is the generator's way of
saying the assertion needed a guard, not that the idea was wrong.

**The honest part of an ORM reader is the list of what it did not read.**
Rails derives `user_id` from `"users"` by singularising, which means this
repository now contains an inflector, which means there are plurals it will
get wrong. The reader does not draw an edge whose column the table does not
have — it reports the line instead. Writing that rule was easier than writing
the inflector, and it is the rule that makes the inflector's gaps harmless.

**Five ORM readers, five different answers to the same question.** Each one
has a place where the file does not say what the database will contain, and
each place is a different shape: Django hides the table name in the directory,
Rails hides the column name in an English plural, TypeORM hides it in a naming
strategy, EF Core hides the relationship in a *second* block for the same
entity further down the file, and SQLAlchemy hides nothing at all — which is
why its reader is the shortest and needed no conventions reproduced. The
common rule that made all five tractable was the one from the Rails reader:
return the schema *and* a list of lines you did not read.

**A gate that is a coin toss teaches people to re-run the build.** The
200-table render budget was two seconds; CI took 2059 ms and went red on a
change that touched nothing near it. The number was measured on this machine
and applied to a two-core shared runner. It is now stated per environment —
8 s on CI, 2 s here — which is not a weakening: the regression it guards
against is an accidental quadratic in the layout, and that costs tens of
seconds on this corpus, not fifty-nine milliseconds.

### Still open

- Phase 4's gate, and Phase 5's repetition of it for MySQL: three real public
  repositories, every finding read by a person. Still an afternoon of reading,
  still not done, still not claimed. It is now the only thing left.

## 2026-09-23 — Phase 4's code: the command, the gate, and what is not cleared

**Did.** The baseline, explain, blast and usage rules in the model; schema
archaeology in sources; the CLI with nine commands; the Action; `self-check`
and `badge-check` as gates. 55 tests, 9 gates, `make ci` green.

### What surprised us

**The baseline stopped recognising its own debt.** The finding sentence
carries the support count — *(and 1 more)* — so copying a query into a second
file changed the sentence, changed the key, and resurrected debt somebody had
already accepted. The key strips the count and the line numbers now. The test
that caught it was the one that moved a query down a file.

**A test told me the truth about a test.** I asserted that a model with one
query, checked against a baseline from a model with three, had nothing new —
and it did have something new: with the other queries gone, a column that had
related to something now related to nothing, and naming drift fired. The rule
was right and my scenario was wrong.

**`explain` could not explain half its own findings.** It found the edge by
reading the arrow out of the sentence, and the orphan-side sentence has no
arrow. It reads that shape too now. A finding the tool cannot explain is a
finding a person cannot act on.

**The phase gate is not the code.** Everything in Phase 4's list is built and
tested, and the gate says *three public repositories, zero false findings,
read by a person*. That is not something I can do by writing more tests, and
the roadmap now says the code is ready to be tested against reality rather
than pretending the phase is cleared. This is the same discipline as the
handset gates in the mobile portfolio.

### Still open

- The Phase 4 gate itself: three real repositories, read by hand.
- Phase 5: MySQL, and the other ORM sources.

## 2026-09-23, small hours — Phase 3: the picture

**Did.** `@ledgerline/render`: ELK at build time, the SVG, the HTML with its
inline script, Mermaid and the badge line, seven tests including the contrast
assertion and a 200-table timing. Looked at the shop fixture in a browser:
the dotted undeclared joins with their marks, the ghost `audit_log` in a
dashed box, the polymorphic diamonds, focus dimming the rest and writing the
hash, the evidence panel showing the masked query. Phase 3 cleared; Phase 4
opened.

### What surprised us

**The evidence carried the comment above the query.** `-- The audit table
exists only in the queries.` was the first thing in the panel, because the
statement's location starts where the previous one ended. The evidence text
now skips leading comments the way the line count already did.

**A grey that passed on white failed on the header.** The ghost colour was
4.34:1 against the table-header fill; the test that composites every ink on
every surface caught it, and the ghost is a shade darker.

**`url(` is also a marker reference.** The no-network test forbade `url(` and
the SVG's own `marker-end="url(#crow)"` tripped it; the test now forbids
`url(` that is not `url(#`.

**What "accessibility audit" can mean in a test.** Labels, tab stops, a live
region, a role on the diagram, and contrast — those a test holds. A person
with a screen reader walking the diagram is not something this repository can
do, and the roadmap says so rather than claiming it.

### Still open

- Phase 4: the command, the gate, the Action, the pull-request comment, and
  the eight remaining things from ADR-0003.

## 2026-09-22, night — Phase 2: the queries, and fifteen more things

**Did.** ADR-0003 (fifteen things, four refused) before any code. Then
`claimsFromSql` over the PostgreSQL AST, the polymorphic pass, literal
masking, placeholder rewriting; four query sources including a string lexer
for eleven languages; support counts, the orphan-side and naming-drift
findings in the model; the 200-world property test; a fixture with real
migrations and real queries whose expected findings were read by hand. Phase
2 cleared; Phase 3 opened.

### What surprised us

**A doc comment closed itself.** The lexer's own documentation listed the
comment syntaxes it skips — including `/* */` — inside a `/** */` block, which
ended the block early; the next backtick opened a template literal that ran
forty lines until the lexer's own `` '`' ``. TypeScript reported an
unterminated string on the wrong line. Found by bisecting with `tsc`; the
comment now describes block comments in words.

**The polymorphic shape lives across clauses.** The join is in `JOIN … ON`
and the discriminator in `WHERE`, and the first pass looked for both inside
one predicate. The pass runs once per statement over everything it saw.

**`continue` swallowed the scalar subquery.** `a.x = (SELECT …)` fell into
the literal-equality branch, which continued before the subquery check was
reached. The test that had `users.id=orders.user_id` in its expected list
was the one that noticed.

**Statement locations sit before the comment.** libpg_query's location for a
statement that follows `--` is the comment's first byte, so the line count
skipped comments and whitespace as one leading run. And a template literal
that starts with a newline puts its `SELECT` on the next line, which is the
right line to report.

**The CTE shadowed nothing.** `WITH recent AS (…) SELECT … FROM recent` was
registering `recent` as a table because the CTE was in the same scope the
lookup skipped. A derived name now shadows a table of the same name at any
depth.

### Still open

- Phase 3: one static HTML file, ELK at build time, three edge treatments,
  focus subgraphs in the URL hash, Mermaid export, the accessibility audit.
- No command line yet; the model is reachable only through the packages and
  the fixture emitter.

## 2026-09-22, evening — Phase 1: the declared side, and the one word that differed

**Did.** `@ledgerline/parse` (libpg_query through `@pgsql/parser`, a
`SchemaBuilder` that folds statements in order), `@ledgerline/sources`
(migrations directory, Prisma via `@mrleebo/prisma-ast`, live PostgreSQL over
`pg_catalog`, the model file), a generated 200-table corpus, a `live-check`
gate, CI with a Postgres 16 service. Phase 1 cleared; Phase 2 opened.

### What surprised us

**The two readers disagreed on exactly one word.** Tables, columns,
nullability, keys, uniques, 375 foreign keys across three schemas — all
identical — and `serial` versus `integer`. PostgreSQL never stores `serial`;
it stores `integer` with a sequence default and reports `integer` back.
ADR-0002: spell every type as the database does. The gate that asks for
byte-identical output is the only reason this was found today rather than on
the first user's first diff.

**`node --test` runs files in parallel, and two of them shared a database.**
The 200-table gate found the small test's `orders` and `users` inside its own
introspection — one extra foreign key, 376 against 375. Each live test now
creates its own database from the maintenance connection. Isolation that was
not needed until a second file reached for the same server.

**`@pgsql/parser`'s ESM entry does not load.** It re-exports `./types`, a
directory, which Node's ESM resolver refuses; the CommonJS entry resolves it.
`createRequire` in an ESM file, one line, and a comment saying why.

**`pg` returns `name[]` as the literal `{a,b}`.** Every array column is cast to
`text[]` in the introspection queries so the driver parses it. Found in the
first row of the first run.

**Prisma's parser wants the file laid out the way Prisma writes it.** A
one-line `model User { id Int @id ... }` fails with *expecting LineBreak*;
fields on their own lines parse. Fine for real files, worth knowing for tests.

**The corpus is generated, not copied.** The roadmap said *from a public
open-source project*; a 200-table DDL dump of a GPL project inside an
Apache-2.0 repository is a licence question with no upside, and a generator
with a fixed seed gives renames, alters, composite and unnamed keys and three
schemas on demand. Real repositories are the Phase 4 gate, where the point is
finding true undeclared relationships in them, not parsing them.

### Still open

- Drizzle as a source moved to Phase 5 with the other ORMs; Prisma is in.
- Phase 2: the queries — joins, cross-table `WHERE`, subqueries, polymorphic
  pairs — into claims with evidence, and the property test over generated
  schemas and query sets.

## 2026-09-22, later — Phase 0, and the rules ahead of their inputs

**Did.** The pnpm workspace, `@ledgerline/model` with schema, claims, reconcile,
diff and findings, eleven tests, three fixtures with expected models diffed on
every build, the boundary gate, the fixtures gate, the Makefile, CI on Node 22.
Phase 0's gate cleared and Phase 1 opened.

### What surprised us

**ESLint's `patterns.group` does not do what a gitignore reader expects.**
`['*', '!./*', '!../*']` flagged the model's own relative imports; the negations
did not carry. The rule is a `regex: '^[^.]'` now — anything that does not start
with a dot is a package or a built-in — and the boundary check proved it fires
on `node:fs` before anything trusted it.

**Orientation from uniqueness turned out to be the whole cardinality story.** A
join does not say which way it points; a constraint does. With no constraint,
the side whose columns are the primary key or a unique constraint is the one
being pointed at, and if both or neither are unique the edge stays undirected
and *unknown*. Writing that down as a rule, with a test that a self-join stays
unknown, removed the temptation to guess — which is what every ERD tool that
draws a crow's foot on an inferred edge is doing.

**The gate for this phase was smaller than the code.** Phase 0 asked for one
fixture; reconcile, diff and findings were written because the model is one
package and the boundaries between those three are the design. Phase 1 now
only has to produce the inputs.

### Still open

- Phase 1: the real PostgreSQL grammar, migrations folded in order, Prisma and
  Drizzle, optional live introspection, and the model file on disk.
- `self-check` — the tool run on its own fixtures with a planted drift — waits
  for a CLI to run.

## 2026-09-22 — Started

**Did.** Searched the free ERD tool landscape (drawDB, ChartDB, Azimutt, Liam
ERD, dbdiagram.io, DrawSQL, QuickDBD, DBeaver, pgModeler, DbSchema, and the
rest), found the editors solved and free, and found the gaps: diagrams that go
stale, relationships the DDL never declares, no diff between versions, nothing
derived from the queries an application actually runs. Wrote the product
statement for the tool that starts from queries and treats the diagram as a
claim to be checked. Chose the toolchain, wrote the roadmap with an exit gate
per phase, and opened the repository.

**What surprised us.** How uniformly the category ignores the queries. Every
tool — free or paid, editor or generator — starts from `CREATE TABLE` or a
live connection. The one place the true relationships are written down, the
SQL the application runs, is read by none of them.

**Still open.** Everything. Phase 0 is the workspace and the gates.

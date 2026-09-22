# The Ledgerline action

Everything this action does is one CLI command; nothing here decides anything
the terminal would decide differently.

```yaml
- uses: nobledeveloper01/ledgerline/action@main
  with:
    command: check     # or model, report, pr
```

On a pull request it also posts the comment — a sentence first, the detail in
a `<details>` — editing the one comment it has rather than adding another on
every push. That needs:

```yaml
permissions:
  contents: read
  pull-requests: write
```

No database is required. Pass `database-url` only if you want the declared
schema read from a live database rather than from the migrations.

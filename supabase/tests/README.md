# app rules tests

Checks the privacy rules in `../app.sql` against a plain Postgres 16 that imitates Supabase
(roles, `auth.uid()`, a minimal `storage` schema). Every line prints PASS or stops at the first FAIL.

```bash
createdb orbitest
psql -d orbitest -f supabase/tests/mock_supabase.sql
psql -d orbitest -f supabase/app.sql
psql -d orbitest -f supabase/tests/app_rules.sql
```

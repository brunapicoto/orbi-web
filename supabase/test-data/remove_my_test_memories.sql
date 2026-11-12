-- Removes the test plans added by my_test_memories.sql (and their photo records).
delete from public.plans where note like 'test plan:%';

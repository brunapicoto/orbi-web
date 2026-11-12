import "server-only";
import { redirect } from "next/navigation";
import { getStore } from "@/lib/app/store";

/** For every signed-in page: the store and the person, with a first name. */
export async function requireMe(path: string) {
  const store = await getStore();
  const me = await store.me();
  if (!me) redirect(`/app/login?next=${encodeURIComponent(path)}`);
  if (!me.firstName) redirect(`/app/welcome?next=${encodeURIComponent(path)}`);
  return { store, me: { ...me, firstName: me.firstName } };
}

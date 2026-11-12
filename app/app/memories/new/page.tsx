import { AddMemoryForm } from "@/components/app/AddMemoryForm";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export default async function NewMemory() {
  const { store } = await requireMe("/app/memories/new");
  const mutuals = await store.mutuals();
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <p className="mono text-muted-2">add a memory</p>
        <h1 className="display text-[3rem]">something that already happened.</h1>
        <p className="text-[16px] text-muted">for the good nights that didn&apos;t start on orbi.</p>
      </header>
      <AddMemoryForm mutuals={mutuals} />
    </div>
  );
}

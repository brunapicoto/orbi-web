import Link from "next/link";

/** list / map, for the plans tab. */
export function ViewToggle({ current }: { current: "list" | "map" }) {
  const item = (id: "list" | "map", href: string) => (
    <Link
      href={href}
      aria-current={current === id ? "page" : undefined}
      className={`mono rounded-full px-4 py-2 text-[12px] ${current === id ? "bg-bone text-ink" : "text-muted-2 hover:text-bone"}`}
    >
      {id}
    </Link>
  );
  return (
    <nav aria-label="show plans as" className="flex gap-1 rounded-full border border-line bg-ink/90 p-1 backdrop-blur-md">
      {item("list", "/app")}
      {item("map", "/app/map")}
    </nav>
  );
}

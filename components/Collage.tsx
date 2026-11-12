import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

/**
 * Black-and-white cutout photos on a single bordeaux brushstroke.
 * PLACEHOLDER: drop transparent PNG cutouts (or JPGs) into /public/collage/
 * using the file names below. Until a file exists, a labelled frame shows instead.
 */
const SLOTS = [
  { file: "01.jpg", alt: "", className: "left-[4%] top-[14%] w-[34%] -rotate-3" },
  { file: "02.jpg", alt: "", className: "left-[34%] top-[2%] w-[32%] rotate-2" },
  { file: "03.jpg", alt: "", className: "right-[3%] top-[20%] w-[33%] -rotate-1" },
] as const;

export function Collage() {
  const dir = path.join(process.cwd(), "public", "collage");
  return (
    <figure className="relative mx-auto aspect-[5/3] w-full max-w-3xl" aria-label="collage of friends out together">
      {/* the brushstroke */}
      <svg viewBox="0 0 500 300" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="none">
        <path
          d="M18 170c40-58 118-92 214-98 92-6 176 10 236 40 18 9 20 30 4 44-56 46-150 78-262 80-86 2-154-14-188-34-14-8-14-20-4-32z"
          fill="#7A1428"
        />
        <path d="M60 118c62-30 160-46 262-32" stroke="#7A1428" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.7" />
      </svg>
      {SLOTS.map((s, i) => {
        const exists = fs.existsSync(path.join(dir, s.file));
        return (
          <div key={s.file} className={`absolute aspect-[3/4] ${s.className}`}>
            {exists ? (
              <Image
                src={`/collage/${s.file}`}
                alt={s.alt}
                fill
                sizes="(min-width: 768px) 260px, 33vw"
                className="object-contain grayscale contrast-125"
              />
            ) : (
              <div className="mono flex h-full w-full items-center justify-center rounded-lg border border-dashed border-lavender-soft/50 bg-ink/40 p-2 text-center text-[12px] text-lavender-soft">
                photo {i + 1}
                <br />
                /collage/{s.file}
              </div>
            )}
          </div>
        );
      })}
    </figure>
  );
}

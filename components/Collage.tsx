import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import { BarArt, CafeArt, MuseumArt, PaintArt, ParkArt, RunArt, SaunaArt, ShowArt } from "@/components/SceneArt";

/**
 * A sideways-scrolling row of example plans: white drawings on bordeaux cards.
 * Drop a photo into /public/collage/ with a card's file name to show it instead of the drawing.
 */
const CARDS = [
  { file: "met.jpg", label: "a visit to the met · sat 11am", Art: MuseumArt },
  { file: "monkey-bar.jpg", label: "dinner at monkey bar · thu 8pm", Art: BarArt },
  { file: "moms.jpg", label: "moms' meetup in central park · sat 10am", Art: ParkArt },
  { file: "01.jpg", label: "run club · sat 8am", Art: RunArt },
  { file: "02.jpg", label: "sauna · sun 5pm", Art: SaunaArt },
  { file: "comedy.jpg", label: "comedy night · fri 9pm", Art: ShowArt },
  { file: "03.jpg", label: "painting class · tue 7pm", Art: PaintArt },
  { file: "brunch.jpg", label: "brunch · sun 11am", Art: CafeArt },
] as const;

export function Collage() {
  const dir = path.join(process.cwd(), "public", "collage");
  return (
    <div className="flex flex-col gap-4">
      <p className="mono text-muted-2">examples · scroll for more</p>
      <ul
        aria-label="example plans"
        tabIndex={0}
        className="no-scrollbar -mx-[max(20px,calc((100vw-72rem)/2+20px))] flex snap-x snap-mandatory gap-5 overflow-x-auto px-[max(20px,calc((100vw-72rem)/2+20px))] py-6 [scroll-padding-inline:max(20px,calc((100vw-72rem)/2+20px))]"
      >
        {CARDS.map((c, i) => {
          const photo = fs.existsSync(path.join(dir, c.file));
          return (
            <li
              key={c.file}
              className={`relative flex aspect-[3/4] w-[230px] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] bg-bordeaux shadow-[0_24px_60px_rgba(14,12,13,0.5)] md:w-[270px] ${
                i % 2 ? "rotate-[1.5deg]" : "-rotate-[1.5deg]"
              }`}
            >
              {photo ? (
                <Image src={`/collage/${c.file}`} alt={c.label} fill sizes="270px" className="object-cover grayscale contrast-125" />
              ) : (
                <div className="flex-1 px-6 pt-6">
                  <c.Art />
                </div>
              )}
              <span className="mono relative bg-bordeaux px-4 pb-5 pt-2 text-center text-[12px] text-lavender-soft">{c.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

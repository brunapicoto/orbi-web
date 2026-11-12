import { OrbitDial } from "@/components/OrbitDial";

export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bordeaux" role="status">
      <div className="w-20">
        <OrbitDial interactive={false} />
      </div>
      <span className="sr-only">loading</span>
    </div>
  );
}

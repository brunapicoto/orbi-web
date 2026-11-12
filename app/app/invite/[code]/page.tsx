import Link from "next/link";
import { OrbitDial } from "@/components/OrbitDial";
import { AcceptInvite } from "@/components/app/Forms";
import { requireMe } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export default async function Invite({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const { store, me } = await requireMe(`/app/invite/${code}`);
  const name = await store.inviteName(code);
  const own = code === me.inviteCode;

  return (
    <div className="flex flex-col gap-10 pt-6">
      <div className="w-24">
        <OrbitDial phase="reveal" interactive={false} />
      </div>
      {!name ? (
        <>
          <h1 className="display text-[2.75rem]">this invite link doesn&apos;t work.</h1>
          <p className="text-muted">ask your friend to send their link again.</p>
        </>
      ) : own ? (
        <>
          <h1 className="display text-[2.75rem]">this is your own link.</h1>
          <p className="text-muted">send it to friends you want in your orbit.</p>
          <Link href="/app/mutuals" className="mono link-draw self-start text-lavender">
            go to your mutuals
          </Link>
        </>
      ) : (
        <>
          <h1 className="display text-[2.75rem]">{name.toLowerCase()} wants you in their orbit.</h1>
          <p className="text-muted">once you connect, you&apos;ll see each other&apos;s plans. nobody sees who else is going until a plan starts.</p>
          <AcceptInvite code={code} name={name} />
        </>
      )}
    </div>
  );
}

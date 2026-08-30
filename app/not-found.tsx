import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4">
      <h1 className="font-display text-4xl text-clay-200">That mark does not open.</h1>
      <p className="mt-3 text-clay-400">
        Kiln marks are four letters, A–Z. Open a link like <code>/r/KILN</code> or mint a new mark from the home page.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex w-fit rounded-xl bg-ember-500 px-4 py-2 text-ink-950"
      >
        Back to Shardroom
      </Link>
      <SiteFooter />
    </main>
  );
}

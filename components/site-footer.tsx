export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-ink-700/80 px-4 py-8 text-center text-sm text-clay-400">
      <p>
        Original work by{" "}
        <a
          className="text-ember-300 underline decoration-ember-500/60 underline-offset-4 hover:text-ember-400"
          href="https://www.mdrashedulhasan.me"
          target="_blank"
          rel="noreferrer"
        >
          Md Rashedul Hasan
        </a>
        .
      </p>
      <p className="mt-2 text-clay-400/70">
        Prompts stay in the browser mesh. PeerJS is used only to introduce devices.
      </p>
    </footer>
  );
}

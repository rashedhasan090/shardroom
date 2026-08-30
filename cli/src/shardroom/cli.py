"""Shardroom command line: print kiln URLs, optionally open a browser."""

from __future__ import annotations

import argparse
import os
import random
import sys
import webbrowser

ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
DEFAULT_ORIGIN = "https://shardroom.mdrashedulhasan.me"


def mint_code() -> str:
    return "".join(random.choice(ALPHABET) for _ in range(4))


def origin() -> str:
    return os.environ.get("SHARDROOM_ORIGIN", DEFAULT_ORIGIN).rstrip("/")


def room_url(code: str) -> str:
    return f"{origin()}/r/{code}"


def normalize(code: str) -> str:
    letters = "".join(ch for ch in code.upper() if ch.isalpha())
    return letters[:4]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="shardroom",
        description="Kindle or join a Shardroom kiln (four-letter browser mesh).",
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("create", help="Mint a four-letter mark and print the kiln URL")

    join = sub.add_parser("join", help="Print (and open) a kiln URL for an existing mark")
    join.add_argument("code", help="Four-letter kiln mark")
    join.add_argument(
        "--print-only",
        action="store_true",
        help="Do not open a browser",
    )

    args = parser.parse_args(argv)

    if args.cmd == "create":
        code = mint_code()
        url = room_url(code)
        print(code)
        print(url)
        return 0

    if args.cmd == "join":
        code = normalize(args.code)
        if len(code) != 4:
            print("Kiln marks are four letters A–Z.", file=sys.stderr)
            return 2
        url = room_url(code)
        print(url)
        if not args.print_only:
            opened = webbrowser.open(url)
            if not opened:
                print("Could not open a browser; use the URL above.", file=sys.stderr)
        return 0

    parser.error(f"unknown command {args.cmd}")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())

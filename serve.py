from __future__ import annotations

import argparse
import http.server
import socketserver
from pathlib import Path


class StaticHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve DG frontend locally.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=5173)
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parent
    root = project_root / "dist"
    if not root.exists():
        raise SystemExit("dist/ 不存在。请先运行 npm install 和 npm run build。开发模式请使用 npm run dev。")
    handler = lambda *handler_args, **handler_kwargs: StaticHandler(  # noqa: E731
        *handler_args,
        directory=str(root),
        **handler_kwargs,
    )

    with socketserver.TCPServer((args.host, args.port), handler) as server:
        print(f"DG Vue production build running at http://{args.host}:{args.port}")
        print("Press Ctrl+C to stop.")
        server.serve_forever()


if __name__ == "__main__":
    main()

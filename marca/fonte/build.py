"""Troca {{IMG:nome}} pelo SVG da pasta da marca como data URI."""
import base64
import re
import sys

src, marca, out = sys.argv[1], sys.argv[2], sys.argv[3]
html = open(src, encoding="utf-8").read()


def repl(m):
    data = open(f"{marca}/{m.group(1)}.svg", "rb").read()
    return "data:image/svg+xml;base64," + base64.b64encode(data).decode()


html = re.sub(r"\{\{IMG:([a-z0-9-]+)\}\}", repl, html)
open(out, "w", encoding="utf-8").write(html)
print(out, len(html))

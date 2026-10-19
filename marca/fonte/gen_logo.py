"""Gera os arquivos SVG da marca Genesis41 (assinatura A2) com o nome convertido em curvas."""
import json
import os
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONT, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

font = TTFont(FONT)
gs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font["head"].unitsPerEm
cap = font["OS/2"].sCapHeight
TRACK = -0.045 * upm

COLORS = {
    "positivo": {"text": "#16181D", "gold": "#A97A18", "line": "#16181D", "bg": None},
    "negativo": {"text": "#F2F1EC", "gold": "#E0AE4E", "line": "#F2F1EC", "bg": None},
    "mono-preto": {"text": "#16181D", "gold": "#16181D", "line": "#16181D", "bg": None},
    "mono-branco": {"text": "#FFFFFF", "gold": "#FFFFFF", "line": "#FFFFFF", "bg": None},
}
BITS = ["G", 1, 0, 1, 0, 0, 1]


def word_paths(text):
    """Retorna (lista de (char, path_d)), largura total, ymin, ymax em unidades da fonte, eixo y para baixo."""
    x = 0
    items = []
    ymin, ymax = 0, 0
    for i, ch in enumerate(text):
        gname = cmap[ord(ch)]
        glyph = gs[gname]
        pen = SVGPathPen(gs)
        tpen = TransformPen(pen, (1, 0, 0, -1, x, 0))
        glyph.draw(tpen)
        bp = BoundsPen(gs)
        glyph.draw(TransformPen(bp, (1, 0, 0, -1, x, 0)))
        if bp.bounds:
            ymin = min(ymin, bp.bounds[1])
            ymax = max(ymax, bp.bounds[3])
        items.append((ch, pen.getCommands()))
        x += glyph.width + (TRACK if i < len(text) - 1 else 0)
    return items, x, ymin, ymax


items, W, Ymin, Ymax = word_paths("genesis41")
# a última letra não precisa do tracking; a largura visual vem da caixa real
bp = BoundsPen(gs)
x = 0
for i, ch in enumerate("genesis41"):
    g = gs[cmap[ord(ch)]]
    g.draw(TransformPen(bp, (1, 0, 0, -1, x, 0)))
    x += g.width + TRACK
X0, _, X1, _ = bp.bounds
W = X1 - X0

name_d = "".join(d for ch, d in items[:7])
num_d = "".join(d for ch, d in items[7:])


def cell(kind, x, y, h, c, uid):
    r = h * 0.2
    if kind == "G":
        s = h / 20.0
        g = (f'M{x+14.2*s:.2f} {y+5.6*s:.2f} H{x+8.2*s:.2f} Q{x+5.6*s:.2f} {y+5.6*s:.2f} {x+5.6*s:.2f} {y+8.2*s:.2f} '
             f'V{y+11.8*s:.2f} Q{x+5.6*s:.2f} {y+14.4*s:.2f} {x+8.2*s:.2f} {y+14.4*s:.2f} H{x+11.8*s:.2f} '
             f'Q{x+14.4*s:.2f} {y+14.4*s:.2f} {x+14.4*s:.2f} {y+11.8*s:.2f} V{y+10*s:.2f} H{x+10.6*s:.2f}')
        return (f'<mask id="{uid}"><rect x="{x:.2f}" y="{y:.2f}" width="{h:.2f}" height="{h:.2f}" fill="#fff"/>'
                f'<path d="{g}" fill="none" stroke="#000" stroke-width="{2.3*s:.2f}" stroke-linecap="round" stroke-linejoin="round"/></mask>'
                f'<rect x="{x:.2f}" y="{y:.2f}" width="{h:.2f}" height="{h:.2f}" rx="{r:.2f}" fill="{c["line"]}" mask="url(#{uid})"/>')
    if kind == 1:
        return f'<rect x="{x:.2f}" y="{y:.2f}" width="{h:.2f}" height="{h:.2f}" rx="{r:.2f}" fill="{c["gold"]}"/>'
    sw = h * 0.11
    return (f'<rect x="{x+sw/2:.2f}" y="{y+sw/2:.2f}" width="{h-sw:.2f}" height="{h-sw:.2f}" rx="{r-sw/2:.2f}" '
            f'fill="none" stroke="{c["line"]}" stroke-width="{sw:.2f}"/>')


def strip(x0, y0, h, gap, c, prefix):
    return "".join(cell(k, x0 + i * (h + gap), y0, h, c, f"{prefix}m{i}") for i, k in enumerate(BITS))


def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" width="{w:.0f}" height="{h:.0f}" role="img">'
            f'<title>{title}</title>{body}</svg>\n')


PAD = 0.12 * upm
h = cap * 1.0
gap = h * 0.16  # o mesmo espaçamento da A2 aprovada: o binário fica mais largo que o nome, centralizado
SW = 7 * h + 6 * gap
strip_top = Ymax + 0.12 * upm  # abaixo da perna do g
inner = max(W, SW)

meta = {}

# Assinatura principal A2 (empilhada, centralizada)
for key, c in COLORS.items():
    tx = PAD + (inner - W) / 2 - X0
    ty = PAD - Ymin
    body = (f'<g transform="translate({tx:.1f} {ty:.1f})"><path d="{name_d}" fill="{c["text"]}"/><path d="{num_d}" fill="{c["gold"]}"/></g>'
            + strip(PAD + (inner - SW) / 2, ty + strip_top, h, gap, c, f"a{key.replace('-', '')}"))
    total_w = inner + 2 * PAD
    total_h = ty + strip_top + h + PAD
    with open(f"{OUT}/genesis41-logo-{key}.svg", "w") as f:
        f.write(svg(total_w, total_h, body, "Genesis41"))

# Assinatura horizontal (A3)
for key in ("positivo", "negativo"):
    c = COLORS[key]
    hg = h * 0.22
    sw = 7 * h + 6 * hg
    space = 0.34 * upm
    word_top = -cap  # alinhar maiúsculas com as casas
    ty = PAD - Ymin
    strip_y = ty - cap
    body = (strip(PAD, strip_y, h, hg, c, f"h{key[:2]}")
            + f'<g transform="translate({PAD + sw + space - X0:.1f} {ty:.1f})"><path d="{name_d}" fill="{c["text"]}"/><path d="{num_d}" fill="{c["gold"]}"/></g>')
    total_w = PAD + sw + space + W + PAD
    total_h = ty + Ymax + PAD
    with open(f"{OUT}/genesis41-logo-horizontal-{key}.svg", "w") as f:
        f.write(svg(total_w, total_h, body, "Genesis41"))

# Só o símbolo
for key in ("positivo", "negativo"):
    c = COLORS[key]
    s = 20
    g6 = 6
    body = strip(2, 2, s, g6, c, f"s{key[:2]}")
    with open(f"{OUT}/genesis41-simbolo-{key}.svg", "w") as f:
        f.write(svg(7 * s + 6 * g6 + 4, s + 4, body, "Símbolo Genesis41"))

# Ícone de aplicativo
icon = ('<rect x="0" y="0" width="64" height="64" rx="14" fill="#11141A"/>'
        '<path d="M43 15 H24 Q17 15 17 22 V33 Q17 40 24 40 H36 Q43 40 43 33 V28 H32.5" fill="none" stroke="#F2F1EC" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
        '<rect x="11" y="47" width="6" height="6" rx="1.4" fill="#E0AE4E"/>'
        '<rect x="18.75" y="47.75" width="4.5" height="4.5" rx="1" fill="none" stroke="#F2F1EC" stroke-width="1.5"/>'
        '<rect x="25.75" y="47" width="6" height="6" rx="1.4" fill="#E0AE4E"/>'
        '<rect x="33.5" y="47.75" width="4.5" height="4.5" rx="1" fill="none" stroke="#F2F1EC" stroke-width="1.5"/>'
        '<rect x="40.5" y="47.75" width="4.5" height="4.5" rx="1" fill="none" stroke="#F2F1EC" stroke-width="1.5"/>'
        '<rect x="47" y="47" width="6" height="6" rx="1.4" fill="#E0AE4E"/>')
with open(f"{OUT}/genesis41-icone-app.svg", "w") as f:
    f.write(svg(64, 64, icon, "Genesis41"))

fav = ('<rect x="0" y="0" width="32" height="32" rx="7" fill="#11141A"/>'
       '<path d="M22.7 8.9 H13.1 Q8.9 8.9 8.9 13.1 V18.9 Q8.9 23.1 13.1 23.1 H18.9 Q23.1 23.1 23.1 18.9 V16 H17" fill="none" stroke="#E0AE4E" stroke-width="3.7" stroke-linecap="round" stroke-linejoin="round"/>')
with open(f"{OUT}/genesis41-favicon.svg", "w") as f:
    f.write(svg(32, 32, fav, "Genesis41"))

# Símbolos para embutir nas páginas: nome em curvas, em unidades da fonte
wm_w = W
wm_top, wm_bot = Ymin, Ymax
snippet = {
    "viewBox": f"{X0:.1f} {Ymin:.1f} {W:.1f} {Ymax - Ymin:.1f}",
    "name_d": name_d,
    "num_d": num_d,
    "cap_ratio": cap / (Ymax - Ymin),
    "strip_top_ratio": (strip_top - Ymin) / (Ymax - Ymin),
    "W": W, "H": Ymax - Ymin, "cap": cap, "gap": gap, "strip_top": strip_top, "X0": X0, "Ymin": Ymin,
}
with open(f"{OUT}/wordmark.json", "w") as f:
    json.dump(snippet, f)
print(json.dumps({k: v for k, v in snippet.items() if not k.endswith("_d")}, indent=1))

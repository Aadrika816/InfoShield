"""
Generates frontend/css/theme-light.css from frontend/css/style.css.

Every rule that uses a dark-theme colour (dark surfaces, white/pale text,
white translucent borders, heavy black shadows) gets a matching
`[data-theme="light"]` override. Accent colours (saffron, green, blue, red)
are kept so the brand identity is identical in both themes.

Run:  python tools/gen_light_theme.py
"""
import colorsys
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "frontend", "css", "style.css")
OUT = os.path.join(ROOT, "frontend", "css", "theme-light.css")

COLOR_RE = re.compile(
    r"#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(\s*[\d.\s,%]+\)")
VAR_RE = re.compile(r"var\(--[a-z-]+\)")


def parse(c):
    c = c.strip()
    if c.startswith("#"):
        h = c[1:]
        if len(h) == 3:
            h = "".join(x * 2 for x in h)
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        a = int(h[6:8], 16) / 255 if len(h) == 8 else 1.0
        return r, g, b, a
    nums = [float(x) for x in re.findall(r"[\d.]+", c)]
    r, g, b = nums[:3]
    a = nums[3] if len(nums) > 3 else 1.0
    return r, g, b, a


def fmt(r, g, b, a):
    r, g, b = [max(0, min(255, int(round(v)))) for v in (r, g, b)]
    if a >= 0.995:
        return "#%02x%02x%02x" % (r, g, b)
    return "rgba(%d, %d, %d, %.2f)" % (r, g, b, min(a, 1))


def hls(r, g, b):
    return colorsys.rgb_to_hls(r / 255, g / 255, b / 255)


def is_accent(r, g, b):
    h, l, s = hls(r, g, b)
    return s > 0.45 and 0.22 <= l <= 0.72


def is_dark(r, g, b):
    return hls(r, g, b)[1] < 0.22 and not (is_accent(r, g, b))


def map_surface(r, g, b, a):
    l = hls(r, g, b)[1]
    if (r, g, b) == (0, 0, 0):          # pure black overlay / shadow
        return 15, 23, 42, a * 0.35
    if l < 0.06:
        return 238, 242, 247, a
    if l < 0.13:
        return 255, 255, 255, a
    return 244, 247, 251, a


def map_bg(c):
    r, g, b, a = parse(c)
    if r > 240 and g > 240 and b > 240 and a < 0.95:      # white glass
        return fmt(15, 23, 42, a * 0.8)
    if is_dark(r, g, b):
        return fmt(*map_surface(r, g, b, a))
    return None


def map_border(c):
    r, g, b, a = parse(c)
    if r > 200 and g > 200 and b > 200 and a < 0.95:
        return fmt(15, 23, 42, min(0.9, a * 1.3))
    if is_dark(r, g, b):
        return fmt(203, 213, 225, a)
    return None


def map_text(c):
    r, g, b, a = parse(c)
    h, l, s = hls(r, g, b)
    if l > 0.85 and s < 0.35:
        return fmt(15, 23, 42, a) if l > 0.93 else fmt(51, 65, 85, a)
    if l > 0.5 and s < 0.25:                          # slate greys (muted)
        return fmt(71, 85, 105, a)
    if l > 0.6 and s >= 0.25:                         # pastel accent text
        rr, gg, bb = colorsys.hls_to_rgb(h, 0.27, min(1, s + 0.1))
        return fmt(rr * 255, gg * 255, bb * 255, a)
    return None


def map_shadow(decl):
    def rep(m):
        r, g, b, a = parse(m.group(0))
        if (r, g, b) == (0, 0, 0):
            return fmt(15, 23, 42, a * 0.22)
        return m.group(0)
    return COLOR_RE.sub(rep, decl)


def transform(prop, value):
    p = prop.strip().lower()
    if p.startswith("box-shadow") or p == "text-shadow" or p == "filter":
        new = map_shadow(value)
        return new if new != value else None
    if p == "color":
        m = COLOR_RE.fullmatch(value.strip())
        if m:
            return map_text(value)
        return None
    if p.startswith("background") or p.startswith("border") or p in ("outline", "fill", "stroke"):
        fn = map_bg if p.startswith("background") or p in ("fill",) else map_border
        changed = [False]

        def rep(m):
            res = fn(m.group(0))
            if res:
                changed[0] = True
                return res
            return m.group(0)
        new = COLOR_RE.sub(rep, value)
        return new if changed[0] else None
    return None


def split_decls(body):
    out, depth, cur = [], 0, ""
    for ch in body:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == ";" and depth == 0:
            out.append(cur)
            cur = ""
        else:
            cur += ch
    if cur.strip():
        out.append(cur)
    return out


def has_solid_accent_bg(decls):
    for d in decls:
        if ":" not in d:
            continue
        k, v = d.split(":", 1)
        if k.strip().lower().startswith("background"):
            for m in COLOR_RE.finditer(v):
                r, g, b, a = parse(m.group(0))
                if a >= 0.7 and is_accent(r, g, b):
                    return True
    return False


def prefix(sel):
    parts = []
    for s in sel.split(","):
        s = s.strip()
        if not s:
            continue
        if s.startswith("html"):
            parts.append('[data-theme="light"]')
        elif s == "body" or s.startswith("body "):
            parts.append('[data-theme="light"] ' + s)
        else:
            parts.append('[data-theme="light"] ' + s)
    return ", ".join(parts)


def walk(css, in_media=None):
    out = []
    i, n = 0, len(css)
    while i < n:
        j = css.find("{", i)
        if j == -1:
            break
        head = css[i:j].strip()
        depth, k = 1, j + 1
        while k < n and depth:
            if css[k] == "{":
                depth += 1
            elif css[k] == "}":
                depth -= 1
            k += 1
        body = css[j + 1:k - 1]
        i = k
        head = re.sub(r"/\*.*?\*/", "", head, flags=re.S).strip()
        if head.startswith("@media"):
            inner = walk(body)
            if inner:
                out.append(head + " {\n" + inner + "}\n")
        elif head.startswith("@") or not head or head.startswith(":root"):
            continue
        else:
            decls = split_decls(re.sub(r"/\*.*?\*/", "", body, flags=re.S))
            keep_text = has_solid_accent_bg(decls)
            new = []
            for d in decls:
                if ":" not in d:
                    continue
                k2, v = d.split(":", 1)
                if k2.strip().lower() == "color" and keep_text:
                    continue
                t = transform(k2, v.strip().replace("!important", "").strip())
                if t:
                    new.append("  %s: %s !important;" % (k2.strip(), t))
            if new:
                out.append("%s {\n%s\n}\n" % (prefix(head), "\n".join(new)))
    return "".join(out)


HEADER = """/* ==========================================================================
   InfoShield - Light Theme  (AUTO-GENERATED by tools/gen_light_theme.py)
   Activated by <html data-theme="light">. Dark theme = default style.css.
   ========================================================================== */

[data-theme="light"] {
  color-scheme: light;
  --bg-primary: #eef2f7;
  --bg-secondary: #e6ecf4;
  --bg-surface: #ffffff;
  --bg-surface-elevated: #f4f7fb;
  --bg-glass: rgba(255, 255, 255, 0.85);
  --border-subtle: rgba(15, 23, 42, 0.12);
  --text-main: #0f172a;
  --text-muted: #475569;
  --text-dim: #64748b;
  --color-civic-white: #0f172a;
  --shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.08);
  --shadow-md: 0 8px 24px rgba(15, 23, 42, 0.12);
  --shadow-lg: 0 16px 40px rgba(15, 23, 42, 0.16);
}

[data-theme="light"] body {
  background-color: #eef2f7 !important;
  background-image:
    radial-gradient(circle at 10% 8%, rgba(255, 153, 51, 0.16) 0%, transparent 45%),
    radial-gradient(circle at 90% 12%, rgba(19, 136, 8, 0.10) 0%, transparent 45%),
    radial-gradient(circle at 50% 40%, rgba(14, 165, 233, 0.08) 0%, transparent 55%) !important;
  color: #0f172a;
}

[data-theme="light"] a { color: #0369a1; }
[data-theme="light"] a:hover { color: #c2410c; }

/* Inline-styled white text in markup / JS templates */
[data-theme="light"] [style*="color: #fff"],
[data-theme="light"] [style*="color:#fff"] { color: #0f172a !important; }
[data-theme="light"] .btn-primary, [data-theme="light"] .btn-danger { color: #fff !important; }

"""

if __name__ == "__main__":
    css = open(SRC, encoding="utf8").read()
    css = re.sub(r"@import[^;]+;", "", css)
    body = walk(css)
    open(OUT, "w", encoding="utf8").write(HEADER + body)
    print("wrote", OUT, len(body), "bytes")

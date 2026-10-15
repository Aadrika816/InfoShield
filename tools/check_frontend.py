"""Sanity checks: JS syntax of edited files + translation coverage + i18n key usage in index.html."""
import json
import os
import re

import esprima

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FE = os.path.join(ROOT, "frontend")

for f in ["js/app.js", "js/data/translations_ui.js", "js/data/translations_dravidian.js"]:
    src = open(os.path.join(FE, f), encoding="utf8").read()
    src = src.replace("?.", ".").replace("??", "||")  # esprima predates optional chaining
    try:
        esprima.parseScript(src)
        print("OK ", f)
    except Exception as e:
        print("ERR", f, e)


def obj(f, name):
    t = open(os.path.join(FE, "js", "data", f), encoding="utf8").read()
    t = t[t.index("{", t.index("const " + name)):]
    return json.JSONDecoder().raw_decode(t)[0]


T = obj("translations.js", "TRANSLATIONS")
D = obj("translations_dravidian.js", "TRANSLATIONS_DRAVIDIAN")
U = obj("translations_ui.js", "TRANSLATIONS_UI")
for l in T:
    T[l].update(D.get(l, {}))
    T[l].update(U[l])
en = T["en"]
for l in T:
    same = [k for k in en if T[l][k] == en[k]]
    print(l, len(T[l]), "same-as-en:", len(same), [k for k in same if len(en[k]) > 25][:5])

h = open(os.path.join(FE, "index.html"), encoding="utf8").read()
used = set(re.findall(r'data-i18n(?:-placeholder|-title)?="([^"]+)"', h))
print("keys used in html:", len(used), "| missing in en:", [k for k in used if k not in en])

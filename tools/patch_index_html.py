"""One-off patcher: wires theme switch, chart/verify panels and extra i18n tags into index.html."""
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IDX = os.path.join(ROOT, "frontend", "index.html")
TR = os.path.join(ROOT, "frontend", "js", "data", "translations.js")

h = open(IDX, encoding="utf8").read()

# ---- 1. head: theme bootstrap + stylesheets ------------------------------------------
if "theme-light.css" not in h:
    h = h.replace(
        '<link rel="stylesheet" href="css/style.css">',
        '<script>\n'
        '    /* Apply saved theme before first paint (no flash) */\n'
        '    (function () {\n'
        '      var t = "dark";\n'
        '      try { t = localStorage.getItem("infoshield-theme") || "dark"; } catch (e) {}\n'
        '      document.documentElement.setAttribute("data-theme", t);\n'
        '    })();\n'
        '  </script>\n'
        '  <link rel="stylesheet" href="css/style.css">\n'
        '  <link rel="stylesheet" href="css/theme-light.css">\n'
        '  <link rel="stylesheet" href="css/insights.css">')

# ---- 2. theme switch in header --------------------------------------------------------
if "themeSwitch" not in h:
    h = h.replace(
        '<div class="nav-right-actions">',
        '<div class="nav-right-actions">\n'
        '        <div class="theme-switch" id="themeSwitch" role="group" aria-label="Colour theme" '
        'data-i18n-title="themeToggleTitle" title="Switch colour theme">\n'
        '          <button type="button" class="theme-opt" id="themeBtnLight" data-theme-choice="light">'
        '<span class="theme-ico" aria-hidden="true">☀️</span><span data-i18n="themeLight">Light</span></button>\n'
        '          <button type="button" class="theme-opt" id="themeBtnDark" data-theme-choice="dark">'
        '<span class="theme-ico" aria-hidden="true">🌙</span><span data-i18n="themeDark">Dark</span></button>\n'
        '        </div>', 1)

# ---- 3. insight panels (chart + official verification) --------------------------------
PANELS = '''<!-- Result at a Glance (donut chart) + Official Website Verification -->
        <div class="insight-grid" id="insightGrid">
          <section class="insight-card chart-card" aria-labelledby="chartTitleH">
            <div class="insight-head">
              <h4 id="chartTitleH" data-i18n="chartTitle">Result at a Glance</h4>
              <p data-i18n="chartSubtitle">A simple picture of how risky this message is</p>
            </div>
            <div class="chart-body">
              <div class="donut-wrap">
                <svg id="riskDonut" viewBox="0 0 120 120" role="img" aria-label="Risk chart">
                  <circle class="donut-track" cx="60" cy="60" r="48"></circle>
                  <circle class="donut-arc" id="donutArc" cx="60" cy="60" r="48" transform="rotate(-90 60 60)"></circle>
                </svg>
                <div class="donut-center">
                  <strong id="donutValue">0%</strong>
                  <span data-i18n="chartRisk">Risk</span>
                </div>
              </div>
              <div class="chart-bars" id="chartBars"></div>
            </div>
            <div class="chart-legend">
              <span class="legend-item"><i class="legend-dot dot-risk"></i><span data-i18n="chartLegendRisk">Scam risk</span></span>
              <span class="legend-item"><i class="legend-dot dot-safe"></i><span data-i18n="chartLegendSafe">Safe</span></span>
            </div>
            <p id="plainVerdict" class="plain-verdict"></p>
          </section>

          <section class="insight-card verify-card" aria-labelledby="verifyTitleH">
            <div class="insight-head">
              <h4 id="verifyTitleH"><span aria-hidden="true">🏛️</span> <span data-i18n="verifyTitle">Verify on the Official Website</span></h4>
              <p data-i18n="verifySub">Never trust a forward alone. Open the official government website below and confirm it yourself.</p>
            </div>
            <ul class="verify-list" id="verifyLinks"></ul>
            <p class="verify-tip" data-i18n="verifyTip">Tip: a real government website always ends with .gov.in or .nic.in</p>
          </section>
        </div>

        '''
if "insightGrid" not in h:
    marker = "<!-- Benefit & Fee Mismatch Alert Banner"
    assert marker in h
    h = h.replace(marker, PANELS + marker, 1)

# ---- 4. scripts -----------------------------------------------------------------------
if "translations_ui.js" not in h:
    h = h.replace(
        '<script src="js/data/translations.js"></script>',
        '<script src="js/data/translations.js"></script>\n'
        '  <script src="js/data/translations_dravidian.js"></script>\n'
        '  <script src="js/data/translations_ui.js"></script>')

# ---- 5. auto-tag untagged elements whose text equals an English dictionary value -------
s = open(TR, encoding="utf8").read()
s = s[s.index("{", s.index("const TRANSLATIONS")):]
T, _ = json.JSONDecoder().raw_decode(s)
en = T["en"]


def norm(x):
    return re.sub(r"\s+", " ", html.unescape(x)).strip()


text_map, ph_map = {}, {}
for k, v in en.items():
    if "<" in v:
        continue
    text_map.setdefault(norm(v), k)
    ph_map.setdefault(norm(v), k)

tagged = 0


def tag_text(m):
    global tagged
    tag, attrs, inner = m.group(1), m.group(2), m.group(3)
    if "data-i18n" in attrs or "<" in inner:
        return m.group(0)
    key = text_map.get(norm(inner))
    if not key:
        return m.group(0)
    tagged += 1
    return "<%s%s data-i18n=\"%s\">%s</%s>" % (tag, attrs, key, inner, tag)


h = re.sub(r"<(span|p|h[1-6]|a|button|label|strong|option|div|li|summary)(\b[^>]*)>([^<]+)</\1>", tag_text, h)


def tag_ph(m):
    global tagged
    whole, val = m.group(0), m.group(2)
    if "data-i18n-placeholder" in whole:
        return whole
    key = ph_map.get(norm(val))
    if not key:
        return whole
    tagged += 1
    end = "/>" if whole.endswith("/>") else ">"
    return whole[:-len(end)].rstrip() + ' data-i18n-placeholder="%s"%s' % (key, end)


h = re.sub(r'<(input|textarea)\b[^>]*placeholder="([^"]*)"[^>]*>', tag_ph, h)

open(IDX, "w", encoding="utf8", newline="\n").write(h)
print("auto-tagged elements:", tagged)

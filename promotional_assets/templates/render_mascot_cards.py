import os
import subprocess
import re

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
base_dir = r"c:\Users\USER\Downloads\EbookBuddy\promotional_assets"
template_path = os.path.join(base_dir, "templates", "mascot_graphics.html")
images_dir = os.path.join(base_dir, "images")

with open(template_path, "r", encoding="utf-8") as f:
    content = f.read()

style_match = re.search(r"<style>(.*?)</style>", content, re.DOTALL)
common_style = style_match.group(1) if style_match else ""

sections = re.split(r"<!-- ==================== (MASCOT \d+:[^=]+) ==================== -->", content)
cards = []
for i in range(1, len(sections), 2):
    tag = sections[i].strip()
    card_body = sections[i+1].split("<!-- ====================")[0].split("</body>")[0].strip()
    cards.append((tag, card_body))

filename_map = {
    1: "post1_mascot_breakthrough.png",
    2: "post2_mascot_weekend.png",
    3: "post3_mascot_blueprint.png",
    4: "post4_mascot_free_gift.png",
    5: "post5_mascot_passive_income.png"
}

print(f"Found {len(cards)} mascot cards.")

common_defs = """<svg style="position:absolute; width:0; height:0;" xmlns="http://www.w3.org/2000/svg">
<defs>
  <radialGradient id="glowOrange" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#F26B21" stop-opacity="0.6"/>
    <stop offset="100%" stop-color="#F26B21" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="glowTeal" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#22C55E" stop-opacity="0.45"/>
    <stop offset="100%" stop-color="#22C55E" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#FFFFFF"/>
    <stop offset="60%" stop-color="#F0EDEA"/>
    <stop offset="100%" stop-color="#D9D5D0"/>
  </linearGradient>
  <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#FF8A48"/>
    <stop offset="100%" stop-color="#F26B21"/>
  </linearGradient>
  <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#242634"/>
    <stop offset="100%" stop-color="#14151E"/>
  </linearGradient>
  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="16" stdDeviation="18" flood-color="#000" flood-opacity="0.45"/>
  </filter>
</defs>
</svg>"""

for idx, (tag, card_body) in enumerate(cards, start=1):
    out_name = filename_map.get(idx, f"mascot_{idx}.png")
    out_png = os.path.join(images_dir, out_name)
    
    page_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
{common_style}
body {{
  margin: 0;
  padding: 0;
  background: #0D0E15;
  width: 1200px;
  height: 1200px;
  overflow: hidden;
}}
.canvas {{
  width: 1200px !important;
  height: 1200px !important;
}}
</style>
</head>
<body>
{common_defs}
{card_body}
</body>
</html>"""

    temp_html = os.path.join(base_dir, "templates", f"mascot_{idx}.html")
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(page_html)

    file_url = "file:///" + temp_html.replace("\\", "/")
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1200,1200",
        f"--screenshot={out_png}",
        file_url
    ]
    print(f"Rendering {tag} -> {out_name}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(out_png):
        print(f"  [OK] Saved {out_png} ({os.path.getsize(out_png):,} bytes)")

print("All mascot cards rendered successfully!")

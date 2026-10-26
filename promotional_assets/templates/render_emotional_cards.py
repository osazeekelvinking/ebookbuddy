import os
import subprocess
import re

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
base_dir = r"c:\Users\USER\Downloads\EbookBuddy\promotional_assets"
template_path = os.path.join(base_dir, "templates", "render_emotional_cards.html")
images_dir = os.path.join(base_dir, "images")

with open(template_path, "r", encoding="utf-8") as f:
    content = f.read()

style_match = re.search(r"<style>(.*?)</style>", content, re.DOTALL)
common_style = style_match.group(1) if style_match else ""

sections = re.split(r"<!-- ==================== (CARD \d+ EMOTION) ==================== -->", content)
cards = []
for i in range(1, len(sections), 2):
    tag = sections[i].strip()
    card_body = sections[i+1].split("<!-- ====================")[0].split("</body>")[0].strip()
    cards.append((tag, card_body))

filename_map = {
    "CARD 4 EMOTION": "post4_emotion_free_tool.png",
    "CARD 5 EMOTION": "post5_emotion_passive_income.png"
}

for tag, card_body in cards:
    out_name = filename_map.get(tag, "output.png")
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
  background: #0A0B0E;
  width: 1200px;
  height: 1200px;
  overflow: hidden;
}}
.card {{
  width: 1200px !important;
  height: 1200px !important;
}}
</style>
</head>
<body>
{card_body}
</body>
</html>"""

    temp_html = os.path.join(base_dir, "templates", f"{out_name}.html")
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

print("Emotional cards rendered successfully!")

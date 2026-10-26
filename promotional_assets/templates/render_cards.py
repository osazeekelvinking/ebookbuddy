import os
import subprocess
import re

edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
base_dir = r"c:\Users\USER\Downloads\EbookBuddy\promotional_assets"
template_path = os.path.join(base_dir, "templates", "post_graphics.html")
images_dir = os.path.join(base_dir, "images")
os.makedirs(images_dir, exist_ok=True)

with open(template_path, "r", encoding="utf-8") as f:
    content = f.read()

# Extract style
style_match = re.search(r"<style>(.*?)</style>", content, re.DOTALL)
common_style = style_match.group(1) if style_match else ""

# Extract cards using card comment delimiters
sections = re.split(r"<!-- ==================== CARD (\d+) ==================== -->", content)
cards = []
for i in range(1, len(sections), 2):
    card_id = sections[i].strip()
    card_body = sections[i+1].split("<!-- ====================")[0].split("</body>")[0].strip()
    cards.append((card_body, card_id))

# Filename mapping
card_filenames = {
    "1": "post1_contrarian_comparison.png",
    "2": "post2_fast_start_workflow.png",
    "3": "post3_15_stage_roadmap.png",
    "4": "post4_free_tool_showcase.png",
    "5": "post5_problem_to_profit.png"
}

print(f"Found {len(cards)} cards in template.")

for card_html, card_id in cards:
    card_name = card_filenames.get(card_id, f"post{card_id}.png")
    out_png = os.path.join(images_dir, card_name)
    
    # Standalone HTML
    page_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
{common_style}
body {{
  margin: 0;
  padding: 0;
  background: #14141A;
  width: 1200px;
  height: 1200px;
  overflow: hidden;
}}
.card-container {{
  width: 1200px !important;
  height: 1200px !important;
  border-radius: 0 !important;
}}
</style>
</head>
<body>
{card_html}
</body>
</html>"""
    
    temp_html = os.path.join(base_dir, "templates", f"card_{card_id}.html")
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(page_html)
    
    file_url = "file:///" + temp_html.replace("\\", "/")
    
    cmd = [
        edge_path,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size=1200,1200",
        f"--screenshot={out_png}",
        file_url
    ]
    
    print(f"Rendering Card {card_id} -> {card_name}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(out_png) and os.path.getsize(out_png) > 1000:
        print(f"  [OK] Saved {out_png} ({os.path.getsize(out_png):,} bytes)")
    else:
        print(f"  [ERROR] Failed to render {card_name}: {res.stderr}")

print("Done rendering all cards!")

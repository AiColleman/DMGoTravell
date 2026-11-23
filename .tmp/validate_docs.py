import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

root = Path("sdd").resolve()

markdown = sorted(root.rglob("*.md"))
link_re = re.compile(r"!?\[[^\]]*\]\(([^)]+)\)")
links = 0
broken = []
for file in markdown:
    text = file.read_text(encoding="utf-8", errors="replace")
    for match in link_re.finditer(text):
        raw = match.group(1).strip()
        if raw.startswith("<") and ">" in raw:
            target = raw[1:raw.index(">")]
        else:
            target = raw.split()[0] if raw.split() else ""
        if not target:
            continue
        if target.startswith(("http://", "https://", "mailto:", "tel:", "data:")):
            continue
        if target.startswith("#"):
            continue
        path_part = unquote(urlparse(target).path)
        if not path_part:
            continue
        links += 1
        candidate = (file.parent / path_part).resolve()
        if not candidate.exists():
            broken.append(f"{file.relative_to(root)} -> {target}")

dec_ids = set()
dec_headers = 0
for file in markdown:
    text = file.read_text(encoding="utf-8", errors="replace")
    dec_ids.update(re.findall(r"DEC-\d{3}", text))
    if file.name == "decisiones.md":
        dec_headers = len(re.findall(r"^#{2,3} DEC-\d{3}\b", text, flags=re.MULTILINE))

print(f"markdown={len(markdown)} links={links} broken={len(broken)} dec_ids={len(dec_ids)} dec_headers={dec_headers}")
for item in broken[:30]:
    print(item)
sys.exit(1 if broken else 0)

"""Build review sheets and a gallery from exhaustive Playwright captures.
Requires Pillow. Usage: python3 scripts/build-docs-contact-sheets.py /tmp/odella-docs-visual-audit before
Full screenshots stay untouched; sheets provide top, middle and ending views.
"""
import json
import math
import sys
import textwrap
from html import escape
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(sys.argv[1]) / sys.argv[2]
rows = json.loads((root / 'manifest.json').read_text())
out = root / 'sheets'
out.mkdir(exist_ok=True)
font_path = '/System/Library/Fonts/Supplemental/Arial.ttf'
font = ImageFont.truetype(font_path, 13)
small = ImageFont.truetype(font_path, 11)
pages = {}
for row in rows:
    pages.setdefault(row['id'], {})[row['width']] = row
ordered = sorted(pages.items())

def paste_crop(canvas, file, box, xy, size):
    image = Image.open(root / file).convert('RGB')
    box = (max(0, box[0]), max(0, box[1]), min(image.width, box[2]), min(image.height, box[3]))
    crop = image.crop(box)
    crop.thumbnail(size, Image.Resampling.LANCZOS)
    canvas.paste(crop, xy)

def tile(id, pair, ending=False):
    height = 315 if ending else 630
    im = Image.new('RGB', (640, height), '#f5f5f5')
    d = ImageDraw.Draw(im)
    desktop, mobile = pair.get(1440), pair.get(390)
    row = desktop or mobile
    label = id + '  ' + row['route']
    for line_no, line in enumerate(textwrap.wrap(label, 80)):
        d.text((8, 6 + line_no * 15), line, font=font, fill='#111')
    flags = []
    for r in pair.values():
        if r.get('failure'): flags.append(str(r['width']) + ':FAIL')
        if r.get('overflow'): flags.append(str(r['width']) + ':OVERFLOW')
        if len(r.get('h1s', [])) > 1: flags.append(str(r['width']) + ':H1x' + str(len(r['h1s'])))
        if r.get('brokenImages'): flags.append(str(r['width']) + ':BROKEN-IMG')
    d.text((8, 38), ' | '.join(flags) if flags else 'Desktop + mobile', font=small, fill='#a80000' if flags else '#666')
    if desktop and not desktop.get('failure'):
        c = desktop['content']
        if ending:
            y = max(0, c['y'] + c['height'] - 365)
            paste_crop(im, desktop['file'], (c['x'], y, c['x'] + c['width'], y + 365), (8, 65), (420, 240))
        else:
            paste_crop(im, desktop['file'], (280, 0, 1440, 850), (8, 65), (420, 310))
            y = max(c['y'], int(c['y'] + c['height'] * .48 - 180))
            paste_crop(im, desktop['file'], (c['x'], y, c['x'] + c['width'], y + 365), (8, 383), (420, 237))
    if mobile and not mobile.get('failure'):
        c = mobile['content']
        if ending:
            y = max(0, c['y'] + c['height'] - 540)
            paste_crop(im, mobile['file'], (0, y, 390, y + 540), (439, 65), (165, 240))
        else:
            paste_crop(im, mobile['file'], (0, 0, 390, 960), (439, 65), (165, 406))
            y = max(c['y'], int(c['y'] + c['height'] * .48 - 170))
            paste_crop(im, mobile['file'], (0, y, 390, y + 340), (439, 478), (165, 144))
    if not ending and desktop and not desktop.get('failure'):
        full = Image.open(root / desktop['file']).convert('RGB')
        full.thumbnail((27, 545), Image.Resampling.LANCZOS)
        im.paste(full, (608, 65))
    return im

for ending, per_sheet, height, prefix in [(False, 9, 630, 'overview'), (True, 18, 315, 'endings')]:
    for start in range(0, len(ordered), per_sheet):
        sheet = Image.new('RGB', (1920, height * math.ceil(per_sheet / 3)), '#ddd')
        for i, (id, pair) in enumerate(ordered[start:start + per_sheet]):
            sheet.paste(tile(id, pair, ending), ((i % 3) * 640, (i // 3) * height))
        sheet.save(out / f'{prefix}-{start // per_sheet + 1:02d}.png', optimize=True)

cards = []
for id, pair in ordered:
    route = (pair.get(1440) or pair.get(390))['route']
    links = ' '.join(f'<a href="{escape(r["file"])}">{w}px full screenshot</a>' for w, r in pair.items() if not r.get('failure'))
    preview = pair.get(1440) or pair.get(390)
    image = '' if preview.get('failure') else f'<a href="{escape(preview["file"])}"><img loading="lazy" src="{escape(preview["file"])}" alt="{escape(route)}"></a>'
    cards.append(f'<section id="page-{id}"><h2>{id} · {escape(route)}</h2><p>{links}</p>{image}</section>')
(root / 'index.html').write_text('<!doctype html><meta charset="utf-8"><title>Odella full-page visual audit</title><style>body{font:14px system-ui;margin:30px;background:#eee}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}section{background:white;padding:16px;min-width:0}h2{font-size:14px;overflow-wrap:anywhere}img{width:100%;max-height:700px;object-fit:contain;object-position:top}a{margin-right:12px}</style><h1>Odella visual audit · ' + escape(sys.argv[2]) + '</h1><p>Every published page, including hidden app-linked reference. Open a full screenshot to inspect at native resolution.</p><main>' + ''.join(cards) + '</main>')
print(f'Built {len(ordered)} page review tiles, contact sheets, and {root / "index.html"}')

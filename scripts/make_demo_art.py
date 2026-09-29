"""Flat illustrations used as demo 'photos' for store screenshots: python scripts/make_demo_art.py OUT_DIR

Drawn locally in the app-icon style (no stock photos). Replace with real photos any time.
"""
import math
import random
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

W, H = 1200, 900


def grad(top, bottom):
    im = Image.new("RGB", (W, H), top)
    d = ImageDraw.Draw(im)
    for y in range(H):
        t = y / H
        d.line([(0, y), (W, y)], fill=tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3)))
    return im


def finish(im, path):
    noise = Image.effect_noise((W // 2, H // 2), 22).resize((W, H)).convert("RGB")
    Image.blend(im, noise, 0.05).filter(ImageFilter.GaussianBlur(0.6)).save(path, quality=88)


def ramen(p):
    im = grad((58, 42, 36), (30, 22, 20)); d = ImageDraw.Draw(im)
    d.ellipse([220, 260, 980, 820], fill=(214, 70, 52))  # bowl rim
    d.ellipse([260, 290, 940, 760], fill=(236, 190, 120))  # broth
    for i in range(9):  # noodles
        y = 470 + i * 22
        d.arc([330, y - 90, 870, y + 90], 200, 340, fill=(250, 226, 160), width=10)
    d.ellipse([610, 360, 760, 480], fill=(250, 250, 240)); d.ellipse([650, 390, 720, 450], fill=(245, 170, 40))  # egg
    d.polygon([(380, 350), (520, 330), (500, 450)], fill=(40, 60, 40))  # nori
    for x in (420, 460, 700, 740):
        d.ellipse([x, 560, x + 26, 586], fill=(110, 170, 80))  # scallion
    d.line([(860, 180), (560, 520)], fill=(120, 80, 50), width=16); d.line([(900, 200), (600, 540)], fill=(120, 80, 50), width=16)
    finish(im, p)


def tower(p):
    im = grad((250, 170, 120), (120, 90, 160)); d = ImageDraw.Draw(im)
    d.ellipse([820, 120, 980, 280], fill=(255, 230, 190))
    for i in range(12):  # skyline
        x = i * 110 - 20; h = random.randint(140, 320)
        d.rectangle([x, H - h, x + 90, H], fill=(60, 50, 80))
    d.polygon([(600, 110), (680, 820), (520, 820)], fill=(224, 72, 48))
    for y in (330, 500, 650):
        d.rectangle([545 + (y - 330) // 12, y, 655 - (y - 330) // 12, y + 26], fill=(250, 250, 250))
    finish(im, p)


def ticket(p):
    im = grad((70, 110, 150), (40, 70, 110)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([170, 250, 1030, 650], 28, fill=(246, 238, 220))
    d.rectangle([170, 250, 1030, 330], fill=(64, 140, 110))
    d.line([(760, 260), (760, 640)], fill=(200, 190, 170), width=4)
    for i in range(6):
        d.rectangle([240, 390 + i * 38, 240 + random.randint(200, 420), 410 + i * 38], fill=(90, 90, 90))
    d.ellipse([820, 400, 960, 540], outline=(200, 70, 60), width=8)
    finish(im, p)


def fuji(p):
    im = grad((150, 200, 240), (230, 240, 250)); d = ImageDraw.Draw(im)
    d.polygon([(100, 820), (600, 250), (1100, 820)], fill=(70, 90, 140))
    d.polygon([(470, 400), (600, 250), (730, 400), (660, 380), (600, 420), (540, 380)], fill=(250, 250, 255))
    d.rectangle([0, 760, W, H], fill=(90, 140, 90))
    for i in range(7):
        x = 60 + i * 170
        d.ellipse([x, 700, x + 140, 800], fill=(240, 170, 190))
    finish(im, p)


def cake(p):
    im = grad((252, 228, 214), (240, 200, 190)); d = ImageDraw.Draw(im)
    d.ellipse([280, 700, 920, 800], fill=(220, 220, 225))
    d.rectangle([340, 430, 860, 740], fill=(250, 244, 236)); d.ellipse([340, 380, 860, 480], fill=(255, 250, 244))
    d.rectangle([340, 560, 860, 600], fill=(230, 110, 130))
    for x in (440, 540, 640, 740):
        d.rectangle([x, 300, x + 18, 420], fill=(120, 170, 230)); d.ellipse([x - 8, 250, x + 26, 310], fill=(255, 190, 60))
    finish(im, p)


def coffee(p):
    im = grad((200, 170, 140), (150, 115, 90)); d = ImageDraw.Draw(im)
    for cx in (420, 780):
        d.ellipse([cx - 210, 300, cx + 210, 720], fill=(245, 245, 240)); d.ellipse([cx - 170, 340, cx + 170, 680], fill=(120, 72, 40))
        d.ellipse([cx - 60, 450, cx + 60, 570], outline=(235, 210, 170), width=10)
    finish(im, p)


def beach(p):
    im = grad((255, 190, 130), (250, 120, 110)); d = ImageDraw.Draw(im)
    d.ellipse([480, 280, 720, 520], fill=(255, 235, 170))
    d.rectangle([0, 470, W, 680], fill=(60, 120, 170)); d.rectangle([0, 680, W, H], fill=(240, 210, 160))
    for i in range(5):
        d.line([(100 + i * 230, 520 + i * 25), (220 + i * 230, 520 + i * 25)], fill=(255, 220, 180), width=6)
    finish(im, p)


def city(p):
    im = grad((25, 30, 60), (60, 40, 80)); d = ImageDraw.Draw(im)
    for i in range(14):
        x = i * 90; h = random.randint(250, 600)
        d.rectangle([x, H - h, x + 80, H], fill=(35, 35, 55))
        for wy in range(H - h + 20, H - 20, 40):
            for wx in (x + 12, x + 44):
                if random.random() < 0.55:
                    d.rectangle([wx, wy, wx + 18, wy + 22], fill=(255, 210, 120))
    d.ellipse([940, 90, 1040, 190], fill=(250, 240, 210))
    finish(im, p)


def picnic(p):
    im = grad((140, 200, 110), (90, 160, 80)); d = ImageDraw.Draw(im)
    d.polygon([(200, 420), (1000, 380), (1080, 820), (120, 860)], fill=(230, 90, 80))
    for i in range(5):
        d.line([(200 + i * 180, 410), (140 + i * 220, 850)], fill=(250, 240, 235), width=18)
    d.ellipse([420, 520, 560, 640], fill=(240, 70, 60)); d.ellipse([620, 500, 820, 620], fill=(250, 220, 120))
    finish(im, p)


def snow(p):
    im = grad((170, 190, 215), (230, 236, 245)); d = ImageDraw.Draw(im)
    d.polygon([(0, 700), (300, 480), (620, 700)], fill=(90, 110, 140)); d.polygon([(420, 720), (820, 420), (1200, 720)], fill=(110, 130, 160))
    d.rectangle([0, 700, W, H], fill=(248, 250, 252))
    for _ in range(160):
        x, y, r = random.randint(0, W), random.randint(0, H), random.randint(3, 9)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255))
    finish(im, p)


def pasta(p):
    im = grad((60, 90, 110), (40, 60, 80)); d = ImageDraw.Draw(im)
    d.ellipse([220, 180, 980, 820], fill=(248, 248, 244))
    for i in range(14):
        a = i / 14 * math.pi * 2
        d.arc([380 + 30 * math.cos(a), 330 + 30 * math.sin(a), 820, 670], i * 25, i * 25 + 250, fill=(240, 196, 110), width=16)
    for x, y in ((520, 430), (660, 520), (560, 590)):
        d.ellipse([x, y, x + 60, y + 60], fill=(200, 50, 40))
    finish(im, p)


def flowers(p):
    im = grad((245, 236, 220), (230, 215, 195)); d = ImageDraw.Draw(im)
    d.polygon([(480, 560), (720, 560), (680, 840), (520, 840)], fill=(110, 150, 190))
    for _ in range(9):
        x, y = random.randint(380, 820), random.randint(180, 520)
        d.line([(600, 580), (x, y)], fill=(80, 130, 70), width=8)
        c = random.choice([(240, 120, 150), (250, 200, 80), (240, 150, 90), (200, 120, 200)])
        for k in range(6):
            a = k / 6 * math.pi * 2
            d.ellipse([x + 26 * math.cos(a) - 22, y + 26 * math.sin(a) - 22, x + 26 * math.cos(a) + 22, y + 26 * math.sin(a) + 22], fill=c)
        d.ellipse([x - 16, y - 16, x + 16, y + 16], fill=(250, 230, 150))
    finish(im, p)


MOTIFS = [ramen, tower, ticket, fuji, cake, coffee, beach, city, picnic, snow, pasta, flowers]

if __name__ == "__main__":
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "demo-art"); out.mkdir(parents=True, exist_ok=True)
    random.seed(3)
    for f in MOTIFS:
        f(str(out / f"{f.__name__}.jpg"))
    print("wrote", len(MOTIFS), "images to", out)

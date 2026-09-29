"""Regenerate board textures: python scripts/make_textures.py (needs Pillow).

Seamless tiles: every speckle is also drawn wrapped around the edges.
"""
import random
from PIL import Image, ImageDraw, ImageFilter


def texture(path, base, specks, n, size=256, seed=7, blur=0.8):
    random.seed(seed)
    im = Image.new("RGB", (size, size), base)
    d = ImageDraw.Draw(im)
    for _ in range(n):
        x, y = random.randrange(size), random.randrange(size)
        r = random.choice([1, 1, 2, 2, 3])
        c = random.choice(specks)
        for dx in (-size, 0, size):
            for dy in (-size, 0, size):
                d.ellipse([x + dx - r, y + dy - r, x + dx + r, y + dy + r], fill=c)
    im.filter(ImageFilter.GaussianBlur(blur)).save(path)


if __name__ == "__main__":
    texture("assets/board-cork.png", (226, 206, 176), [(214, 190, 154), (218, 196, 162), (234, 218, 194), (208, 183, 145)], 1400)
    texture("assets/board-felt.png", (44, 39, 35), [(52, 46, 41), (38, 34, 30), (58, 52, 46), (33, 29, 26)], 2600, seed=11, blur=0.9)
    print("textures written")

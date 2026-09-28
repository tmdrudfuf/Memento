"""Regenerate app icons/splash: python scripts/make_icons.py (needs Pillow).

Mark: two stacked polaroids; the front one holds a simple sunset "memory".
"""
from PIL import Image, ImageDraw

PAPER = (244, 239, 230, 255)
INK = (43, 38, 34, 255)
ACCENT = (200, 85, 61, 255)
SAND = (233, 196, 140, 255)
WHITE = (255, 255, 255, 255)
S = 4  # supersampling


def polaroid(w, photo=True, mono=False):
    h = int(w * 1.18)
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    frame = WHITE
    d.rounded_rectangle([0, 0, w - 1, h - 1], radius=w // 40, fill=frame)
    m = w // 12
    box = [m, m, w - m, m + (w - 2 * m)]
    if mono:
        d.rectangle(box, fill=(0, 0, 0, 0))  # cut-out window
    elif photo:
        d.rectangle(box, fill=SAND)
        x0, y0, x1, y1 = box
        r = (x1 - x0) // 5
        cx, cy = (x0 + x1) // 2, y0 + int((y1 - y0) * 0.55)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ACCENT)
        d.rectangle([x0, cy, x1, y1], fill=INK)
    else:
        d.rectangle(box, fill=(214, 204, 188, 255))
    return im


def mark(size, mono=False, scale=0.62):
    big = size * S
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    w = int(big * scale * 0.78)
    back = polaroid(w, photo=False, mono=mono).rotate(12, expand=True, resample=Image.BICUBIC)
    front = polaroid(w, mono=mono).rotate(-5, expand=True, resample=Image.BICUBIC)
    for layer, dx, dy in ((back, 0.06, -0.03), (front, -0.04, 0.03)):
        x = (big - layer.width) // 2 + int(big * dx)
        y = (big - layer.height) // 2 + int(big * dy)
        canvas.alpha_composite(layer, (x, y))
    if mono:
        # monochrome icon: opaque white silhouette
        alpha = canvas.getchannel("A")
        canvas = Image.new("RGBA", canvas.size, (255, 255, 255, 0))
        canvas.putalpha(alpha)
    return canvas.resize((size, size), Image.LANCZOS)


def on_paper(size, scale):
    bg = Image.new("RGBA", (size, size), PAPER)
    bg.alpha_composite(mark(size, scale=scale))
    return bg


if __name__ == "__main__":
    on_paper(1024, 0.72).convert("RGB").save("assets/icon.png")
    on_paper(48, 0.8).save("assets/favicon.png")
    mark(1024, scale=0.62).save("assets/android-icon-foreground.png")  # inside adaptive safe zone
    Image.new("RGBA", (1024, 1024), PAPER).save("assets/android-icon-background.png")
    mark(1024, mono=True, scale=0.62).save("assets/android-icon-monochrome.png")
    mark(1024, scale=0.75).save("assets/splash-icon.png")
    print("icons written")

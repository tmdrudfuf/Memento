"""Compose Play Store images from raw emulator screenshots.

python scripts/make_store_images.py RAW_DIR   (RAW_DIR/en/*.png and RAW_DIR/ko/*.png, 1080x2400)
Writes store/android/{en,ko}/phone-N.png (1080x1920), feature-graphic.png (1024x500), and store/icon-512.png.
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
RAW = Path(sys.argv[1] if len(sys.argv) > 1 else "raw")
OUT = ROOT / "store" / "android"
FONTS = {"en": "C:/Windows/Fonts/segoeuib.ttf", "ko": "C:/Windows/Fonts/malgunbd.ttf"}
REG = {"en": "C:/Windows/Fonts/segoeui.ttf", "ko": "C:/Windows/Fonts/malgun.ttf"}
PAPER, INK, DARK, LIGHT = (244, 239, 230), (43, 38, 34), (27, 24, 21), (242, 236, 228)

HEAD = {
    "en": [
        ("1-home", "One photo opens\nthe whole memory"),
        ("2-capture", "Save a moment\nin 3 taps"),
        ("3-board", "Pin your memories\nto boards"),
        ("4-memory", "Photos, videos and a note,\nall in one memory"),
        ("5-recap", "Look back on\nyour year"),
        ("6-dark", "Private by design.\nIt all stays on your phone"),
    ],
    "ko": [
        ("1-home", "사진 한 장이\n추억 전체를 엽니다"),
        ("2-capture", "세 번의 탭으로\n순간을 남기세요"),
        ("3-board", "추억 보드에\n차곡차곡 붙이기"),
        ("4-memory", "사진, 영상, 메모를\n하나의 추억에"),
        ("5-recap", "한 해를\n추억으로 돌아보기"),
        ("6-dark", "모든 추억은\n내 휴대폰에만"),
    ],
}


def rounded(img, r):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.width - 1, img.height - 1], r, fill=255)
    out = Image.new("RGBA", img.size)
    out.paste(img, (0, 0), mask)
    return out


def phone(lang, name, text, dark):
    W, H = 1080, 1920
    bg, fg = (DARK, LIGHT) if dark else (PAPER, INK)
    canvas = Image.new("RGBA", (W, H), bg + (255,))
    d = ImageDraw.Draw(canvas)
    font = ImageFont.truetype(FONTS[lang], 76 if lang == "en" else 72)
    d.multiline_text((W // 2, 120), text, font=font, fill=fg, anchor="ma", align="center", spacing=18)
    shot = Image.open(RAW / lang / f"{name}.png").convert("RGB")
    h = 1440
    w = round(shot.width * h / shot.height)
    shot = rounded(shot.resize((w, h), Image.LANCZOS), 44)
    x, y = (W - w) // 2, H - h - 60
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle([x, y + 16, x + w, y + h + 16], 44, fill=(0, 0, 0, 90 if not dark else 160))
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(26)))
    canvas.alpha_composite(shot, (x, y))
    return canvas.convert("RGB")


def feature(lang):
    """1024x500: wordmark + tagline on paper, a pinned cork board on the right."""
    W, H = 1024, 500
    im = Image.new("RGBA", (W, H), PAPER + (255,))
    d = ImageDraw.Draw(im)
    title = ImageFont.truetype(FONTS["en"], 92)
    tag = ImageFont.truetype(REG[lang], 34 if lang == "en" else 32)
    d.text((64, 150), "Memento", font=title, fill=INK)
    tagline = "One photo opens\nthe whole memory." if lang == "en" else "사진 한 장이\n추억 전체를 엽니다."
    d.multiline_text((68, 280), tagline, font=tag, fill=(110, 100, 92), spacing=10)
    # board
    bx, by, bw, bh = 540, 70, 420, 360
    d.rounded_rectangle([bx, by, bx + bw, by + bh], 18, fill=(184, 144, 104), outline=(156, 117, 80), width=3)
    cork = Image.open(ROOT / "assets" / "board-cork.png").convert("RGB")
    tile = Image.new("RGB", (bw - 28, bh - 28))
    for tx in range(0, tile.width, cork.width):
        for ty in range(0, tile.height, cork.height):
            tile.paste(cork, (tx, ty))
    im.paste(rounded(tile, 8), (bx + 14, by + 14), rounded(tile, 8))
    demo = RAW / "demo"
    pins = [(217, 72, 59), (232, 181, 58), (61, 123, 217)]
    for i, (art, px, py, rot) in enumerate([("ramen", 572, 92, -7), ("fuji", 770, 96, 5), ("tower", 668, 212, -2)]):
        photo = Image.open(demo / f"{art}.jpg").convert("RGB").resize((150, 113))
        card = Image.new("RGBA", (166, 150), (255, 255, 255, 255))
        card.paste(photo.crop((19, 0, 131, 113)).resize((146, 120)), (10, 10))
        card = card.rotate(rot, expand=True, resample=Image.BICUBIC)
        sh = Image.new("RGBA", card.size, (0, 0, 0, 0))
        sh.paste((0, 0, 0, 70), (0, 0, card.width, card.height), card.split()[3])
        im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)), (px + 4, py + 7))
        im.alpha_composite(card, (px, py))
        cx, cy = px + card.width // 2, py + 12
        d.ellipse([cx - 11, cy - 11, cx + 11, cy + 11], fill=pins[i])
        d.ellipse([cx - 6, cy - 7, cx - 1, cy - 2], fill=(255, 255, 255))
    return im.convert("RGB")


if __name__ == "__main__":
    for lang, items in HEAD.items():
        (OUT / lang).mkdir(parents=True, exist_ok=True)
        for i, (name, text) in enumerate(items, 1):
            phone(lang, name, text, dark=name == "6-dark").save(OUT / lang / f"phone-{i}.png")
        feature(lang).save(OUT / lang / "feature-graphic.png")
    Image.open(ROOT / "assets" / "icon.png").convert("RGB").resize((512, 512), Image.LANCZOS).save(ROOT / "store" / "icon-512.png")
    print("store images written to", OUT)

"""Process logo and hero assets for OTHER SIDE store."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "client" / "public"
IMAGES = PUBLIC / "images"

LOGO_SRC = Path(
    r"C:\Users\QSCUser\.cursor\projects\c-folders-projects-all-new-twoside-store\assets"
    r"\c__Users_QSCUser_AppData_Roaming_Cursor_User_workspaceStorage_16670b716cbc0412f3d68ec1ddf707c7_images_image-372dd4d2-e11a-4702-9472-9e45d3c36eec.png"
)
HERO_SRC = ROOT / "hero.png"


def crop_logo_circle(img: Image.Image) -> Image.Image:
    """Crop the centered white circle from the Instagram profile screenshot."""
    img = img.convert("RGB")
    w, h = img.size
    cx, cy = w // 2, h // 2

    # Find white circle radius by scanning from center outward
    pixels = img.load()
    radius = 0
    for r in range(min(w, h) // 2):
        # Sample point on circle edge (right side)
        x = cx + r
        if x >= w:
            break
        pr, pg, pb = pixels[x, cy]
        if pr > 200 and pg > 200 and pb > 200:
            radius = r
        elif radius > 50:
            break

    # Fallback radius if detection fails
    if radius < 80:
        radius = int(min(w, h) * 0.38)

    left = cx - radius
    top = cy - radius
    right = cx + radius
    bottom = cy + radius

    cropped = img.crop((left, top, right, bottom))
    return cropped


def create_circular_mask(size: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    return mask


def make_favicon(logo_circle: Image.Image, out_path: Path, size: int) -> None:
    """Create favicon — crop bar + OTHER SIDE (exclude tagline)."""
    w, h = logo_circle.size
    mark = logo_circle.crop((int(w * 0.12), int(h * 0.04), int(w * 0.88), int(h * 0.52)))
    mark = mark.resize((size, size), Image.Resampling.LANCZOS)

    # Add small padding on white background for clarity at tiny sizes
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    # Scale mark to fit with padding
    pad = int(size * 0.08)
    inner = size - pad * 2
    mark_scaled = mark.resize((inner, inner), Image.Resampling.LANCZOS).convert("RGBA")
    canvas.paste(mark_scaled, (pad, pad))
    canvas.save(out_path, format="PNG")


def make_header_logo(logo_circle: Image.Image, out_path: Path) -> None:
    """Header logo — white inverted version for dark navbar."""
    w, h = logo_circle.size
    mark = logo_circle.crop((int(w * 0.12), int(h * 0.04), int(w * 0.88), int(h * 0.52)))
    mark = mark.resize((120, 80), Image.Resampling.LANCZOS)

    # Invert: black → white for dark header
    inverted = ImageOps.invert(mark.convert("RGB"))

    # Make white/near-white background transparent
    rgba = inverted.convert("RGBA")
    pixels = rgba.load()
    for y in range(rgba.height):
        for x in range(rgba.width):
            r, g, b, a = pixels[x, y]
            # White background from invert → make transparent
            if r > 230 and g > 230 and b > 230:
                pixels[x, y] = (r, g, b, 0)
            else:
                pixels[x, y] = (255, 255, 255, 255)

    rgba.save(out_path, format="PNG")


def make_badge_logo(logo_circle: Image.Image, out_path: Path, size: int = 96) -> None:
    """Circular badge for hero divider — black circle with white logo."""
    w, h = logo_circle.size
    mark = logo_circle.crop((int(w * 0.12), int(h * 0.04), int(w * 0.88), int(h * 0.52)))
    mark = mark.resize((int(size * 0.7), int(size * 0.5)), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    draw.ellipse((0, 0, size - 1, size - 1), fill=(0, 0, 0, 255))

    # Invert mark to white
    white_mark = ImageOps.invert(mark.convert("RGB")).convert("RGBA")
    px = white_mark.load()
    for y in range(white_mark.height):
        for x in range(white_mark.width):
            r, g, b, _ = px[x, y]
            if r > 230 and g > 230 and b > 230:
                px[x, y] = (255, 255, 255, 0)
            else:
                px[x, y] = (255, 255, 255, 255)

    offset = ((size - white_mark.width) // 2, (size - white_mark.height) // 2)
    canvas.paste(white_mark, offset, white_mark)
    canvas.save(out_path, format="PNG")


def copy_hero() -> None:
    hero = Image.open(HERO_SRC)
    # Optimize for web — max width 1920
    if hero.width > 1920:
        ratio = 1920 / hero.width
        hero = hero.resize((1920, int(hero.height * ratio)), Image.Resampling.LANCZOS)
    hero.save(IMAGES / "hero.png", format="PNG", optimize=True)
    print(f"Hero saved: {IMAGES / 'hero.png'} ({hero.size})")


def main() -> None:
    IMAGES.mkdir(parents=True, exist_ok=True)

    logo_img = Image.open(LOGO_SRC)
    logo_circle = crop_logo_circle(logo_img)

    # Save full circle reference
    logo_circle.save(IMAGES / "logo-circle.png", format="PNG")

    make_favicon(logo_circle, PUBLIC / "favicon-32.png", 32)
    make_favicon(logo_circle, PUBLIC / "favicon-192.png", 192)
    make_favicon(logo_circle, PUBLIC / "apple-touch-icon.png", 180)
    make_header_logo(logo_circle, IMAGES / "logo-header.png")
    make_badge_logo(logo_circle, IMAGES / "logo-badge.png", 96)

    copy_hero()
    print("All assets processed successfully.")


if __name__ == "__main__":
    main()

from PIL import Image

SRC = 'smaart-logo.png'
WHITE = (255, 255, 255)

full = Image.open(SRC).convert('RGBA')

# The shard mark sits to the left of the "S". Crop it, then trim to its own alpha
# bbox so scaling is measured against the artwork, not the transparent margin.
mark = full.crop((30, 20, 180, 352))
mark = mark.crop(mark.getbbox())

# The full wordmark, trimmed the same way.
word = full.crop(full.getbbox())

def place(canvas_px, art, height_scale, bg=None, mode='RGBA', max_width=0.92):
    """Centre `art` on a square canvas, sized by HEIGHT.

    The mark is tall and narrow (150x326), so scaling by the longest side leaves
    it looking lost. Height is what the eye reads, so height drives the scale and
    max_width is only a guard for the wide wordmark.
    """
    canvas = Image.new('RGBA', (canvas_px, canvas_px), (*bg, 255) if bg else (0, 0, 0, 0))
    ratio = min((canvas_px * height_scale) / art.height,
                (canvas_px * max_width) / art.width)
    art = art.resize((max(1, round(art.width * ratio)),
                      max(1, round(art.height * ratio))), Image.LANCZOS)
    canvas.alpha_composite(art, ((canvas_px - art.width) // 2,
                                 (canvas_px - art.height) // 2))
    return canvas.convert(mode)

# iOS app icon — must be opaque, no alpha channel.
place(1024, mark, 0.80, bg=WHITE, mode='RGB').save('icon.png')

# Android adaptive icon. The launcher crops to a circle or squircle and parallaxes
# the layers, so the mark stays inside the centre safe zone (~66% of the canvas).
place(512, mark, 0.60).save('android-icon-foreground.png')
Image.new('RGB', (512, 512), WHITE).save('android-icon-background.png')

# Themed (monochrome) icon — a flat silhouette the launcher tints itself.
sil = Image.new('RGBA', mark.size, (0, 0, 0, 0))
sil.putalpha(mark.getchannel('A'))
place(512, sil, 0.60).save('android-icon-monochrome.png')

# Web favicon.
place(48, mark, 0.84, bg=WHITE, mode='RGBA').save('favicon.png')

# Splash artwork — the full wordmark, transparent, with breathing room.
place(1024, word, 0.62, max_width=0.78).save('splash-icon.png')

for f in ['icon.png', 'android-icon-foreground.png', 'android-icon-background.png',
          'android-icon-monochrome.png', 'favicon.png', 'splash-icon.png']:
    im = Image.open(f)
    print(f'{f:32} {im.size[0]}x{im.size[1]}  {im.mode}')

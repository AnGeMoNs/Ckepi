"""Regenera los activos vectoriales propios de CKEPI. Python, PyGObject, Cairo, Pillow."""
from pathlib import Path
from io import BytesIO
import json
import base64
import zipfile
import cairo
import re
import xml.etree.ElementTree as ET
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
COLORS = dict(space='#101F24', ink='#183A3A', earth='#FFF2D7', moon='#E4ED83', mars='#E8A080', paper='#FFF2D7')
for folder in ('svg', 'png', 'webp', 'jpg', 'icons'):
    (ROOT / folder).mkdir(exist_ok=True)

def symbol(fg, mono=False):
    paper = ROOT / 'paper-cut/ckepi-symbol-paper-transparent.webp'
    if not mono and fg == COLORS['paper'] and paper.exists():
        data=base64.b64encode(paper.read_bytes()).decode()
        return f'<image x="0" y="0" width="256" height="256" href="data:image/webp;base64,{data}"/>'
    shades = [fg] * 3 if mono else [COLORS['earth'], COLORS['moon'], COLORS['mars']]
    if not mono and fg == COLORS['ink']:
        shades = ['#245953', '#626D12', '#9C422D']
    paths = ['M176 48 L128 20 L36 73 L36 179 L128 232 L176 204',
             'M176 85 L128 57 L68 92 L68 160 L128 195 L176 167',
             'M176 122 L128 94 L100 110 L100 142 L128 158 L150 145']
    return ''.join(f'<path d="{p}" fill="none" stroke="{c}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>' for p,c in zip(paths,shades)) + f'<circle cx="209" cy="126" r="10" fill="{fg}"/>'

GLYPHS = [
    'M70 5 H19 Q5 5 5 19 V77 Q5 91 19 91 H70',
    'M5 5 V91 M70 5 L28 48 L70 91 M5 48 H28',
    'M70 5 H5 V91 H70 M5 48 H56',
    'M5 91 V5 H48 Q70 5 70 27 Q70 49 48 49 H5',
    'M5 5 H57 M31 5 V91 M5 91 H57',
]
def word(fg):
    face=''.join(f'<path transform="translate({i*99} 0)" d="{p}" fill="none" stroke="{fg}" stroke-width="9" stroke-linecap="square" stroke-linejoin="round"/>' for i,p in enumerate(GLYPHS))
    if fg in ('#FFFFFF','#000000'):
        return face
    edge=face.replace(f'stroke="{fg}"', 'stroke="#8E7860"')
    shadow=face.replace(f'stroke="{fg}"', 'stroke="#050D12"')
    return f'<g transform="translate(0 4)">{shadow}</g><g transform="translate(0 1.5)">{edge}</g>{face}'

def svg(kind, fg, mono=False, bg=None):
    if kind == 'symbol':
        w,h=256,256
        body=symbol(fg,mono)
    elif kind == 'horizontal':
        w,h=900,280
        body=f'<g transform="translate(18 14)">{symbol(fg,mono)}</g><g transform="translate(315 92)">{word(fg)}</g>'
    elif kind == 'stacked':
        w,h=640,450
        body=f'<g transform="translate(192 20)">{symbol(fg,mono)}</g><g transform="translate(84 322)">{word(fg)}</g>'
    else:
        w,h=560,160
        body=f'<g transform="translate(44 32)">{word(fg)}</g>'
    background=f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc"><title id="title">CKEPI — {kind}</title><desc id="desc">Identidad propia de CKEPI. Tres contornos abiertos representan Tierra, Luna y Marte; un punto representa la exploración. Ilustración de marca, sin datos científicos ni emblemas institucionales.</desc>{background}{body}</svg>'

def render(source, width):
    root=ET.fromstring(source)
    vw,vh=float(root.attrib['width']),float(root.attrib['height'])
    height=round(width*vh/vw)
    surface=cairo.ImageSurface(cairo.FORMAT_ARGB32,width,height)
    ctx=cairo.Context(surface);ctx.scale(width/vw,height/vh)
    def color(c):
        ctx.set_source_rgb(*(int(c[i:i+2],16)/255 for i in (1,3,5)))
    def draw(el):
        ctx.save()
        if 'transform' in el.attrib:
            tx,ty=map(float,re.findall(r'[-\d.]+',el.attrib['transform']))
            ctx.translate(tx,ty)
        tag=el.tag.split('}')[-1]
        if tag=='path':
            tokens=re.findall(r'[MLHVQ]|-?\d+(?:\.\d+)?',el.attrib['d'])
            i=0
            while i<len(tokens):
                op=tokens[i];i+=1
                if op in ('M','L'):
                    x,y=map(float,tokens[i:i+2]);i+=2
                    (ctx.move_to if op=='M' else ctx.line_to)(x,y)
                elif op in ('H','V'):
                    val=float(tokens[i]);i+=1
                    x,y=ctx.get_current_point()
                    ctx.line_to(val if op=='H' else x,val if op=='V' else y)
                elif op=='Q':
                    qx,qy,x,y=map(float,tokens[i:i+4]);i+=4
                    sx,sy=ctx.get_current_point()
                    ctx.curve_to(sx+2*(qx-sx)/3,sy+2*(qy-sy)/3,x+2*(qx-x)/3,y+2*(qy-y)/3,x,y)
            color(el.attrib['stroke'])
            ctx.set_line_width(float(el.attrib['stroke-width']))
            ctx.set_line_cap(cairo.LINE_CAP_ROUND if el.attrib.get('stroke-linecap')=='round' else cairo.LINE_CAP_SQUARE)
            ctx.set_line_join(cairo.LINE_JOIN_ROUND);ctx.stroke()
        elif tag=='image':
            raw=base64.b64decode(el.attrib['href'].split(',',1)[1])
            im=Image.open(BytesIO(raw)).convert('RGBA')
            data=BytesIO();im.save(data,format='PNG');data.seek(0)
            s=cairo.ImageSurface.create_from_png(data)
            ctx.scale(float(el.attrib['width'])/s.get_width(),float(el.attrib['height'])/s.get_height())
            ctx.set_source_surface(s);ctx.paint()
        elif tag in ('circle','rect'):
            if tag=='circle':
                ctx.arc(float(el.attrib['cx']),float(el.attrib['cy']),float(el.attrib['r']),0,6.283185307179586)
            else: ctx.rectangle(0,0,float(el.attrib['width']),float(el.attrib['height']))
            color(el.attrib['fill']);ctx.fill()
        for child in el: draw(child)
        ctx.restore()
    draw(root)
    out=BytesIO();surface.write_to_png(out);out.seek(0)
    return Image.open(out).convert('RGBA')

manifest=[]
for kind in ('horizontal','stacked','symbol','wordmark'):
    for variant,fg,mono,bg in (
        ('color-dark',COLORS['paper'],False,None),
        ('color-light',COLORS['ink'],False,None),
        ('mono-white','#FFFFFF',True,None),
        ('mono-black','#000000',True,None),
        ('on-dark',COLORS['paper'],False,COLORS['space']),
        ('on-light',COLORS['ink'],False,COLORS['paper']),
    ):
        name=f'ckepi-{kind}-{variant}'
        source=svg(kind,fg,mono,bg)
        (ROOT/'svg'/f'{name}.svg').write_text(source)
        im=render(source,1024 if kind=='symbol' else 1800)
        im.save(ROOT/'png'/f'{name}.png')
        im.save(ROOT/'webp'/f'{name}.webp',lossless=True)
        if bg:
            im.convert('RGB').save(ROOT/'jpg'/f'{name}.jpg',quality=95)
        manifest.append(name)

icon_source=svg('symbol',COLORS['paper'],False,COLORS['space'])
for size in (16,32,48,64,128,180,192,256,512,1024):
    im=render(icon_source,size)
    im.save(ROOT/'icons'/f'ckepi-icon-{size}.png')
render(icon_source,256).save(ROOT/'icons'/'favicon.ico',sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
(ROOT/'icons'/'ckepi-icon.svg').write_text(icon_source)
(ROOT/'tokens.json').write_text(json.dumps({'name':'CKEPI','colors':COLORS,'clear_space':'24/256 of symbol width minimum','minimum_symbol_px':32,'minimum_horizontal_px':180,'assets':manifest},indent=2))

font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
board=Image.new('RGB',(1800,1500),COLORS['paper'])
d=ImageDraw.Draw(board)
d.rectangle((0,0,1800,150),fill=COLORS['space'])
d.text((70,44),'CKEPI / IDENTIDAD DE MARCA',font=ImageFont.truetype(font,40),fill=COLORS['paper'])
d.text((70,105),'SAL · COBRE · AZUFRE / AI-generated · Ckepi',font=ImageFont.truetype(font,20),fill=COLORS['moon'])
for name,x,y,w,bg in [('horizontal-on-dark',60,195,1050,COLORS['space']),('horizontal-on-light',60,575,1050,COLORS['paper']),('stacked-on-dark',1170,195,570,COLORS['space']),('symbol-color-light',115,1000,285,COLORS['paper']),('symbol-mono-black',510,1000,285,COLORS['paper']),('symbol-mono-white',905,1000,285,COLORS['space']),('symbol-color-dark',1300,1000,285,COLORS['space'])]:
    im=Image.open(ROOT/'png'/f'ckepi-{name}.png')
    im.thumbnail((w,355 if name.startswith('horizontal') else 670 if name.startswith('stacked') else 285),Image.Resampling.LANCZOS)
    d.rectangle((x,y,x+w,y+im.height),fill=bg)
    board.paste(im,(x,y),im)
for i,(label,c) in enumerate(COLORS.items()):
    x=65+i*285
    d.rectangle((x,1375,x+70,1420),fill=c,outline='#84919A')
    d.text((x+82,1375),label.upper(),font=ImageFont.truetype(font,15),fill=COLORS['ink'])
    d.text((x+82,1398),c,font=ImageFont.truetype(font,15),fill=COLORS['ink'])
board.save(ROOT/'CKEPI-brand-board.png')

def archive():
    with zipfile.ZipFile(ROOT/'CKEPI-brand-kit.zip','w',zipfile.ZIP_DEFLATED) as z:
        for p in sorted(ROOT.rglob('*')):
            if p.is_file() and p.suffix!='.zip':
                z.write(p,p.relative_to(ROOT))

if __name__=='__main__':
    archive()
    print(f'Generadas {len(manifest)} variantes; paquete en {ROOT}')

import sys,glob
from PIL import Image,ImageDraw
fs=sorted(glob.glob(sys.argv[1]+'/f_*.jpg'),key=lambda f:float(f.split('f_')[1][:-4]))
cols=int(sys.argv[3]) if len(sys.argv)>3 else 3; w,h=640,360
rows=(len(fs)+cols-1)//cols; S=Image.new('RGB',(cols*w,rows*h),'#222')
for i,f in enumerate(fs):
    im=Image.open(f).resize((w,h)); d=ImageDraw.Draw(im); d.text((8,8),f.split('f_')[1][:-4]+'s',fill='yellow'); S.paste(im,((i%cols)*w,(i//cols)*h))
S.save(sys.argv[2]); print(len(fs))

"""Tres arenas, globos, monedas y aros. Los obstáculos del JSON coinciden con los modelos."""
import json
import math
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
import clay
from carreras_comun import bola, caja, cilindro, exportar, grupo, laca, luz, madera, tela, tubo
from carreras_circuitos import cristal, puesto

ARENAS = {
 'arena_plaza': dict(suelo='#bdc994',orilla='#72935d',obstaculos=[(0,0,6,3)],tipo='fuente'),
 'arena_hornos': dict(suelo='#807074',orilla='#bf8f6a',obstaculos=[(-13,-13,3.5,4),(13,-13,3.5,4),(-13,13,3.5,4),(13,13,3.5,4)],tipo='horno'),
 'arena_cristal': dict(suelo='#b8accb',orilla='#8d7ca4',obstaculos=[(-14,0,4,5),(14,0,4,5),(0,17,4,5),(0,-17,4,5)],tipo='cristal'),
}


def construir(pid,cfg,out):
    clay.reset_scene()
    import tiendas
    tiendas._MATS.clear()
    coll=clay.collection(pid)
    cilindro(coll,'suelo arena',(0,0,0),45,.4,tela('arena '+pid,cfg['suelo']),seg=96)
    cilindro(coll,'base arena',(0,0,-1),46,1,madera('base arena','#756651'),seg=96)
    for j in range(48):
        a=j*math.tau/48; b=(j+1)*math.tau/48
        x,y=45*math.cos(a),45*math.sin(a)
        cilindro(coll,'poste borde',(x,y,.4),.35,1.8,tela('borde '+pid,cfg['orilla']),seg=8)
        tubo(coll,'baranda',[(x,y,1.6),(45*math.cos(b),45*math.sin(b),1.6)],.15,madera('baranda','#dbbd8b'),seg=6)
        if j%6==0:
            bola(coll,'lampara',(x,y,2.5),.45,luz('lampara arena','#ffe7a6',1.2),n=3,sub=0)
    for j,(x,y,r,h) in enumerate(cfg['obstaculos']):
        if cfg['tipo']=='fuente':
            cilindro(coll,'fuente',(x,y,.4),r,1,tela('piedra fuente','#d2c9ad'),seg=32)
            cilindro(coll,'agua fuente',(x,y,1.3),r-.5,.15,laca('agua fuente','#70aeb6',.2),seg=32)
            cilindro(coll,'centro fuente',(x,y,1.4),1,h-1.2,tela('centro fuente','#d2c9ad'),seg=16)
            bola(coll,'bola fuente',(x,y,h+.4),1.2,laca('remate fuente','#c8d3a3'),n=3,sub=1)
        elif cfg['tipo']=='horno':
            cilindro(coll,'horno arena',(x,y,.4),r,h,tela('horno arena','#75606a'),seg=12)
            caja(coll,'boca horno',(x,y-r,.4+h*.4),(r*.55,.15,h*.3),luz('brasa horno','#f7aa5b',1),p=4,sub=0,n=3)
            cilindro(coll,'corona horno',(x,y,h+.3),r+.3,.4,tela('borde horno','#b18b70'),seg=12)
        else:
            cilindro(coll,'pedestal cristal',(x,y,.4),r,1,tela('pedestal cristal','#a595b4'),seg=16)
            grupo(coll,f'cristal {j}',(x,y,1.4),lambda:cristal(coll,['#af92d5','#83c9bf','#e4c8e2','#a6bfe0'][j]))
    # La utilería exterior deja la zona de combate libre.
    for j in range(12):
        a=j*math.tau/12
        grupo(coll,f'puesto {j}',(math.cos(a)*59,math.sin(a)*59,.4),lambda:puesto(coll),rot=(0,0,a))
    raiz=bpy.data.objects.new('pista_'+pid,None);clay.link(raiz,coll)
    for o in list(coll.objects):
        if o!=raiz and o.parent is None:o.parent=raiz
    exportar([raiz],os.path.join(out,'carreras_'+pid+'.glb'))
    n=96
    datos=dict(id=pid,largo=round(math.tau*8,1),n=n,
        m=[[round(math.cos(j*math.tau/n)*8,3),.4,round(-math.sin(j*math.tau/n)*8,3),36.5,1,0] for j in range(n)],
        cajas=[],turbos=[],rampas=[],arena=dict(radio=45,obstaculos=[dict(x=x,z=-y,r=r,h=h) for x,y,r,h in cfg['obstaculos']]))
    with open(os.path.join(out,'carreras_'+pid+'.json'),'w') as f:json.dump(datos,f,separators=(',',':'))


def extras(out):
    clay.reset_scene()
    import tiendas
    tiendas._MATS.clear()
    coll=clay.collection('Objetos de minijuegos')
    raices=[]
    for j,color in enumerate(('#f08098','#85c5ed','#f2d47e')):
        def globo(color=color):
            bola(coll,'globo',(0,0,0),(0.55,.55,.7),laca('globo '+color,color,.35),n=3,sub=1)
            bola(coll,'nudo',(0,0,-.68),(.12,.12,.16),tela('nudo '+color,color),n=2,sub=0)
            tubo(coll,'cordon',[(0,0,-.75),(.1,0,-1.1),(0,0,-1.6)],.025,tela('cordon','#eee4d0'),seg=5)
        raices.append(grupo(coll,'m_globo'+str(j),(0,0,0),globo))
    def moneda():
        antes=set(coll.objects)
        cilindro(coll,'moneda',(0,0,-.12),.65,.24,laca('oro moneda','#f4c95a',.25),seg=24)
        # Los discos se exportan verticales para girar frente a los corredores.
        for o in list(coll.objects):
            if o not in antes:o.rotation_euler.x=math.pi/2
        bola(coll,'emblema moneda',(0,-.18,0),(.25,.07,.25),luz('marca moneda','#fff0a0',.5),n=3,sub=0)
    raices.append(grupo(coll,'m_moneda',(0,0,0),moneda))
    def aro():
        pts=[(math.cos(j*math.tau/40)*2,0,math.sin(j*math.tau/40)*2) for j in range(41)]
        tubo(coll,'aro reto',pts,.18,laca('aro dorado','#f2ce68',.3),seg=8)
        for j in range(8):
            a=j*math.tau/8
            bola(coll,'remache aro',(math.cos(a)*2,0,math.sin(a)*2),.22,luz('luz aro','#fff0c6',.8),n=2,sub=0)
    raices.append(grupo(coll,'m_aro',(0,0,0),aro))
    exportar(raices,os.path.join(out,'carreras_minijuegos.glb'))


if __name__=='__main__':
    argumentos=sys.argv[sys.argv.index('--')+1:]
    out=argumentos[0];os.makedirs(out,exist_ok=True)
    for pid,cfg in ARENAS.items():construir(pid,cfg,out)
    extras(out)

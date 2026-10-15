"""Doce circuitos originales de Astra. Curva, suelo, utilería y decoración salen de Blender."""
import math

import numpy as np

from carreras_comun import bola, caja, cilindro, laca, luz, madera, tela, tubo


def ruta(base, puntos, ancho=7.5, hombro=3, rampas=(), puentes=(), **otros):
    return dict(base=base, puntos=puntos, ancho=ancho, hombro=hombro,
                cajas=(.12,.35,.59,.83), turbos=((.24,0),(.52,-2),(.76,2)),
                rampas=rampas, puentes=puentes, **otros)


NUEVAS = {
 'puerto': ruta('valle',[(0,-90,1),(65,-90,1),(112,-62,2),(125,-12,4),(94,18,5),(54,15,5),(34,47,3),
  (72,80,2),(55,115,1),(-5,112,1),(-36,76,2),(-72,90,2),(-112,57,1),(-115,3,2),(-78,-27,3),(-105,-61,2),(-57,-89,1)],puentes=((.17,.29),(.56,.7)),rampas=(.43,)),
 'mina': ruta('brasa',[(0,-85,1),(62,-85,1),(105,-56,3),(100,-7,7),(61,15,10),(28,-3,10),(5,28,11),(40,62,9),
  (25,103,6),(-27,105,3),(-65,70,2),(-60,26,2),(-96,4,1),(-112,-39,1),(-67,-81,1)],ancho=7,rampas=(.72,)),
 'bosque': ruta('valle',[(0,-92,.5),(58,-91,1),(104,-63,2),(105,-16,4),(66,10,4),(78,48,3),(51,93,1),
  (9,108,1),(-24,73,3),(-68,94,3),(-107,62,2),(-97,14,3),(-54,-5,5),(-76,-43,3),(-57,-82,1)],rampas=(.59,)),
 'desierto': ruta('valle',[(0,-100,1),(66,-99,2),(118,-63,6),(130,-12,12),(100,38,15),(57,18,12),(22,51,8),
  (43,97,4),(0,124,2),(-55,107,3),(-79,62,9),(-122,35,12),(-123,-19,8),(-84,-61,3),(-45,-96,1)],ancho=8,rampas=(.29,.63)),
 'jardines': ruta('valle',[(0,-95,.5),(64,-95,.5),(108,-66,1),(110,-22,2),(72,3,2),(101,42,1),(87,88,1),
  (41,104,2),(5,67,3),(-29,95,2),(-78,88,1),(-109,46,.5),(-81,5,1),(-110,-36,1),(-78,-80,.5)],ancho=7,rampas=()),
 'cristal': ruta('cielo',[(0,-95,12),(62,-95,12),(108,-62,16),(103,-13,23),(65,12,28),(81,54,27),(53,102,23),
  (0,118,19),(-40,85,15),(-25,41,12),(-64,19,10),(-111,22,12),(-123,-28,14),(-84,-77,12),(-43,-95,12)],hombro=1.8,rampas=(.44,),anillos=(.09,.32,.61,.88)),
 'fortaleza': ruta('valle',[(0,-105,1),(65,-105,1),(116,-76,2),(115,-23,6),(70,-9,9),(48,24,10),(80,65,10),
  (62,108,7),(8,115,3),(-39,85,2),(-89,98,2),(-122,57,5),(-100,12,8),(-62,-2,9),(-90,-48,5),(-53,-95,1)],puentes=((.25,.35),),rampas=(.68,)),
 'pantano': ruta('valle',[(0,-88,2),(57,-86,2),(99,-57,2),(101,-14,3),(67,14,4),(85,55,3),(54,96,2),
  (5,105,2),(-36,78,2),(-69,89,2),(-106,49,3),(-87,9,4),(-108,-31,3),(-66,-77,2)],ancho=7,hombro=1,puentes=((0,1),),rampas=(.27,)),
 'mercado': ruta('valle',[(0,-93,.5),(64,-93,.5),(109,-64,.5),(109,-21,1),(70,5,1),(103,44,1),(80,90,2),
  (31,109,2),(-4,76,2),(-42,107,1),(-90,81,.5),(-111,35,.5),(-79,3,.5),(-107,-39,.5),(-72,-80,.5)],ancho=7.5,rampas=(.51,)),
 'acantilado': ruta('cielo',[(0,-110,25),(74,-105,27),(133,-67,35),(141,-10,43),(102,35,48),(56,18,44),
  (22,55,38),(37,108,30),(-12,131,27),(-67,105,35),(-82,54,45),(-126,24,50),(-131,-31,42),(-89,-78,30),(-43,-107,25)],ancho=8,hombro=1.8,rampas=(.46,.8),anillos=(.18,.63)),
 'observatorio': ruta('brasa',[(0,-96,.7),(65,-96,.7),(110,-64,2),(111,-15,4),(72,12,5),(98,56,5),(66,102,3),
  (13,108,1),(-20,71,1),(-57,93,2),(-103,61,3),(-108,13,4),(-67,-12,3),(-100,-54,2),(-51,-91,1)],ancho=7.5,rampas=(.33,)),
 'estacion': ruta('cielo',[(0,-100,16),(70,-100,16),(125,-65,20),(121,-12,26),(77,12,30),(43,-4,30),(12,25,28),
  (51,65,25),(31,112,22),(-23,116,18),(-67,81,16),(-56,34,18),(-97,7,22),(-124,-40,22),(-77,-88,18),(-35,-101,16)],ancho=8,hombro=1.8,rampas=(.3,.73),anillos=(.12,.45,.66,.91)),
}


def tema(camino, orilla, suelo, costura='#fff1c8', claro=None):
    return dict(camino=camino,camino2=claro or camino,hombro=orilla,suelo=suelo,talud=orilla,
                piano=(costura,camino),costura=costura)


TEMAS_NUEVOS = {
 'puerto':tema('#b58b61','#8e684a',None,'#e9f2db','#c69a69'),
 'mina':tema('#81706b','#544f5b','#423b49','#e5bd65','#93817b'),
 'bosque':tema('#b99b68','#54875a','#476f4a','#eee0b6','#a78c5b'),
 'desierto':tema('#d5af6f','#d8ba7e','#cba566','#8e6168','#e0be82'),
 'jardines':tema('#d5c2a9','#78a46b','#8bb476','#b15d87','#e1cfb7'),
 'cristal':tema('#7776ac','#535987',None,'#f0c8ec','#8582bb'),
 'fortaleza':tema('#a29b9d','#79717d','#87857a','#e0b76b','#b2aaad'),
 'pantano':tema('#99724d','#604d39',None,'#e6d7b8','#aa835b'),
 'mercado':tema('#bf9583','#8f7768','#99806f','#f6d8a2','#cda18c'),
 'acantilado':tema('#b0b4bd','#8d96aa',None,'#ebcb86','#bfc3cc'),
 'observatorio':tema('#676f8e','#41465b','#383c53','#c2c6ec','#757e9d'),
 'estacion':tema('#6396a9','#314b65',None,'#e8d58d','#75a7b7'),
}


def barca(c):
    for x in (-1.4,0,1.4):
        caja(c,'casco barca',(x,0,.5),(1,.8,.45),madera('barca','#8b613c'),p=4,sub=1,n=3)
    for x in (-1,1):
        caja(c,'banco',(x,0,1),(0.25,.9,.15),madera('banco','#d0a779'),p=4,sub=0,n=3)
    tubo(c,'mastil',[(0,0,.8),(0,0,5)],.12,madera('mastil','#9d754e'),seg=8)
    caja(c,'vela',(1,0,3.4),(1,.08,1.4),tela('vela','#f3e3c4'),p=5,sub=1,n=3)


def puesto(c):
    caja(c,'mesa puesto',(0,0,1.2),(2.7,1.7,.3),madera('mesa','#98704d'),p=4,sub=0,n=3)
    for x in (-2.5,2.5):
        for y in (-1.5,1.5):
            cilindro(c,'poste puesto',(x,y,0),.12,4.1,madera('poste','#826048'),seg=6)
    for j in range(6):
        caja(c,'toldo',(j*.9-2.25,0,4.1),(.46,2,.13),tela('toldo claro' if j%2 else 'toldo rojo','#f6deab' if j%2 else '#b45c62'),p=5,sub=1,n=3)
    for k in range(12):
        bola(c,'producto',((k%4-1.5)*.9,(k//4-1)*.7,1.8),(.3,.3,.3),tela('fruta','#e8b453' if k%2 else '#bf7153'),n=2,sub=0)


def cristal(c,color='#b49ae8'):
    for x,y,z,r in [(-.8,0,1.5,.7),(.4,.4,3,.9),(1,-.4,1,.5)]:
        cilindro(c,'cristal',(x,y,0),r,z*1.4,laca('cristal '+color,color,.25),seg=6)
        bola(c,'punta cristal',(x,y,z*1.4),(.7*r,.7*r,z*.35),luz('punta '+color,color,.5),n=2,sub=0)


def torre(c):
    cilindro(c,'torre',(0,0,0),3,11,tela('piedra','#8e8392'),seg=14)
    cilindro(c,'corona',(0,0,10),3.5,1.2,tela('corona','#b3a6ad'),seg=14)
    for k in range(8):
        a=k*math.tau/8
        caja(c,'almena',(math.cos(a)*3,math.sin(a)*3,12),(.5,.5,.9),tela('almenas','#b3a6ad'),p=4,sub=0,n=3)
    caja(c,'ventana',(0,-3.02,6),(.5,.08,1),laca('vidrio','#525474'),p=4,sub=0,n=3)


def tunel(c,ancho=12,metal=False):
    mat=madera('vigas','#9e7755') if not metal else laca('portico','#80b4c6',.4)
    for x in (-ancho,ancho):
        caja(c,'soporte',(x,0,3.7),(.6,1,3.7),mat,p=4,sub=0,n=3)
    caja(c,'viga',(0,0,7.3),(ancho+.6,1,.6),mat,p=4,sub=0,n=3)
    for x in (-ancho+1,ancho-1):
        bola(c,'luz tunel',(x,-1,5),(.35,.25,.35),luz('luz galeria','#ffe3a3',1.8),n=2,sub=0)


def domo(c):
    cilindro(c,'base cupula',(0,0,0),4.5,2,tela('base lunar','#71778f'),seg=18)
    bola(c,'cupula',(0,0,2),(4.5,4.5,3.5),laca('cupula','#c1c5d6',.35),n=3,sub=1)
    tubo(c,'telescopio',[(0,-2,4),(0,-5,7)],.7,laca('telescopio','#5a647d'),seg=10)
    bola(c,'ocular',(0,-5,7),(.75,.3,.75),laca('vidrio telescopio','#799db7',.15),n=3,sub=0)


def palma(c):
    tubo(c,'palma tronco',[(0,0,0),(.5,0,3),(.3,.1,6)],.3,madera('palma','#a68050'),seg=8)
    for j in range(7):
        a=j*math.tau/7
        tubo(c,'hoja palma',[(.3,.1,6),(math.cos(a)*2,math.sin(a)*2,6.4),(math.cos(a)*3.2,math.sin(a)*3.2,5.4)],.35,tela('palma hoja','#65884d'),seg=6)


def decorar(pid,cfg,lote,P,T,N,hw,hombro,base,poner_proto,repartir,anillo_lejos):
    up=np.array([0,0,1.0]); n=len(P); extra={}
    def pr(clave,fn): return poner_proto(pid+clave,fn)
    def hileras(proto,paso,distancia,radio):
        for i in range(0,n,paso):
            for lado in (-1,1):
                p=P[i]+N[i]*lado*(hw[i]+hombro[i]+distancia)
                if np.all(np.linalg.norm(P[:,:2]-p[:2],axis=1)>hw+hombro+radio):
                    lote.poner(proto,p,math.atan2(N[i][1],N[i][0])+(-math.pi/2 if lado<0 else math.pi/2))
    def suelo(color,z=-.15):
        lote.quads(tela('fondo '+pid,color),[(-420,-420,z),(420,-420,z),(420,420,z),(-420,420,z)],[(0,1,2,3)],trozo=(99,99))
    if pid in ('puerto','pantano'):
        suelo('#589ca6' if pid=='puerto' else '#628b78')
        repartir(pr('barca',barca),18 if pid=='puerto' else 5,8,35,4,esc=(.8,1.4))
        for i in range(0,n,9):
            for s in (-1,1):
                p=P[i]+N[i]*s*(hw[i]+.2)
                poste=pr('pilar',lambda c:cilindro(c,'pilar',(0,0,0),.3,1,madera('pilares','#76533c'),seg=8))
                lote.poner(poste,(p[0],p[1],0),0,(1,1,max(.5,p[2])))
        repartir(pr('puesto',puesto),12,9,30,4,esc=(.8,1.2))
        if pid=='pantano':
            repartir(pr('arbol',lambda c:base.arbol(c,2,1.8)),110,5,45,3,esc=(1,1.6))
            repartir(pr('flores',base.flores),70,2,18,1)
        else:
            repartir(pr('palma',palma),38,4,38,3)
            anillo_lejos(pr('casas',lambda c:base.casa(c,'#e7d6ab','#5d8f9c')),25,160,230)
    elif pid in ('bosque','jardines'):
        repartir(pr('arbol',lambda c:base.arbol(c,1,1.8 if pid=='bosque' else 1)),350 if pid=='bosque' else 85,9,60,8,esc=(.9,1.6))
        repartir(pr('flores',base.flores),110,1,25,.5)
        repartir(pr('arbusto',lambda c:base.arbusto(c,0)),100,1,22,1,esc=(1,2.4) if pid=='jardines' else (.8,1.4))
        if pid=='jardines':
            hileras(pr('seto',lambda c:caja(c,'seto',(0,0,1),(3,1.1,1),tela('hojas seto','#507b52'),p=5,sub=1,n=4)),5,3.5,2)
            hileras(pr('maceta',base.flores),3,2.5,.7)
            for f in (.16,.42,.72):
                i=int(f*n)
                lote.poner(pr('arco',lambda c:tunel(c,hw[i]+hombro[i]+1)),P[i],math.atan2(N[i][1],N[i][0]))
        else:
            repartir(pr('roca',lambda c:base.roca(c,'#657e67',2)),45,1,22,2)
    elif pid=='desierto':
        repartir(pr('palma',palma),55,4,45,3)
        repartir(pr('puesto',puesto),10,12,35,6)
        repartir(pr('duna',lambda c:bola(c,'duna',(0,0,0),(15,10,5),tela('arena','#e0be82'),n=3,sub=1)),35,18,65,12,esc=(1,2))
        anillo_lejos(pr('montana',lambda c:base.montana(c,False,'#b79b7c')),18,220,320)
    elif pid=='mina':
        repartir(pr('roca',lambda c:base.roca(c,'#69616c',5)),100,14,55,12,esc=(1,2))
        repartir(pr('cristal',lambda c:cristal(c,'#93bcb5')),60,1,25,1.5)
        roca=tela('techo galeria','#554c5b')
        for i in range(int(.23*n),int(.56*n)):
            j=(i+1)%n
            a=P[i]-N[i]*(hw[i]+hombro[i]+2)
            b=P[i]+N[i]*(hw[i]+hombro[i]+2)
            c=P[j]+N[j]*(hw[j]+hombro[j]+2)
            d=P[j]-N[j]*(hw[j]+hombro[j]+2)
            v=[a,b,c,d,a+up*8,b+up*8,c+up*8,d+up*8]
            lote.quads(roca,v,[(4,5,6,7),(7,6,5,4),(0,4,7,3),(1,2,6,5)])
        for f in np.arange(.18,.7,.035):
            i=int(f*n)
            lote.poner(pr('vigas',lambda c:tunel(c,hw[i]+hombro[i]+1)),P[i],math.atan2(N[i][1],N[i][0]))
        anillo_lejos(pr('montana',lambda c:base.montana(c,False,'#63545c')),26,180,300)
    elif pid=='fortaleza':
        repartir(pr('torre',torre),24,7,35,5)
        repartir(pr('casas',lambda c:base.casa(c,'#d5c1b7','#6e667d')),15,9,35,5)
        for f in (.09,.4,.72):
            i=int(f*n)
            lote.poner(pr('porton',lambda c:tunel(c,hw[i]+hombro[i]+1)),P[i],math.atan2(N[i][1],N[i][0]))
        repartir(pr('farol',base.farol_poste),45,.6,2,0,esc=(1,1))
    elif pid=='mercado':
        repartir(pr('puestos',puesto),58,2,22,4,esc=(.9,1.3))
        hileras(pr('puestos alineados',puesto),9,5,3.5)
        repartir(pr('casas',lambda c:base.casa(c,'#e8bf96','#995c63')),34,12,40,6)
        repartir(pr('farol',base.farol_poste),70,.7,1.8,0,esc=(1,1))
        repartir(pr('flores',base.flores),40,1,15,.5)
    elif pid in ('cristal','acantilado','observatorio','estacion'):
        if pid=='cristal':
            repartir(pr('cristal1',lambda c:cristal(c,'#ae8bcd')),90,5,42,3,esc=(1.5,4),zf=lambda i,p:P[i][2]-5)
            repartir(pr('cristal2',lambda c:cristal(c,'#89bfc7')),55,5,40,3,esc=(1,3),zf=lambda i,p:P[i][2]-4)
        elif pid=='acantilado':
            repartir(pr('cima',lambda c:base.montana(c,True,'#8f98a9')),38,95,160,85,esc=(.6,1.2),zf=lambda i,p:P[i][2]-16)
            repartir(pr('nube',base.nube),45,5,65,3,esc=(2,4),zf=lambda i,p:P[i][2]-15)
        elif pid=='observatorio':
            repartir(pr('domo',domo),18,8,40,6)
            repartir(pr('rocas',lambda c:base.roca(c,'#747992',2)),100,1,40,2)
            repartir(pr('farol',lambda c:base.farol_poste(c,'#b3ceff')),60,.5,1.5,0,esc=(1,1))
        else:
            repartir(pr('domo',domo),16,10,35,6,zf=lambda i,p:P[i][2]-1)
            for f in np.arange(.12,.94,.1):
                i=int(f*n)
                lote.poner(pr('portico',lambda c:tunel(c,hw[i]+hombro[i]+1,True)),P[i],math.atan2(N[i][1],N[i][0]))
            anillo_lejos(pr('celia',lambda c:base.luna(c,'#659fbc',100,'#8db880')),1,100,110,z=-140,esc=(1,1))
        for f in cfg.get('anillos',()):
            i=int(f*n)
            lote.poner(pr('anillo',lambda c:base.anillo_turbo(c,6.5)),P[i]+up,math.atan2(N[i][1],N[i][0]))
        if cfg.get('anillos'): extra['anillos']=[int(f*n) for f in cfg['anillos']]
    return extra

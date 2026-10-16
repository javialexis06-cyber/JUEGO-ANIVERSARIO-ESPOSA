"""Figuras originales de peluche para Jardín de los Desvelados y cuatro retratos de Astra.
blender -b --threads 2 --python-exit-code 1 -P personajes/blender/patio_figuras.py
No modifica modelos ni fuentes de la granja. GLB con una raíz por figura y retratos JPEG.
"""
from pathlib import Path
import math
import sys
import bpy
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'juego/web/public/jardin'
PHOTOS = ROOT / 'juego/web/public/celular/fotos'
OUT.mkdir(parents=True, exist_ok=True)
PHOTOS.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
MATS = {}
def mat(color):
    if color not in MATS:
        m = bpy.data.materials.new('Fieltro ' + color)
        rgb=[int(color[i:i+2],16)/255 for i in (1,3,5)]
        m.diffuse_color = (*tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in rgb),1)
        m.use_nodes = True
        bs = m.node_tree.nodes.get('Principled BSDF')
        bs.inputs['Base Color'].default_value = m.diffuse_color
        bs.inputs['Roughness'].default_value = .92
        MATS[color] = m
    return MATS[color]
def ball(parent, name, pos, scale, color):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, location=pos)
    o=bpy.context.object; o.name=name; o.scale=scale; o.parent=parent
    o.data.materials.append(mat(color))
    for p in o.data.polygons:p.use_smooth=True
    return o
def root(name):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);return o
def face(r,z=.9,color='#292c36',front=-.30):
    for x in [-.115,.115]:
        ball(r,'ojo', (x,front,z),(.047,.025,.055),color)
        ball(r,'brillo', (x-.012,front-.025,z+.016),(.012,.009,.014),'#fff8e8')
    ball(r,'sonrisa',(0,front-.01,z-.12),(.065,.015,.026),color)
    for x in [-.20,.20]:ball(r,'mejilla',(x,front+.015,z-.075),(.045,.015,.025),'#ec96a5')
def stitch(r,z,y=-.26):
    for k in range(5):
        o=ball(r,'puntada',(-.15+k*.075,y,z),(.012,.014,.026),'#eee4cb')
        o.rotation_euler.y=.6 if k%2 else -.6
PLANTS=[('margarita','#f6c552'),('frijol','#7abf83'),('calabaza','#e5a16b'),('menta','#99d9dc'),('hongo','#c29cdb'),('chile','#e9786f'),('gemela','#88bc66'),('campanilla','#edb3cd')]
figures=[]
for name,color in PLANTS:
    r=root('planta_'+name);figures.append(r)
    ball(r,'tallo',(0,0,.32),(.09,.10,.32),'#528a67')
    for side in [-1,1]:
        leaf=ball(r,'hoja',(side*.20,0,.18),(.26,.13,.10),'#78b982');leaf.rotation_euler.y=side*-.4
    if name=='calabaza':
        for a in range(6):
            ang=a*math.tau/6;ball(r,'gajo',(math.cos(ang)*.16,math.sin(ang)*.16,.54),(.30,.24,.40),color)
        face(r,.62);stitch(r,.40,-.39)
    elif name=='hongo':
        ball(r,'sombrero',(0,0,.95),(.53,.42,.24),color)
        for x,y in [(-.25,-.15),(.2,-.22),(0,.13)]:ball(r,'mota',(x,y,1.12),(.08,.07,.035),'#f7e8e4')
        ball(r,'cuerpo',(0,0,.65),(.27,.25,.30),'#f2dec7');face(r,.70)
    elif name=='chile':
        o=ball(r,'chile',(0,0,.73),(.27,.25,.51),color);o.rotation_euler.y=-.2
        ball(r,'gorro',(0,0,1.15),(.17,.15,.10),'#578b60');face(r,.82)
    elif name=='gemela':
        for side in [-1,1]:
            ball(r,'campana',(side*.23,0,.83),(.27,.24,.29),color)
            ball(r,'boquilla',(side*.23,-.23,.83),(.12,.16,.11),'#52865b')
            ball(r,'centro',(side*.23,-.37,.83),(.07,.017,.065),'#314f45')
            ball(r,'ojo',(side*.23,-.20,.99),(.035,.025,.04),'#273b39')
    else:
        if name in ['margarita','campanilla']:
            for a in range(9):
                ang=a*math.tau/9
                pet=ball(r,'petalo',(math.cos(ang)*.33,0,.91+math.sin(ang)*.33),(.16,.13,.22), '#f7ecd3' if name=='margarita' else color)
                pet.rotation_euler.y=-ang
        ball(r,'cabeza',(0,-.03,.91),(.32,.26,.32),color)
        if name=='frijol':
            ball(r,'boquilla',(0,-.27,.79),(.16,.19,.13),'#568e61')
            ball(r,'hueco',(0,-.44,.79),(.10,.018,.08),'#304e3e')
        face(r,1.0)
        if name=='menta':
            for a in [-1,0,1]:
                o=ball(r,'hoja de menta',(a*.16,0,1.2),(.10,.08,.25),'#aadfd6');o.rotation_euler.y=a*.6
ZOMBIES=[('remiendo','#8db8a1'),('olla','#9bae9e'),('corredor','#a0b5bd'),('paraguas','#b0a3b5'),('grandote','#91a8ba')]
for name,color in ZOMBIES:
    r=root('zombi_'+name);figures.append(r)
    for side in [-1,1]:
        ball(r,'pie', (side*.15,-.12,.10),(.18,.27,.12),'#665b69')
        ball(r,'pierna',(side*.15,0,.30),(.12,.13,.23),'#6c7a87')
        arm=ball(r,'brazo',(side*.34,-.10,.68),(.12,.16,.30),color);arm.rotation_euler.x=.45
    ball(r,'abrigo',(0,0,.60),(.30,.23,.35),'#ad8195' if name=='corredor' else '#84798c')
    ball(r,'cabeza',(0,0,1.13),(.34,.29,.34),color);face(r,1.18);stitch(r,1.35,-.235)
    for x in [-.23,.23]:ball(r,'oreja',(x*1.6,0,1.14),(.08,.10,.12),color)
    if name=='olla':
        ball(r,'olla',(0,0,1.43),(.40,.33,.18),'#c6c2c4')
        for side in [-1,1]:ball(r,'asa',(side*.4,0,1.43),(.10,.08,.06),'#9f9fa8')
    if name=='corredor':
        for x in [-.26,0,.26]:ball(r,'cinta',(x,-.12,1.36),(.15,.18,.05),'#edba76')
    if name=='paraguas':
        ball(r,'mango',(.42,0,.95),(.025,.025,.6),'#e9c28c')
        ball(r,'paraguas',(.42,0,1.55),(.54,.42,.12),'#b7a1da')
    if name=='grandote':
        ball(r,'bolsillo',(0,-.23,.60),(.20,.04,.17),'#c4b995');stitch(r,.69,-.28)
        r.scale=(1.25,1.25,1.18)
# Una malla y un material por figura: el color del fieltro vive en los vértices.
# El juego anima la figura completa; no necesita un draw call por ojo, puntada o pétalo.
felt=bpy.data.materials.new('Peluche con color de vértices');felt.use_nodes=True
bs=felt.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.92
vc=felt.node_tree.nodes.new('ShaderNodeVertexColor');vc.layer_name='Color';felt.node_tree.links.new(vc.outputs['Color'],bs.inputs['Base Color'])
for r in figures:
    meshes=[o for o in r.children_recursive if o.type=='MESH']
    for o in meshes:
        colors=o.data.color_attributes.new(name='Color',type='BYTE_COLOR',domain='CORNER')
        for poly in o.data.polygons:
            color=o.data.materials[poly.material_index].diffuse_color
            for i in poly.loop_indices:colors.data[i].color=color
        o.data.materials.clear();o.data.materials.append(felt)
        for poly in o.data.polygons:poly.material_index=0
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:o.select_set(True)
    bpy.context.view_layer.objects.active=meshes[0]
    bpy.ops.object.join()
# Exportar únicamente los personajes; cada raíz permite el balanceo de su figura.
bpy.ops.object.select_all(action='DESELECT')
for r in figures:
    r.select_set(True)
    for o in r.children_recursive:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'figuras.glb'),export_format='GLB',use_selection=True,export_yup=True)
if '--solo-modelos' in sys.argv:
    print('OK 13 figuras con una malla y un material por figura')
    raise SystemExit(0)
# Retratos nuevos: figuras de peluche con identidad y vestuario propios.
for o in bpy.data.objects:o.hide_render=True
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=64;scene.cycles.use_denoising=False
scene.render.resolution_x=320;scene.render.resolution_y=320;scene.render.resolution_percentage=100
scene.view_settings.view_transform='Standard'
scene.world.color=(.15,.18,.20)
for pos,power,size in [((3,-4,5),500,5),((-3,-1,3),300,4)]:
    data=bpy.data.lights.new('Luz suave','AREA');data.energy=power;data.shape='DISK';data.size=size
    o=bpy.data.objects.new('Luz suave',data);bpy.context.collection.objects.link(o);o.location=pos;o.rotation_euler=(Vector((0,0,.7))-o.location).to_track_quat('-Z','Y').to_euler()
camdata=bpy.data.cameras.new('Retratos');cam=bpy.data.objects.new('Retratos',camdata);bpy.context.collection.objects.link(cam)
cam.location=(1.8,-4,1.75);cam.rotation_euler=(Vector((0,0,.8))-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=2.2;scene.camera=cam
for ident,skin,hair,shirt in [('c9_dalia','#dfb38f','#513c39','#a6bbd5'),('c10_ines','#ecc5a7','#9c6454','#79a69d'),('c11_benicio','#ba886b','#44404b','#be975b'),('c12_leonor','#e5bc9e','#38313e','#aa83b3')]:
    r=root(ident)
    ball(r,'cuerpo',(0,0,.47),(.31,.23,.35),shirt)
    ball(r,'cabeza',(0,-.01,1.02),(.43,.32,.43),skin)
    for side in [-1,1]:
        ball(r,'mano',(side*.36,-.02,.48),(.13,.13,.15),skin)
        ball(r,'mechon',(side*.29,.01,1.25),(.19,.29,.23),hair)
        ball(r,'pie',(side*.17,-.1,.13),(.16,.21,.13),'#56525e')
    ball(r,'pelo',(0,.04,1.37),(.36,.28,.17),hair)
    face(r,1.07,front=-.345);stitch(r,.42,-.223)
    scene.render.image_settings.file_format='JPEG';scene.render.filepath=str(PHOTOS/(ident+'.jpg'))
    bpy.ops.render.render(write_still=True)
    for o in r.children_recursive:o.hide_render=True
# Fotografías originales de los cuatro escenarios, sin editar recursos existentes.
def box(r,name,pos,scale,color):
    bpy.ops.mesh.primitive_cube_add(size=1,location=pos)
    o=bpy.context.object;o.name=name;o.parent=r;o.scale=scale;o.data.materials.append(mat(color))
    mod=o.modifiers.new('Cantos de tela','BEVEL');mod.width=.07;mod.segments=3
    o.modifiers.new('Normales','WEIGHTED_NORMAL')
    return o
def label(r,text,pos,size=.13,color='#423b48'):
    curve=bpy.data.curves.new('Rótulo','FONT');curve.body=text;curve.size=size;curve.extrude=.001
    o=bpy.data.objects.new('Rótulo',curve);bpy.context.collection.objects.link(o);o.parent=r;o.location=pos;o.rotation_euler=(math.pi/2,0,0);o.data.materials.append(mat(color));return o
scene.render.resolution_x=800;scene.render.resolution_y=450
cam.location=(4,-7,5);cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler();camdata.ortho_scale=7
for ident,ground,wall,title,detail in [
 ('c9','#dbe8ec','#9aafc1','REFUGIO R-4','MANTAS / R-4'),
 ('c10','#93af8b','#819c8b','ARCHIVO BOTÁNICO','CAJA 26 / AV 312'),
 ('c11','#b4a28b','#b99376','DEPÓSITO SECO','ÍNDICE / HOJAS SUELTAS'),
 ('c12','#b6adcc','#7e91b8','MIRADOR CUBIERTO','FERIA / RUTA DE CARGA')]:
    r=root(ident+'_escena')
    box(r,'piso',(0,0,-.1),(6,4,.2),ground);box(r,'pared',(0,1.3,1),(5,.2,2),wall)
    box(r,'puerta',(1.4,1.15,.85),(1.1,.2,1.7),'#655f70')
    box(r,'mesa',(-.8,-.2,.75),(2.2,1.2,.15),'#bb9374')
    for x in [-1.6,0]:box(r,'pata',(x,-.2,.35),(.16,.7,.7),'#8d715f')
    box(r,'caja',(-.7,-.2,1.05),(1,.75,.45),'#e0b77e')
    label(r,detail,(-1.16,-.59,1.04),.085)
    label(r,title,(-2.2,1.17,1.65),.18,'#fff1db')
    if ident=='c9':
        for x in [-2.3,2.4]:
            ball(r,'abeto',(x,.65,.7),(.4,.4,.9),'#e1ebec')
        box(r,'manta',(-.7,-.2,1.32),(1,.75,.12),'#859bb9')
    elif ident=='c10':
        for x in [-2,2]:
            box(r,'semillero',(x,.5,.3),(.7,.6,.35),'#826644')
            for a in [-.15,.15]:ball(r,'hojas',(x+a,.5,.67),(.17,.15,.3),'#649767')
    elif ident=='c11':
        for z in [.35,.8,1.25]:
            box(r,'estante',(-1.5,.95,z),(1.8,.6,.12),'#6f5c57')
            for a in range(8):box(r,'libro',(-2.2+a*.19,.95,z+.2),(.12,.4,.32),['#a57f8a','#879e91','#c5ae81'][a%3])
    else:
        for x in [-2,2]:ball(r,'cristal',(x,.6,.7),(.22,.24,.8),'#b6a2db')
        box(r,'cinta de carga',(0,-.8,.02),(4,.14,.02),'#9970bb')
    scene.render.filepath=str(PHOTOS/(ident+'_fondo.jpg'));bpy.ops.render.render(write_still=True)
    # Un parte fotografiado, con fechas legibles y sin indicadores de pista.
    for o in r.children_recursive:o.hide_render=True
    doc=root(ident+'_documento')
    box(doc,'parte',(0,0,.8),(4.8,.08,2.4),'#f4ead5')
    lines={'c9':['COORDINACIÓN DE REFUGIOS','17 / INVIERNO / AV 312','Mantas: R-4 — Lago','Pino: R-2 / letrero prestado','Acceso alto cerrado a las 17:00'],
           'c10':['ARCHIVO BOTÁNICO','CAJA RETORNABLE 26','AZUL: 8 / VERANO / AV 311','NARANJA: 8 / VERANO / AV 312','Esquejes — conservar a sombra'],
           'c11':['BIBLIOTECA DE VIGILIA','22 / OTOÑO / AV 312 — 17:04','Entregado por: MILO','Presupuesto: BENICIO','Falta: hoja del índice'],
           'c12':['FERIA DE IRIDALIA','13 / PRIMAVERA / AV 312','Teatro: MONTAJE ANTERIOR','Mirador cubierto: TELAR','Ruta de carga: cinta violeta']}[ident]
    for i,line in enumerate(lines):label(doc,line,(-2.1,-.06,1.65-i*.36),.14)
    oldpos=cam.location.copy();oldrot=cam.rotation_euler.copy();oldscale=camdata.ortho_scale
    cam.location=(0,-6,.8);cam.rotation_euler=(math.pi/2,0,0);camdata.ortho_scale=5.5
    scene.render.filepath=str(PHOTOS/(ident+'_documento.jpg'));bpy.ops.render.render(write_still=True)
    cam.location=oldpos;cam.rotation_euler=oldrot;camdata.ortho_scale=oldscale
    for o in doc.children_recursive:o.hide_render=True
print('OK 13 figuras originales, 4 retratos y 8 fotografías de expedientes')

#!/usr/bin/env python3
"""Exporta documentación pública a un checkout independiente de la wiki; no hace push."""
import argparse
import collections
import hashlib
import json
import posixpath
import re
import subprocess
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NARR = ROOT / 'docs/narrativa'
REPO = 'https://github.com/javialexis06-cyber/JUEGO-ANIVERSARIO-ESPOSA'
WIKI = REPO + '/wiki/'
RAW_WIKI = 'https://raw.githubusercontent.com/wiki/javialexis06-cyber/JUEGO-ANIVERSARIO-ESPOSA/'
BRANCH = 'claude/supermarket-mania-minigame-xn2it8'
PLANNED = '**Estado: diseño narrativo; estas misiones y sus premios todavía no están integrados al motor.**'


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args], text=True)


def slug(text):
    text = unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode()
    return re.sub(r'[^A-Za-z0-9_-]+', '-', text).strip('-')


def load(name):
    return json.loads((NARR / name).read_text())


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--salida', required=True, type=Path)
    ap.add_argument('--revision', default='f4fee67209c4ca8e0277e9fa360c737c5b89de04')
    ap.add_argument('--show', default='ab7d01a9ff836b529526b33a54c06e7b50bf14ab')
    args = ap.parse_args()
    rev = git('rev-parse', args.revision).strip()
    show = git('rev-parse', args.show).strip()
    out = args.salida.resolve()
    if out == ROOT or ROOT in out.parents:
        raise ValueError('La salida debe estar fuera del repositorio del juego.')
    out.mkdir(parents=True, exist_ok=True)
    pages, source_map = {}, {}
    roster = load('datos/reparto.json')
    people = {n['id']: n for n in roster}
    figures = load('datos/figuras.json')
    relations = load('datos/relaciones.json')
    rewards = {r['mision']: r for r in load('datos/recompensas.json')}
    missions = load('datos/campana.json') + load('datos/secretos.json') + load('datos/encuentros.json') + load('datos/elementales.json')
    missions += [dict(n['mision'], reparto=[n['id']], clase='personal') for n in roster]
    quests = {m['id']: m for m in missions}
    recursos = load('datos/regiones-recursos.json')['regiones']
    npc_pages = {n['id']: 'Personaje-' + n['id'] for n in roster + figures}
    npc_pages.update({'el': 'Personaje-El', 'ella': 'Personaje-Ella', 'conde': 'Personaje-Conde-Sangrevil'})
    quest_pages = {k: 'Mision-' + k for k in quests}
    names = {n['id']: n['nombre'] for n in roster + figures}
    names.update({f['alias_voz']:f['nombre'] for f in figures})
    names.update({'el': 'Él', 'ella': 'Ella', 'conde': 'Conde Sangrevil', 'narrador': 'Narrador'})
    region_names = ['Pueblo del Sol', 'Puerto de los Lirios', 'Brumaverde', 'Piedralumbre', 'Brasaviva', 'Nieveclara', 'Vigilia de Ceniza', 'Rosal Eterno', 'Jardines del Eco', 'Umbral de la Travesía', 'Refugio de los Hilos', 'Bastión del Velo', 'Estación sobre Celia', 'Huerto de Aurelia', 'Vigía de Nocturna', 'Cantera de Esmeralda', 'Campamento de los Fragmentos', 'Ambarina', 'Iridalia']
    groups = collections.defaultdict(list)
    for n in roster:
        groups[n['asentamiento']].append(n)
    region_keys = ['pueblo_sol', 'puerto_lirios', 'brumaverde', 'piedralumbre', 'brasaviva', 'nieveclara', 'vigilia', 'rosal_eterno', 'jardines_eco', 'travesia', 'refugio_hilos', 'bastion_velo', 'estacion_celia', 'huerto_aurelia', 'vigia_nocturna', 'cantera_esmeralda', 'campamento_fragmentos', 'ambarina', 'iridalia']
    if set(region_keys) != set(groups):
        raise ValueError('El reparto debe conservar sus 19 asentamientos.')
    region_title = dict(zip(region_keys, region_names))
    downloads = {str(p.relative_to(ROOT)): str(p.relative_to(NARR)) for p in (NARR / 'datos').glob('*.json')}
    downloads.update({str(NARR.relative_to(ROOT)) + '/audio/' + f: 'audio/' + f for f in ['lineas.json', 'lineas-mundo.json', 'reparto-voces.json', 'resumen.json', 'tomas.csv']})

    def link(page, label=None):
        return f'[{label or page}]({WIKI}{page})'

    def person(nid):
        nid=next((f['id'] for f in figures if f['alias_voz']==nid),nid)
        return link(npc_pages[nid], names[nid]) if nid in npc_pages else names.get(nid, nid)

    def quest(mid):
        return link(quest_pages[mid], mid + ' · ' + quests[mid]['titulo'])

    def add(page, body):
        if page in pages:
            raise ValueError('Página duplicada: ' + page)
        pages[page] = '\n'.join(line.rstrip() for line in body.rstrip().splitlines()) + '\n'

    def source(path, revision=rev):
        return git('show', revision + ':' + path)

    def sections(text):
        chunks = re.split(r'(?m)(?=^## )', text)
        return [(c.splitlines()[0].removeprefix('## '), c) for c in chunks if c.strip()]

    def scrub(text):
        # La wiki pública describe ficción y mecánicas, no reproduce recuerdos íntimos.
        text = text.replace('Javier', 'Él').replace('Laura', 'Ella')
        text = text.replace(' (el viaje entre Medellín y la otra ciudad)', '').replace(' (Cartagena)', '')
        text = text.replace('de la primera cita', 'de la historia').replace('como llamábamos', 'según la pista de la sala')
        return text

    def convert(text, path, revision=rev):
        def replace(match):
            label, target = match.groups()
            if target.startswith(('http:', 'https:', '#', 'mailto:', 'data:')):
                return match.group(0)
            target = target.strip('<>')
            filename, sep, anchor = target.partition('#')
            resolved = posixpath.normpath(posixpath.join(posixpath.dirname(path), filename))
            if resolved in downloads:
                dest = RAW_WIKI + downloads[resolved]
            elif resolved in source_map:
                dest = WIKI + source_map[resolved]
            else:
                dest = REPO + '/blob/' + revision + '/' + resolved
            return f'[{label}]({dest}{sep}{anchor})'
        return scrub(re.sub(r'(?<!!)\[([^\]]+)\]\(([^)]+)\)', replace, text))

    def doc(page, path, status, revision=rev, text=None):
        content = source(path, revision) if text is None else text
        add(page, f'# {page.replace("-", " ")}\n\n{status}\n\n' + convert(content, path, revision) + f'\n\nFuente técnica: [documento de referencia]({REPO}/blob/{revision}/{path}). Esta página no certifica la versión de la APK instalada.\n')

    modules = ['PUEBLO', 'VIVIENDAS', 'DORMITORIOS', 'VIDA-SOCIAL', 'ENCARGOS', 'CORREO', 'COLECCIONES', 'FESTIVALES', 'CARPINTERIA', 'COMPANIA', 'HABILIDADES', 'GANADERIA', 'NARRATIVA']
    source_map.update({f'juego/web/src/granja-v3/{m}-INTEGRACION.md': 'Granja-' + m.title() for m in modules})
    source_map.update({'juego/web/src/granja-v3/PLAN-MOTOR-COMPLETO.md': 'Plan-del-motor', 'juego/web/src/granja-v3/PLAN-PUEBLOS-MUNDOS.md': 'Plan-de-pueblos-y-mundos', 'juego/web/src/granja-v3/REPARTO-COMPLETO.md': 'Catalogo-tecnico-del-reparto'})
    general = {
        'docs/sistemas/granja.md': ('Nuestra-Granjita', 'Motor integrado parcialmente. La mitología ampliada se documenta como diseño futuro.'),
        'docs/sistemas/mecanicas.md': ('Supermercado-Mecanicas', 'Guía del juego existente; ampliaciones pendientes se conservan como tales.'),
        'docs/sistemas/niveles.md': ('Supermercado-Niveles', 'Catálogo de niveles documentado.'),
        'docs/sistemas/logros.md': ('Supermercado-Logros', 'Catálogo de logros documentado.'),
        'docs/sistemas/reacciones.md': ('Supermercado-Reacciones', 'Personajes y reacciones del supermercado; no son el reparto social de Astra.'),
        'docs/sistemas/juegos-mesa.md': ('Juegos-de-Mesa', 'Cinco juegos existentes, con diferencias de modalidad según cada juego.'),
        'docs/sistemas/clue.md': ('Clue', 'Juego existente. No ofrece modalidad local pasando el mismo celular, por las cartas secretas.'),
        'docs/sistemas/salas.md': ('Sala-de-Juegos-Amigos', 'Edición independiente para amigos; no incorpora casa, granja ni campaña privada.'),
        'docs/sistemas/sangre-y-ceniza.md': ('Sangre-y-Ceniza', 'Juego existente. La campaña Astra ampliada de 36 misiones es una expansión diseñada y aún no integrada.'),
        'docs/sistemas/sangre-figuras.md': ('Sangre-Figuras', 'Catálogo del juego existente. Los ecos de dioses no equivalen a sus identidades divinas.'),
        'docs/en-obra/sangre-propuesta.md': ('Plan-Sangre-y-Ceniza-2', 'Propuesta histórica. Consultar Estado-y-planes: sus cinco fases ya figuran completadas en la cola remota.'),
        'docs/en-obra/lavado-propuesta.md': ('Plan-Lavarse-la-Cara-2', 'Propuesta por fases: fase 1 y fase 2a documentadas como completas; fase 2b y posteriores pendientes.'),
        'docs/en-obra/escenas-premium.md': ('Escenas-Premium', 'Catálogo y funcionamiento de escenas existentes; sus nuevos escenarios y ampliaciones permanecen en pausa.'),
        'docs/sistemas/musica.md': ('Musica-y-efectos-de-los-juegos', 'Música y efectos existentes. La producción musical de Astra y la granja sigue pendiente y se especifica aparte.'),
    }
    for path, (page, _) in general.items():
        source_map[path] = page
    local_docs = {'01-mundo.md': 'Astra-Mundo', '02-campana.md': 'Astra-Campana-y-cinematica', '05-jugabilidad.md': 'Astra-Jugabilidad-y-recompensas', '06-produccion.md': 'Astra-Voces-musica-y-produccion', '08-fuatia.md':'Fuatia', '08-misiones-fuatia.md':'Misiones-de-Fuatia', '09-regiones-y-recursos.md':'Confluencia-y-recursos', '10-figuras-y-escenas.md':'Figuras-y-escenas', '11-armas-y-combate.md':'Armas-y-combate'}
    for filename, page in local_docs.items():
        source_map['docs/narrativa/' + filename] = page
    source_map['docs/mitologia.md'] = 'Astra-Canon-base'
    source_map.update({'docs/narrativa/README.md': 'Astra', 'docs/narrativa/03-reparto.md': 'Personajes', 'docs/narrativa/02-misiones-principales.md': 'Misiones-Principales', 'docs/narrativa/04-relaciones-secretos.md': 'Relaciones-y-secretos', 'docs/narrativa/07-encuentros.md': 'Misiones-Encuentros', 'docs/narrativa/audio': 'Voces-y-guiones', 'docs/narrativa/datos': 'Datos-y-fuentes'})
    for path, (page, state) in general.items():
        doc(page, path, '**Estado:** ' + state)
    for path, page in list(source_map.items()):
        if path.startswith('juego/web/'):
            planning = path.endswith(('PLAN-MOTOR-COMPLETO.md', 'PLAN-PUEBLOS-MUNDOS.md', 'REPARTO-COMPLETO.md'))
            if path.endswith('NARRATIVA-INTEGRACION.md'):
                add(page, PLANNED + '\n\n' + convert((ROOT / path).read_text(), path))
            else:
                doc(page, path, '**Estado: planificación y capacidades pendientes; no implica que todos los mundos existan en la partida.**' if planning else '**Estado: contrato de integración del motor. Consultar las limitaciones del documento.**')
    for filename, page in local_docs.items():
        add(page, PLANNED + '\n\n' + convert((NARR / filename).read_text(), 'docs/narrativa/' + filename))
    add('Astra-Canon-base', '# Canon base de Astra\n\n**Documento de origen y propuestas históricas.** La biblia ampliada resuelve sus preguntas abiertas: la Santa es Serena, los dioses oscuros son ecos y la Noche dura once años. Consultar Astra Mundo y la campaña para la continuidad vigente. Las propuestas de altares, álbum y decoración no están implementadas por publicarse aquí.\n\n' + convert((ROOT / 'docs/mitologia.md').read_text(), 'docs/mitologia.md'))

    house = sections(source('docs/sistemas/nuestro-hogar.md'))
    private = ('Recuerdos en el baño', 'Recuerdos y fechas', 'Mensajes de voz')
    house_content = '\n'.join(c for title, c in house if not title.startswith(private + ('Ir al baño', 'Lavarse la cara', 'La cocina de chef')))
    doc('Nuestro-Hogar', 'docs/sistemas/nuestro-hogar.md', '**Estado: juego existente.** Las funciones privadas de recuerdos y mensajes se describen solo como mecanismos; su contenido no se publica aquí.', text=house_content)
    kitchen = next(c for t, c in house if t.startswith('La cocina de chef'))
    for page, prefix in [('Lavarse-la-Cara', 'Lavarse la cara'), ('Retrete-Espacial', 'Ir al baño')]:
        content = next(c for t, c in house if t.startswith(prefix))
        if page == 'Retrete-Espacial':
            content = re.sub(r'(?ms)^- \*\*Lo que les cae pesado\*\*:.*?(?=^- \*\*Solo la primera)', '', content)
            content = content.replace('Solo la primera vez hace falta la leche o el picante', 'Solo la primera vez hace falta descubrir el evento de comida del baño')
        doc(page, 'docs/sistemas/nuestro-hogar.md', '**Estado: minijuego existente.**', text=content)
    doc('Cocina-de-Chef', 'docs/sistemas/nuestro-hogar.md', '**Estado: tres restaurantes existentes, con progreso independiente.** Los clientes de cocina pertenecen a ese juego; la Abuela Rosa no es la posadera Rosa de Astra.', text=kitchen)
    cooking = {'La-Wafleria': ('Waflería', 'Plancha → Armar → Bebidas (desde rango 3). Verifica masa, punto D/T y distribución de toppings; retira antes de que se queme.'), 'La-Freseria': ('Fresería', 'Picar → Batir → Servir. Respeta tamaño de corte, volumen y firmeza; detener el batido evita cortar la crema.'), 'La-Fraperia': ('Frapería', 'Preparar → Licuar → Decorar. Respeta vaso, base, hielo, leche, textura y altura de chantilly; no prolongues el licuado hasta aguarlo.')}
    for page, (title, steps) in cooking.items():
        add(page, f'# La {title}\n\n**Estado: juego existente.**\n\n{steps}\n\n1. Escucha el pedido completo antes de cambiar de estación.\n2. Consulta el tiquete durante toda la preparación.\n3. Prepara y entrega cada pedido; revisa calificaciones de espera y estaciones.\n4. Invierte las propinas en equipo; la puntuación aumenta el rango y desbloquea ingredientes.\n\n' + link('Cocina-de-Chef', 'Guía completa: ingredientes, técnicas, mejoras, modos y recompensas') + '\n')
    doors = sections(source('docs/sistemas/cien-puertas.md'))
    public_doors = '\n'.join(c for t, c in doors if not t.startswith(('La historia', 'Los recuerdos (de verdad)', 'Investigación:')))
    doc('Cien-Puertas', 'docs/sistemas/cien-puertas.md', '**Estado: cien puertas funcionales documentadas; las revisiones y cambios pendientes se indican en el texto.** El Olvido oculta fragmentos del camino de regreso. Esta guía contiene los acertijos y soluciones documentadas; los recuerdos personales no se reproducen.', text=public_doors)
    doc('El-Show-de-Nosotros', 'docs/show.md', '**Estado: desarrollo en rama separada `trabajo/show`; integración y revisión pendientes en la rama principal.** No se da por publicado en la APK.', revision=show)

    for page, title in [('Dados', 'Dados'), ('Mancala', 'Mancala'), ('Puntos-y-Cajas', 'Puntos y Cajas'), ('Parchis', 'Parchís')]:
        table = source('docs/sistemas/juegos-mesa.md')
        matching = re.findall(r'(?ms)^### ' + re.escape(title) + r'[^\n]*\n.*?(?=^### |^## |\Z)', table)
        add(page, f'# {title}\n\n**Estado: juego existente.**\n\n' + '\n'.join(matching) + '\n\n' + link('Juegos-de-Mesa', 'Reglas completas, modos, dificultades, monedas y solución de desconexiones') + '\n')
    add('Supermercado-Mania', '# Supermercado Manía\n\n**Estado: juego existente.** Atiende clientes, cumple objetivos de cada jornada y utiliza mejoras para afrontar la dificultad.\n\n' + '\n'.join('- ' + link(p, l) for p, l in [('Supermercado-Mecanicas', 'Cómo jugar y mejorar'), ('Supermercado-Niveles', 'Todos los niveles y requisitos'), ('Supermercado-Logros', 'Logros y condiciones'), ('Supermercado-Reacciones', 'Clientes y reacciones')]))

    def dialogue(text):
        result = []
        for line in text.splitlines():
            speaker, sep, spoken = line.partition(': ')
            result.append(f'> **{person(speaker)}:** {spoken}' if sep else '> ' + line)
        return '\n>\n'.join(result)

    def reward(mid):
        r = rewards[mid]
        return f'## Recompensa diseñada\n\n**{r["nombre"]}** · familia `{r["familia"]}` · insignia `{r["insignia"]}`.\n\n{r["efecto_diseno"]}\n\nLímite: {r["limite"]}\n\nUna sola entrega, no vendible; no otorga monedas ni multiplicadores globales. Especificación: `{r["id"]}`.\n'

    for mid, m in quests.items():
        personal = m.get('clase') == 'personal'
        body = f'# {mid} · {m["titulo"]}\n\n{PLANNED}\n\n'
        body += '## Cómo iniciar\n\n' + ('Completar ' + ', '.join(quest(p) for p in m['requiere']) + '.' if m['requiere'] else 'Primera misión: no requiere otra misión de esta campaña.')
        body += '\n\nParticipan: ' + ', '.join(person(n) for n in m['reparto']) + '.\n\n'
        if m.get('zona') or m.get('asentamiento'):
            region = m.get('zona', m.get('asentamiento'))
            body += 'Zona prevista: ' + (link('Lugar-' + region, region_title[region]) if region in groups else region) + '.\n\n'
        if m.get('pistas'):
            body += '## Pistas para encontrarla\n\n' + '\n'.join('- ' + p for p in m['pistas']) + '\n\n'
        actions = m.get('actos', m.get('acciones'))
        body += '## Cómo completarla\n\n'
        if isinstance(actions, list):
            body += '\n'.join(f'{i}. {a}.' for i, a in enumerate(actions, 1))
        else:
            body += actions
        body += '\n\n## Guion completo\n\n'
        if 'inicio' in m:
            for stage in ['inicio', 'giro', 'cierre']:
                text = (m['reparto'][0] + ': ' if personal else '') + m[stage]
                body += f'### {stage.capitalize()}\n\n{dialogue(text)}\n\n'
        else:
            body += dialogue(m['lineas']) + '\n\n'
        decision = m.get('decision', m.get('eleccion', ''))
        if decision:
            body += '## Decisión y respuestas\n\n' + decision + '\n\n'
            branches = m.get('respuestas', m.get('ramas_dialogo', m.get('ramas', [])))
            for i, branch in enumerate(branches, 1):
                body += f'### Opción {i}\n\n' + dialogue((m['reparto'][0] + ': ' if personal else '') + branch) + '\n\n'
            if m.get('consecuencias'):
                body += m['consecuencias'] + '\n\n'
        body += reward(mid) + '\n## Si se interrumpe\n\n' + m.get('recuperacion', 'Conservar el último paso confirmado y poder reanudar sin duplicar entregas o premios. Los materiales siguen las acciones normales del motor; no se descuenta ni concede nada por una escena inconclusa.')
        future = [x['id'] for x in missions if mid in x['requiere']]
        if future:
            body += '\n\n## Misiones que abre\n\n' + '\n'.join('- ' + quest(p) for p in future)
        body += '\n\n' + link('Misiones', 'Índice de misiones')
        add(quest_pages[mid], body)

    for n in roster:
        nid = n['id']
        body = f'# {n["nombre"]}\n\n{PLANNED}\n\nID estable: `{nid}`. Naturaleza: `{n["naturaleza"]}`.\n\n'
        body += 'Lugar: ' + link('Lugar-' + n['asentamiento'], region_title[n['asentamiento']]) + f'. Mundo: `{n["mundo"]}`. Hogar previsto: `{n["hogar_planeado"]}`.\n\n'
        for title, field in [('Oficio y papel', 'funcion'), ('Pasado', 'pasado'), ('Presente y personalidad', 'presente'), ('Cambio personal y sus motivos', 'arco'), ('Dirección de voz', 'voz')]:
            body += f'## {title}\n\n{n[field]}\n\n'
        vida=n['profundidad']
        for memoria in vida['memorias']:
            body += f"## {memoria['etapa']}\n\n{memoria['texto']}\n\n"
        body += '## Vida cotidiana fuera de la misión\n\n'+vida['cotidiano']+'\n\n## Qué piensa de Fuatia\n\n'+vida['postura_fuatia']+'\n\n'
        for escena in vida['escenas']:
            body += f"## {escena['momento']}\n\n`{escena['id']}` · condición `{escena['condicion']}`; escena repetible sin premio adicional.\n\n"+dialogue(escena['lineas'])+'\n\n'
        body += '## Misión personal\n\n' + quest(n['mision']['id']) + '\n\n'
        other = [m for m in missions if nid in m['reparto'] and m['id'] != n['mision']['id']]
        body += '## Otras historias en las que participa\n\n' + ('\n'.join('- ' + quest(m['id']) for m in other) if other else 'Su arco personal sostiene por ahora su participación escrita.') + '\n\n'
        body += '## Relaciones y secretos\n\n'
        for r in relations:
            if nid not in (r['a'], r['b']):
                continue
            other_id = r['b'] if nid == r['a'] else r['a']
            body += f'### {r["id"]} · {person(other_id)}\n\nTipo: `{r["tipo"]}`. ' + ('**Relación secreta: contiene spoilers.**' if r['secreto'] else '') + f'\n\n**Pasado:** {r["pasado"]}\n\n**Presente:** {r["presente"]}\n\nSe desarrolla en ' + quest(r['revela']) + '.\n\n'
        body += 'Vínculos del reparto: ' + ', '.join(person(i) for i in n['vinculos']) + '.\n\n' + link('Voz-' + nid, 'Todas sus líneas listas para grabar')
        add(npc_pages[nid], body)
    for f in figures:
        add(npc_pages[f['id']], '# ' + f['nombre'] + '\n\n' + PLANNED + '\n\n' + convert(f.get('historia_extensa',f['biografia']), 'docs/narrativa/08-fuatia.md' if f['alias_voz']=='fuatia' else 'docs/narrativa/10-figuras-y-escenas.md') + '\n\n' + link('Astra-Mundo', 'Poderes, límites, cronología y conflictos') + '\n\n' + link('Voz-' + f['alias_voz'], 'Guion de voz'))
    protagonist = next(c for t, c in sections((NARR / '02-campana.md').read_text()) if t.startswith('Protagonistas'))
    for pid in ['el', 'ella', 'conde']:
        label = {'el': 'Él.', 'ella': 'Ella.', 'conde': 'Conde Sangrevil.'}[pid]
        bio = re.search(r'(?ms)^\*\*' + re.escape(label) + r'\*\*.*?(?=\n\n|\Z)', protagonist).group(0)
        extra=next(c for t,c in sections((NARR/'10-figuras-y-escenas.md').read_text()) if t.startswith({'el':'Él ·','ella':'Ella ·','conde':'Conde Sangrevil ·'}[pid]))
        bio += '\n\n'+extra
        add(npc_pages[pid], '# ' + names[pid] + '\n\n' + PLANNED + '\n\nPasado ficticio escrito para el juego.\n\n' + bio + '\n\n' + link('Astra-Campana-y-cinematica', 'Escenas completas y desenlace') + '\n\n' + link('Voz-' + pid, 'Guion de voz'))

    region_source = source('juego/web/src/granja-v3/PLAN-PUEBLOS-MUNDOS.md')
    for region, inhabitants in groups.items():
        title = region_title[region]
        matching = [c for t, c in sections(region_source) if t == title]
        body = f'# {title}\n\n**Estado: región y contenidos planificados; consultar Nuestra Granjita para los sistemas ya integrados.**\n\n'
        body += '\n'.join(matching) + '\n\n## Habitantes y sus historias\n\n'
        body += '\n'.join('- ' + person(n['id']) + ' — ' + quest(n['mision']['id']) for n in inhabitants)
        community = [m for m in missions if m.get('asentamiento') == region]
        if community:
            body += '\n\n## Encuentro comunitario\n\n' + '\n'.join(quest(m['id']) for m in community)
        territorios=[z for z in recursos if z['id']==region or (region=='campamento_fragmentos' and z['id'].startswith('fragmentos_'))]
        body += '\n\n## Recursos y motivos para regresar\n\n'+'\n'.join('- '+link('Recursos-'+z['id'],z['nombre']) for z in territorios)
        add('Lugar-' + region, body)
    for z in recursos:
        body=f"# {z['nombre']} · recursos\n\n{PLANNED}\n\nMundo: {z['mundo']}. Acceso: {z['acceso']}.\n\n{z['conflicto']}\n\n"
        for r in z['recursos']:
            body+=f"## {r['nombre']} · {r['clase']}\n\n{r['obtencion']}\n\n"+'\n'.join('- '+uso for uso in r['usos'])+'\n\n'
        body+=f"## Combate\n\n{z['combate']}\n\n## Renovación y regreso\n\nCiclo: {z['renovacion']['dias_dormidos']} jornadas dormidas.\n\n{z['renovacion']['politica']}\n\n{z['retorno']}\n\n"+link('Confluencia-y-recursos','Reglas, economía y catálogo completo')+' · '+link('Armas-y-combate','Armas y combate')
        add('Recursos-'+z['id'],body)
    add('Recursos-de-los-mundos','# Recursos de los mundos\n\n**24 territorios de recursos diseñados; no todos existen todavía en el juego.** Conservan 19 asentamientos: los Fragmentos tienen dos rutas y Confluencia cuatro territorios sin nuevas aldeas.\n\n'+'\n'.join('- '+link('Recursos-'+z['id'],z['nombre']) for z in recursos))


    for page, prefix, title in [('Misiones-Principales', 'P', 'Campaña principal'), ('Misiones-Personales', 'V_', 'Arcos personales'), ('Misiones-Secretas', 'S', 'Misiones secretas'), ('Misiones-Encuentros', 'E', 'Encuentros comunitarios'), ('Misiones-Elementales','T','Arcos secundarios de Fuatia')]:
        entries = [m for m in missions if m['id'].startswith(prefix) or (prefix=='P' and m['id'].startswith('F')) or (prefix=='S' and m.get('secreta'))]
        if prefix=='P':
            ordered=[];pending=entries[:]
            while pending:
                ready=[m for m in pending if set(m['requiere']) <= {q['id'] for q in ordered}]
                if not ready:raise ValueError('Campaña sin ruta de índice')
                ordered+=ready;pending=[m for m in pending if m not in ready]
            entries=ordered
        add(page, f'# {title}\n\n{PLANNED}\n\n{len(entries)} misiones. Cada enlace contiene condiciones, recorrido, guion y recompensa.\n\n' + '\n'.join('- ' + quest(m['id']) for m in entries))
    add('Personajes', '# Personajes de Astra\n\n142 habitantes con biografía y misión; seis figuras cósmicas y tres protagonistas/antagonistas adicionales. Todos los arcos nuevos están diseñados, no activados en la partida.\n\n' + '\n\n'.join('## ' + link('Lugar-' + k, region_title[k]) + '\n\n' + '\n'.join('- ' + person(n['id']) for n in v) for k, v in groups.items()) + '\n\n## Figuras y protagonistas\n\n' + '\n'.join('- ' + person(k) for k in npc_pages if k not in people))
    add('Lugares', '# Lugares de Astra\n\n**Mapa narrativo y expansión planificada.**\n\n' + '\n'.join('- ' + link('Lugar-' + k, region_title[k]) + f' · {len(v)} habitantes' for k, v in groups.items()) + '\n\n' + link('Plan-de-pueblos-y-mundos', 'Conexiones, viviendas y orden de integración'))
    add('Relaciones-y-secretos', '# Relaciones y secretos\n\n**Spoilers de la expansión diseñada.** 98 vínculos desarrollados.\n\n' + '\n\n'.join(f'## {r["id"]} · {person(r["a"])} y {person(r["b"])}\n\nTipo: `{r["tipo"]}`. Secreto: {"sí" if r["secreto"] else "no"}.\n\n{r["pasado"]}\n\n{r["presente"]}\n\nRevelación: ' + quest(r['revela']) for r in relations))
    add('Misiones', '# Misiones\n\n## Contenido jugable de la granja\n\n' + link('Granja-Encargos', '12 pedidos permanentes, ofertas renovables y especiales: pasos, entregas, plazos y premios') + '\n\n' + link('Granja-Correo', 'Proyectos por correspondencia: elección de rama y recetas') + '\n\n## Expansión narrativa diseñada\n\n217 misiones sin activar todavía en el motor: 36 principales (P01–P24 y F01–F12), 142 personales, 12 secretos originales, 19 encuentros y 8 arcos secundarios elementales. T08 añade un secreto; está contado dentro de esos ocho.\n\n' + '\n'.join('- ' + link(p) for p in ['Misiones-Principales', 'Misiones-Personales', 'Misiones-Secretas', 'Misiones-Encuentros', 'Misiones-Elementales', 'Astra-Jugabilidad-y-recompensas']))

    voicefiles = sorted((NARR / 'audio/por-voz').glob('*.md'))
    voiceindex = []
    for path in voicefiles:
        pid = path.stem
        add('Voz-' + pid, '**Estado: guion escrito; no se ha generado ni contratado audio nuevo.**\n\n' + path.read_text() + '\n\n' + link('Voces-y-guiones', 'Índice de voces y producción'))
        voiceindex.append('- ' + link('Voz-' + pid, names.get(pid, pid)))
    summary = load('audio/resumen.json')
    add('Voces-y-guiones', f'# Voces y guiones\n\n**Guiones completos; audio nuevo pendiente.**\n\n{summary["total_lineas"]} líneas para {len(voicefiles)} voces; {summary["tomas_unicas_por_hablante_texto"]} tomas únicas por hablante/texto, {summary["caracteres_unicos"]} caracteres únicos. Duración estimada: {summary["minutos_estimados_a_145_palabras_por_minuto"]} minutos a 145 palabras/minuto; no es una medición de audio ni un presupuesto.\n\nNo se ha ejecutado generación ni gasto en ElevenLabs. La promoción y los modelos deben comprobarse al producir; los diálogos de pareja necesitan su adaptación antes de ir a la edición de amigos.\n\n' + link('Astra-Voces-musica-y-produccion', 'Dirección, prioridades, 22 encargos musicales y animación') + '\n\n## Guiones por voz\n\n' + '\n'.join(voiceindex))

    status = '''# Estado y planes

La documentación distingue el juego existente de los diseños. El estado de una APK depende del commit con el que fue compilada; esta wiki no publica ejecutables.

| Frente | Estado documentado | Siguiente paso |
|---|---|---|
| Nuestro Hogar | Casa y minijuegos integrados | Revisión de las ampliaciones de tele, tocador y escenas premium |
| Supermercado | Juego, niveles y logros existentes | Mejoras según la cola de trabajo |
| Cien Puertas | 100 acertijos funcionales y revisión de pareja documentada | Continuar ajustes de presentación sin cambiar soluciones sin revisión |
| Sangre y Ceniza 2 | Cinco fases de expansión completadas en la cola remota | Aceite de lámparas, sellos de Procesión, espejos del castillo y suelo de fuego de la abadía |
| Lavarse la Cara 2 | Fase 1 y fase 2a completas | Fase 2b: mercader viajero y Monedero; fases siguientes: biomas de ducha, disfraces, cartas y aventuras |
| Retrete Espacial | Juego existente y edición amigos | Revisión y ampliaciones según cola |
| Cocina de Chef | Tres restaurantes existentes | Balance y mejoras según cola |
| Juegos de Mesa | Cinco juegos existentes | Show pendiente de integrar desde rama separada |
| Sala de Juegos | Seis familias de juegos para amigos | Mantener economías y contenido separados |
| Granja | Motor V5 y módulos integrados parcialmente | Capacidades pendientes del plan del motor |
| Cuadernos de mina K07 | Implementación y comprobaciones locales, código sin publicar | Integrar después de que finalice el trabajo remoto en paralelo |
| Astra ampliada | Biblia ampliada con Fuatia, 142 NPC, 217 misiones y guiones completos | Implementación de estados, condiciones, escenas y premios; producción de audio posterior |
| Sótano de terror y teléfono de crímenes | Ideas iniciales | Diseñar; no existen campañas completas jugables ni guiones cerrados |

La publicación de esta wiki no levanta la pausa del push del código del juego. Los textos de Astra se publican aquí como documentación del diseño, sin activar misiones.
'''
    add('Estado-y-planes', status + '\n\n' + '\n'.join('- ' + link(p) for p in ['Plan-del-motor', 'Plan-de-pueblos-y-mundos', 'Plan-Sangre-y-Ceniza-2', 'Plan-Lavarse-la-Cara-2', 'El-Show-de-Nosotros', 'Ideas-futuras', 'Granja-Cuadernos-locales', 'Escenas-Premium', 'Musica-y-efectos-de-los-juegos', 'Astra-Canon-base', 'Fuatia', 'Confluencia-y-recursos', 'Recursos-de-los-mundos', 'Armas-y-combate']))
    add('Ideas-futuras', '# Ideas futuras\n\n**Estado: ideas sin desarrollo cerrado.**\n\n- Sótano de terror: juego de acceso por contraseña e identificación de visitantes, inspirado en la tensión de decidir a quién dejar entrar.\n- Teléfono de crímenes: propuesta de diez casos de investigación. Todavía no se han escrito aquí diez guiones ni soluciones definitivas.\n- Tele, tocador y ampliación de escenas premium: propuestas sujetas a diseño e integración.\n\nEstas ideas no son requisitos de Astra ni desbloqueos disponibles. Cuando exista un diseño concreto se añadirá su página con reglas, casos, guiones y estado verificable.')
    local_book = ROOT / 'juego/web/src/granja-v3/LIBROS-INTEGRACION.md'
    add('Granja-Cuadernos-locales', '# Cuadernos de mina\n\n**Estado: implementado y comprobado localmente; código aún sin publicar en la rama del juego.**\n\n' + local_book.read_text())
    add('Sistemas-de-Granja', '# Sistemas de la granja\n\n' + '\n'.join('- ' + link('Granja-' + m.title()) for m in modules) + '\n- ' + link('Granja-Cuadernos-locales') + '\n- ' + link('Plan-del-motor'))
    gamepages = ['Nuestro-Hogar', 'Supermercado-Mania', 'Cien-Puertas', 'Sangre-y-Ceniza', 'Nuestra-Granjita', 'Lavarse-la-Cara', 'Retrete-Espacial', 'Cocina-de-Chef', 'La-Wafleria', 'La-Freseria', 'La-Fraperia', 'Juegos-de-Mesa', 'Dados', 'Mancala', 'Puntos-y-Cajas', 'Parchis', 'Clue', 'Sala-de-Juegos-Amigos', 'El-Show-de-Nosotros', 'Ideas-futuras']
    add('Juegos', '# Juegos\n\nCada guía distingue reglas existentes y expansiones. La casa, la granja y Sangre comparten universo narrativo; los juegos casuales mantienen reglas y economías propias.\n\n' + '\n'.join('- ' + link(p) for p in gamepages))
    add('Astra', '# Astra · La vida que no cabe en una vasija\n\n' + PLANNED + '\n\nMitología que conecta Sangre y Ceniza con Nuestra Granjita. Autoría nueva sobre el canon conservado; no es recuperación de la conversación perdida. Los pasados, conflictos y relaciones añadidos son ficción.\n\n' + '\n'.join('- ' + link(p) for p in ['Astra-Mundo', 'Astra-Campana-y-cinematica', 'Personajes', 'Lugares', 'Misiones', 'Relaciones-y-secretos', 'Astra-Jugabilidad-y-recompensas', 'Voces-y-guiones', 'Astra-Canon-base', 'Fuatia', 'Confluencia-y-recursos', 'Recursos-de-los-mundos', 'Armas-y-combate']))
    add('Datos-y-fuentes', f'# Datos y fuentes\n\nLa wiki se exporta desde documentos y catálogos estructurados; no carga estos datos automáticamente en el juego.\n\n- Documentación remota de juegos: [{rev[:7]}]({REPO}/tree/{rev}), rama `{BRANCH}`.\n- Show: [{show[:7]}]({REPO}/tree/{show}), rama `trabajo/show`, pendiente de integración.\n- Biblia Astra: catálogo local `docs/narrativa`, base `ff9723a` y ampliación de Fuatia, publicado como texto en esta wiki; el commit del juego sigue sin subir.\n- Cuadernos K07: trabajo local `2ec0334`, sin push.\n\nPara actualizar se usa `docs/wiki/generar.py` desde el repositorio del juego, con una revisión remota explícita y un checkout separado de la wiki. El exportador no hace commits ni pushes. Los NPC usan IDs estables y cada misión enlaza la recompensa de su catálogo.\n\nLos recuerdos privados, las conversaciones personales y los datos de salud no se trasladan a estas páginas.\n\n## Catálogos descargables\n\n' + '\n'.join(f'- [{dest}]({RAW_WIKI}{dest})' for dest in sorted(downloads.values())))
    add('Home', '# Nuestro Hogar · Wiki\n\nGuías de todos los juegos, sistemas de la granja y biblia completa de Astra. **Las páginas de personajes, relaciones y misiones contienen spoilers.**\n\n## Entradas principales\n\n' + '\n'.join('- ' + link(p, label) for p, label in [('Juegos', 'Juegos y cómo se juegan'), ('Estado-y-planes', 'Qué está terminado y qué falta'), ('Nuestra-Granjita', 'Granja: entrada, controles y guardado'), ('Sistemas-de-Granja', 'Sistemas, encargos, recetas y progreso'), ('Astra', 'Mitología, historia principal y escenas'), ('Personajes', '142 NPC y sus biografías completas'), ('Misiones', 'Misiones: requisitos, soluciones, decisiones y premios'), ('Lugares', 'Pueblos y mundos'), ('Fuatia','Fuatia: historia, personalidad y poderes'), ('Recursos-de-los-mundos','Confluencia y recursos de cada mundo'), ('Armas-y-combate','Armas: reglas y motor local'), ('Relaciones-y-secretos', 'Relaciones y secretos'), ('Voces-y-guiones', 'Guiones por voz, música y narración'), ('Datos-y-fuentes', 'Fuentes y criterio de actualización')]) + '\n\n## Cómo leer el estado\n\n- **Existente / integrado:** documentado en el código remoto consultado; la APK puede corresponder a otro commit.\n- **Parcial:** funciona una parte y se detallan capacidades pendientes.\n- **Local sin publicar:** preparado y comprobado, pero el código no está subido.\n- **Diseño narrativo / plan:** historia o mecánica especificada; todavía no se puede completar en el juego.\n- **Idea:** propuesta pendiente de desarrollo.\n\nLa expansión incluye 36 misiones principales, 142 personales, 12 secretos originales, 19 encuentros y 8 secundarios elementales (T08 es un nuevo secreto), 98 relaciones, 284 conversaciones personales, 14 escenas cinematográficas y 152 guiones de voz. Tiene un catálogo de recursos para 24 territorios. El primer combate de armas se ha preparado localmente; Confluencia y las misiones siguen en diseño. Publicar estos textos no activa la expansión ni modifica las partidas.\n')
    add('_Sidebar', '**Nuestro Hogar**\n\n' + '\n'.join('- ' + link(p) for p in ['Home', 'Juegos', 'Estado-y-planes', 'Nuestra-Granjita', 'Sistemas-de-Granja', 'Astra', 'Personajes', 'Misiones', 'Lugares', 'Fuatia', 'Recursos-de-los-mundos', 'Armas-y-combate', 'Relaciones-y-secretos', 'Voces-y-guiones', 'Datos-y-fuentes']))
    add('_Footer', link('Home', 'Inicio') + ' · ' + link('Estado-y-planes', 'Estado y planes') + ' · Los diseños futuros se identifican en cada página.')

    # Validación previa a toda escritura: cardinalidades, enlaces internos y contenido privado excluido.
    assert len(roster) == 142 and len(figures) == 6 and len(quests) == 217 and len(relations) == 98
    assert len(voicefiles) == 152 and summary['total_lineas'] == len(load('audio/lineas.json'))
    assert set(rewards) == set(quests)
    for page, body in pages.items():
        for target in re.findall(re.escape(WIKI) + r'([A-Za-z0-9_-]+)', body):
            if target not in pages:
                raise ValueError(f'Enlace interno sin destino: {page} → {target}')
        for forbidden in ['sb_secret_', 'service_role', 'Lo que les cae pesado', 'Los recuerdos (de verdad)']:
            if forbidden in body:
                raise ValueError(f'Contenido excluido en {page}: {forbidden}')
    for page, body in pages.items():
        (out / (page + '.md')).write_text(body)
    for origin, destination in downloads.items():
        target = out / destination
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes((ROOT / origin).read_bytes())
    manifest = {'revision_juegos': rev, 'revision_show': show, 'paginas': len(pages), 'npc': len(roster), 'figuras': len(figures), 'misiones': len(quests), 'relaciones': len(relations), 'guiones_por_voz': len(voicefiles), 'lineas': summary['total_lineas'], 'sha256': {p: hashlib.sha256(b.encode()).hexdigest() for p, b in sorted(pages.items())}}
    (out / 'exportacion.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({k: v for k, v in manifest.items() if k != 'sha256'}, ensure_ascii=False))


if __name__ == '__main__':
    main()

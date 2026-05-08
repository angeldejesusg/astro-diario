const RAILWAY_URL = 'https://web-production-93aa1.up.railway.app';

// ── Base de conocimiento astrológico ─────────────────
const SIGNOS = {
  'Aries':       { elemento:'Fuego',  modalidad:'Cardinal', keywords:'iniciativa, impulsividad, liderazgo, pionero', sombra:'agresividad, egocentrismo, no termina lo que empieza' },
  'Tauro':       { elemento:'Tierra', modalidad:'Fijo',     keywords:'estabilidad, sensualidad, perseverancia, lealtad', sombra:'terquedad, resistencia al cambio, posesividad' },
  'Geminis':     { elemento:'Aire',   modalidad:'Mutable',  keywords:'comunicacion, curiosidad, versatilidad, adaptabilidad', sombra:'dispersion, inconsistencia, ansiedad mental' },
  'Cancer':      { elemento:'Agua',   modalidad:'Cardinal', keywords:'sensibilidad, proteccion, memoria, intuicion emocional', sombra:'manipulacion emocional, victimismo, dependencia' },
  'Leo':         { elemento:'Fuego',  modalidad:'Fijo',     keywords:'creatividad, liderazgo, generosidad, expresion personal', sombra:'arrogancia, necesidad de validacion, dramatismo' },
  'Virgo':       { elemento:'Tierra', modalidad:'Mutable',  keywords:'analisis, servicio, perfeccionismo, discriminacion', sombra:'hipercritica, ansiedad, dificultad para soltar control' },
  'Libra':       { elemento:'Aire',   modalidad:'Cardinal', keywords:'armonia, justicia, diplomacia, relaciones', sombra:'complacencia, evitar conflictos, dependencia del otro' },
  'Escorpio':    { elemento:'Agua',   modalidad:'Fijo',     keywords:'transformacion, intensidad, poder, profundidad psicologica', sombra:'control, celos, venganza, dificultad para confiar' },
  'Sagitario':   { elemento:'Fuego',  modalidad:'Mutable',  keywords:'expansion, filosofia, libertad, optimismo', sombra:'irresponsabilidad, excesos, dogmatismo, huida' },
  'Capricornio': { elemento:'Tierra', modalidad:'Cardinal', keywords:'ambicion, disciplina, responsabilidad, estructura', sombra:'frialdad emocional, workaholic, miedo al fracaso' },
  'Acuario':     { elemento:'Aire',   modalidad:'Fijo',     keywords:'originalidad, humanismo, independencia, innovacion', sombra:'desapego emocional, rebeldia sin causa, frialdad' },
  'Piscis':      { elemento:'Agua',   modalidad:'Mutable',  keywords:'compasion, espiritualidad, creatividad, empatia', sombra:'evasion, confusion, victimismo, adicciones' }
};

const PLANETAS = {
  'Sol':      'identidad, ego, proposito de vida, vitalidad, expresion consciente',
  'Luna':     'emociones, instintos, memoria, necesidades de seguridad, relacion con la madre',
  'Mercurio': 'comunicacion, pensamiento, aprendizaje, lenguaje, logica',
  'Venus':    'amor, estetica, valores, dinero, relaciones intimas, placer',
  'Marte':    'accion, deseo, sexualidad, energia, iniciativa, conflicto',
  'Jupiter':  'expansion, abundancia, filosofia, optimismo, crecimiento, suerte',
  'Saturno':  'limites, responsabilidad, karma, disciplina, miedos, estructura',
  'Urano':    'cambio subito, originalidad, revolucion, tecnologia, liberacion',
  'Neptuno':  'espiritualidad, ilusion, arte, confusion, compasion, idealismo',
  'Pluton':   'transformacion profunda, poder, muerte y renacimiento, sombra psicologica'
};

const CASAS = {
  1:  'apariencia, personalidad proyectada, cuerpo fisico, como nos perciben',
  2:  'dinero, posesiones, valores personales, autoestima material',
  3:  'comunicacion cotidiana, hermanos, viajes cortos, aprendizaje basico',
  4:  'raices, familia, hogar, base emocional, vida privada',
  5:  'expresion creativa, romance, hijos, juego, placer, identidad autentica',
  6:  'salud, trabajo cotidiano, rutinas, servicio, habitos',
  7:  'pareja, socios, contratos, lo que proyectamos en el otro',
  8:  'muerte, sexualidad, dinero ajeno, herencias, psicologia profunda',
  9:  'filosofia, religion, viajes largos, educacion superior, busqueda de sentido',
  10: 'vocacion, reputacion publica, autoridad, exito profesional, legado',
  11: 'amigos, grupos, ideales, objetivos a largo plazo, redes',
  12: 'inconsciente, karma, limitaciones ocultas, espiritualidad, soledad'
};

const ASPECTOS_SIGNIF = {
  'Conjuncion':  'fusion intensa: ambas energias actuan como una sola fuerza, pueden amplificarse o bloquearse',
  'Sextil':      'oportunidad fluida que requiere accion consciente para activarse',
  'Cuadratura':  'tension que genera crecimiento a traves del conflicto interno entre dos necesidades opuestas',
  'Trigono':     'flujo natural y armonico, don que viene sin esfuerzo — riesgo de darlo por sentado',
  'Oposicion':   'polaridad que busca equilibrio — lo que no se integra internamente se proyecta en los demas',
  'Quincuncio':  'ajuste incomodo entre energias que no se comprenden, requiere adaptacion constante'
};

function getHouseNum(absPos, houses) {
  if (!houses || houses.length < 12) return null;
  for (let i = 0; i < 12; i++) {
    const next = (i + 1) % 12;
    let c1 = houses[i].absolute;
    let c2 = houses[next].absolute;
    if (c2 < c1) c2 += 360;
    let pos = absPos < c1 ? absPos + 360 : absPos;
    if (pos >= c1 && pos < c2) return houses[i].house;
  }
  return null;
}

function normalizeSign(sign) {
  const map = { 'Geminis': 'Geminis', 'Gemini': 'Geminis', 'Cancer': 'Cancer', 'Pluton': 'Pluton', 'Plutón': 'Pluton', 'Júpiter': 'Jupiter', 'Jupiter': 'Jupiter' };
  return map[sign] || sign;
}

function buildKnowledge(natal) {
  if (!natal || !natal.planets) return '';
  const p = natal.planets;
  const houses = natal.houses || [];
  const aspects = natal.aspects || [];
  let block = '\n\nCONOCIMIENTO ASTROLOGICO PARA INTERPRETAR ESTA CARTA:\n';

  // Signos clave
  const signosVistos = {};
  ['Sol','Luna'].forEach(function(name) {
    if (p[name]) signosVistos[p[name].sign] = true;
  });
  if (natal.ascendant) signosVistos[natal.ascendant.sign] = true;

  block += '\nSignos clave:\n';
  Object.keys(signosVistos).forEach(function(sign) {
    const s = SIGNOS[normalizeSign(sign)];
    if (s) block += '  ' + sign + ' (' + s.elemento + ', ' + s.modalidad + '): ' + s.keywords + '. Sombra: ' + s.sombra + '\n';
  });

  // Planetas en signo y casa
  block += '\nPlanetas:\n';
  Object.entries(p).forEach(function(entry) {
    const name = entry[0], data = entry[1];
    const area = PLANETAS[name] || PLANETAS[name.replace('ú','u').replace('ó','o')];
    if (!area) return;
    const hNum = getHouseNum(data.absolute, houses);
    const hTxt = hNum && CASAS[hNum] ? ' | Casa ' + hNum + ': ' + CASAS[hNum] : '';
    const s = SIGNOS[normalizeSign(data.sign)];
    const sTxt = s ? ' | ' + data.sign + ' (' + s.elemento + '): ' + s.keywords : '';
    block += '  ' + name + ': ' + area + sTxt + hTxt + '\n';
  });

  // Aspectos
  const relAspects = aspects.filter(function(a) {
    return ['Sol','Luna','Mercurio','Venus','Marte'].includes(a.planet1);
  }).slice(0, 10);

  if (relAspects.length > 0) {
    block += '\nAspectos y su significado psicologico:\n';
    relAspects.forEach(function(a) {
      const aspKey = a.aspect.replace('ó','o').replace('ú','u').replace('é','e').replace('á','a');
      const signif = ASPECTOS_SIGNIF[aspKey] || ASPECTOS_SIGNIF[a.aspect];
      if (signif) block += '  ' + a.planet1 + ' ' + a.aspect + ' ' + a.planet2 + ': ' + signif + '\n';
    });
  }

  return block;
}

// ── Helpers ───────────────────────────────────────────
function getHouseInPrompt(absPos, houses) {
  const h = getHouseNum(absPos, houses);
  return h ? ' en Casa ' + h : '';
}

function buildPrompt(nombre, enfoque, moon, today, natal, transits) {
  const hasNatal = natal && natal.planets;
  const p = hasNatal ? natal.planets : {};
  const houses = hasNatal ? natal.houses : [];

  const fmt = function(planet) {
    if (!p[planet]) return 'desconocido';
    return p[planet].degree.toFixed(1) + 'o ' + p[planet].sign + getHouseInPrompt(p[planet].absolute, houses) + (p[planet].retrograde ? ' (Rx)' : '');
  };

  const sol  = fmt('Sol');
  const luna = fmt('Luna');
  const asc  = natal && natal.ascendant ? natal.ascendant.degree.toFixed(1) + 'o ' + natal.ascendant.sign : 'desconocido';
  const mc   = natal && natal.mc ? natal.mc.degree.toFixed(1) + 'o ' + natal.mc.sign : 'desconocido';

  let planetLines = '';
  if (hasNatal) {
    planetLines = Object.entries(p).map(function(entry) {
      const name = entry[0], d = entry[1];
      return '  - ' + name + ': ' + d.degree.toFixed(1) + 'o ' + d.sign + getHouseInPrompt(d.absolute, houses) + (d.retrograde ? ' (Rx)' : '');
    }).join('\n');
  }

  let tensosLines = '  (ninguno significativo)';
  let armonicosLines = '  (ninguno significativo)';
  if (hasNatal && natal.aspects && natal.aspects.length > 0) {
    const relevant = natal.aspects.filter(function(a) {
      return ['Sol','Luna','Mercurio','Venus','Marte','Jupiter','Saturno','Júpiter'].includes(a.planet1);
    });
    const tensos = relevant.filter(function(a) { return a.nature === 'tenso'; }).slice(0, 5)
      .map(function(a) { return '  - ' + a.planet1 + ' ' + a.aspect + ' ' + a.planet2 + ' (orbe ' + a.orb.toFixed(1) + 'o)'; }).join('\n');
    const armonicos = relevant.filter(function(a) { return a.nature === 'armonico' || a.nature === 'arm\u00f3nico'; }).slice(0, 5)
      .map(function(a) { return '  - ' + a.planet1 + ' ' + a.aspect + ' ' + a.planet2 + ' (orbe ' + a.orb.toFixed(1) + 'o)'; }).join('\n');
    if (tensos) tensosLines = tensos;
    if (armonicos) armonicosLines = armonicos;
  }

  let transitLines = '';
  let transitAspectLines = '  (ninguno significativo)';
  if (transits && transits.planets) {
    transitLines = Object.entries(transits.planets)
      .filter(function(e) { return ['Sol','Luna','Mercurio','Venus','Marte','Jupiter','Saturno','Júpiter'].includes(e[0]); })
      .map(function(e) { return '  - ' + e[0] + ': ' + e[1].degree.toFixed(1) + 'o ' + e[1].sign + (e[1].retrograde ? ' (Rx)' : ''); })
      .join('\n');
  }
  if (transits && transits.transit_aspects && transits.transit_aspects.length > 0) {
    transitAspectLines = transits.transit_aspects.slice(0, 6)
      .map(function(a) { return '  - ' + a.transit_planet + ' ' + a.aspect + ' natal ' + a.natal_planet + ' (orbe ' + a.orb.toFixed(1) + 'o, ' + a.nature + ')'; })
      .join('\n');
  }

  const knowledge = hasNatal ? buildKnowledge(natal) : '';

  let natalBlock = '';
  if (hasNatal) {
    natalBlock = '\n\nCARTA NATAL (Swiss Ephemeris - datos precisos)\n' +
      '  - Sol:         ' + sol + '\n' +
      '  - Luna:        ' + luna + '\n' +
      '  - Ascendente:  ' + asc + '\n' +
      '  - Medio Cielo: ' + mc + '\n\n' +
      'Planetas con casa:\n' + planetLines + '\n\n' +
      'Aspectos de tension:\n' + tensosLines + '\n\n' +
      'Aspectos armonicos:\n' + armonicosLines +
      knowledge;
  }

  let transitBlock = '';
  if (transitLines) {
    transitBlock = '\n\nTRANSITOS HOY - ' + today + ' - ' + moon.n + ' ' + moon.e + '\n' +
      'Posiciones actuales:\n' + transitLines + '\n\n' +
      'Aspectos activos hoy:\n' + transitAspectLines;
  }

  const venusPos = (p.Venus) ? p.Venus.degree.toFixed(1) + 'o ' + p.Venus.sign : 'su signo';
  const martePos = (p.Marte) ? p.Marte.degree.toFixed(1) + 'o ' + p.Marte.sign : 'su signo';

  const enfoquesSecciones = {
    'General': [
      '### Personalidad central\nBasado en Sol en ' + sol + ' y Ascendente en ' + asc + '. Cual es el motor interno de ' + nombre + '? Como lo ve el mundo vs como se ve a si mismo?',
      '### Conflictos internos\nBasado en los aspectos de tension. Que batallas internas tiene ' + nombre + '? Que le cuesta integrar?',
      '### Patrones en relaciones\nBasado en Venus en ' + venusPos + ', Marte en ' + martePos + ' y Luna. Que busca ' + nombre + ' en los vinculos?',
      '### Fortalezas\nBasado en aspectos armonicos. Donde tiene talento natural ' + nombre + '?',
      '### Hoy\nEl transito mas relevante hoy y su impacto concreto para ' + nombre + '. Un consejo accionable.'
    ],
    'Trabajo': [
      '### Vocacion y proposito\nBasado en Medio Cielo en ' + mc + ' y Casa 10. Cual es la vocacion autentica de ' + nombre + '?',
      '### Estilo de trabajo\nBasado en Mercurio y Marte en ' + martePos + '. Como procesa, decide y ejecuta ' + nombre + '?',
      '### Bloqueos profesionales\nBasado en aspectos de tension que afectan Casa 6 y Casa 10. Que patrones sabotean su carrera?',
      '### Talento diferenciador\nBasado en aspectos armonicos. Que habilidad puede convertir en ventaja profesional ' + nombre + '?',
      '### Hoy en el trabajo\nEl transito mas relevante hoy para decisiones o relaciones laborales. Un consejo concreto.'
    ],
    'Relaciones': [
      '### Estilo afectivo\nBasado en Venus en ' + venusPos + ' y Luna en ' + luna + '. Como ama ' + nombre + '? Que necesita para sentirse seguro en pareja?',
      '### Patrones repetitivos\nBasado en aspectos de tension de Venus y Luna. Que dinamica tiende a repetir ' + nombre + ' en sus relaciones?',
      '### Lo que provoca sin darse cuenta\nBasado en Marte en ' + martePos + '. Que energia proyecta ' + nombre + ' que atrae ciertos perfiles?',
      '### Su pareja ideal segun la carta\nBasado en Casa 7. Que caracteristicas complementan la carta de ' + nombre + '?',
      '### Hoy en amor\nEl transito mas relevante hoy para la vida amorosa. Un consejo concreto.'
    ],
    'Finanzas': [
      '### Relacion con el dinero\nBasado en Casa 2. Cual es la creencia profunda de ' + nombre + ' sobre el dinero?',
      '### Capacidad de generar riqueza\nBasado en Jupiter y Casa 8. Donde tiene ' + nombre + ' mayor potencial de abundancia?',
      '### Bloqueos financieros\nBasado en aspectos de tension de Casa 2 y Casa 8. Que patrones limitan la prosperidad?',
      '### Estrategia financiera segun la carta\nQue enfoque (ahorro, inversion, emprendimiento) se alinea con la energia de ' + nombre + '?',
      '### Hoy en finanzas\nEl transito mas relevante hoy para decisiones economicas. Una accion concreta.'
    ],
    'Salud': [
      '### Vitalidad natal\nBasado en Sol en ' + sol + ' y Marte. Cual es el nivel de energia base de ' + nombre + '? Como recarga y como se agota?',
      '### Cuerpo y emociones\nBasado en Luna en ' + luna + ' y Casa 6. Como afectan las emociones la salud de ' + nombre + '?',
      '### Habitos que drenan\nQue patrones van contra la naturaleza de la carta de ' + nombre + '?',
      '### Lo que le da energia real\nBasado en aspectos armonicos. Que actividades vitalizan genuinamente a ' + nombre + '?',
      '### Hoy en salud\nEl transito mas relevante hoy para el bienestar. Un habito concreto para hoy.'
    ],
    'Creatividad': [
      '### Naturaleza creativa\nBasado en Casa 5 y Sol en ' + sol + '. Como fluye la creatividad de ' + nombre + '?',
      '### Bloqueos creativos\nQue miedos bloquean la expresion creativa de ' + nombre + '?',
      '### Proyectos que le llenan\nQue tipo de proyectos se alinean con quien es ' + nombre + '?',
      '### Superpoder creativo\nQue combinacion de talentos tiene ' + nombre + ' que pocos tienen?',
      '### Hoy para crear\nEl transito mas relevante hoy para crear o avanzar. Un paso concreto.'
    ],
    'Redes': [
      '### Voz autentica\nBasado en Mercurio, Sol en ' + sol + ' y Ascendente en ' + asc + '. Cual es el estilo comunicativo natural de ' + nombre + '?',
      '### Contenido que le sale solo\nSobre que temas o formatos ' + nombre + ' tiene autoridad o pasion genuina?',
      '### Bloqueos para publicar\nQue miedos le frenan a mostrarse publicamente?',
      '### Estrategia segun la carta\nQue enfoque de contenido se alinea con la energia de ' + nombre + '?',
      '### Hoy para comunicar\nEl transito mas relevante hoy para publicar o conectar. Un mensaje concreto.'
    ]
  };

  let enfoqueKey = 'General';
  if (enfoque.indexOf('Trabajo') !== -1) enfoqueKey = 'Trabajo';
  else if (enfoque.indexOf('Relacion') !== -1 || enfoque.indexOf('amor') !== -1) enfoqueKey = 'Relaciones';
  else if (enfoque.indexOf('Finanz') !== -1 || enfoque.indexOf('dinero') !== -1) enfoqueKey = 'Finanzas';
  else if (enfoque.indexOf('Salud') !== -1) enfoqueKey = 'Salud';
  else if (enfoque.indexOf('Creativ') !== -1) enfoqueKey = 'Creatividad';
  else if (enfoque.indexOf('Redes') !== -1 || enfoque.indexOf('comunicac') !== -1) enfoqueKey = 'Redes';

  const secciones = enfoquesSecciones[enfoqueKey];

  return 'Eres un astrologo con formacion en psicologia analitica. Tu analisis es preciso, directo y nunca generico.\n' +
    'Consultante: ' + nombre + '\n' +
    'Fecha: ' + today + '\n' +
    'Enfoque: ' + enfoque + '\n' +
    natalBlock + transitBlock + '\n\n' +
    'REGLAS ESTRICTAS:\n' +
    '- USA los datos exactos y el conocimiento astrologico provisto. No inventes interpretaciones.\n' +
    '- NO uses frases vacias: "los astros te invitan", "el universo conspira", "energia cosmica".\n' +
    '- Escribe como un psicologo que domina astrologia — lenguaje humano y directo.\n' +
    '- Cada seccion debe mencionar al menos un planeta, signo o aspecto especifico.\n' +
    '- Responde siempre en espanol.\n' +
    '- Maximo 600 palabras. No cortes ninguna seccion a la mitad.\n\n' +
    'Escribe el analisis de ' + nombre + ' con estas secciones (usa ### para cada titulo):\n\n' +
    secciones.join('\n\n') + '\n\n' +
    '### Frase del dia\n' +
    'Una frase corta y directa para ' + nombre + ' enfocada en ' + enfoque + '. Sin metaforas cosmicas.';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.OPENROUTER_KEY;
  if (!key) return res.status(500).json({ error: 'API key not configured' });

  const { nombre, enfoque, moon, today, birthData } = req.body;

  try {
    let natal = null;
    let transits = null;

    if (birthData && birthData.lat && birthData.lon) {
      try {
        const natalRes = await fetch(RAILWAY_URL + '/natal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(birthData)
        });
        natal = await natalRes.json();

        const transitsRes = await fetch(RAILWAY_URL + '/transits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ natal: { planets: natal.planets } })
        });
        transits = await transitsRes.json();
      } catch (e) {
        console.error('Railway error:', e.message);
      }
    }

    const prompt = buildPrompt(nombre, enfoque, moon, today, natal, transits);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
        'HTTP-Referer': 'https://astro-diario.vercel.app',
        'X-Title': 'Astro Diario'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1-0528:free',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500
      })
    });

    const data = await response.json();
    if (data.choices) data._natal = natal;
    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

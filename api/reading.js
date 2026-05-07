import { buildKnowledgeBlock } from ‘./astro-knowledge.js’;
const RAILWAY_URL = ‘https://web-production-93aa1.up.railway.app’;

function getHouse(absPos, houses) {
if (!houses || houses.length < 12) return ‘’;
for (let i = 0; i < 12; i++) {
const next = (i + 1) % 12;
let c1 = houses[i].absolute;
let c2 = houses[next].absolute;
if (c2 < c1) c2 += 360;
let pos = absPos < c1 ? absPos + 360 : absPos;
if (pos >= c1 && pos < c2) return ’ en Casa ’ + houses[i].house;
}
return ‘’;
}

function buildPrompt(nombre, enfoque, moon, today, natal, transits) {
const hasNatal = natal && natal.planets;
const p = hasNatal ? natal.planets : {};
const houses = hasNatal ? natal.houses : [];

const fmt = (planet) => {
if (!p[planet]) return ‘desconocido’;
return p[planet].degree.toFixed(1) + ‘o ’ + p[planet].sign + getHouse(p[planet].absolute, houses) + (p[planet].retrograde ? ’ (Rx)’ : ‘’);
};

const sol  = fmt(‘Sol’);
const luna = fmt(‘Luna’);
const asc  = natal && natal.ascendant ? natal.ascendant.degree.toFixed(1) + ’o ’ + natal.ascendant.sign : ‘desconocido’;
const mc   = natal && natal.mc ? natal.mc.degree.toFixed(1) + ’o ’ + natal.mc.sign : ‘desconocido’;

let planetLines = ‘’;
if (hasNatal) {
planetLines = Object.entries(p).map(([name, d]) =>
’  - ’ + name + ‘: ’ + d.degree.toFixed(1) + ‘o ’ + d.sign + getHouse(d.absolute, houses) + (d.retrograde ? ’ (Rx)’ : ‘’)
).join(’\n’);
}

let tensosLines = ‘’;
let armonicosLines = ‘’;
if (hasNatal && natal.aspects && natal.aspects.length > 0) {
const relevant = natal.aspects.filter(a =>
[‘Sol’,‘Luna’,‘Mercurio’,‘Venus’,‘Marte’,‘Jupiter’,‘Saturno’].includes(a.planet1) ||
[‘Sol’,‘Luna’,‘Mercurio’,‘Venus’,‘Marte’,‘Júpiter’,‘Saturno’].includes(a.planet1)
);
tensosLines = relevant
.filter(a => a.nature === ‘tenso’)
.slice(0, 5)
.map(a => ’  - ’ + a.planet1 + ’ ’ + a.aspect + ’ ’ + a.planet2 + ’ (orbe ’ + a.orb.toFixed(1) + ‘o)’)
.join(’\n’) || ’  (ninguno significativo)’;
armonicosLines = relevant
.filter(a => a.nature === ‘armonico’ || a.nature === ‘armónico’)
.slice(0, 5)
.map(a => ’  - ’ + a.planet1 + ’ ’ + a.aspect + ’ ’ + a.planet2 + ’ (orbe ’ + a.orb.toFixed(1) + ‘o)’)
.join(’\n’) || ’  (ninguno significativo)’;
}

let transitLines = ‘’;
let transitAspectLines = ‘’;
if (transits && transits.planets) {
transitLines = Object.entries(transits.planets)
.filter(([n]) => [‘Sol’,‘Luna’,‘Mercurio’,‘Venus’,‘Marte’,‘Júpiter’,‘Saturno’].includes(n))
.map(([name, d]) => ’  - ’ + name + ‘: ’ + d.degree.toFixed(1) + ‘o ’ + d.sign + (d.retrograde ? ’ (Rx)’ : ‘’))
.join(’\n’);
}
if (transits && transits.transit_aspects && transits.transit_aspects.length > 0) {
transitAspectLines = transits.transit_aspects
.slice(0, 6)
.map(a => ’  - ’ + a.transit_planet + ’ ’ + a.aspect + ’ natal ’ + a.natal_planet + ’ (orbe ’ + a.orb.toFixed(1) + ‘o, ’ + a.nature + ‘)’)
.join(’\n’) || ’  (ninguno significativo)’;
}

let natalBlock = ‘’;
if (hasNatal) {
const knowledge = natal.knowledge || ‘’;
natalBlock = ‘\n\nCARTA NATAL (Swiss Ephemeris - datos precisos)\n’ +
’  - Sol:         ’ + sol + ‘\n’ +
’  - Luna:        ’ + luna + ‘\n’ +
’  - Ascendente:  ’ + asc + ‘\n’ +
’  - Medio Cielo: ’ + mc + ‘\n\n’ +
‘Todos los planetas con casa:\n’ + planetLines + ‘\n\n’ +
‘Aspectos de tension (conflictos internos):\n’ + tensosLines + ‘\n\n’ +
‘Aspectos armonicos (fortalezas):\n’ + armonicosLines +
(knowledge ? ‘\n\n’ + knowledge : ‘’);
}

let transitBlock = ‘’;
if (transitLines) {
transitBlock = ‘\n\nTRANSITOS HOY - ’ + today + ’ - ’ + moon.n + ’ ’ + moon.e + ‘\n’ +
‘Posiciones actuales:\n’ + transitLines + ‘\n\n’ +
‘Aspectos activos hoy (transito a natal):\n’ + (transitAspectLines || ’  (ninguno significativo)’);
}

// Secciones dinamicas por enfoque
var venusPos = (natal && natal.planets && natal.planets.Venus) ? natal.planets.Venus.degree.toFixed(1) + ’o ’ + natal.planets.Venus.sign : ‘su signo’;
var martePos = (natal && natal.planets && natal.planets.Marte) ? natal.planets.Marte.degree.toFixed(1) + ’o ’ + natal.planets.Marte.sign : ‘su signo’;

var enfoquesSecciones = {
‘General’: [
’### Personalidad central\nBasado en Sol en ’ + sol + ’ y Ascendente en ’ + asc + ’. Cual es el motor interno de ’ + nombre + ‘? Como lo ve el mundo vs como se ve a si mismo?’,
’### Conflictos internos\nBasado en los aspectos de tension de la carta. Que batallas internas tiene ’ + nombre + ‘? Que le cuesta integrar?’,
’### Patrones en relaciones\nBasado en Venus en ’ + venusPos + ‘, Marte en ’ + martePos + ’ y Luna. Que busca ’ + nombre + ’ en los vinculos?’,
’### Fortalezas\nBasado en aspectos armonicos. Donde tiene talento natural ’ + nombre + ‘?’,
’### Hoy\nEl transito mas relevante hoy y su impacto concreto para ’ + nombre + ‘. Un consejo accionable.’
],
‘Trabajo’: [
’### Vocacion y proposito\nBasado en Medio Cielo en ’ + mc + ’ y Casa 10. Cual es la vocacion autentica de ’ + nombre + ‘?’,
’### Estilo de trabajo\nBasado en Mercurio y Marte en ’ + martePos + ’. Como procesa, decide y ejecuta ’ + nombre + ‘?’,
‘### Bloqueos profesionales\nBasado en aspectos de tension que afectan Casa 6 y Casa 10. Que patrones sabotean su carrera?’,
’### Talento diferenciador\nBasado en aspectos armonicos. Que habilidad natural puede convertir en ventaja profesional ’ + nombre + ‘?’,
‘### Hoy en el trabajo\nEl transito mas relevante hoy para decisiones o relaciones laborales. Un consejo concreto.’
],
‘Relaciones’: [
’### Estilo afectivo\nBasado en Venus en ’ + venusPos + ’ y Luna en ’ + luna + ’. Como ama ’ + nombre + ‘? Que necesita para sentirse seguro en pareja?’,
‘### Patrones repetitivos\nBasado en aspectos de tension de Venus y Luna. Que dinamica tiende a repetir ’ + nombre + ’ en sus relaciones?’,
’### Lo que provoca sin darse cuenta\nBasado en Marte en ’ + martePos + ‘. Que energia proyecta ’ + nombre + ’ que atrae ciertos perfiles?’,
’### Su pareja ideal segun la carta\nBasado en Casa 7 y su regente. Que caracteristicas complementan la carta de ’ + nombre + ‘?’,
‘### Hoy en amor\nEl transito mas relevante hoy para la vida amorosa. Un consejo concreto para conectar o sanar.’
],
‘Finanzas’: [
‘### Relacion con el dinero\nBasado en Casa 2 y su regente. Cual es la creencia profunda de ’ + nombre + ’ sobre el dinero?’,
‘### Capacidad de generar riqueza\nBasado en Jupiter y Casa 8. Donde tiene ’ + nombre + ’ mayor potencial de abundancia?’,
’### Bloqueos financieros\nBasado en aspectos de tension de Casa 2 y Casa 8. Que patrones limitan la prosperidad de ’ + nombre + ‘?’,
’### Estrategia financiera segun la carta\nQue enfoque (ahorro, inversion, emprendimiento) se alinea con la energia de ’ + nombre + ‘?’,
‘### Hoy en finanzas\nEl transito mas relevante hoy para decisiones economicas. Una accion concreta recomendada.’
],
‘Salud’: [
’### Vitalidad natal\nBasado en Sol en ’ + sol + ’, Marte y Casa 1. Cual es el nivel de energia base de ’ + nombre + ‘? Como recarga y como se agota?’,
’### Cuerpo y emociones\nBasado en Luna en ’ + luna + ’ y Casa 6. Como afectan las emociones la salud de ’ + nombre + ‘?’,
’### Habitos que drenan\nBasado en aspectos de tension. Que patrones van contra la naturaleza de la carta de ’ + nombre + ‘?’,
’### Lo que le da energia real\nBasado en aspectos armonicos. Que actividades o ritmos vitalizan genuinamente a ’ + nombre + ‘?’,
‘### Hoy en salud\nEl transito mas relevante hoy para el bienestar. Un habito o practica concreta para hoy.’
],
‘Creatividad’: [
’### Naturaleza creativa\nBasado en Casa 5, Sol en ’ + sol + ’ y Venus. Como fluye la creatividad de ’ + nombre + ‘?’,
’### Bloqueos creativos\nBasado en aspectos de tension. Que miedos bloquean la expresion creativa de ’ + nombre + ‘?’,
’### Proyectos que le llenan\nQue tipo de proyectos (artisticos, tecnicos, humanos) se alinean con quien es ’ + nombre + ‘?’,
‘### Superpoder creativo\nQue combinacion de talentos tiene ’ + nombre + ’ que pocos tienen?’,
‘### Hoy para crear\nEl transito mas relevante hoy para crear o avanzar. Un paso concreto.’
],
‘Redes’: [
’### Voz autentica\nBasado en Mercurio, Sol en ’ + sol + ’ y Ascendente en ’ + asc + ’. Cual es el estilo comunicativo natural de ’ + nombre + ‘?’,
‘### Contenido que le sale solo\nSobre que temas o formatos ’ + nombre + ’ tiene autoridad natural o pasion genuina?’,
‘### Bloqueos para publicar\nBasado en aspectos de tension de Mercurio y Casa 3. Que miedos le frenan a mostrarse publicamente?’,
’### Estrategia segun la carta\nQue enfoque de contenido (educativo, emocional, provocador) se alinea con la energia de ’ + nombre + ‘?’,
‘### Hoy para comunicar\nEl transito mas relevante hoy para publicar o conectar. Un tipo de mensaje concreto para hoy.’
]
};

// Match enfoque to key
var enfoqueKey = ‘General’;
if (enfoque.indexOf(‘Trabajo’) !== -1) enfoqueKey = ‘Trabajo’;
else if (enfoque.indexOf(‘Relacion’) !== -1 || enfoque.indexOf(‘amor’) !== -1) enfoqueKey = ‘Relaciones’;
else if (enfoque.indexOf(‘Finanz’) !== -1 || enfoque.indexOf(‘dinero’) !== -1) enfoqueKey = ‘Finanzas’;
else if (enfoque.indexOf(‘Salud’) !== -1) enfoqueKey = ‘Salud’;
else if (enfoque.indexOf(‘Creativ’) !== -1) enfoqueKey = ‘Creatividad’;
else if (enfoque.indexOf(‘Redes’) !== -1 || enfoque.indexOf(‘comunicac’) !== -1) enfoqueKey = ‘Redes’;

var secciones = enfoquesSecciones[enfoqueKey];

return ‘Eres un astrologo con formacion en psicologia analitica. Tu analisis es preciso, directo y nunca generico.\n’ +
’Consultante: ’ + nombre + ‘\n’ +
‘Fecha: ’ + today + ‘\n’ +
‘Enfoque: ’ + enfoque + ‘\n’ +
natalBlock + transitBlock + ‘\n\n’ +
‘REGLAS ESTRICTAS\n’ +
‘- USA los datos exactos de la carta. Menciona signos, grados y casas reales.\n’ +
‘- NO uses frases vacias: “los astros te invitan”, “el universo conspira”, “energia cosmica”.\n’ +
‘- Escribe como un psicologo que domina astrologia, lenguaje humano y directo.\n’ +
‘- Cada seccion debe incluir al menos un dato especifico de la carta.\n’ +
‘- Responde siempre en espanol.\n’ +
‘- Maximo 600 palabras. No cortes ninguna seccion a la mitad.\n\n’ +
‘Escribe el analisis de ’ + nombre + ’ con estas secciones exactas (usa ### para cada titulo):\n\n’ +
secciones.join(’\n\n’) + ‘\n\n’ +
‘### Frase del dia\n’ +
’Una frase corta y directa para ’ + nombre + ’ enfocada en ’ + enfoque + ‘. Sin metaforas cosmicas.’;
}

export default async function handler(req, res) {
if (req.method !== ‘POST’) return res.status(405).json({ error: ‘Method not allowed’ });

const key = process.env.OPENROUTER_KEY;
if (!key) return res.status(500).json({ error: ‘API key not configured’ });

const { nombre, enfoque, moon, today, birthData } = req.body;

try {
let natal = null;
let transits = null;

```
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
    model: 'openrouter/auto',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500
  })
});

const data = await response.json();
if (data.choices) data._natal = natal;
return res.status(response.status).json(data);
```

} catch (err) {
return res.status(500).json({ error: err.message });
}
}

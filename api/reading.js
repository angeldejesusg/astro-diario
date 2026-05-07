const RAILWAY_URL = 'https://web-production-93aa1.up.railway.app';

function getHouse(absPos, houses) {
  if (!houses || houses.length < 12) return '';
  for (let i = 0; i < 12; i++) {
    const next = (i + 1) % 12;
    let c1 = houses[i].absolute;
    let c2 = houses[next].absolute;
    if (c2 < c1) c2 += 360;
    let pos = absPos < c1 ? absPos + 360 : absPos;
    if (pos >= c1 && pos < c2) return ' en Casa ' + houses[i].house;
  }
  return '';
}

function buildPrompt(nombre, enfoque, moon, today, natal, transits) {
  const hasNatal = natal && natal.planets;
  const p = hasNatal ? natal.planets : {};
  const houses = hasNatal ? natal.houses : [];

  const fmt = (planet) => {
    if (!p[planet]) return 'desconocido';
    return p[planet].degree.toFixed(1) + 'o ' + p[planet].sign + getHouse(p[planet].absolute, houses) + (p[planet].retrograde ? ' (Rx)' : '');
  };

  const sol  = fmt('Sol');
  const luna = fmt('Luna');
  const asc  = natal && natal.ascendant ? natal.ascendant.degree.toFixed(1) + 'o ' + natal.ascendant.sign : 'desconocido';
  const mc   = natal && natal.mc ? natal.mc.degree.toFixed(1) + 'o ' + natal.mc.sign : 'desconocido';

  let planetLines = '';
  if (hasNatal) {
    planetLines = Object.entries(p).map(([name, d]) =>
      '  - ' + name + ': ' + d.degree.toFixed(1) + 'o ' + d.sign + getHouse(d.absolute, houses) + (d.retrograde ? ' (Rx)' : '')
    ).join('\n');
  }

  let tensosLines = '';
  let armonicosLines = '';
  if (hasNatal && natal.aspects && natal.aspects.length > 0) {
    const relevant = natal.aspects.filter(a =>
      ['Sol','Luna','Mercurio','Venus','Marte','Jupiter','Saturno'].includes(a.planet1) ||
      ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(a.planet1)
    );
    tensosLines = relevant
      .filter(a => a.nature === 'tenso')
      .slice(0, 5)
      .map(a => '  - ' + a.planet1 + ' ' + a.aspect + ' ' + a.planet2 + ' (orbe ' + a.orb.toFixed(1) + 'o)')
      .join('\n') || '  (ninguno significativo)';
    armonicosLines = relevant
      .filter(a => a.nature === 'armonico' || a.nature === 'armónico')
      .slice(0, 5)
      .map(a => '  - ' + a.planet1 + ' ' + a.aspect + ' ' + a.planet2 + ' (orbe ' + a.orb.toFixed(1) + 'o)')
      .join('\n') || '  (ninguno significativo)';
  }

  let transitLines = '';
  let transitAspectLines = '';
  if (transits && transits.planets) {
    transitLines = Object.entries(transits.planets)
      .filter(([n]) => ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(n))
      .map(([name, d]) => '  - ' + name + ': ' + d.degree.toFixed(1) + 'o ' + d.sign + (d.retrograde ? ' (Rx)' : ''))
      .join('\n');
  }
  if (transits && transits.transit_aspects && transits.transit_aspects.length > 0) {
    transitAspectLines = transits.transit_aspects
      .slice(0, 6)
      .map(a => '  - ' + a.transit_planet + ' ' + a.aspect + ' natal ' + a.natal_planet + ' (orbe ' + a.orb.toFixed(1) + 'o, ' + a.nature + ')')
      .join('\n') || '  (ninguno significativo)';
  }

  let natalBlock = '';
  if (hasNatal) {
    natalBlock = '\n\nCARTA NATAL (Swiss Ephemeris - datos precisos)\n' +
      '  - Sol:         ' + sol + '\n' +
      '  - Luna:        ' + luna + '\n' +
      '  - Ascendente:  ' + asc + '\n' +
      '  - Medio Cielo: ' + mc + '\n\n' +
      'Todos los planetas con casa:\n' + planetLines + '\n\n' +
      'Aspectos de tension (conflictos internos):\n' + tensosLines + '\n\n' +
      'Aspectos armonicos (fortalezas):\n' + armonicosLines;
  }

  let transitBlock = '';
  if (transitLines) {
    transitBlock = '\n\nTRANSITOS HOY - ' + today + ' - ' + moon.n + ' ' + moon.e + '\n' +
      'Posiciones actuales:\n' + transitLines + '\n\n' +
      'Aspectos activos hoy (transito a natal):\n' + (transitAspectLines || '  (ninguno significativo)');
  }

  return 'Eres un astrologo con formacion en psicologia analitica. Tu analisis es preciso, directo y nunca generico.\n' +
    'Consultante: ' + nombre + '\n' +
    'Fecha: ' + today + '\n' +
    'Enfoque solicitado: ' + enfoque + '\n' +
    natalBlock + transitBlock + '\n\n' +
    'REGLAS ESTRICTAS\n' +
    '- USA los datos exactos de la carta. Menciona signos, grados y casas reales.\n' +
    '- NO uses frases vacias: "los astros te invitan", "el universo conspira", "energia cosmica".\n' +
    '- Escribe como un psicologo que domina astrologia, lenguaje humano y directo.\n' +
    '- Cada seccion debe tener al menos un dato especifico de la carta.\n' +
    '- Responde en español.\n' +
    '- Maximo 500 palabras en total.\n\n' +
    'Analiza la carta de ' + nombre + ' con estas secciones (usa ### para cada titulo):\n\n' +
    '### Personalidad central\n' +
    'Basado en Sol, Luna y Ascendente con sus casas. Cual es el motor interno de ' + nombre + '? Como lo ve el mundo vs como se ve a si mismo?\n\n' +
    '### Conflictos internos\n' +
    'Basado en los aspectos de tension. Que batallas internas tiene ' + nombre + '? Que le cuesta integrar?\n\n' +
    '### Patrones en relaciones\n' +
    'Basado en Venus, Marte, Luna y sus aspectos. Que busca en los vinculos? Que provoca sin darse cuenta?\n\n' +
    '### Fortalezas\n' +
    'Basado en aspectos armonicos y planetas bien ubicados. Donde tiene talento natural?\n\n' +
    '### Riesgos\n' +
    'Cuales son los patrones que pueden limitarle si no los trabaja?\n\n' +
    '### Hoy - ' + enfoque + '\n' +
    'El transito mas relevante hoy para ' + nombre + ' y su impacto concreto. Un solo consejo accionable para las proximas 24 horas.\n\n' +
    '### Frase del dia\n' +
    'Una frase corta, directa y personalizada para ' + nombre + '. Sin metaforas cosmicas.';
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
        model: 'openrouter/auto',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (data.choices) data._natal = natal;
    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

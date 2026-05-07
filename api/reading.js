const RAILWAY_URL = 'https://web-production-93aa1.up.railway.app';

function buildPrompt(nombre, enfoque, moon, today, natal, transits) {
  const hasNatal = natal && natal.planets;

  let sol = 'desconocido', luna = 'desconocida', asc = 'desconocido', mc = 'desconocido';
  let planetLines = '', aspectLines = '', transitLines = '', transitAspectLines = '';
  let tensosLines = '', armonicosLines = '';

  if (hasNatal) {
    const p = natal.planets;

    // Helper: find house for a planet
    const getHouse = (absPos) => {
      if (!natal.houses || natal.houses.length < 12) return '';
      for (let i = 0; i < 12; i++) {
        const next = (i + 1) % 12;
        let c1 = natal.houses[i].absolute;
        let c2 = natal.houses[next].absolute;
        if (c2 < c1) c2 += 360;
        let pos = absPos < c1 ? absPos + 360 : absPos;
        if (pos >= c1 && pos < c2) return ` en Casa ${natal.houses[i].house}`;
      }
      return '';
    };

    sol  = p.Sol     ? `${p.Sol.degree.toFixed(1)}° ${p.Sol.sign}${getHouse(p.Sol.absolute)}`         : 'desconocido';
    luna = p.Luna    ? `${p.Luna.degree.toFixed(1)}° ${p.Luna.sign}${getHouse(p.Luna.absolute)}`       : 'desconocida';
    asc  = natal.ascendant ? `${natal.ascendant.degree.toFixed(1)}° ${natal.ascendant.sign}` : 'desconocido';
    mc   = natal.mc        ? `${natal.mc.degree.toFixed(1)}° ${natal.mc.sign}`               : 'desconocido';

    planetLines = Object.entries(p).map(([name, d]) =>
      `  • ${name}: ${d.degree.toFixed(1)}° ${d.sign}${getHouse(d.absolute)}${d.retrograde ? ' (Rx)' : ''}`
    ).join('
');

    if (natal.aspects && natal.aspects.length > 0) {
      const relevant = natal.aspects.filter(a =>
        ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(a.planet1)
      );
      tensosLines = relevant
        .filter(a => a.nature === 'tenso')
        .slice(0, 5)
        .map(a => `  • ${a.planet1} ${a.aspect} ${a.planet2} (orbe ${a.orb.toFixed(1)}°)`)
        .join('
');
      armonicosLines = relevant
        .filter(a => a.nature === 'armónico')
        .slice(0, 5)
        .map(a => `  • ${a.planet1} ${a.aspect} ${a.planet2} (orbe ${a.orb.toFixed(1)}°)`)
        .join('
');
    }

    if (transits && transits.planets) {
      transitLines = Object.entries(transits.planets)
        .filter(([n]) => ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(n))
        .map(([name, d]) => `  • ${name}: ${d.degree.toFixed(1)}° ${d.sign}${d.retrograde ? ' (Rx)' : ''}`)
        .join('
');
    }

    if (transits && transits.transit_aspects && transits.transit_aspects.length > 0) {
      transitAspectLines = transits.transit_aspects
        .slice(0, 6)
        .map(a => `  • ${a.transit_planet} ${a.aspect} natal ${a.natal_planet} — orbe ${a.orb.toFixed(1)}° (${a.nature})`)
        .join('
');
    }
  }

  const natalBlock = hasNatal ? `
═══════════════════════════════════
CARTA NATAL — datos calculados con Swiss Ephemeris
═══════════════════════════════════
  • Sol:         ${sol}
  • Luna:        ${luna}
  • Ascendente:  ${asc}
  • Medio Cielo: ${mc}

Todos los planetas con casa:
${planetLines}

Aspectos de tensión (conflictos internos):
${tensosLines || '  (ninguno significativo)'}

Aspectos armónicos (fortalezas):
${armonicosLines || '  (ninguno significativo)'}
` : '';

  const transitBlock = transitLines ? `
═══════════════════════════════════
TRÁNSITOS HOY — ${today} — ${moon.n} ${moon.e}
═══════════════════════════════════
Posiciones actuales:
${transitLines}

Aspectos activos hoy (tránsito → natal):
${transitAspectLines || '  (ninguno significativo)'}
` : '';

  return `Eres un astrólogo con formación en psicología analítica. Tu análisis es preciso, directo y nunca genérico.
Consultante: ${nombre}
Fecha: ${today}
Enfoque solicitado: ${enfoque}
${natalBlock}${transitBlock}
═══════════════════════════════════
REGLAS ESTRICTAS
═══════════════════════════════════
- USA los datos exactos de la carta. Menciona signos, grados y casas reales.
- NO uses frases vacías: "los astros te invitan", "el universo conspira", "energía cósmica".
- Escribe como un psicólogo que domina astrología — lenguaje humano y directo.
- Cada sección debe tener al menos un dato específico de la carta.
- Máximo 500 palabras en total.

Analiza la carta de ${nombre} con estas secciones (usa ### para cada título):

### Personalidad central
Basado en Sol, Luna y Ascendente con sus casas.
¿Cuál es el motor interno de ${nombre}? ¿Cómo lo ve el mundo vs cómo se ve a sí mismo?

### Conflictos internos
Basado en los aspectos de tensión.
¿Qué batallas internas tiene ${nombre}? ¿Qué le cuesta integrar?

### Patrones en relaciones
Basado en Venus, Marte, Luna y sus aspectos.
¿Qué busca en los vínculos? ¿Qué provoca sin darse cuenta?

### Fortalezas
Basado en los aspectos armónicos y planetas bien ubicados.
¿Dónde tiene talento natural? ¿Qué le sale fácil?

### Riesgos
¿Cuáles son los patrones que pueden limitarle si no los trabaja?

### Hoy — ${enfoque}
El tránsito más relevante hoy para ${nombre} y su impacto concreto.
Un solo consejo accionable para las próximas 24 horas.

### Frase del día
Una frase corta, directa y personalizada. Sin metáforas cósmicas.`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.OPENROUTER_KEY;
  if (!key) return res.status(500).json({ error: 'API key not configured' });

  const { nombre, enfoque, moon, today, birthData } = req.body;

  try {
    let natal = null;
    let transits = null;

    // Get precise natal chart from Railway
    if (birthData && birthData.lat && birthData.lon) {
      try {
        const [natalRes, transitsRes] = await Promise.all([
          fetch(`${RAILWAY_URL}/natal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(birthData)
          }),
          fetch(`${RAILWAY_URL}/transits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ natal: null })
          })
        ]);
        natal = await natalRes.json();

        // Get transits with natal data
        const transitsRes2 = await fetch(`${RAILWAY_URL}/transits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ natal: { planets: natal.planets } })
        });
        transits = await transitsRes2.json();
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

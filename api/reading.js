const RAILWAY_URL = 'https://web-production-93aa1.up.railway.app';

function buildPrompt(nombre, enfoque, moon, today, natal, transits) {
  const hasNatal = natal && natal.planets;

  // Base natal data
  let sol = 'desconocido', luna = 'desconocida', asc = 'desconocido', mc = 'desconocido';
  let planetLines = '', aspectLines = '', transitLines = '', transitAspectLines = '';

  if (hasNatal) {
    const p = natal.planets;
    sol  = p.Sol     ? `${p.Sol.degree.toFixed(1)}° ${p.Sol.sign}`         : 'desconocido';
    luna = p.Luna    ? `${p.Luna.degree.toFixed(1)}° ${p.Luna.sign}`       : 'desconocida';
    asc  = natal.ascendant ? `${natal.ascendant.degree.toFixed(1)}° ${natal.ascendant.sign}` : 'desconocido';
    mc   = natal.mc        ? `${natal.mc.degree.toFixed(1)}° ${natal.mc.sign}`               : 'desconocido';

    planetLines = Object.entries(p).map(([name, d]) =>
      `  • ${name}: ${d.degree.toFixed(1)}° ${d.sign}${d.retrograde ? ' (Retrógrado)' : ''}`
    ).join('\n');

    if (natal.aspects && natal.aspects.length > 0) {
      aspectLines = natal.aspects
        .filter(a => ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(a.planet1))
        .slice(0, 10)
        .map(a => `  • ${a.planet1} ${a.aspect} ${a.planet2} — orbe ${a.orb.toFixed(1)}° (${a.nature})`)
        .join('\n');
    }

    if (transits && transits.planets) {
      transitLines = Object.entries(transits.planets)
        .filter(([n]) => ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(n))
        .map(([name, d]) => `  • ${name}: ${d.degree.toFixed(1)}° ${d.sign}${d.retrograde ? ' (Rx)' : ''}`)
        .join('\n');
    }

    if (transits && transits.transit_aspects && transits.transit_aspects.length > 0) {
      transitAspectLines = transits.transit_aspects
        .slice(0, 6)
        .map(a => `  • ${a.transit_planet} ${a.aspect} natal ${a.natal_planet} — orbe ${a.orb.toFixed(1)}° (${a.nature})`)
        .join('\n');
    }
  }

  const natalBlock = hasNatal ? `
═══════════════════════════════════
CARTA NATAL (Swiss Ephemeris — datos precisos)
═══════════════════════════════════
Luminarias clave:
  • Sol:        ${sol}
  • Luna:       ${luna}
  • Ascendente: ${asc}
  • Medio Cielo: ${mc}

Todos los planetas:
${planetLines}

Aspectos natales principales:
${aspectLines || '  (no disponibles)'}
` : '';

  const transitBlock = transitLines ? `
═══════════════════════════════════
TRÁNSITOS DE HOY — ${today}
═══════════════════════════════════
Posiciones actuales:
${transitLines}

Aspectos tránsito → natal activos hoy:
${transitAspectLines || '  (ninguno significativo)'}
` : '';

  return `Actúa como un astrólogo profesional con enfoque psicológico y humanista.
Nombre del consultante: ${nombre}
Hoy: ${today}
Fase lunar: ${moon.n} ${moon.e}
Enfoque solicitado: ${enfoque}
${natalBlock}${transitBlock}
═══════════════════════════════════
INSTRUCCIONES ESTRICTAS
═══════════════════════════════════
1. USA los datos precisos de la carta natal. No los ignores ni los estimes.
2. NO escribas frases genéricas como "los astros te invitan" o "el universo te dice".
3. SÉ específico: menciona los signos, grados y aspectos reales al interpretar.
4. Lenguaje humano, directo, como un psicólogo que conoce astrología.
5. Máximo 450 palabras en total.

Estructura tu respuesta con estas secciones (usa ### para cada título):

### Perfil natal
Describe la personalidad de ${nombre} basándote en Sol, Luna y Ascendente reales.
Menciona 2-3 rasgos concretos con ejemplos de cómo se manifiestan en la vida.

### Emociones y estrés
Cómo reacciona ${nombre} emocionalmente bajo presión. Basado en Luna y aspectos.
Sé directo — qué patrones tiene, qué le cuesta soltar.

### Relaciones
Patrones reales en vínculos. Venus, Marte y aspectos relevantes.
Qué busca, qué provoca sin darse cuenta.

### Hoy — ${enfoque}
Qué tránsito es el más significativo hoy para ${nombre}.
Un consejo accionable concreto para las próximas 24 horas.

### Lo que fluye hoy
2-3 cosas específicas que le favorecen (basadas en los tránsitos).

### Lo que requiere cuidado
2-3 cosas específicas a tener en cuenta (basadas en los tránsitos).

### Frase del día
Una frase corta, directa y personalizada para ${nombre}. Sin metáforas cósmicas.`;
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

const RAILWAY_URL = 'https://web-production-93aa1.up.railway.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.OPENROUTER_KEY;
  if (!key) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const { prompt, birthData } = req.body;

  try {
    let natalContext = '';
    let transitsContext = '';

    // =========================
    // 1. OBTENER CARTA NATAL
    // =========================
    if (birthData && birthData.lat && birthData.lon) {
      try {
        const natalRes = await fetch(`${RAILWAY_URL}/natal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(birthData)
        });

        const natal = await natalRes.json();

        if (natal.planets) {
          const planetLines = Object.entries(natal.planets)
            .filter(([name]) =>
              ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(name)
            )
            .map(([name, p]) =>
              `- ${name}: ${p.degree.toFixed(1)}° ${p.sign}${p.retrograde ? ' (Rx)' : ''}`
            )
            .join('\n');

          natalContext = `
Carta natal:
Ascendente: ${natal.ascendant.degree.toFixed(1)}° ${natal.ascendant.sign}
Medio Cielo: ${natal.mc.degree.toFixed(1)}° ${natal.mc.sign}

Planetas:
${planetLines}
`;

          // Aspectos importantes (limitados)
          if (natal.aspects && natal.aspects.length > 0) {
            const aspectLines = natal.aspects
              .filter(a =>
                ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(a.planet1)
              )
              .slice(0, 5)
              .map(a =>
                `- ${a.planet1} ${a.aspect} ${a.planet2} (orbe ${a.orb.toFixed(1)}°)`
              )
              .join('\n');

            natalContext += `\nAspectos clave:\n${aspectLines}`;
          }

          // =========================
          // 2. TRÁNSITOS
          // =========================
          const transitsRes = await fetch(`${RAILWAY_URL}/transits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ natal: { planets: natal.planets } })
          });

          const transits = await transitsRes.json();

          if (transits.planets) {
            const transitLines = Object.entries(transits.planets)
              .filter(([n]) =>
                ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(n)
              )
              .map(([name, p]) =>
                `- ${name}: ${p.degree.toFixed(1)}° ${p.sign}${p.retrograde ? ' (Rx)' : ''}`
              )
              .join('\n');

            transitsContext = `
Tránsitos actuales:
${transitLines}
`;

            if (transits.transit_aspects && transits.transit_aspects.length > 0) {
              const tAspects = transits.transit_aspects
                .slice(0, 5)
                .map(a =>
                  `- ${a.transit_planet} ${a.aspect} ${a.natal_planet} (orbe ${a.orb.toFixed(1)}°)`
                )
                .join('\n');

              transitsContext += `\nAspectos activos hoy:\n${tAspects}`;
            }
          }
        }
      } catch (e) {
        console.error('Railway error:', e.message);
      }
    }

    // =========================
    // 3. CONSTRUCCIÓN DEL PROMPT
    // =========================

    const contextUser = `
Esta persona quiere entender patrones reales de su vida y tomar mejores decisiones.
`;

    const structuredInstruction = `
Actúa como un astrólogo profesional con enfoque psicológico.

NO uses lenguaje genérico.
NO inventes datos.
USA la carta natal y los tránsitos proporcionados.

Estructura tu respuesta en:

1. Resumen claro (máx 5 líneas)
2. Energía actual (basada en tránsitos)
3. Emociones
4. Relaciones
5. Consejo práctico

Lenguaje humano, claro y directo.
`;

    const enrichedPrompt =
      contextUser +
      structuredInstruction +
      '\n\n' +
      (prompt || '') +
      '\n\n' +
      natalContext +
      '\n\n' +
      transitsContext;

    // =========================
    // 4. LLAMADA A OPENROUTER
    // =========================

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
        'HTTP-Referer': 'https://astro-diario.vercel.app',
        'X-Title': 'Astro Diario'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct',
        messages: [
          {
            role: 'system',
            content: 'Eres un astrólogo experto, preciso, psicológico y directo.'
          },
          {
            role: 'user',
            content: enrichedPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 900
      })
    });

    const data = await response.json();

    return res.status(response.status).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

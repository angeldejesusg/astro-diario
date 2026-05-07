const RAILWAY_URL = ‘https://web-production-93aa1.up.railway.app’;

export default async function handler(req, res) {
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

const key = process.env.OPENROUTER_KEY;
if (!key) return res.status(500).json({ error: ‘API key not configured’ });

const { prompt, birthData } = req.body;

try {
// Step 1: Get precise natal chart from Railway if birthData provided
let natalContext = ‘’;
let natalData = null;
let transitsContext = ‘’;

```
if (birthData && birthData.lat && birthData.lon) {
  try {
    // Natal chart
    const natalRes = await fetch(`${RAILWAY_URL}/natal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(birthData)
    });
    const natal = await natalRes.json();

    if (natal.planets) {
      natalData = natal;
      // Format planets
      const planetLines = Object.entries(natal.planets).map(([name, p]) =>
        `  - ${name}: ${p.degree.toFixed(1)}° ${p.sign}${p.retrograde ? ' (Rx)' : ''}`
      ).join('\n');

      natalContext = `\n\nCARTA NATAL CALCULADA CON PRECISIÓN ASTRONÓMICA (Swiss Ephemeris):
```

Ascendente: ${natal.ascendant.degree.toFixed(1)}° ${natal.ascendant.sign}
Medio Cielo: ${natal.mc.degree.toFixed(1)}° ${natal.mc.sign}
Planetas:
${planetLines}`;

```
      // Aspects
      if (natal.aspects && natal.aspects.length > 0) {
        const aspectLines = natal.aspects
          .filter(a => ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(a.planet1))
          .slice(0, 8)
          .map(a => `  - ${a.planet1} ${a.aspect} ${a.planet2} (orbe ${a.orb.toFixed(1)}°, ${a.nature})`)
          .join('\n');
        natalContext += `\nAspectos natales principales:\n${aspectLines}`;
      }

      // Step 2: Get today's transits
      const transitsRes = await fetch(`${RAILWAY_URL}/transits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ natal: { planets: natal.planets } })
      });
      const transits = await transitsRes.json();

      if (transits.planets) {
        const transitLines = Object.entries(transits.planets)
          .filter(([n]) => ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(n))
          .map(([name, p]) => `  - ${name}: ${p.degree.toFixed(1)}° ${p.sign}${p.retrograde ? ' (Rx)' : ''}`)
          .join('\n');

        transitsContext = `\n\nTRÁNSITOS DE HOY (posiciones planetarias actuales precisas):
```

${transitLines}`;

```
        if (transits.transit_aspects && transits.transit_aspects.length > 0) {
          const tAspects = transits.transit_aspects
            .slice(0, 6)
            .map(a => `  - Tránsito ${a.transit_planet} ${a.aspect} natal ${a.natal_planet} (orbe ${a.orb.toFixed(1)}°, ${a.nature})`)
            .join('\n');
          transitsContext += `\nAspectos tránsito-natal activos hoy:\n${tAspects}`;
        }
      }
    }
  } catch (e) {
    console.error('Railway error:', e.message);
    // Continue without precise data
  }
}

// Step 2: Call OpenRouter with enriched prompt
const enrichedPrompt = prompt + natalContext + transitsContext +
  (natalContext ? '\n\nIMPORTANTE: Usa los datos astronómicos precisos provistos arriba. No estimes posiciones — están calculadas con Swiss Ephemeris. Menciona posiciones exactas en tu lectura.' : '');

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
    messages: [{ role: 'user', content: enrichedPrompt }],
    max_tokens: 1000
  })
});

const data = await response.json();
// Attach natal chart data to response for frontend chart rendering
if (data.choices) {
  data._natal = natalData;
}
return res.status(response.status).json(data);
```

} catch (err) {
return res.status(500).json({ error: err.message });
}
}

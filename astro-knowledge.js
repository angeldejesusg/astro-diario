// ═══════════════════════════════════════════════════════
// BASE DE CONOCIMIENTO ASTROLÓGICO
// Interpretaciones para inyectar en el prompt según carta
// ═══════════════════════════════════════════════════════

const SIGNOS = {
  'Aries':       { elemento:'Fuego', modalidad:'Cardinal', regente:'Marte',   keywords:'iniciativa, impulsividad, liderazgo, impaciencia, pionero', sombra:'agresividad, egocentrismo, no termina lo que empieza' },
  'Tauro':       { elemento:'Tierra', modalidad:'Fijo',    regente:'Venus',   keywords:'estabilidad, sensualidad, perseverancia, materialismo, lealtad', sombra:'terquedad, resistencia al cambio, posesividad' },
  'Géminis':     { elemento:'Aire',   modalidad:'Mutable', regente:'Mercurio',keywords:'comunicación, curiosidad, versatilidad, superficialidad, adaptabilidad', sombra:'dispersión, inconsistencia, ansiedad mental' },
  'Cáncer':      { elemento:'Agua',   modalidad:'Cardinal',regente:'Luna',    keywords:'sensibilidad, protección, memoria, apego, intuición emocional', sombra:'manipulación emocional, victimismo, dependencia' },
  'Leo':         { elemento:'Fuego',  modalidad:'Fijo',    regente:'Sol',     keywords:'creatividad, liderazgo, generosidad, orgullo, expresión personal', sombra:'arrogancia, necesidad de validación, dramatismo' },
  'Virgo':       { elemento:'Tierra', modalidad:'Mutable', regente:'Mercurio',keywords:'análisis, servicio, perfeccionismo, salud, discriminación', sombra:'hipercrítica, ansiedad, dificultad para soltar control' },
  'Libra':       { elemento:'Aire',   modalidad:'Cardinal',regente:'Venus',   keywords:'armonía, justicia, relaciones, indecisión, diplomacia', sombra:'complacencia, evitar conflictos, dependencia del otro' },
  'Escorpio':    { elemento:'Agua',   modalidad:'Fijo',    regente:'Plutón',  keywords:'transformación, intensidad, poder, secreto, profundidad psicológica', sombra:'control, celos, venganza, dificultad para confiar' },
  'Sagitario':   { elemento:'Fuego',  modalidad:'Mutable', regente:'Júpiter', keywords:'expansión, filosofía, libertad, optimismo, búsqueda de sentido', sombra:'irresponsabilidad, excesos, dogmatismo, huida' },
  'Capricornio': { elemento:'Tierra', modalidad:'Cardinal',regente:'Saturno', keywords:'ambición, disciplina, responsabilidad, paciencia, estructura', sombra:'frialdad emocional, workaholic, miedo al fracaso' },
  'Acuario':     { elemento:'Aire',   modalidad:'Fijo',    regente:'Urano',   keywords:'originalidad, humanismo, independencia, visión de futuro, innovación', sombra:'desapego emocional, rebeldía por principio, frialdad' },
  'Piscis':      { elemento:'Agua',   modalidad:'Mutable', regente:'Neptuno', keywords:'compasión, espiritualidad, creatividad, disolución de límites, empatía', sombra:'evasión, confusión, victimismo, adicciones' }
};

const PLANETAS = {
  'Sol':      { area:'identidad, ego, propósito de vida, vitalidad, expresión consciente', pregunta:'¿Quién soy y hacia dónde voy?' },
  'Luna':     { area:'emociones, instintos, memoria, necesidades de seguridad, relación con la madre', pregunta:'¿Qué necesito para sentirme seguro?' },
  'Mercurio': { area:'comunicación, pensamiento, aprendizaje, lenguaje, transporte', pregunta:'¿Cómo proceso y comunico la realidad?' },
  'Venus':    { area:'amor, estética, valores, dinero, relaciones íntimas, placer', pregunta:'¿Qué valoro y cómo me relaciono?' },
  'Marte':    { area:'acción, deseo, sexualidad, agresión, energía, iniciativa', pregunta:'¿Cómo actúo y qué quiero?' },
  'Júpiter':  { area:'expansión, abundancia, filosofía, optimismo, viajes, crecimiento', pregunta:'¿Dónde crezco y me expando?' },
  'Saturno':  { area:'límites, responsabilidad, karma, disciplina, miedos, estructura', pregunta:'¿Qué debo construir con esfuerzo?' },
  'Urano':    { area:'cambio súbito, originalidad, revolución, tecnología, liberación', pregunta:'¿Dónde necesito romper estructuras?' },
  'Neptuno':  { area:'espiritualidad, ilusión, arte, confusión, compasión, idealismo', pregunta:'¿Dónde disuelvo límites o me engaño?' },
  'Plutón':   { area:'transformación profunda, poder, muerte y renacimiento, psicología de sombra', pregunta:'¿Dónde debo transformarme radicalmente?' }
};

const CASAS = {
  1:  { nombre:'Casa 1 — Identidad',       area:'apariencia, personalidad proyectada, inicio, cuerpo físico, cómo nos ven los demás' },
  2:  { nombre:'Casa 2 — Recursos',         area:'dinero, posesiones, valores personales, autoestima material, lo que consideramos nuestro' },
  3:  { nombre:'Casa 3 — Comunicación',     area:'pensamiento cotidiano, habla, escritura, hermanos, viajes cortos, aprendizaje básico' },
  4:  { nombre:'Casa 4 — Hogar',            area:'raíces, familia, hogar, padre/madre, base emocional, vida privada, final de la vida' },
  5:  { nombre:'Casa 5 — Creatividad',      area:'expresión creativa, romance, hijos, juego, placer, especulación, identidad auténtica' },
  6:  { nombre:'Casa 6 — Salud',            area:'salud, trabajo cotidiano, rutinas, servicio, empleados, hábitos, animales pequeños' },
  7:  { nombre:'Casa 7 — Relaciones',       area:'pareja, socios, contratos, enemigos declarados, lo que proyectamos en el otro' },
  8:  { nombre:'Casa 8 — Transformación',   area:'muerte, sexualidad, dinero ajeno, herencias, psicología profunda, poder compartido' },
  9:  { nombre:'Casa 9 — Expansión',        area:'filosofía, religión, viajes largos, educación superior, extranjeros, búsqueda de sentido' },
  10: { nombre:'Casa 10 — Carrera',         area:'vocación, reputación pública, autoridad, éxito, madre/padre dominante, legado' },
  11: { nombre:'Casa 11 — Comunidad',       area:'amigos, grupos, ideales, objetivos a largo plazo, redes sociales, causas colectivas' },
  12: { nombre:'Casa 12 — Inconsciente',    area:'karma, limitaciones ocultas, espiritualidad, soledad, hospitales, enemigos ocultos, sueños' }
};

const ASPECTOS = {
  'Conjunción': { naturaleza:'fusión intensa de energías — pueden amplificarse o bloquearse mutuamente', efecto:'La energía de ambos planetas se mezcla y actúa como una sola fuerza' },
  'Sextil':     { naturaleza:'oportunidad fluida que requiere acción consciente', efecto:'Talento latente que se activa con esfuerzo mínimo' },
  'Cuadratura': { naturaleza:'tensión que genera crecimiento a través del conflicto', efecto:'Fricción interna que obliga a integrar dos necesidades opuestas' },
  'Trígono':    { naturaleza:'flujo natural y armónico entre energías compatibles', efecto:'Don natural, talento que fluye sin esfuerzo — riesgo de darlo por sentado' },
  'Oposición':  { naturaleza:'polaridad que busca equilibrio a través del otro', efecto:'Lo que no se integra internamente se proyecta en relaciones o circunstancias externas' },
  'Quincuncio': { naturaleza:'ajuste incómodo entre energías que no se entienden', efecto:'Tensión crónica que requiere adaptación constante, difícil de resolver del todo' }
};

// ── Función principal ─────────────────────────────────
function buildKnowledgeBlock(natal) {
  if (!natal || !natal.planets) return '';

  const p = natal.planets;
  const houses = natal.houses || [];
  const aspects = natal.aspects || [];

  let block = '\nCONOCIMIENTO ASTROLÓGICO RELEVANTE PARA ESTA CARTA\n';
  block += '(Usa esto para interpretar con precisión, no como texto a copiar)\n\n';

  // 1. Luminarias principales
  const solSign  = p.Sol    ? p.Sol.sign    : null;
  const lunaSign = p.Luna   ? p.Luna.sign   : null;
  const ascSign  = natal.ascendant ? natal.ascendant.sign : null;
  const mcSign   = natal.mc        ? natal.mc.sign        : null;

  block += '-- NATURALEZA DE LOS SIGNOS CLAVE --\n';
  [solSign, lunaSign, ascSign, mcSign].filter((s,i,a) => s && a.indexOf(s) === i).forEach(sign => {
    if (SIGNOS[sign]) {
      const s = SIGNOS[sign];
      block += sign + ' (' + s.elemento + ', ' + s.modalidad + '): ' + s.keywords + '. Sombra: ' + s.sombra + '\n';
    }
  });

  // 2. Planetas con su área
  block += '\n-- PLANETAS EN CARTA --\n';
  Object.entries(p).forEach(([name, data]) => {
    if (!PLANETAS[name] || !SIGNOS[data.sign]) return;
    const planet = PLANETAS[name];
    const sign   = SIGNOS[data.sign];
    const house  = getHouseNumber(data.absolute, houses);
    const houseTxt = house ? ' | ' + CASAS[house].area : '';
    block += name + ' en ' + data.sign + ': área de ' + planet.area + '. En ' + data.sign + ' (' + sign.elemento + '): ' + sign.keywords + houseTxt + '\n';
  });

  // 3. Aspectos activos con su significado
  const relevantAspects = aspects.filter(a =>
    ['Sol','Luna','Mercurio','Venus','Marte','Júpiter','Saturno'].includes(a.planet1)
  ).slice(0, 12);

  if (relevantAspects.length > 0) {
    block += '\n-- ASPECTOS Y SU SIGNIFICADO --\n';
    relevantAspects.forEach(a => {
      const asp = ASPECTOS[a.aspect];
      if (!asp) return;
      block += a.planet1 + ' ' + a.aspect + ' ' + a.planet2 + ' (' + a.nature + '): ' + asp.efecto + '\n';
    });
  }

  // 4. Casas ocupadas
  block += '\n-- CASAS OCUPADAS --\n';
  Object.entries(p).forEach(([name, data]) => {
    const house = getHouseNumber(data.absolute, houses);
    if (house && CASAS[house]) {
      block += name + ' en ' + CASAS[house].nombre + ': ' + CASAS[house].area + '\n';
    }
  });

  return block;
}

function getHouseNumber(absPos, houses) {
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

export { buildKnowledgeBlock };

// Horaires d'ouverture, calculés à l'heure de la Guadeloupe (partagé site + API)

const TZ = 'America/Guadeloupe';
export const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function maintenantGuadeloupe(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  return { jour: WD[get('weekday')], minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const enMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
// « 07:30 » → « 7h30 », « 18:00 » → « 18h »
export const heure = (hhmm) => {
  const [h, m] = hhmm.split(':');
  return `${Number(h)}h${m === '00' ? '' : m}`;
};

function prochaineOuverture(config, jour, minutes) {
  for (let i = 0; i < 8; i++) {
    const j = (jour + i) % 7;
    const plage = config.horaires[j];
    if (!plage) continue;
    if (i === 0 && minutes >= enMinutes(plage[0])) continue;
    const quand = i === 0 ? '' : i === 1 ? 'demain ' : `${JOURS[j].toLowerCase()} `;
    return `${quand}à ${heure(plage[0])}`;
  }
  return null;
}

export function etatOuverture(config, date = new Date()) {
  const { jour, minutes } = maintenantGuadeloupe(date);
  const plage = config.horaires[jour];
  if (plage) {
    const ouverture = enMinutes(plage[0]);
    const fermeture = enMinutes(plage[1]);
    const stop = fermeture - (config.livraisonStopAvantFermeture || 0);
    if (minutes >= ouverture && minutes < fermeture) {
      return { ouvert: true, livraison: minutes < stop, jour, texte: `Ouvert · jusqu’à ${heure(plage[1])}` };
    }
  }
  const prochain = prochaineOuverture(config, jour, minutes);
  return { ouvert: false, livraison: false, jour, texte: prochain ? `Fermé · ouvre ${prochain}` : 'Fermé' };
}

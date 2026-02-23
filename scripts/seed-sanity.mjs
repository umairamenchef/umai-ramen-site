#!/usr/bin/env node
/**
 * UMAÏ Ramen — Sanity Content Seed Script
 *
 * Populates the Sanity Content Lake with:
 * - siteSettings (singleton)
 * - menuCategory (8 categories)
 * - menuItem (~17 dishes)
 * - menuExtra (5 toppings)
 * - menuFormule (2 set menus)
 * - gallery (placeholder entries)
 * - page "notre-histoire" with 4 sections
 *
 * Usage: node scripts/seed-sanity.mjs
 */

const PROJECT_ID = 'c7twe801';
const DATASET = 'production';
const API_VERSION = '2025-01-01';
const TOKEN = process.env.SANITY_TOKEN;

if (!TOKEN) {
  console.error('Missing SANITY_TOKEN env var. Run with:\n  SANITY_TOKEN=<token> node scripts/seed-sanity.mjs');
  process.exit(1);
}

const API_URL = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`;

// ─── Helpers ───────────────────────────────────────────────────────
function locStr(fr, en, de) {
  return { _type: 'localeString', fr, en: en || undefined, de: de || undefined };
}
function locTxt(fr, en, de) {
  return { _type: 'localeText', fr, en: en || undefined, de: de || undefined };
}
function slug(value) {
  return { _type: 'slug', current: value };
}
function ref(id) {
  return { _type: 'reference', _ref: id };
}
function key() {
  return Math.random().toString(36).slice(2, 12);
}

// ─── 1. Site Settings (singleton) ──────────────────────────────────
const siteSettings = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  catchphrase: locStr(
    'NOUILLES FRAÎCHES. BOUILLONS MAISON.',
    'FRESH NOODLES. HOUSE-MADE BROTH.',
    'FRISCHE NUDELN. HAUSGEMACHTE BRÜHE.'
  ),
  accentColor: '#77967A',
  phone: '09 52 34 34 38',
  address: {
    _type: 'object',
    street: '5 rue des Orphelins',
    city: 'Strasbourg',
    postalCode: '67000',
  },
  reservationUrl: 'https://gusty.app/booking/1667924751880x258346136410259460?source=SITE',
  uberEatsUrl: 'https://www.ubereats.com/fr/store/umai-ramen/8yLiOMdPVTudC_Pgbe209g',
  clickCollectUrl: 'https://my.flipdish.com/umai-ramen/order',
  eazeeLinkUrl: 'https://menu.eazee-link.com/?id=E7FNRP0ET3&o=q',
  openingHours: [
    { _key: key(), _type: 'object', day: 'Lundi', periods: [{ _key: key(), _type: 'object', open: '12:00', close: '14:30' }, { _key: key(), _type: 'object', open: '19:00', close: '22:30' }] },
    { _key: key(), _type: 'object', day: 'Mardi', periods: [{ _key: key(), _type: 'object', open: '12:00', close: '14:30' }, { _key: key(), _type: 'object', open: '19:00', close: '22:30' }] },
    { _key: key(), _type: 'object', day: 'Mercredi', periods: [{ _key: key(), _type: 'object', open: '12:00', close: '14:30' }, { _key: key(), _type: 'object', open: '19:00', close: '22:30' }] },
    { _key: key(), _type: 'object', day: 'Jeudi', periods: [{ _key: key(), _type: 'object', open: '12:00', close: '14:30' }, { _key: key(), _type: 'object', open: '19:00', close: '22:30' }] },
    { _key: key(), _type: 'object', day: 'Vendredi', periods: [{ _key: key(), _type: 'object', open: '12:00', close: '14:30' }, { _key: key(), _type: 'object', open: '19:00', close: '23:00' }] },
    { _key: key(), _type: 'object', day: 'Samedi', periods: [{ _key: key(), _type: 'object', open: '12:00', close: '15:00' }, { _key: key(), _type: 'object', open: '19:00', close: '23:00' }] },
    { _key: key(), _type: 'object', day: 'Dimanche', periods: [{ _key: key(), _type: 'object', open: '12:00', close: '14:30' }, { _key: key(), _type: 'object', open: '19:00', close: '22:00' }] },
  ],
  socialLinks: {
    _type: 'object',
    instagram: 'https://www.instagram.com/umai_ramen_strasbourg/',
    facebook: 'https://www.facebook.com/UmaiRamenStrasbourg/',
  },
};

// ─── 2. Menu Categories ────────────────────────────────────────────
const categories = [
  {
    _id: 'cat-entrees',
    _type: 'menuCategory',
    name: locStr('Entrées', 'Starters', 'Vorspeisen'),
    slug: slug('entrees'),
    order: 1,
    description: locTxt(
      'Petites bouchées japonaises pour ouvrir l\'appétit.',
      'Japanese bites to start your meal.',
      'Japanische Häppchen zum Einstieg.'
    ),
  },
  {
    _id: 'cat-ramen-paitan',
    _type: 'menuCategory',
    name: locStr('Ramen Paitan', 'Paitan Ramen', 'Paitan Ramen'),
    slug: slug('ramen-paitan'),
    order: 2,
    description: locTxt(
      'Bouillon crémeux et riche, longuement mijoté. Le cœur de notre carte.',
      'Rich, creamy broth, slowly simmered. The heart of our menu.',
      'Reichhaltige, cremige Brühe, langsam geschmort. Das Herzstück unserer Karte.'
    ),
  },
  {
    _id: 'cat-ramen-chintan',
    _type: 'menuCategory',
    name: locStr('Ramen Chintan', 'Chintan Ramen', 'Chintan Ramen'),
    slug: slug('ramen-chintan'),
    order: 3,
    description: locTxt(
      'Bouillon clair et délicat, aux saveurs nettes et profondes.',
      'Clear, delicate broth with clean, deep flavours.',
      'Klare, zarte Brühe mit reinen, tiefen Aromen.'
    ),
  },
  {
    _id: 'cat-tsukemen',
    _type: 'menuCategory',
    name: locStr('Tsukemen', 'Tsukemen', 'Tsukemen'),
    slug: slug('tsukemen'),
    order: 4,
    description: locTxt(
      'Nouilles froides servies à part, à tremper dans un bouillon concentré.',
      'Cold noodles served separately, dipped into a rich, concentrated broth.',
      'Kalte Nudeln, separat serviert, in eine konzentrierte Brühe getaucht.'
    ),
  },
  {
    _id: 'cat-mazesoba',
    _type: 'menuCategory',
    name: locStr('Mazesoba', 'Mazesoba', 'Mazesoba'),
    slug: slug('mazesoba'),
    order: 5,
    description: locTxt(
      'Nouilles sans bouillon, mélangées avec leurs garnitures. Saveur concentrée.',
      'Brothless noodles mixed with toppings. Pure concentrated flavour.',
      'Nudeln ohne Brühe, mit Toppings vermischt. Purer, konzentrierter Geschmack.'
    ),
  },
  {
    _id: 'cat-soba',
    _type: 'menuCategory',
    name: locStr('Soba', 'Soba', 'Soba'),
    slug: slug('soba'),
    order: 6,
    description: locTxt(
      'Nouilles de sarrasin artisanales, servies en bouillon.',
      'Handmade buckwheat noodles served in broth.',
      'Handgemachte Buchweizennudeln in Brühe serviert.'
    ),
  },
  {
    _id: 'cat-udon',
    _type: 'menuCategory',
    name: locStr('Udon', 'Udon', 'Udon'),
    slug: slug('udon'),
    order: 7,
    description: locTxt(
      'Nouilles épaisses de blé, généreuses et réconfortantes.',
      'Thick wheat noodles, hearty and comforting.',
      'Dicke Weizennudeln, herzhaft und wohltuend.'
    ),
  },
  {
    _id: 'cat-desserts',
    _type: 'menuCategory',
    name: locStr('Desserts', 'Desserts', 'Desserts'),
    slug: slug('desserts'),
    order: 8,
    description: locTxt(
      'Douceurs d\'inspiration japonaise pour terminer le repas.',
      'Japanese-inspired sweets to finish your meal.',
      'Japanisch inspirierte Süßspeisen zum Abschluss.'
    ),
  },
];

// ─── 3. Menu Items ─────────────────────────────────────────────────
const menuItems = [
  // --- Entrées ---
  {
    _id: 'item-gyoza',
    _type: 'menuItem',
    name: locStr('Gyoza', 'Gyoza', 'Gyoza'),
    nameJp: '餃子',
    slug: slug('gyoza'),
    description: locTxt(
      'Raviolis japonais au porc et légumes, grillés et croustillants. 5 pièces.',
      'Pan-fried pork and vegetable dumplings. 5 pieces.',
      'Gebratene Schwein-Gemüse-Teigtaschen. 5 Stück.'
    ),
    price: 7.5,
    category: ref('cat-entrees'),
    isVegetarian: false,
    isGlutenFree: false,
    available: true,
    order: 1,
  },
  {
    _id: 'item-takoyaki',
    _type: 'menuItem',
    name: locStr('Takoyaki', 'Takoyaki', 'Takoyaki'),
    nameJp: 'たこ焼き',
    slug: slug('takoyaki'),
    description: locTxt(
      'Beignets de poulpe à l\'osaka, sauce takoyaki, mayo japonaise, katsuobushi. 4 pièces.',
      'Osaka-style octopus fritters, takoyaki sauce, Japanese mayo, bonito flakes. 4 pieces.',
      'Oktopus-Bällchen nach Osaka-Art, Takoyaki-Sauce, japanische Mayo, Bonitoflocken. 4 Stück.'
    ),
    price: 7,
    category: ref('cat-entrees'),
    isVegetarian: false,
    isGlutenFree: false,
    available: true,
    order: 2,
  },
  {
    _id: 'item-karaage',
    _type: 'menuItem',
    name: locStr('Karaage', 'Karaage', 'Karaage'),
    nameJp: '唐揚げ',
    slug: slug('karaage'),
    description: locTxt(
      'Poulet fermier alsacien mariné et frit, croustillant à l\'extérieur, juteux à l\'intérieur.',
      'Alsatian free-range chicken, marinated and fried. Crispy outside, juicy inside.',
      'Elsässisches Freilandhuhn, mariniert und frittiert. Außen knusprig, innen saftig.'
    ),
    price: 8.5,
    category: ref('cat-entrees'),
    isVegetarian: false,
    isGlutenFree: true,
    available: true,
    order: 3,
  },
  {
    _id: 'item-edamame',
    _type: 'menuItem',
    name: locStr('Edamame', 'Edamame', 'Edamame'),
    nameJp: '枝豆',
    slug: slug('edamame'),
    description: locTxt(
      'Fèves de soja légèrement salées, servies tièdes.',
      'Lightly salted soybean pods, served warm.',
      'Leicht gesalzene Sojabohnen, warm serviert.'
    ),
    price: 4.5,
    category: ref('cat-entrees'),
    isVegetarian: true,
    isGlutenFree: true,
    available: true,
    order: 4,
  },

  // --- Ramen Paitan (crémeux) ---
  {
    _id: 'item-tori-paitan',
    _type: 'menuItem',
    name: locStr('Tori Paitan', 'Tori Paitan', 'Tori Paitan'),
    nameJp: '鶏白湯ラーメン',
    slug: slug('tori-paitan'),
    description: locTxt(
      'Nouilles fraîches maison, bouillon de poulet crémeux mijoté 6h+, chashu de porc, œuf mariné, pousses de soja, pak choï, oignons frits & ciboulette.',
      'House-made fresh noodles, creamy chicken broth simmered 6h+, pork chashu, marinated egg, bean sprouts, pak choi, fried onions & chives.',
      'Hausgemachte frische Nudeln, cremige Hühnerbrühe 6h+ geschmort, Schweine-Chashu, mariniertes Ei, Sojasprossen, Pak Choi, Röstzwiebeln & Schnittlauch.'
    ),
    price: 15.8,
    category: ref('cat-ramen-paitan'),
    isVegetarian: false,
    isGlutenFree: false,
    available: true,
    order: 1,
  },

  // --- Ramen Chintan (clair) ---
  {
    _id: 'item-miso',
    _type: 'menuItem',
    name: locStr('Miso Ramen', 'Miso Ramen', 'Miso Ramen'),
    nameJp: '味噌ラーメン',
    slug: slug('miso-ramen'),
    description: locTxt(
      'Nouilles fraîches maison, bouillon de poulet au miso rouge, chashu de porc, œuf mariné, pousses de soja, pois gourmand & ciboulette.',
      'House-made fresh noodles, red miso chicken broth, pork chashu, marinated egg, bean sprouts, snow peas & chives.',
      'Hausgemachte frische Nudeln, rote Miso-Hühnerbrühe, Schweine-Chashu, mariniertes Ei, Sojasprossen, Zuckerschoten & Schnittlauch.'
    ),
    price: 15.8,
    category: ref('cat-ramen-chintan'),
    isVegetarian: false,
    isGlutenFree: false,
    available: true,
    order: 1,
  },
  {
    _id: 'item-shoyu',
    _type: 'menuItem',
    name: locStr('Shoyu Ramen', 'Shoyu Ramen', 'Shoyu Ramen'),
    nameJp: '醤油ラーメン',
    slug: slug('shoyu-ramen'),
    description: locTxt(
      'Nouilles fraîches maison, bouillon de poulet à la sauce soja, chashu de porc, œuf mariné, bambou, ciboulette & pousses de soja.',
      'House-made fresh noodles, soy sauce chicken broth, pork chashu, marinated egg, bamboo, chives & bean sprouts.',
      'Hausgemachte frische Nudeln, Sojasaucen-Hühnerbrühe, Schweine-Chashu, mariniertes Ei, Bambus, Schnittlauch & Sojasprossen.'
    ),
    price: 15.8,
    category: ref('cat-ramen-chintan'),
    isVegetarian: false,
    isGlutenFree: false,
    available: true,
    order: 2,
  },
  {
    _id: 'item-shio',
    _type: 'menuItem',
    name: locStr('Shio Ramen', 'Shio Ramen', 'Shio Ramen'),
    nameJp: '塩ラーメン',
    slug: slug('shio-ramen'),
    description: locTxt(
      'Nouilles fraîches maison, bouillon de poulet au sel, chashu de poulet, œuf mariné, ravioli de poulet, bambou, ciboulette & pousses de soja.',
      'House-made fresh noodles, salt-based chicken broth, chicken chashu, marinated egg, chicken dumplings, bamboo, chives & bean sprouts.',
      'Hausgemachte frische Nudeln, Salz-Hühnerbrühe, Hühner-Chashu, mariniertes Ei, Hühner-Ravioli, Bambus, Schnittlauch & Sojasprossen.'
    ),
    price: 15.8,
    category: ref('cat-ramen-chintan'),
    isVegetarian: false,
    isGlutenFree: false,
    available: true,
    order: 3,
  },
  {
    _id: 'item-tantan',
    _type: 'menuItem',
    name: locStr('Tantan Ramen', 'Tantan Ramen', 'Tantan Ramen'),
    nameJp: '担々麺',
    slug: slug('tantan-ramen'),
    description: locTxt(
      'Nouilles fraîches maison, bouillon de poulet au sésame blanc torréfié, lait de soja, huile de piment, bœuf haché aux 5 épices, pak choï, pousses de soja, œuf mariné, narutomaki & daikon mariné.',
      'House-made fresh noodles, roasted white sesame chicken broth, soy milk, chili oil, five-spice minced beef, pak choi, bean sprouts, marinated egg, narutomaki & pickled daikon.',
      'Hausgemachte frische Nudeln, geröstete weiße Sesam-Hühnerbrühe, Sojamilch, Chiliöl, Rinderhack mit 5 Gewürzen, Pak Choi, Sojasprossen, mariniertes Ei, Narutomaki & eingelegter Rettich.'
    ),
    price: 16.8,
    category: ref('cat-ramen-chintan'),
    isVegetarian: false,
    isGlutenFree: false,
    available: true,
    order: 4,
  },

  // --- Tsukemen ---
  {
    _id: 'item-tsukemen',
    _type: 'menuItem',
    name: locStr('Tsukemen', 'Tsukemen', 'Tsukemen'),
    nameJp: 'つけ麺',
    slug: slug('tsukemen'),
    description: locTxt(
      'Nouilles froides servies séparément, à tremper dans un bouillon de poulet concentré aux agrumes. Chashu de porc, œuf mariné, bambou & nori.',
      'Cold noodles served separately, dipped into a concentrated citrus chicken broth. Pork chashu, marinated egg, bamboo & nori.',
      'Kalte Nudeln separat serviert, in eine konzentrierte Zitrus-Hühnerbrühe getaucht. Schweine-Chashu, mariniertes Ei, Bambus & Nori.'
    ),
    price: 16.5,
    category: ref('cat-tsukemen'),
    isVegetarian: false,
    isGlutenFree: false,
    available: true,
    order: 1,
  },

  // --- Mazesoba ---
  {
    _id: 'item-chashu-mazesoba',
    _type: 'menuItem',
    name: locStr('Chashu Mazesoba', 'Chashu Mazesoba', 'Chashu Mazesoba'),
    nameJp: 'チャーシュー油そば',
    slug: slug('chashu-mazesoba'),
    description: locTxt(
      'Nouilles fraîches maison sans bouillon, chashu de porc, sauce soja, œuf, daikon mariné, oignons frits, nori, narutomaki & ciboulette. À mélanger.',
      'House-made fresh noodles without broth, pork chashu, soy sauce, egg, pickled daikon, fried onions, nori, narutomaki & chives. Mix well.',
      'Hausgemachte frische Nudeln ohne Brühe, Schweine-Chashu, Sojasauce, Ei, eingelegter Rettich, Röstzwiebeln, Nori, Narutomaki & Schnittlauch. Gut mischen.'
    ),
    price: 15.8,
    category: ref('cat-mazesoba'),
    isVegetarian: false,
    isGlutenFree: false,
    available: true,
    order: 1,
  },
  {
    _id: 'item-karaage-mazesoba',
    _type: 'menuItem',
    name: locStr('Karaage Mazesoba', 'Karaage Mazesoba', 'Karaage Mazesoba'),
    nameJp: '唐揚げ油そば',
    slug: slug('karaage-mazesoba'),
    description: locTxt(
      'Nouilles fraîches maison sans bouillon, poulet frit croustillant, sauce soja, œuf mariné, daikon mariné, nori, narutomaki & ciboulette. À mélanger.',
      'House-made fresh noodles without broth, crispy fried chicken, soy sauce, marinated egg, pickled daikon, nori, narutomaki & chives. Mix well.',
      'Hausgemachte frische Nudeln ohne Brühe, knusprig frittiertes Hühnchen, Sojasauce, mariniertes Ei, eingelegter Rettich, Nori, Narutomaki & Schnittlauch. Gut mischen.'
    ),
    price: 15.8,
    category: ref('cat-mazesoba'),
    isVegetarian: false,
    isGlutenFree: false,
    available: true,
    order: 2,
  },

  // --- Soba ---
  {
    _id: 'item-kamo-soba',
    _type: 'menuItem',
    name: locStr('Kamo Soba', 'Kamo Soba', 'Kamo Soba'),
    nameJp: '鴨そば',
    slug: slug('kamo-soba'),
    description: locTxt(
      'Nouilles de sarrasin maison, bouillon tsuyu, magret de canard, œuf mariné, bambou & ciboulette.',
      'House-made buckwheat noodles, tsuyu broth, duck breast, marinated egg, bamboo & chives.',
      'Hausgemachte Buchweizennudeln, Tsuyu-Brühe, Entenbrust, mariniertes Ei, Bambus & Schnittlauch.'
    ),
    price: 17.5,
    category: ref('cat-soba'),
    isVegetarian: false,
    isGlutenFree: false,
    available: true,
    order: 1,
  },

  // --- Udon ---
  {
    _id: 'item-udon-karaage',
    _type: 'menuItem',
    name: locStr('Udon Karaage', 'Karaage Udon', 'Karaage Udon'),
    nameJp: '唐揚げうどん',
    slug: slug('udon-karaage'),
    description: locTxt(
      'Udon épaisses en bouillon dashi, poulet frit croustillant, ciboulette & wakame.',
      'Thick udon in dashi broth, crispy fried chicken, chives & wakame.',
      'Dicke Udon in Dashi-Brühe, knusprig frittiertes Hühnchen, Schnittlauch & Wakame.'
    ),
    price: 14.5,
    category: ref('cat-udon'),
    isVegetarian: false,
    isGlutenFree: false,
    available: true,
    order: 1,
  },

  // --- Desserts ---
  {
    _id: 'item-tiramisu',
    _type: 'menuItem',
    name: locStr('Tiramisu Framboise Litchi', 'Raspberry Lychee Tiramisu', 'Himbeer-Litschi-Tiramisu'),
    nameJp: 'ティラミス',
    slug: slug('tiramisu-framboise-litchi'),
    description: locTxt(
      'Tiramisu revisité aux saveurs framboise et litchi.',
      'Tiramisu reimagined with raspberry and lychee flavours.',
      'Tiramisu neu interpretiert mit Himbeer- und Litschi-Aromen.'
    ),
    price: 7.5,
    category: ref('cat-desserts'),
    isVegetarian: true,
    isGlutenFree: false,
    available: true,
    order: 1,
  },
  {
    _id: 'item-mochi',
    _type: 'menuItem',
    name: locStr('Mochi glacé', 'Ice Cream Mochi', 'Mochi-Eis'),
    nameJp: 'もち',
    slug: slug('mochi-glace'),
    description: locTxt(
      'Pâte de riz glutineux fourrée de glace. 3 pièces, parfums du moment.',
      'Glutinous rice cake filled with ice cream. 3 pieces, seasonal flavours.',
      'Klebreiskuchen gefüllt mit Eis. 3 Stück, saisonale Sorten.'
    ),
    price: 6.5,
    category: ref('cat-desserts'),
    isVegetarian: true,
    isGlutenFree: true,
    available: true,
    order: 2,
  },
  {
    _id: 'item-panna-cotta',
    _type: 'menuItem',
    name: locStr('Panna Cotta Matcha', 'Matcha Panna Cotta', 'Matcha Panna Cotta'),
    nameJp: 'パンナコッタ',
    slug: slug('panna-cotta-matcha'),
    description: locTxt(
      'Panna cotta au thé vert matcha, coulis de fruits rouges.',
      'Matcha green tea panna cotta, red berry coulis.',
      'Matcha-Grüntee-Panna-Cotta mit rotem Beerencoulis.'
    ),
    price: 6.5,
    category: ref('cat-desserts'),
    isVegetarian: true,
    isGlutenFree: true,
    available: true,
    order: 3,
  },
];

// ─── 4. Menu Extras (suppléments) ──────────────────────────────────
const menuExtras = [
  {
    _id: 'extra-chashu',
    _type: 'menuExtra',
    name: locStr('Chashu supplémentaire', 'Extra chashu', 'Zusätzliches Chashu'),
    price: 3,
    order: 1,
    available: true,
  },
  {
    _id: 'extra-oeuf',
    _type: 'menuExtra',
    name: locStr('Œuf mariné', 'Marinated egg', 'Mariniertes Ei'),
    price: 1.5,
    order: 2,
    available: true,
  },
  {
    _id: 'extra-nouilles',
    _type: 'menuExtra',
    name: locStr('Portion de nouilles', 'Extra noodles', 'Zusätzliche Nudeln'),
    price: 2.5,
    order: 3,
    available: true,
  },
  {
    _id: 'extra-nori',
    _type: 'menuExtra',
    name: locStr('Nori (3 feuilles)', 'Nori (3 sheets)', 'Nori (3 Blätter)'),
    price: 1,
    order: 4,
    available: true,
  },
  {
    _id: 'extra-bambou',
    _type: 'menuExtra',
    name: locStr('Bambou mariné', 'Marinated bamboo', 'Marinierter Bambus'),
    price: 1.5,
    order: 5,
    available: true,
  },
];

// ─── 5. Menu Formules ──────────────────────────────────────────────
const menuFormules = [
  {
    _id: 'formule-gyoza',
    _type: 'menuFormule',
    name: locStr('Menu Gyoza', 'Gyoza Set', 'Gyoza-Menü'),
    price: 21.5,
    description: locTxt(
      'Un menu complet pour les amateurs de gyoza.',
      'A complete set for gyoza lovers.',
      'Ein komplettes Menü für Gyoza-Liebhaber.'
    ),
    includedItems: ['5 Gyoza', '1 Ramen au choix'],
    order: 1,
  },
  {
    _id: 'formule-enfant',
    _type: 'menuFormule',
    name: locStr('Menu Enfant « Little Tokyo »', 'Kids Menu "Little Tokyo"', 'Kindermenü „Little Tokyo"'),
    price: 9.5,
    description: locTxt(
      'Pour les petits gourmands. Mini ramen avec bouillon doux et une boisson.',
      'For young foodies. Mini ramen with mild broth and a drink.',
      'Für kleine Feinschmecker. Mini-Ramen mit milder Brühe und einem Getränk.'
    ),
    includedItems: ['1 Mini Ramen', '1 Boisson'],
    order: 2,
  },
];

// ─── 6. Page "Notre Histoire" ──────────────────────────────────────
const notreHistoire = {
  _id: 'page-notre-histoire',
  _type: 'page',
  title: locStr('Notre histoire', 'Our story', 'Unsere Geschichte'),
  slug: slug('notre-histoire'),
  sections: [
    {
      _key: key(),
      _type: 'object',
      heading: locStr('La passion du ramen', 'A passion for ramen', 'Die Leidenschaft für Ramen'),
      body: locTxt(
        'UMAÏ est né du rêve de Loan et Fabrice. Formée au Japon auprès de maîtres ramen, Loan a ouvert ce noodle bar en 2021 au cœur de la Krutenau, à Strasbourg. Chaque bol est un hommage aux ramen-ya de Tokyo : un produit simple, exécuté avec une rigueur sans compromis.',
        'UMAÏ was born from the dream of Loan and Fabrice. Trained in Japan by ramen masters, Loan opened this noodle bar in 2021 in the heart of the Krutenau district, Strasbourg. Each bowl is a tribute to Tokyo\'s ramen-ya: a simple product, executed with uncompromising precision.',
        'UMAÏ entstand aus dem Traum von Loan und Fabrice. Ausgebildet in Japan bei Ramen-Meistern, eröffnete Loan 2021 diese Nudelbar im Herzen des Krutenau-Viertels in Straßburg. Jede Schüssel ist eine Hommage an Tokios Ramen-ya: ein einfaches Produkt, mit kompromissloser Präzision zubereitet.'
      ),
    },
    {
      _key: key(),
      _type: 'object',
      heading: locStr('Le fait maison, chaque jour', 'Handmade, every day', 'Jeden Tag hausgemacht'),
      body: locTxt(
        'Nos nouilles sont pétries et tirées chaque matin à partir de farine du moulin de Sarralbe. Nos bouillons mijotent plus de 6 heures pour extraire toute la richesse des os et des légumes. Rien n\'est industriel, rien n\'est raccourci.',
        'Our noodles are kneaded and pulled every morning using flour from the Sarralbe mill. Our broths simmer for over 6 hours to extract every ounce of richness from bones and vegetables. Nothing is industrial, nothing is shortcut.',
        'Unsere Nudeln werden jeden Morgen aus Mehl der Mühle von Sarralbe geknetet und gezogen. Unsere Brühen köcheln über 6 Stunden, um den vollen Geschmack aus Knochen und Gemüse zu entfalten. Nichts ist industriell, nichts wird abgekürzt.'
      ),
    },
    {
      _key: key(),
      _type: 'object',
      heading: locStr('100% local, 100% authentique', '100% local, 100% authentic', '100% lokal, 100% authentisch'),
      body: locTxt(
        'Poulet alsacien, légumes de saison, œufs fermiers : nous travaillons avec des producteurs et éleveurs de la région. Ce que le Japon nous a appris, c\'est le respect absolu du produit. Ce que l\'Alsace nous offre, c\'est la qualité de ces produits.',
        'Alsatian chicken, seasonal vegetables, farm eggs: we work with local producers and farmers. What Japan taught us is absolute respect for the ingredient. What Alsace gives us is the quality of those ingredients.',
        'Elsässisches Huhn, saisonales Gemüse, Bauernhof-Eier: Wir arbeiten mit regionalen Erzeugern und Züchtern. Was uns Japan gelehrt hat, ist der absolute Respekt vor dem Produkt. Was uns das Elsass bietet, ist die Qualität dieser Produkte.'
      ),
    },
    {
      _key: key(),
      _type: 'object',
      heading: locStr('L\'expérience UMAÏ', 'The UMAÏ experience', 'Das UMAÏ-Erlebnis'),
      body: locTxt(
        'Un comptoir, quelques tables, le bruit des nouilles qu\'on aspire. UMAÏ, c\'est l\'ambiance d\'un noodle bar japonais transposée rue des Orphelins, au cœur du quartier Krutenau. Venez comme vous êtes, repartez rassasié.',
        'A counter, a few tables, the sound of noodles being slurped. UMAÏ is the atmosphere of a Japanese noodle bar, transposed to rue des Orphelins in the heart of the Krutenau quarter. Come as you are, leave satisfied.',
        'Eine Theke, ein paar Tische, das Geräusch von Nudeln, die geschlürft werden. UMAÏ ist die Atmosphäre einer japanischen Nudelbar, übertragen in die Rue des Orphelins im Herzen des Krutenau-Viertels. Kommen Sie wie Sie sind, gehen Sie satt.'
      ),
    },
  ],
};

// ─── 7. Gallery placeholders ───────────────────────────────────────
// (No images yet — entries ready for photo upload in Studio)
const galleryItems = [
  { _id: 'gal-01', _type: 'gallery', title: locStr('Tori Paitan', 'Tori Paitan', 'Tori Paitan'), alt: locStr('Bol de ramen tori paitan crémeux avec chashu et œuf mariné', 'Creamy tori paitan ramen bowl with chashu and marinated egg', 'Cremige Tori-Paitan-Ramen-Schüssel mit Chashu und mariniertem Ei'), order: 1 },
  { _id: 'gal-02', _type: 'gallery', title: locStr('Préparation des nouilles', 'Noodle making', 'Nudelherstellung'), alt: locStr('Nouilles fraîches tirées à la main dans la cuisine', 'Fresh hand-pulled noodles in the kitchen', 'Frische handgezogene Nudeln in der Küche'), order: 2 },
  { _id: 'gal-03', _type: 'gallery', title: locStr('Gyoza grillés', 'Grilled gyoza', 'Gegrillte Gyoza'), alt: locStr('Cinq gyoza dorés et croustillants sur assiette', 'Five golden crispy gyoza on a plate', 'Fünf goldene knusprige Gyoza auf einem Teller'), order: 3 },
  { _id: 'gal-04', _type: 'gallery', title: locStr('La salle', 'The dining room', 'Der Gastraum'), alt: locStr('Intérieur chaleureux du restaurant UMAÏ Ramen', 'Warm interior of UMAÏ Ramen restaurant', 'Warmes Interieur des UMAÏ Ramen Restaurants'), order: 4 },
  { _id: 'gal-05', _type: 'gallery', title: locStr('Miso Ramen', 'Miso Ramen', 'Miso Ramen'), alt: locStr('Bol de miso ramen fumant avec garnitures colorées', 'Steaming miso ramen bowl with colourful toppings', 'Dampfende Miso-Ramen-Schüssel mit bunten Toppings'), order: 5 },
  { _id: 'gal-06', _type: 'gallery', title: locStr('Façade UMAÏ', 'UMAÏ storefront', 'UMAÏ Fassade'), alt: locStr('Devanture du restaurant UMAÏ Ramen rue des Orphelins', 'UMAÏ Ramen storefront on rue des Orphelins', 'Fassade des UMAÏ Ramen Restaurants in der Rue des Orphelins'), order: 6 },
];

// ─── Execute mutations ─────────────────────────────────────────────
async function seed() {
  const allDocs = [
    siteSettings,
    ...categories,
    ...menuItems,
    ...menuExtras,
    ...menuFormules,
    notreHistoire,
    ...galleryItems,
  ];

  const mutations = allDocs.map((doc) => ({
    createOrReplace: doc,
  }));

  console.log(`Sending ${mutations.length} mutations to Sanity…`);

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
    body: JSON.stringify({ mutations }),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('Sanity API error:', JSON.stringify(json, null, 2));
    process.exit(1);
  }

  console.log(`Done — ${json.results?.length ?? 0} documents created/replaced.`);

  // Summary
  const counts = {};
  for (const doc of allDocs) {
    counts[doc._type] = (counts[doc._type] || 0) + 1;
  }
  console.log('\nSummary:');
  for (const [type, count] of Object.entries(counts)) {
    console.log(`  ${type}: ${count}`);
  }
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

// Summer menu 2026 — content transcribed from EK's final PDF (UMAI_MENU_ETE2026 v4).
// Rendered as native HTML on /carte-ete (brand-styled) instead of flat PDF images,
// so it reflows on mobile, is selectable/SEO-indexable, and stays on-brand.
// Item names/descriptions are FR (fallback, like the main /menu); section
// titles/subtitles are localized FR/EN/DE.

export type Loc = { fr: string; en: string; de: string };

export type Dish = {
  name: string;
  /** single price, e.g. "15,90" */
  price?: string;
  /** portioned/multi price line, e.g. "3 pcs — 4,90 · 6 pcs — 8,90 · 9 pcs — 11,90" */
  portions?: string;
  /** short FR description */
  desc?: string;
  /** small FR note under the dish (e.g. spice notice) */
  note?: string;
  /** show a "vegetarian option available" note */
  veg?: boolean;
};

export type Section = {
  key: string;
  title: Loc;
  sub?: Loc;
  /** serving size note shown next to the title, e.g. "20cl" */
  unit?: string;
  dishes: Dish[];
  /** localized note shown after the dishes (spice / customization) */
  footnote?: Loc;
  /** which column group: 'food' | 'drinks' */
  group: 'food' | 'drinks';
};

const L = (fr: string, en: string, de: string): Loc => ({ fr, en, de });

export const SUMMER_MENU: Section[] = [
  {
    key: 'tantan',
    group: 'food',
    title: L('Tantan Umaï', 'Tantan Umaï', 'Tantan Umaï'),
    sub: L(
      'Notre spécialité maison depuis 2021',
      'Our house speciality since 2021',
      'Unsere Spezialität seit 2021'
    ),
    dishes: [
      {
        name: 'Tantan Ramen',
        price: '15,90',
        desc: 'Notre spécialité maison. Ramen crémeux au sésame et lait de soja, bœuf aux 5 épices, pakchoï, pousses de soja, daikon, demi-œuf mariné et huile de piment 🌶️.',
      },
      {
        name: 'Tantan Mazesoba',
        price: '15,90',
        desc: 'Nouilles à mélanger sans bouillon, bœuf aux 5 épices, huile de piment 🌶️, œuf onsen, cébette et cacahuètes.',
      },
      {
        name: 'Tantan Tsukemen',
        price: '16,90',
        desc: 'Nouilles à tremper dans un bouillon crémeux au sésame et lait de soja, relevé d’huile de piment 🌶️, bœuf aux 5 épices, œuf mariné et cébette.',
      },
    ],
    footnote: L(
      '🌶️ Nos Tantan sont servis avec de l’huile de piment. Version sans piment ou plus relevée sur demande.',
      '🌶️ Our Tantan come with chili oil. Milder or spicier version on request.',
      '🌶️ Unsere Tantan werden mit Chiliöl serviert. Mildere oder schärfere Variante auf Anfrage.'
    ),
  },
  {
    key: 'tsukemen',
    group: 'food',
    title: L('Tsukemen', 'Tsukemen', 'Tsukemen'),
    sub: L(
      'Nouilles froides à tremper dans un bouillon chaud et concentré. Servis avec un œuf mariné entier, des pousses de bambou, de la cébette et 2 tranches de chashu porc.',
      'Cold noodles to dip in a hot, concentrated broth. Served with a whole marinated egg, bamboo shoots, spring onion and 2 slices of pork chashu.',
      'Kalte Nudeln zum Eintauchen in eine heiße, konzentrierte Brühe. Serviert mit einem ganzen marinierten Ei, Bambussprossen, Frühlingszwiebel und 2 Scheiben Schweine-Chashu.'
    ),
    dishes: [
      { name: 'Miso', price: '15,90', desc: 'Bouillon de poulet au miso, riche et crémeux.' },
      { name: 'Noukou Gyokai', price: '16,90', desc: 'Bouillon de poulet et poisson, aux saveurs marines et umami.' },
      { name: 'Curry Tomato', price: '15,90', desc: 'Bouillon de légumes au curry japonais et à la tomate.' },
    ],
    footnote: L(
      'Ⓥ Personnalisez votre tsukemen : version végétarienne (tempura de légumes), chashu poulet ou tempuras de crevettes disponibles sur demande.',
      'Ⓥ Customize your tsukemen: vegetarian version (vegetable tempura), chicken chashu or shrimp tempura available on request.',
      'Ⓥ Personalisieren Sie Ihr Tsukemen: vegetarische Variante (Gemüse-Tempura), Hähnchen-Chashu oder Garnelen-Tempura auf Anfrage.'
    ),
  },
  {
    key: 'mazesoba',
    group: 'food',
    title: L('Mazesoba', 'Mazesoba', 'Mazesoba'),
    sub: L(
      'Nouilles sans bouillon à mélanger. Servis avec un œuf onsen, de la cébette, du daikon et du nori.',
      'Brothless noodles to mix. Served with an onsen egg, spring onion, daikon and nori.',
      'Nudeln ohne Brühe zum Mischen. Serviert mit Onsen-Ei, Frühlingszwiebel, Daikon und Nori.'
    ),
    dishes: [
      { name: 'Karaage Mazesoba', price: '14,90', desc: 'Poulet frit japonais.' },
      { name: 'Chashu Mazesoba', price: '14,90', desc: 'Porc braisé au soja et oignons frits.' },
    ],
  },
  {
    key: 'ramen',
    group: 'food',
    title: L('Ramen', 'Ramen', 'Ramen'),
    sub: L(
      'Servis avec un bouillon clair de poulet, shoyu tare, huile de niboshi, demi-œuf mariné, pakchoï, pousses de bambou et cébette.',
      'Served with a clear chicken broth, shoyu tare, niboshi oil, half a marinated egg, pak choi, bamboo shoots and spring onion.',
      'Serviert mit klarer Hühnerbrühe, Shoyu-Tare, Niboshi-Öl, halbem mariniertem Ei, Pak Choi, Bambussprossen und Frühlingszwiebel.'
    ),
    dishes: [
      { name: 'Tokyo', price: '13,90', desc: 'Chashu porc.' },
      { name: 'Yuzu', price: '14,90', desc: 'Jus de yuzu, chashu de poulet et ail frit.' },
    ],
  },
  {
    key: 'hiyashi',
    group: 'food',
    title: L('Hiyashi Chuka', 'Hiyashi Chuka', 'Hiyashi Chuka'),
    sub: L(
      'Salade de nouilles froides, sauce sésame & soja',
      'Cold noodle salad, sesame & soy sauce',
      'Kalter Nudelsalat, Sesam- & Sojasauce'
    ),
    dishes: [
      { name: 'Hiyashi chuka poulet', price: '14,90', desc: 'Concombre, carotte, daikon acidulé' },
      { name: 'Hiyashi chuka tempura', price: '15,90', desc: 'Concombre, carotte, daikon acidulé' },
    ],
  },
  {
    key: 'partager',
    group: 'food',
    title: L('À partager', 'To share', 'Zum Teilen'),
    dishes: [
      { name: 'Karaage — Poulet frit', portions: '3 pcs — 4,90 · 6 pcs — 8,90 · 9 pcs — 11,90' },
      { name: 'Gyoza — Raviolis grillés', desc: 'Poulet · Porc · Légumes', portions: '3 pcs — 4,90 · 6 pcs — 8,90 · 9 pcs — 11,90' },
      { name: 'Takoyaki — Boulettes fondantes au poulpe', portions: '3 pcs — 4,90 · 6 pcs — 8,90 · 9 pcs — 11,90' },
      { name: 'Edamame — À la fleur de sel', price: '4,90' },
    ],
  },
  {
    key: 'desserts',
    group: 'food',
    title: L('Desserts', 'Desserts', 'Desserts'),
    dishes: [
      { name: 'Mochis glacés', price: '5,90', desc: 'Sakura, Passion' },
      { name: 'Glace artisanale', portions: '1 boule — 3,50 · 2 boules — 6,50', desc: 'Matcha, Sésame noir, Yuzu, Coco, Mangue, Passion, Vanille' },
      { name: 'Tiramisu matcha', price: '6,90' },
      { name: 'Tiramisu framboise & litchi', price: '6,90' },
      { name: 'Café ou thé gourmand', price: '9,90' },
    ],
  },
  {
    key: 'bieres',
    group: 'drinks',
    title: L('Bières', 'Beers', 'Biere'),
    dishes: [
      { name: 'Asahi pression', portions: '25cl — 4,90 · 50cl — 7,50' },
      { name: 'Asahi Yuzu', portions: '25cl — 5,40 · 50cl — 8,40' },
      { name: 'Asahi Saké', portions: '25cl — 5,50 · 50cl — 8,50' },
      { name: 'Coedo IPA', price: '6,90', desc: 'Bouteille 33cl' },
    ],
  },
  {
    key: 'sour',
    group: 'drinks',
    title: L('Umaï Sour', 'Umaï Sour', 'Umaï Sour'),
    unit: '20cl',
    sub: L(
      'Cocktails japonais frais et pétillants à base de shochu',
      'Fresh, sparkling Japanese shochu cocktails',
      'Frische, spritzige japanische Shochu-Cocktails'
    ),
    dishes: [
      { name: 'Yuzu Sour', price: '9,00', desc: 'Shochu, thé yuzu & soda' },
      { name: 'Ume Sour', price: '9,00', desc: 'Shochu, umeshu & soda' },
    ],
  },
  {
    key: 'highball',
    group: 'drinks',
    title: L('Highball', 'Highball', 'Highball'),
    unit: '30cl',
    sub: L(
      'Whisky japonais allongé au soda, frais et léger',
      'Japanese whisky with soda, fresh and light',
      'Japanischer Whisky mit Soda, frisch und leicht'
    ),
    dishes: [
      { name: 'Highball', price: '8,50' },
      { name: 'Ginger highball', price: '9,00' },
    ],
  },
  {
    key: 'spritz',
    group: 'drinks',
    title: L('Spritz', 'Spritz', 'Spritz'),
    unit: '25cl',
    sub: L('Cocktail pétillant à base de prosecco', 'Sparkling prosecco cocktail', 'Prickelnder Prosecco-Cocktail'),
    dishes: [
      { name: 'Yuzu Spritz', price: '8,90' },
      { name: 'Umeshu Spritz', price: '8,90' },
      { name: 'Peach Passion Spritz', price: '8,90' },
    ],
  },
  {
    key: 'cocktails',
    group: 'drinks',
    title: L('Cocktails Signature', 'Signature Cocktails', 'Signature-Cocktails'),
    unit: '20cl',
    dishes: [
      { name: 'Natsu', price: '9,00', desc: 'Saké pétillant, matcha, basilic, concombre, pointe de ginger ale' },
      { name: 'Sakura Blossom', price: '8,50', desc: 'Litchi, rose, saké pétillant' },
      { name: 'Nana', price: '9,00', desc: 'Gin, litchi, rose, citron, limonade' },
      { name: 'Pear & Ginger', price: '9,50', desc: 'Poire, gingembre, shochu, soda' },
    ],
  },
  {
    key: 'vins',
    group: 'drinks',
    title: L('Vins', 'Wines', 'Weine'),
    sub: L('Verre 12cl — 5,50 · Bouteille 75cl — 24,00', 'Glass 12cl — 5,50 · Bottle 75cl — 24,00', 'Glas 12cl — 5,50 · Flasche 75cl — 24,00'),
    dishes: [
      { name: 'Blanc — Riesling Alsace, Sperry' },
      { name: 'Blanc — Chardonnay Naturalys, Gérard Bertrand' },
      { name: 'Rouge — Belleruche, M. Chapoutier' },
    ],
  },
  {
    key: 'sansAlcool',
    group: 'drinks',
    title: L('Sans Alcool', 'Non-Alcoholic', 'Alkoholfrei'),
    dishes: [
      { name: 'Hachiko', price: '7,50', desc: '30cl · Yuzu, pêche, ginger ale' },
      { name: 'Lovely', price: '7,50', desc: '30cl · Rose, litchi, citron, limonade' },
      { name: 'Thé glacé yuzu maison', price: '4,20', desc: '30cl · Frais, légèrement acidulé' },
      { name: 'Thé glacé pêche', price: '4,20', desc: '30cl' },
      { name: 'Ramune', price: '5,60', desc: '20cl · Yuzu, Fraise, Litchi' },
      { name: 'Coca-Cola / Zéro', price: '3,50', desc: '33cl' },
      { name: 'Sirop à l’eau', price: '3,00', desc: '25cl · Grenadine, Fraise, Citron, Pêche, Litchi, Passion, Rose' },
      { name: 'Diabolo', price: '3,50', desc: '25cl · Grenadine, Fraise, Citron, Pêche, Litchi, Passion, Rose' },
      { name: 'Lisbeth plate', price: '3,50', desc: '50cl' },
      { name: 'Lisbeth pétillante', price: '3,50', desc: '50cl' },
    ],
  },
  {
    key: 'sake',
    group: 'drinks',
    title: L('Saké Japonais', 'Japanese Sake', 'Japanischer Sake'),
    unit: '10cl',
    dishes: [
      { name: 'Shirakabegura', price: '9,80', desc: 'Frais et léger' },
      { name: 'Fu', price: '9,80', desc: 'Fruité, très léger' },
      { name: 'Jidai Okure', price: '9,80', desc: 'Rond et équilibré' },
      { name: 'Junmaishu', price: '9,80', desc: 'Puissant et riche' },
      { name: 'Atelier du Saké', price: '9,80', desc: 'Classique japonais' },
      { name: 'Trio dégustation', price: '18,00', desc: '3 × 6cl' },
    ],
  },
  {
    key: 'digestifs',
    group: 'drinks',
    title: L('Digestifs', 'Digestifs', 'Digestifs'),
    unit: '4cl',
    dishes: [
      { name: 'Toki', price: '8,50' },
      { name: 'Nikka from the Barrel', price: '10,50' },
      { name: 'Hibiki', price: '12,50' },
      { name: 'Ryoma', price: '8,50', desc: 'Rhum japonais' },
    ],
  },
  {
    key: 'cafeThe',
    group: 'drinks',
    title: L('Café & Thé', 'Coffee & Tea', 'Kaffee & Tee'),
    dishes: [
      { name: 'Café expresso', price: '2,40' },
      { name: 'Double expresso', price: '3,60' },
      { name: 'Café au lait', price: '3,20' },
      { name: 'Thé vert japonais', price: '4,50' },
      { name: 'Infusion', price: '4,50' },
    ],
  },
];

import type { StructureBuilder } from 'sanity/structure';

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('UMAI Ramen')
    .items([
      // Restaurant info (singleton)
      S.listItem()
        .title('Infos du restaurant')
        .id('siteSettings')
        .icon(() => '🏠')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Infos du restaurant')
        ),

      S.divider(),

      // Menu section
      S.listItem()
        .title('La carte')
        .icon(() => '🍜')
        .child(
          S.list()
            .title('La carte')
            .items([
              S.listItem()
                .title('Catégories')
                .icon(() => '📂')
                .schemaType('menuCategory')
                .child(S.documentTypeList('menuCategory').title('Catégories du menu')),

              S.listItem()
                .title('Plats')
                .icon(() => '🍲')
                .schemaType('menuItem')
                .child(S.documentTypeList('menuItem').title('Plats')),

              S.listItem()
                .title('Suppléments')
                .icon(() => '➕')
                .schemaType('menuExtra')
                .child(S.documentTypeList('menuExtra').title('Suppléments')),

              S.listItem()
                .title('Formules')
                .icon(() => '🎯')
                .schemaType('menuFormule')
                .child(S.documentTypeList('menuFormule').title('Formules')),
            ])
        ),

      S.divider(),

      // Gallery
      S.listItem()
        .title('Photos')
        .icon(() => '📷')
        .schemaType('gallery')
        .child(S.documentTypeList('gallery').title('Photos')),

      S.divider(),

      // Pages
      S.listItem()
        .title('Pages')
        .icon(() => '📄')
        .schemaType('page')
        .child(S.documentTypeList('page').title('Pages')),
    ]);

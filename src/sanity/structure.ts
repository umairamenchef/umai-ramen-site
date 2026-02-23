import type { StructureBuilder } from 'sanity/structure';

export const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      // Singleton: Site Settings
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),

      S.divider(),

      // Menu
      S.listItem()
        .title('Menu')
        .child(
          S.list()
            .title('Menu')
            .items([
              S.listItem()
                .title('Menu Categories')
                .schemaType('menuCategory')
                .child(S.documentTypeList('menuCategory').title('Menu Categories')),

              S.listItem()
                .title('Menu Items')
                .schemaType('menuItem')
                .child(S.documentTypeList('menuItem').title('Menu Items')),

              S.listItem()
                .title('Menu Extras')
                .schemaType('menuExtra')
                .child(S.documentTypeList('menuExtra').title('Menu Extras')),

              S.listItem()
                .title('Menu Formules')
                .schemaType('menuFormule')
                .child(S.documentTypeList('menuFormule').title('Menu Formules')),
            ])
        ),

      S.divider(),

      // Gallery
      S.listItem()
        .title('Gallery')
        .schemaType('gallery')
        .child(S.documentTypeList('gallery').title('Gallery')),

      S.divider(),

      // Pages
      S.listItem()
        .title('Pages')
        .schemaType('page')
        .child(S.documentTypeList('page').title('Pages')),
    ]);

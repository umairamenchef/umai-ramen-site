import { defineQuery } from 'next-sanity';

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0]{
    catchphrase,
    accentColor,
    clickCollectUrl,
    reservationUrl,
    uberEatsUrl,
    eazeeLinkUrl,
    phone,
    address,
    openingHours,
    socialLinks
  }
`);

export const MENU_CATEGORIES_QUERY = defineQuery(`
  *[_type == "menuCategory"] | order(order asc) {
    _id,
    name,
    slug,
    description,
    "items": *[_type == "menuItem" && references(^._id) && available == true] | order(order asc) {
      _id,
      name,
      nameJp,
      description,
      price,
      image,
      isVegetarian,
      isGlutenFree
    }
  }
`);

export const GALLERY_QUERY = defineQuery(`
  *[_type == "gallery"] | order(order asc) {
    _id,
    title,
    image,
    alt
  }
`);

export const PAGE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == $slug][0]{
    title,
    slug,
    content,
    sections[]{
      heading,
      body,
      image
    }
  }
`);

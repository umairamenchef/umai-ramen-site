import { defineQuery } from 'next-sanity';

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0]{
    reservationUrl, uberEatsUrl, clickCollectUrl, obypayUrl, eazeeLinkUrl,
    phone, address, openingHours, socialLinks
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

export const MENU_EXTRAS_QUERY = defineQuery(`
  *[_type == "menuExtra" && available == true] | order(order asc) {
    _id, name, price
  }
`);

export const MENU_FORMULES_QUERY = defineQuery(`
  *[_type == "menuFormule"] | order(order asc) {
    _id, name, price, description, includedItems
  }
`);

export const GALLERY_QUERY = defineQuery(`
  *[_type == "gallery"] | order(order asc) {
    _id,
    title,
    alt,
    "image": image{ asset->{ _id, url, metadata { dimensions { width, height } } } }
  }
`);

export const HOMEPAGE_QUERY = defineQuery(`
  {
    "settings": *[_type == "siteSettings"][0]{
      catchphrase, heroImage, reservationUrl, uberEatsUrl, obypayUrl, clickCollectUrl, socialLinks
    },
    "menuCategories": *[_type == "menuCategory"] | order(order asc) [0...3]{
      _id, name, slug, "image": *[_type == "menuItem" && references(^._id) && available == true][0].image
    },
    "galleryPreview": *[_type == "gallery"] | order(order asc) [0...6]{
      _id, title, alt, image
    }
  }
`);

export const NOTRE_HISTOIRE_QUERY = defineQuery(`
  *[_type == "page" && slug.current == "notre-histoire"][0]{
    title,
    sections[]{
      heading,
      body,
      image
    }
  }
`);

export const INFOS_QUERY = defineQuery(`
  *[_type == "siteSettings"][0]{
    phone, address, openingHours, socialLinks
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

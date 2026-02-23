import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { frFRLocale } from '@sanity/locale-fr-fr';
import { schemaTypes } from './schemaTypes';
import { structure } from './structure';
import { projectId, dataset } from './env';

export default defineConfig({
  name: 'umai-ramen',
  title: 'UMAI Ramen',
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    frFRLocale(),
  ],
  schema: { types: schemaTypes },
});

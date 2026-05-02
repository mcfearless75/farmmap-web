import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

// projectId must be non-empty for Sanity to accept the config.
// Use a placeholder at build time when the env var isn't set.
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'placeholder'
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET    || 'production'

export default defineConfig({
  name: 'farmmap',
  title: 'Farmmap Products',
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  schema: { types: schemaTypes },
})

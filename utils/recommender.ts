import type { RawDatabase, RawTool, RecommendationResult, JsonLdRef } from '~/types'

export const SCORE_WEIGHTS = {
  match_envo: 4,
  match_host: 4,
  global_fallback: 1,
  composite_bonus: 1,
  gtdb_bonus: 2,
  globdb_bonus: 3,
  part_score_inheritance: 1,
  broad_context_bonus: 1,
}

export const SAMPLE_FILTER: Record<string, [string | null, string | null]> = {
  'Human gut': ['ENVO_00002003', 'NCBITaxon_9606'],
  'Human skin': ['ENVO_2100003', 'NCBITaxon_9606'],
  'Human mouth': ['ENVO_08000002', 'NCBITaxon_9606'],
  'Mouse gut (Mus musculus)': ['ENVO_00002003', 'NCBITaxon_10090'],
  'Soil': ['ENVO_00001998', null],
  'Ocean / Marine water': ['ENVO_00002006', 'ENVO_00002149'],
  'Multi-environments / Global': [null, null],
  "Other / I don't know": [null, null]
}

export const SAMPLE_CATEGORIES: Record<string, string[]> = {
  'Human': ['Human gut', 'Human skin', 'Human mouth'],
  'Animal': ['Mouse gut (Mus musculus)'],
  'Environmental': ['Soil', 'Ocean / Marine water'],
  'Multi-environments / Global': ['Multi-environments / Global'],
  'Other': ["Other / I don't know"]
}

export const TAXON_IRI: Record<string, string> = {
  Bacteria: 'NCBITaxon_2',
  Archaea: 'NCBITaxon_2157',
  Eukaryota: 'NCBITaxon_2759',
  Viruses: 'NCBITaxon_10239',
  Fungi: 'NCBITaxon_4751'
}

export function toList<T>(val: T | T[] | undefined | null): T[] {
  if (val === undefined || val === null) return []
  return Array.isArray(val) ? val : [val]
}

export class CatalogDatabase {
  id: string
  raw: RawDatabase
  sample: JsonLdRef[]
  origin: JsonLdRef[]
  taxonomicScope: JsonLdRef[]
  hasPart: JsonLdRef[]
  isPartOf: JsonLdRef[]
  compatibleTools: any[]

  constructor(id: string, payload: RawDatabase) {
    this.id = id
    this.raw = payload
    this.sample = toList(payload.sample)
    this.origin = toList(payload.origin)
    this.taxonomicScope = toList(payload.taxonomic_scope)
    this.hasPart = toList(payload.hasPart)
    this.isPartOf = toList(payload.isPartOf)
    this.compatibleTools = toList(payload.compatible_tools)
  }
}

export class CatalogTool {
  id: string
  raw: RawTool
  supportsShortreads: boolean
  supportsLongreads: boolean
  strainLevel: boolean
  functionalProfiling: boolean
  ram: number | null
  usesDatabases: any[]

  constructor(id: string, payload: RawTool) {
    this.id = id
    this.raw = payload
    this.supportsShortreads = Boolean(payload.supports_shortreads)
    this.supportsLongreads = Boolean(payload.supports_longreads)
    this.strainLevel = Boolean(payload.strain_level)
    this.functionalProfiling = Boolean(payload.functional_profiling)
    this.ram = payload.ram ?? null
    this.usesDatabases = toList(payload.uses_databases)
  }
}

export class SurveyContext {
  sampleKey: string | null
  originKey: string | null
  selectedOrgs: string[]
  readsKey: string
  prefTaxo: string
  wantsStrain: boolean
  wantsFunc: boolean
  maxRam: number

  constructor(
    sampleKey: string | null,
    originKey: string | null,
    selectedOrgs: string[],
    readsKey: string,
    prefTaxo: string,
    wantsStrain: boolean,
    wantsFunc: boolean,
    maxRam: number
  ) {
    this.sampleKey = sampleKey
    this.originKey = originKey
    this.selectedOrgs = selectedOrgs
    this.readsKey = readsKey
    this.prefTaxo = prefTaxo
    this.wantsStrain = wantsStrain
    this.wantsFunc = wantsFunc
    this.maxRam = maxRam
  }

  get wantsVirus(): boolean { return this.selectedOrgs.includes('Viruses') || this.selectedOrgs.includes('Virus') }
  get wantsFungi(): boolean { return this.selectedOrgs.includes('Fungi') }
  get wantsEuk(): boolean { return this.selectedOrgs.includes('Eukaryota') }
  get wantsBacteria(): boolean { return this.selectedOrgs.includes('Bacteria') }
  get wantsArchaea(): boolean { return this.selectedOrgs.includes('Archaea') }

  get taxonKeys(): string[] {
    return this.selectedOrgs.map(o => TAXON_IRI[o]).filter(Boolean)
  }
}

export function iriKey(iri: string): string {
  for (const sep of ['obo/', 'obo_', 'obo:', 'NCBITaxon_', 'NCBITaxon:']) {
    if (iri.includes(sep)) return iri.split(sep).pop() || iri
  }
  return iri.split('/').pop()?.split('#').pop() || iri
}

export function extractDbScope(dbId: string, databases: Record<string, RawDatabase>): [string[], string[]] {
  const db = databases[dbId]
  if (!db) return [[], []]

  const envoList: string[] = []
  for (const item of toList(db.sample)) {
    if (typeof item === 'object' && item['@id']) {
      envoList.push(iriKey(item['@id']))
    }
  }

  const hostList: string[] = []
  for (const item of toList(db.origin)) {
    if (typeof item === 'object' && item['@id']) {
      hostList.push(iriKey(item['@id']))
    }
  }

  return [envoList, hostList]
}

export function scoreDbEntry(
  dbId: string,
  databases: Record<string, RawDatabase>,
  ctx: SurveyContext,
  relTaxonomySystem?: any
): number {
  const dbObj = databases[dbId]
  const [envoTags, hostTags] = extractDbScope(dbId, databases)

  if (!ctx.sampleKey && !ctx.originKey && hostTags.length > 0) return -1

  const isGlobalScope = envoTags.length === 0 && hostTags.length === 0

  if (ctx.sampleKey && !isGlobalScope) {
    if (!envoTags.includes(ctx.sampleKey)) return -1
  }
  if (ctx.originKey && !isGlobalScope) {
    if (!hostTags.includes(ctx.originKey)) return -1
  }

  let score = 0
  if (ctx.sampleKey && envoTags.includes(ctx.sampleKey)) score += SCORE_WEIGHTS.match_envo
  if (ctx.originKey && hostTags.includes(ctx.originKey)) score += SCORE_WEIGHTS.match_host
  if ((ctx.sampleKey || ctx.originKey) && isGlobalScope) score += SCORE_WEIGHTS.broad_context_bonus
  if (!ctx.sampleKey && !ctx.originKey && envoTags.length === 0) score += SCORE_WEIGHTS.global_fallback

  if (ctx.wantsBacteria || ctx.wantsArchaea) {
    const tsStr = JSON.stringify(relTaxonomySystem || '').toLowerCase()
    if (tsStr.includes('gtdb')) score += SCORE_WEIGHTS.gtdb_bonus
  }

  if (dbId === 'globdb' && !ctx.sampleKey && !ctx.originKey) {
    score += SCORE_WEIGHTS.globdb_bonus
  }

  return score
}

export function toolIsCompatible(tool: CatalogTool, ctx: SurveyContext): boolean {
  if (ctx.readsKey === 'Short Reads' && !tool.supportsShortreads) return false
  if (ctx.readsKey === 'Long Reads' && !tool.supportsLongreads) return false
  if (ctx.wantsStrain && !tool.strainLevel) return false
  if (ctx.wantsFunc && !tool.functionalProfiling) return false
  if (tool.ram && tool.ram > ctx.maxRam) return false
  return true
}

export function recommend(
  rawDatabases: Record<string, RawDatabase>,
  rawTools: Record<string, RawTool>,
  ctx: SurveyContext
): RecommendationResult[] {
  const wrappedDatabases: Record<string, CatalogDatabase> = {}
  for (const [k, v] of Object.entries(rawDatabases)) {
    wrappedDatabases[k] = new CatalogDatabase(k, v)
  }

  const wrappedTools: Record<string, CatalogTool> = {}
  for (const [k, v] of Object.entries(rawTools)) {
    wrappedTools[k] = new CatalogTool(k, v)
  }

  const results: RecommendationResult[] = []

  for (const [toolId, tool] of Object.entries(wrappedTools)) {
    if (!toolIsCompatible(tool, ctx)) continue

    let bestDbScore = -1
    let bestDbId: string | null = null
    let bestDbTs: any = null
    let bestDbRel: any = null

    for (const u of tool.usesDatabases) {
      if (typeof u !== 'object' || !u['@id']) continue
      const dbId = u['@id']
      const ts = u.taxonomy_system

      const prefNorm = (ctx.prefTaxo || '').toLowerCase()
      if (!['any', 'indifférent', 'indifferent', ''].includes(prefNorm)) {
        const tsStr = JSON.stringify(ts || '').toLowerCase()
        if (!tsStr.includes(prefNorm)) continue
      }

      const sc = scoreDbEntry(dbId, rawDatabases, ctx, ts)
      if (sc > bestDbScore) {
        bestDbScore = sc
        bestDbId = dbId
        bestDbTs = ts
        bestDbRel = u
      }
    }

    if (bestDbScore <= 0 || !bestDbId) continue

    const dbObj = wrappedDatabases[bestDbId]
    const releases = toList(bestDbRel?.release).map(String)

    results.push({
      tool_id: toolId,
      tool: tool.raw,
      db_id: bestDbId,
      db: dbObj ? dbObj.raw : {},
      db_ts: bestDbTs,
      db_rel: bestDbRel,
      score: bestDbScore,
      dl: [],
      releases
    })
  }

  return results.sort((a, b) => b.score - a.score)
}
export interface JsonLdRef {
  '@id': string
  label?: string
  [key: string]: any
}

export interface RawDatabase {
  '@id': string
  name?: string
  latest_release?: string
  release?: string
  sample?: JsonLdRef[] | JsonLdRef
  origin?: JsonLdRef[] | JsonLdRef
  taxonomic_scope?: JsonLdRef[] | JsonLdRef
  hasPart?: JsonLdRef[] | JsonLdRef
  isPartOf?: JsonLdRef[] | JsonLdRef
  compatible_tools?: any[]
  homepage?: string
  doi?: string
  [key: string]: any
}

export interface RawTool {
  '@id': string
  name?: string
  description?: string
  latest_release?: string
  citations_count?: number
  supports_shortreads?: boolean
  supports_longreads?: boolean
  strain_level?: boolean
  functional_profiling?: boolean
  ram?: number
  uses_databases?: any[]
  repo?: string
  doc?: string
  doi?: string
  [key: string]: any
}

export interface RecommendationResult {
  tool_id: string
  tool: RawTool
  db_id: string
  db: RawDatabase
  db_ts?: any
  db_rel?: any
  score: number
  dl: any[]
  releases: string[]
  extension_of?: string
  extension_level?: string
}
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  SAMPLE_CATEGORIES,
  SAMPLE_FILTER,
  TAXON_IRI,
  SurveyContext,
  recommend
} from '~/utils/recommender'
import type { RawDatabase, RawTool } from '~/types'

// Données fictives/chargées (à remplacer par des données lues depuis /data)
const databases = ref<Record<string, RawDatabase>>({
  'gtdb': { '@id': 'gtdb', name: 'GTDB Database' },
  'globdb': { '@id': 'globdb', name: 'GlobDB' }
})

const tools = ref<Record<string, RawTool>>({
  'kraken2': {
    '@id': 'kraken2',
    name: 'Kraken2',
    supports_shortreads: true,
    supports_longreads: true,
    uses_databases: [{ '@id': 'gtdb', taxonomy_system: 'GTDB' }]
  }
})

// Formulaire
const readsChoice = ref('Short Reads')
const category = ref('Human')
const detail = ref('Human gut')
const selectedOrgs = ref<string[]>(['Bacteria', 'Archaea'])
const wantsStrain = ref(false)
const wantsFunc = ref(false)
const prefTaxo = ref('Any')
const maxRam = ref(512)

const detailsOptions = computed(() => SAMPLE_CATEGORIES[category.value] || [])

const recommendations = computed(() => {
  const [sampleKey, originKey] = SAMPLE_FILTER[detail.value] || [null, null]
  const ctx = new SurveyContext(
    sampleKey,
    originKey,
    selectedOrgs.value,
    readsChoice.value,
    prefTaxo.value,
    wantsStrain.value,
    wantsFunc.value,
    maxRam.value
  )
  return recommend(databases.value, tools.value, ctx)
})
</script>

<template>
  <div class="p-8 text-slate-100 max-w-5xl">
    <h1 class="text-3xl font-bold mb-2">🧬 Recommendation Assistant</h1>
    <p class="text-slate-400 mb-6">Réponds aux questions pour obtenir tes recommandations d'outils et de bases de données.</p>

    <div class="space-y-6">
      <!-- Q1 -->
      <section class="bg-slate-900 p-4 rounded-lg border border-slate-800">
        <h2 class="font-bold text-lg mb-2">1 · Sequencing method</h2>
        <div class="flex gap-4">
          <label><input type="radio" v-model="readsChoice" value="Short Reads" /> Short Reads</label>
          <label><input type="radio" v-model="readsChoice" value="Long Reads" /> Long Reads</label>
        </div>
      </section>

      <!-- Q2 -->
      <section class="bg-slate-900 p-4 rounded-lg border border-slate-800">
        <h2 class="font-bold text-lg mb-2">2 · Sample type</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm mb-1">Catégorie</label>
            <select v-model="category" class="bg-slate-800 text-white p-2 rounded w-full">
              <option v-for="cat in Object.keys(SAMPLE_CATEGORIES)" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm mb-1">Détail</label>
            <select v-model="detail" class="bg-slate-800 text-white p-2 rounded w-full">
              <option v-for="opt in detailsOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Q3 -->
      <section class="bg-slate-900 p-4 rounded-lg border border-slate-800">
        <h2 class="font-bold text-lg mb-2">3 · Target organisms</h2>
        <div class="flex gap-4 flex-wrap">
          <label v-for="org in Object.keys(TAXON_IRI)" :key="org" class="flex items-center gap-1">
            <input type="checkbox" :value="org" v-model="selectedOrgs" /> {{ org }}
          </label>
        </div>
      </section>

      <!-- Results -->
      <section class="mt-8">
        <h2 class="text-2xl font-bold mb-4">4 · Recommendations ({{ recommendations.length }})</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <RecommendationCard
            v-for="rec in recommendations"
            :key="rec.tool_id + rec.db_id"
            :recommendation="rec"
          />
        </div>
      </section>
    </div>
  </div>
</template>
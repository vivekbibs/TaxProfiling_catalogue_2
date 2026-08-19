<script setup lang="ts">
import type { RecommendationResult } from '~/types'

const props = defineProps<{
  recommendation: RecommendationResult
  small?: boolean
}>()

const toolName = computed(() => props.recommendation.tool.name || props.recommendation.tool_id)
const dbName = computed(() => props.recommendation.db.name || props.recommendation.db_id)

const sr = computed(() => props.recommendation.tool.supports_shortreads ? '✅' : '❌')
const lr = computed(() => props.recommendation.tool.supports_longreads ? '✅' : '❌')
const strain = computed(() => props.recommendation.tool.strain_level ? '✅' : '❌')
const func = computed(() => props.recommendation.tool.functional_profiling ? '✅' : '❌')
</script>

<template>
  <div
    class="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col justify-between"
    :class="small ? 'min-h-[160px]' : 'min-h-[200px]'"
  >
    <div>
      <div class="flex justify-between items-start mb-1">
        <h3 class="font-semibold text-slate-100 text-base">🔧 {{ toolName }}</h3>
        <span v-if="recommendation.db_ts" class="bg-emerald-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
          {{ recommendation.db_ts }}
        </span>
      </div>
      <div class="text-emerald-400 text-sm font-semibold mb-2">🗄️ {{ dbName }}</div>
      <div v-if="recommendation.releases.length" class="text-xs text-slate-400 mb-2">
        Releases: {{ recommendation.releases.join(', ') }}
      </div>
    </div>

    <div class="flex gap-2 flex-wrap text-xs text-slate-300 mt-4">
      <span class="bg-slate-800 px-2 py-1 rounded">SR {{ sr }}</span>
      <span class="bg-slate-800 px-2 py-1 rounded">LR {{ lr }}</span>
      <span class="bg-slate-800 px-2 py-1 rounded">Strain {{ strain }}</span>
      <span class="bg-slate-800 px-2 py-1 rounded">Func {{ func }}</span>
    </div>
  </div>
</template>
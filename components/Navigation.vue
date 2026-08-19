<template>
  <aside class="w-64 bg-slate-900 text-white p-6 border-r border-slate-800 min-h-screen">
    <h2 class="text-xl font-bold mb-6 flex items-center gap-2">🧬 Navigation</h2>
    <nav class="space-y-2">
      <NuxtLink to="/" class="block p-2 rounded hover:bg-slate-800" active-class="bg-slate-800 font-bold">
        🏠 Home
      </NuxtLink>
      <NuxtLink to="/survey" class="block p-2 rounded hover:bg-slate-800" active-class="bg-slate-800 font-bold">
        🔍 Survey
      </NuxtLink>
      <NuxtLink to="/catalog" class="block p-2 rounded hover:bg-slate-800" active-class="bg-slate-800 font-bold">
        📊 Catalog
      </NuxtLink>
    </nav>
  </aside>
</template>
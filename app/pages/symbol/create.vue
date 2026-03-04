<script setup lang="ts">
import axios from 'axios'

/**
 * Create Symbol Page
 *
 * Loads full symbol lists from Finnhub & Twelve Data on mount.
 * v-autocomplete filters locally — no debounced API calls needed.
 *
 * Flow:
 * 1. Page mount → fetch lists from both providers (cached 1h on backend)
 * 2. User browses / filters via autocomplete
 * 3. Select symbol → auto-fill name & type
 * 4. Save → POST /api/symbols + POST /api/watchlist
 */

useHead({ title: 'Add Symbol — Smart Trader' })

const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl
const { addToWatchlist } = useWatchlist()

// ── Form state ──
const form = reactive({
  symbol: '',
  name: '',
  type: 'STOCK' as string,
  exchange: '',
})

const isSaving = ref(false)
const saveError = ref<string | null>(null)
const saveSuccess = ref(false)

const typeOptions = ['STOCK', 'CRYPTO', 'FOREX', 'INDEX']

// ── Provider symbol lists ──
interface SymbolItem {
  symbol: string
  name: string
  type: string
  exchange: string
}

// Finnhub
const finnhubSymbols = ref<SymbolItem[]>([])
const finnhubLoading = ref(false)
const finnhubSelected = ref<SymbolItem | null>(null)
const finnhubSearch = ref('')

// Twelve Data
const twelveDataSymbols = ref<SymbolItem[]>([])
const twelveDataLoading = ref(false)
const twelveDataSelected = ref<SymbolItem | null>(null)
const twelveDataSearch = ref('')

// ── Fetch full lists on mount ──
async function fetchProviderList(provider: 'finnhub' | 'twelvedata'): Promise<SymbolItem[]> {
  try {
    const { data: response } = await axios.get(`${baseUrl}/api/data/symbols/list`, {
      params: { provider },
    })
    if (response.success && Array.isArray(response.data)) {
      return response.data as SymbolItem[]
    }
    return []
  } catch {
    return []
  }
}

onMounted(async () => {
  // Fetch both lists in parallel
  finnhubLoading.value = true
  twelveDataLoading.value = true

  const [finnhubData, twelveDataData] = await Promise.all([
    fetchProviderList('finnhub'),
    fetchProviderList('twelvedata'),
  ])

  finnhubSymbols.value = finnhubData
  finnhubLoading.value = false

  twelveDataSymbols.value = twelveDataData
  twelveDataLoading.value = false
})

// ── Filtered lists (v-autocomplete custom filter) ──
function filterSymbols(items: SymbolItem[], query: string): SymbolItem[] {
  if (!query) return items.slice(0, 200) // Show first 200 when no search
  const q = query.toLowerCase()
  return items.filter(
    (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
  ).slice(0, 200)
}

const finnhubFiltered = computed(() => filterSymbols(finnhubSymbols.value, finnhubSearch.value))
const twelveDataFiltered = computed(() => filterSymbols(twelveDataSymbols.value, twelveDataSearch.value))

// ── Auto-fill when selecting from Finnhub ──
watch(finnhubSelected, (item) => {
  if (!item) return
  fillFormFromResult(item)
  twelveDataSelected.value = null
  twelveDataSearch.value = ''
})

// ── Auto-fill when selecting from Twelve Data ──
watch(twelveDataSelected, (item) => {
  if (!item) return
  fillFormFromResult(item)
  finnhubSelected.value = null
  finnhubSearch.value = ''
})

function fillFormFromResult(result: SymbolItem) {
  form.symbol = result.symbol
  form.name = result.name
  form.exchange = result.exchange || ''

  // Normalize type
  const rawType = (result.type || '').toUpperCase()
  if (rawType.includes('CRYPTO') || rawType.includes('DIGITAL')) {
    form.type = 'CRYPTO'
  } else if (rawType.includes('FOREX') || rawType.includes('FX') || rawType.includes('CURRENCY')) {
    form.type = 'FOREX'
  } else if (rawType.includes('INDEX') || rawType.includes('ETF')) {
    form.type = 'INDEX'
  } else {
    form.type = 'STOCK'
  }
}

// ── Format display ──
function formatItem(item: SymbolItem): string {
  return `${item.symbol} — ${item.name}`
}

// ── Save ──
async function handleSave() {
  if (!form.symbol.trim() || !form.name.trim()) {
    saveError.value = 'กรุณากรอก Symbol และ Name'
    return
  }

  isSaving.value = true
  saveError.value = null
  saveSuccess.value = false

  try {
    const { data: response } = await axios.post(`${baseUrl}/api/symbols`, {
      symbol: form.symbol.toUpperCase().trim(),
      name: form.name.trim(),
      type: form.type,
      exchange: form.exchange.trim() || undefined,
    })

    if (!response.success || !response.data?.id) {
      throw new Error('Failed to create symbol')
    }

    await addToWatchlist(response.data.id)
    saveSuccess.value = true

    setTimeout(() => { navigateTo('/') }, 1200)
  } catch (err: any) {
    if (err.response?.status === 409) {
      saveError.value = 'Symbol นี้มีอยู่ในระบบแล้ว'
    } else {
      saveError.value =
        err.response?.data?.error?.message || err.message || 'เกิดข้อผิดพลาด'
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4" style="max-width: 600px;">

    <!-- Header -->
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn icon variant="text" size="small" @click="navigateTo('/')">
        <v-icon icon="mdi-arrow-left" />
      </v-btn>
      <span class="text-h5 font-weight-bold">Add Symbol</span>
    </div>

    <v-divider class="mb-6" />

    <!-- Success Alert -->
    <v-alert v-if="saveSuccess" type="success" variant="tonal" class="mb-4">
      เพิ่ม Symbol สำเร็จ! กำลังกลับหน้าหลัก...
    </v-alert>

    <!-- Error Alert -->
    <v-alert
      v-if="saveError"
      type="error"
      variant="tonal"
      closable
      class="mb-4"
      @click:close="saveError = null"
    >
      {{ saveError }}
    </v-alert>

    <!-- Finnhub Symbol List -->
    <v-card variant="outlined" rounded="lg" class="mb-4 pa-4">
      <div class="d-flex align-center ga-2 mb-3">
        <v-icon icon="mdi-finance" color="info" size="20" />
        <span class="text-subtitle-2 font-weight-bold">Finnhub</span>
        <v-chip v-if="!finnhubLoading" size="x-small" variant="tonal">
          {{ finnhubSymbols.length.toLocaleString() }} symbols
        </v-chip>
      </div>

      <v-autocomplete
        v-model="finnhubSelected"
        v-model:search="finnhubSearch"
        :items="finnhubFiltered"
        :loading="finnhubLoading"
        :item-title="formatItem"
        item-value="symbol"
        return-object
        placeholder="เลือกหรือพิมพ์ค้นหา symbol..."
        variant="outlined"
        density="compact"
        hide-details
        clearable
        no-filter
        :no-data-text="finnhubLoading ? 'กำลังโหลด...' : 'ไม่พบผลลัพธ์'"
      >
        <template #item="{ item, props: itemProps }">
          <v-list-item v-bind="itemProps">
            <template #subtitle>
              <span class="text-caption">{{ item.raw.exchange }} · {{ item.raw.type }}</span>
            </template>
          </v-list-item>
        </template>
      </v-autocomplete>
    </v-card>

    <!-- Twelve Data Symbol List -->
    <v-card variant="outlined" rounded="lg" class="mb-4 pa-4">
      <div class="d-flex align-center ga-2 mb-3">
        <v-icon icon="mdi-chart-areaspline" color="warning" size="20" />
        <span class="text-subtitle-2 font-weight-bold">Twelve Data</span>
        <v-chip v-if="!twelveDataLoading" size="x-small" variant="tonal">
          {{ twelveDataSymbols.length.toLocaleString() }} symbols
        </v-chip>
      </div>

      <v-autocomplete
        v-model="twelveDataSelected"
        v-model:search="twelveDataSearch"
        :items="twelveDataFiltered"
        :loading="twelveDataLoading"
        :item-title="formatItem"
        item-value="symbol"
        return-object
        placeholder="เลือกหรือพิมพ์ค้นหา symbol..."
        variant="outlined"
        density="compact"
        hide-details
        clearable
        no-filter
        :no-data-text="twelveDataLoading ? 'กำลังโหลด...' : 'ไม่พบผลลัพธ์'"
      >
        <template #item="{ item, props: itemProps }">
          <v-list-item v-bind="itemProps">
            <template #subtitle>
              <span class="text-caption">{{ item.raw.exchange }} · {{ item.raw.type }}</span>
            </template>
          </v-list-item>
        </template>
      </v-autocomplete>
    </v-card>

    <v-divider class="mb-6" />

    <!-- Form Fields (auto-filled or manual) -->
    <div class="text-subtitle-2 font-weight-bold mb-3">Symbol Details</div>

    <v-text-field
      v-model="form.symbol"
      label="Symbol"
      variant="outlined"
      density="compact"
      class="mb-3"
      hint="จะถูกแปลงเป็นตัวพิมพ์ใหญ่อัตโนมัติ"
      persistent-hint
    />

    <v-text-field
      v-model="form.name"
      label="Name"
      variant="outlined"
      density="compact"
      class="mb-3"
    />

    <v-select
      v-model="form.type"
      label="Type"
      :items="typeOptions"
      variant="outlined"
      density="compact"
      class="mb-3"
    />

    <v-text-field
      v-model="form.exchange"
      label="Exchange (Optional)"
      variant="outlined"
      density="compact"
      class="mb-6"
    />

    <!-- Save Button -->
    <v-btn
      block
      color="primary"
      size="large"
      :loading="isSaving"
      :disabled="!form.symbol.trim() || !form.name.trim() || saveSuccess"
      @click="handleSave"
    >
      <v-icon start icon="mdi-content-save" />
      Save & Add to Watchlist
    </v-btn>

  </v-container>
</template>

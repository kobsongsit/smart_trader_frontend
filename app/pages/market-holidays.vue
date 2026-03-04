<script setup lang="ts">
import { getSymbolTypeColor } from '../../types/trading'
import type { MarketHoliday } from '../../types/trading'

useHead({
  title: 'Market Holidays - Smart Trader',
  meta: [
    { name: 'description', content: 'จัดการวันหยุดตลาดเพื่อกรองข้อมูลที่ไม่ถูกต้อง' }
  ]
})

const { holidays, isLoading, error, fetchHolidays, createHoliday, deleteHoliday, getHolidayByDate, isHoliday } = useMarketHolidays()

// ── Market filter ──
const marketFilters = ['ALL', 'STOCK', 'FOREX', 'INDEX'] as const
const selectedMarket = ref<string>('ALL')

// ── Calendar state ──
const selectedDate = ref<unknown>(null)  // v-date-picker modelValue
const displayedMonth = ref<number>(new Date().getMonth())
const displayedYear = ref<number>(new Date().getFullYear())

// ── Add holiday dialog ──
const showAddDialog = ref(false)
const addForm = reactive({
  date: '',
  name: '',
  market: null as string | null,
})
const isSaving = ref(false)

// ── Delete confirm dialog ──
const showDeleteDialog = ref(false)
const holidayToDelete = ref<MarketHoliday | null>(null)
const isDeleting = ref(false)

// ── Snackbar ──
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success',
})

// ── Fetch holidays on mount & when filter changes ──
async function loadHolidays() {
  const params: { year?: number; market?: string } = {
    year: displayedYear.value,
  }
  if (selectedMarket.value !== 'ALL') {
    params.market = selectedMarket.value
  }
  await fetchHolidays(params)
}

onMounted(() => {
  loadHolidays()
})

watch(selectedMarket, () => {
  loadHolidays()
})

// ── When the calendar month/year changes, reload holidays ──
watch(displayedYear, () => {
  loadHolidays()
})

// ── Calendar: handle date click ──
function handleDateClick(date: unknown) {
  // v-date-picker ส่งค่ามาเป็น Date object
  const d = date as Date
  if (!d) return

  const dateStr = formatDateToISO(d)

  const existing = getHolidayByDate(dateStr)
  if (existing) {
    // มี holiday แล้ว → เปิด confirm delete
    holidayToDelete.value = existing
    showDeleteDialog.value = true
  } else {
    // ยังไม่มี → เปิด add dialog
    addForm.date = dateStr
    addForm.name = ''
    addForm.market = selectedMarket.value === 'ALL' ? null : selectedMarket.value
    showAddDialog.value = true
  }

  // Clear selection ไม่ให้ค้างอยู่
  nextTick(() => {
    selectedDate.value = null
  })
}

// ── Save new holiday ──
async function handleSaveHoliday() {
  if (!addForm.name.trim()) return

  isSaving.value = true
  try {
    const result = await createHoliday({
      date: addForm.date,
      name: addForm.name.trim(),
      market: addForm.market,
    })

    if (result) {
      showAddDialog.value = false
      snackbar.message = `เพิ่ม "${result.holiday.name}" สำเร็จ`
      if (result.cleanup.deletedCandles > 0) {
        snackbar.message += ` (ลบ ${result.cleanup.deletedCandles} candles จาก ${result.cleanup.affectedSymbols} symbols)`
      }
      snackbar.color = 'success'
      snackbar.show = true
    } else {
      snackbar.message = error.value || 'เกิดข้อผิดพลาด'
      snackbar.color = 'error'
      snackbar.show = true
    }
  } finally {
    isSaving.value = false
  }
}

// ── Confirm delete holiday ──
async function handleDeleteHoliday() {
  if (!holidayToDelete.value) return

  isDeleting.value = true
  try {
    const success = await deleteHoliday(holidayToDelete.value.id)
    if (success) {
      snackbar.message = `ลบ "${holidayToDelete.value.name}" สำเร็จ`
      snackbar.color = 'success'
      snackbar.show = true
      showDeleteDialog.value = false
      holidayToDelete.value = null
    } else {
      snackbar.message = error.value || 'เกิดข้อผิดพลาด'
      snackbar.color = 'error'
      snackbar.show = true
    }
  } finally {
    isDeleting.value = false
  }
}

// ── Upcoming holidays (sorted by date, future only) ──
const upcomingHolidays = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return [...holidays.value]
    .filter((h) => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 10) // show max 10
})

// ── Format helpers ──
function formatDateToISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ── Market label helper ──
function getMarketLabel(market: string | null): string {
  return market || 'ALL'
}

// ── Name validation ──
const nameRules = [
  (v: string) => !!v?.trim() || 'กรุณาใส่ชื่อวันหยุด',
  (v: string) => (v?.trim().length ?? 0) <= 100 || 'ชื่อต้องไม่เกิน 100 ตัวอักษร',
]

// ── Market select items for dialog ──
const marketOptions = [
  { title: 'ALL Markets', value: null },
  { title: 'STOCK', value: 'STOCK' },
  { title: 'FOREX', value: 'FOREX' },
  { title: 'INDEX', value: 'INDEX' },
]

</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">

    <!-- Header: avatar + title + refresh on ONE line -->
    <div class="d-flex align-center ga-3 mb-1">
      <v-avatar color="error" size="40" rounded="lg">
        <v-icon icon="mdi-calendar" color="white" size="22" />
      </v-avatar>
      <span class="text-h5 font-weight-bold">Market Holidays</span>
      <v-spacer />
      <v-btn
        icon
        variant="text"
        size="small"
        :loading="isLoading"
        @click="loadHolidays"
      >
        <v-icon icon="mdi-sync" size="26" class="text-label-muted" />
      </v-btn>
    </div>
    <p class="text-caption font-weight-medium text-label-muted mb-4">
      จัดการวันหยุดตลาด — กรองข้อมูล candle ที่ไม่ถูกต้อง
    </p>

    <v-divider class="mb-4" />

    <!-- Market Filter Chips -->
    <v-chip-group
      v-model="selectedMarket"
      mandatory
      selected-class="text-white"
      class="mb-4"
    >
      <v-chip
        v-for="market in marketFilters"
        :key="market"
        :value="market"
        :color="market === 'ALL' ? 'primary' : getSymbolTypeColor(market)"
        variant="tonal"
        filter
        size="small"
      >
        {{ market }}
      </v-chip>
    </v-chip-group>

    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      closable
      class="mb-4"
    >
      {{ error }}
    </v-alert>

    <!-- Calendar Card -->
    <v-card class="glass-card mb-4" rounded="xl">
      <v-date-picker
        v-model="selectedDate"
        v-model:month="displayedMonth"
        v-model:year="displayedYear"
        color="primary"
        width="100%"
        show-adjacent-months
        @update:model-value="handleDateClick"
      >
        <!-- Custom day slot: highlight holidays with red background -->
        <template #day="{ props: dayProps, item }">
          <v-btn
            v-bind="dayProps"
            :color="item.isoDate && isHoliday(item.isoDate) ? 'error' : dayProps.color"
            :variant="item.isoDate && isHoliday(item.isoDate) ? 'flat' : dayProps.variant"
          />
        </template>
      </v-date-picker>

      <!-- Holiday count -->
      <v-card-text class="pt-0 pb-3 text-center">
        <v-chip size="small" color="error" variant="tonal" prepend-icon="mdi-calendar-remove">
          {{ holidays.length }} วันหยุดในปีนี้
        </v-chip>
      </v-card-text>
    </v-card>

    <!-- Upcoming Holidays List -->
    <div class="mb-2 d-flex align-center">
      <v-icon icon="mdi-calendar-arrow-right" size="20" class="mr-2 text-label-muted" />
      <span class="text-subtitle-2 font-weight-bold">Upcoming Holidays</span>
      <v-spacer />
      <span class="text-caption text-label-muted">{{ upcomingHolidays.length }} รายการ</span>
    </div>

    <!-- Loading skeleton -->
    <template v-if="isLoading && holidays.length === 0">
      <v-skeleton-loader
        v-for="i in 3"
        :key="i"
        type="list-item-two-line"
        class="mb-2 rounded-lg"
      />
    </template>

    <!-- Empty state -->
    <v-card
      v-else-if="upcomingHolidays.length === 0"
      class="glass-card pa-6 text-center"
      rounded="xl"
    >
      <v-icon icon="mdi-calendar-check" size="48" class="text-label-muted mb-2" />
      <div class="text-body-2 text-label-muted">
        ไม่มีวันหยุดที่กำลังจะมาถึง
      </div>
      <div class="text-caption text-label-muted mt-1">
        กดวันที่บน Calendar เพื่อเพิ่มวันหยุด
      </div>
    </v-card>

    <!-- Holiday list -->
    <v-card
      v-for="holiday in upcomingHolidays"
      :key="holiday.id"
      class="glass-card mb-2"
      rounded="lg"
      @click="holidayToDelete = holiday; showDeleteDialog = true"
    >
      <v-card-text class="d-flex align-center pa-3">
        <!-- Date chip -->
        <v-sheet
          color="error"
          class="rounded-lg d-flex flex-column align-center justify-center mr-3"
          width="52"
          height="52"
        >
          <span class="text-caption font-weight-bold" style="line-height: 1;">
            {{ new Date(holiday.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' }).toUpperCase() }}
          </span>
          <span class="text-h6 font-weight-bold" style="line-height: 1.2;">
            {{ new Date(holiday.date + 'T00:00:00').getDate() }}
          </span>
        </v-sheet>

        <!-- Name & details -->
        <div class="flex-grow-1">
          <div class="text-body-2 font-weight-medium">{{ holiday.name }}</div>
          <div class="d-flex align-center ga-2 mt-1">
            <v-chip
              size="x-small"
              :color="getSymbolTypeColor(holiday.market || 'ALL')"
              variant="tonal"
            >
              {{ getMarketLabel(holiday.market) }}
            </v-chip>
            <span class="text-caption text-label-muted">
              {{ formatDisplayDate(holiday.date) }}
            </span>
          </div>
        </div>

        <!-- Delete hint icon -->
        <v-icon icon="mdi-delete-outline" size="20" class="text-label-muted" />
      </v-card-text>
    </v-card>

    <!-- Footer -->
    <v-sheet color="transparent" class="pa-3 text-center mt-4">
      <div class="text-caption text-medium-emphasis">
        <v-icon icon="mdi-information-outline" size="14" class="mr-1" />
        วันหยุดตลาดจะถูกใช้กรอง candle data ที่ไม่ถูกต้องออกโดยอัตโนมัติ
      </div>
    </v-sheet>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- Dialog: Add Holiday                                     -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <v-dialog v-model="showAddDialog" max-width="420" persistent>
      <v-card class="glass-card" rounded="xl">
        <v-card-title class="d-flex align-center ga-2 pa-4">
          <v-icon icon="mdi-calendar-plus" color="primary" />
          <span>เพิ่มวันหยุดตลาด</span>
        </v-card-title>

        <v-card-text class="pa-4 pt-0">
          <!-- Date (readonly) -->
          <v-text-field
            :model-value="formatDisplayDate(addForm.date)"
            label="วันที่"
            prepend-inner-icon="mdi-calendar"
            variant="outlined"
            density="compact"
            readonly
            class="mb-3"
          />

          <!-- Holiday name -->
          <v-text-field
            v-model="addForm.name"
            label="ชื่อวันหยุด"
            placeholder="เช่น Independence Day"
            prepend-inner-icon="mdi-tag"
            variant="outlined"
            density="compact"
            :rules="nameRules"
            maxlength="100"
            counter
            class="mb-3"
          />

          <!-- Market select -->
          <v-select
            v-model="addForm.market"
            :items="marketOptions"
            item-title="title"
            item-value="value"
            label="ตลาด"
            prepend-inner-icon="mdi-store"
            variant="outlined"
            density="compact"
          />
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showAddDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="isSaving"
            :disabled="!addForm.name.trim()"
            @click="handleSaveHoliday"
          >
            <v-icon icon="mdi-check" class="mr-1" />
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- Dialog: Confirm Delete                                  -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <v-dialog v-model="showDeleteDialog" max-width="380">
      <v-card class="glass-card" rounded="xl">
        <v-card-title class="d-flex align-center ga-2 pa-4">
          <v-icon icon="mdi-delete-alert" color="error" />
          <span>ลบวันหยุด?</span>
        </v-card-title>

        <v-card-text class="pa-4 pt-0">
          <div class="text-body-2 mb-2">
            คุณต้องการลบวันหยุดนี้ใช่หรือไม่?
          </div>
          <v-sheet class="glass-sheet rounded-lg pa-3" v-if="holidayToDelete">
            <div class="text-body-2 font-weight-bold">{{ holidayToDelete.name }}</div>
            <div class="text-caption text-label-muted mt-1">
              {{ formatDisplayDate(holidayToDelete.date) }}
              · {{ getMarketLabel(holidayToDelete.market) }}
            </div>
          </v-sheet>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showDeleteDialog = false; holidayToDelete = null"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            :loading="isDeleting"
            @click="handleDeleteHoliday"
          >
            <v-icon icon="mdi-delete" class="mr-1" />
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="4000"
      location="top"
    >
      {{ snackbar.message }}
    </v-snackbar>

  </v-container>
</template>

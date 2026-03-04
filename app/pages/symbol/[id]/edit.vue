<script setup lang="ts">
import axios from 'axios'

/**
 * Edit Symbol Page (Mobile-First)
 *
 * Pre-fills form from GET /api/symbols/:id
 * Save → PUT /api/symbols/:id
 * Toggle active/inactive via form field (sent with save)
 * Delete → DELETE /api/symbols/:id (soft delete, confirm first)
 */

useHead({ title: 'Edit Symbol — Smart Trader' })

const route = useRoute()
const config = useRuntimeConfig()
const baseUrl = config.public.apiBaseUrl

const symbolId = computed(() => Number(route.params.id))

// ── Form state ──
const form = reactive({
  symbol: '',
  name: '',
  type: 'STOCK' as string,
  exchange: '',
  isActive: true,
})

const typeOptions = ['STOCK', 'CRYPTO', 'FOREX', 'INDEX']

// ── Page state ──
const isLoadingSymbol = ref(true)
const loadError = ref<string | null>(null)
const isSaving = ref(false)
const saveError = ref<string | null>(null)
const saveSuccess = ref(false)
const isDeleting = ref(false)
const showDeleteConfirm = ref(false)

// ── Fetch symbol data on mount ──
onMounted(async () => {
  try {
    const { data: response } = await axios.get(`${baseUrl}/api/symbols/${symbolId.value}`)

    if (response.success && response.data) {
      const s = response.data
      form.symbol = s.symbol || ''
      form.name = s.name || ''
      form.type = s.type || 'STOCK'
      form.exchange = s.exchange || ''
      form.isActive = s.isActive ?? true
    } else {
      loadError.value = 'ไม่พบข้อมูล Symbol'
    }
  } catch (err: any) {
    loadError.value = err.response?.data?.error?.message || err.message || 'โหลดข้อมูลไม่สำเร็จ'
  } finally {
    isLoadingSymbol.value = false
  }
})

// ── Save changes ──
async function handleSave() {
  if (!form.name.trim()) {
    saveError.value = 'กรุณากรอก Name'
    return
  }

  isSaving.value = true
  saveError.value = null
  saveSuccess.value = false

  try {
    const { data: response } = await axios.put(`${baseUrl}/api/symbols/${symbolId.value}`, {
      name: form.name.trim(),
      type: form.type,
      exchange: form.exchange.trim() || undefined,
      isActive: form.isActive,
    })

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to update symbol')
    }

    saveSuccess.value = true
    setTimeout(() => {
      navigateTo(`/symbol/${symbolId.value}`)
    }, 1000)
  } catch (err: any) {
    saveError.value = err.response?.data?.error?.message || err.message || 'เกิดข้อผิดพลาด'
  } finally {
    isSaving.value = false
  }
}

// ── Delete symbol ──
async function handleDelete() {
  isDeleting.value = true

  try {
    const { data: response } = await axios.delete(`${baseUrl}/api/symbols/${symbolId.value}`)

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete symbol')
    }

    navigateTo('/')
  } catch (err: any) {
    saveError.value = err.response?.data?.error?.message || err.message || 'ลบ Symbol ไม่สำเร็จ'
    showDeleteConfirm.value = false
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4" style="max-width: 600px;">

    <!-- Header -->
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn icon variant="text" size="small" @click="navigateTo(`/symbol/${symbolId}`)">
        <v-icon icon="mdi-arrow-left" />
      </v-btn>
      <span class="text-h5 font-weight-bold">Edit Symbol</span>
    </div>

    <v-divider class="mb-6" />

    <!-- Loading State -->
    <div v-if="isLoadingSymbol" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="40" />
      <div class="text-caption mt-3 text-label-muted">Loading symbol data...</div>
    </div>

    <!-- Load Error -->
    <div v-else-if="loadError" class="text-center py-12">
      <v-icon icon="mdi-alert-circle-outline" size="48" class="mb-3 text-error" />
      <div class="text-body-1 text-label-muted mb-4">{{ loadError }}</div>
      <v-btn variant="tonal" color="primary" @click="navigateTo('/')">
        <v-icon icon="mdi-arrow-left" start />
        Back
      </v-btn>
    </div>

    <!-- Form -->
    <template v-else>

      <!-- Success Alert -->
      <v-alert v-if="saveSuccess" type="success" variant="tonal" class="mb-4">
        Updated successfully!
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

      <!-- Symbol (readonly) -->
      <v-text-field
        v-model="form.symbol"
        label="Symbol"
        variant="outlined"
        density="compact"
        class="mb-3"
        readonly
        disabled
        hint="Symbol cannot be changed"
        persistent-hint
      />

      <!-- Name -->
      <v-text-field
        v-model="form.name"
        label="Name"
        variant="outlined"
        density="compact"
        class="mb-3"
      />

      <!-- Type -->
      <v-select
        v-model="form.type"
        label="Type"
        :items="typeOptions"
        variant="outlined"
        density="compact"
        class="mb-3"
      />

      <!-- Exchange -->
      <v-text-field
        v-model="form.exchange"
        label="Exchange (Optional)"
        variant="outlined"
        density="compact"
        class="mb-4"
      />

      <!-- Active Toggle -->
      <v-sheet rounded="lg" class="pa-4 mb-6" color="surface-variant">
        <div class="d-flex align-center justify-space-between">
          <div>
            <div class="text-subtitle-2 font-weight-bold">Status</div>
            <div class="text-caption text-label-muted">
              {{ form.isActive ? 'Active — data is being fetched' : 'Inactive — paused' }}
            </div>
          </div>
          <v-switch
            v-model="form.isActive"
            :color="form.isActive ? 'success' : 'grey'"
            hide-details
            inset
            density="compact"
          />
        </div>
      </v-sheet>

      <!-- Save Button -->
      <v-btn
        block
        color="primary"
        size="large"
        :loading="isSaving"
        :disabled="!form.name.trim() || saveSuccess"
        class="mb-4"
        @click="handleSave"
      >
        <v-icon start icon="mdi-content-save" />
        Save Changes
      </v-btn>

      <!-- Delete Button -->
      <div class="text-center">
        <v-btn
          variant="text"
          color="error"
          size="small"
          @click="showDeleteConfirm = true"
        >
          <v-icon start icon="mdi-delete-outline" size="18" />
          Delete Symbol
        </v-btn>
      </div>

      <!-- Delete Confirmation Dialog -->
      <v-dialog v-model="showDeleteConfirm" max-width="360">
        <v-card rounded="lg">
          <v-card-title class="text-h6 pt-5">
            <v-icon icon="mdi-alert" color="error" class="mr-2" />
            Delete Symbol?
          </v-card-title>
          <v-card-text class="text-body-2">
            <strong>{{ form.symbol }}</strong> ({{ form.name }}) will be deactivated.
            This action can be undone by reactivating the symbol.
          </v-card-text>
          <v-card-actions class="pa-4 pt-0">
            <v-spacer />
            <v-btn variant="text" @click="showDeleteConfirm = false">Cancel</v-btn>
            <v-btn
              variant="flat"
              color="error"
              :loading="isDeleting"
              @click="handleDelete"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    </template>
  </v-container>
</template>

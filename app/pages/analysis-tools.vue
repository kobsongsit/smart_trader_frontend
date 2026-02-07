<script setup lang="ts">
useHead({
  title: 'Analysis Tools - Smart Trader',
  meta: [
    { name: 'description', content: 'สรุปเครื่องมือวิเคราะห์ทั้งหมดที่ใช้ในระบบ Smart Trader' }
  ]
})

// Active TOC section tracking
const activeSection = ref('')

function scrollTo(id: string) {
  activeSection.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// TOC items
const tocItems = [
  { id: 'data-providers', label: 'Data Providers', icon: 'mdi-database' },
  { id: 'indicators', label: 'Indicators', icon: 'mdi-chart-line' },
  { id: 'multi-tf', label: 'Multi-TF', icon: 'mdi-clock-outline' },
  { id: 'pre-filters', label: 'Pre-Filters', icon: 'mdi-filter' },
  { id: 'news', label: 'News', icon: 'mdi-newspaper' },
  { id: 'ai-analysis', label: 'AI', icon: 'mdi-robot' },
  { id: 'signal-flow', label: 'Flow', icon: 'mdi-sitemap' },
  { id: 'quick-ref', label: 'Quick Ref', icon: 'mdi-lightning-bolt' },
]

// Indicator expansion panel
const indicatorPanel = ref<number[]>([])
</script>

<template>
  <v-container fluid class="page-container pa-3 pa-sm-4">

    <!-- Header -->
    <div class="mb-3">
      <h1 class="text-h6 text-sm-h5 font-weight-bold">
        <v-icon icon="mdi-book-open-variant" color="primary" class="mr-1" />
        Analysis Tools
      </h1>
      <p class="text-caption text-medium-emphasis mt-1">
        สรุปเครื่องมือวิเคราะห์ทั้งหมดในระบบ Smart Trader
      </p>
    </div>

    <!-- Table of Contents - Scrollable Chips -->
    <v-sheet class="mb-4 pa-2" rounded="lg" color="grey-darken-4">
      <v-chip-group class="flex-wrap">
        <v-chip
          v-for="item in tocItems"
          :key="item.id"
          size="small"
          variant="tonal"
          color="primary"
          :prepend-icon="item.icon"
          @click="scrollTo(item.id)"
        >
          {{ item.label }}
        </v-chip>
      </v-chip-group>
    </v-sheet>

    <!-- ============================================================ -->
    <!-- SECTION 1: Data Providers -->
    <!-- ============================================================ -->
    <v-card id="data-providers" class="mb-4" elevation="2" rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon icon="mdi-database" color="primary" class="mr-2" />
        1. Data Providers
      </v-card-title>
      <v-card-subtitle class="pb-0">แหล่งดึงข้อมูลดิบ</v-card-subtitle>

      <v-card-text>
        <v-table density="compact" class="mb-4">
          <thead>
            <tr>
              <th>Provider</th>
              <th>ใช้ทำอะไร</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <v-chip size="x-small" color="warning" variant="flat">Yahoo Finance</v-chip>
              </td>
              <td class="text-caption">OHLCV, Quote, ข่าว, Historical Data</td>
            </tr>
            <tr>
              <td>
                <v-chip size="x-small" color="info" variant="flat">Twelve Data</v-chip>
              </td>
              <td class="text-caption">Time Series, Quote (Forex/Crypto/Stock)</td>
            </tr>
          </tbody>
        </v-table>

        <!-- OHLCV Explanation -->
        <div class="text-overline text-primary mb-2">
          <v-icon icon="mdi-candelabra" size="16" class="mr-1" />
          ข้อมูลพื้นฐาน OHLCV
        </div>
        <p class="text-caption text-medium-emphasis mb-3">
          ทุก indicator ในระบบคำนวณจากข้อมูล OHLCV — ข้อมูลราคาแท่งเทียนแต่ละแท่ง
        </p>

        <v-row dense>
          <v-col v-for="item in [
            { letter: 'O', name: 'Open', desc: 'ราคาเปิด', color: 'info' },
            { letter: 'H', name: 'High', desc: 'ราคาสูงสุด', color: 'success' },
            { letter: 'L', name: 'Low', desc: 'ราคาต่ำสุด', color: 'error' },
            { letter: 'C', name: 'Close', desc: 'ราคาปิด', color: 'warning' },
            { letter: 'V', name: 'Volume', desc: 'ปริมาณซื้อขาย', color: 'secondary' },
          ]" :key="item.letter" cols="6" sm="4">
            <v-sheet rounded="lg" class="pa-3 text-center" color="grey-darken-4">
              <v-avatar :color="item.color" size="32" class="mb-1">
                <span class="text-caption font-weight-bold">{{ item.letter }}</span>
              </v-avatar>
              <div class="text-caption font-weight-bold">{{ item.name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.desc }}</div>
            </v-sheet>
          </v-col>
        </v-row>

        <v-alert type="info" variant="tonal" density="compact" class="mt-3" icon="mdi-lightbulb">
          ถ้าดูกราฟราคาหุ้น แต่ละ "แท่งเทียน" ก็คือข้อมูล OHLCV 1 ชุด
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- ============================================================ -->
    <!-- SECTION 2: Technical Indicators -->
    <!-- ============================================================ -->
    <v-card id="indicators" class="mb-4" elevation="2" rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon icon="mdi-chart-line" color="primary" class="mr-2" />
        2. Technical Indicators
      </v-card-title>
      <v-card-subtitle>เครื่องมือวิเคราะห์ทางเทคนิค 9 ตัว</v-card-subtitle>

      <v-card-text class="pa-2 pa-sm-4">
        <v-expansion-panels v-model="indicatorPanel" variant="accordion">

          <!-- 2.1 SMA -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon icon="mdi-chart-timeline-variant" color="info" size="20" class="mr-2" />
              <span class="text-body-2 font-weight-medium">SMA — Simple Moving Average</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="text-body-2 mb-2">
                ค่าเฉลี่ยราคาปิดย้อนหลัง N วัน เป็นเส้นเรียบๆ บนกราฟราคา ช่วยให้เห็น "ภาพรวม" ของทิศทางราคา
              </p>

              <v-sheet color="grey-darken-3" rounded="lg" class="pa-3 mb-3">
                <code class="text-caption" style="white-space: pre-wrap;">SMA = (ราคาปิดวันที่ 1 + วันที่ 2 + ... + วันที่ N) / N</code>
              </v-sheet>

              <v-table density="compact" class="mb-3">
                <thead><tr><th>เส้น</th><th>Period</th><th>ดูอะไร</th></tr></thead>
                <tbody>
                  <tr><td><v-chip size="x-small" color="info" variant="flat">SMA 50</v-chip></td><td>50</td><td class="text-caption">แนวโน้มระยะกลาง</td></tr>
                  <tr><td><v-chip size="x-small" color="warning" variant="flat">SMA 200</v-chip></td><td>200</td><td class="text-caption">แนวโน้มระยะยาว</td></tr>
                </tbody>
              </v-table>

              <v-list density="compact" class="bg-transparent pa-0 mb-2">
                <v-list-item prepend-icon="mdi-arrow-up-bold" class="px-0">
                  <v-list-item-title class="text-caption">ราคาเหนือ SMA → ขาขึ้น (Bullish)</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-arrow-down-bold" class="px-0">
                  <v-list-item-title class="text-caption">ราคาใต้ SMA → ขาลง (Bearish)</v-list-item-title>
                </v-list-item>
              </v-list>

              <v-sheet color="success" variant="tonal" rounded="lg" class="pa-3 mb-2">
                <div class="text-caption font-weight-bold text-success">Golden Cross</div>
                <div class="text-caption">SMA 50 ตัดขึ้นเหนือ SMA 200 → สัญญาณซื้อแรง!</div>
              </v-sheet>
              <v-sheet color="error" variant="tonal" rounded="lg" class="pa-3 mb-3">
                <div class="text-caption font-weight-bold text-error">Death Cross</div>
                <div class="text-caption">SMA 50 ตัดลงใต้ SMA 200 → สัญญาณขายแรง!</div>
              </v-sheet>

              <v-alert type="info" variant="tonal" density="compact" icon="mdi-lightbulb">
                SMA เหมือน "อุณหภูมิเฉลี่ย" ของราคา ถ้าระยะสั้นร้อนกว่าระยะยาว = ตลาดกำลังร้อนแรง
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 2.2 EMA -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon icon="mdi-chart-timeline-variant-shimmer" color="purple" size="20" class="mr-2" />
              <span class="text-body-2 font-weight-medium">EMA — Exponential Moving Average</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="text-body-2 mb-2">
                คล้าย SMA แต่ให้ <strong>น้ำหนักกับราคาล่าสุดมากกว่า</strong> ทำให้ไวต่อการเปลี่ยนแปลงมากกว่า SMA
              </p>

              <v-sheet color="grey-darken-3" rounded="lg" class="pa-3 mb-3">
                <code class="text-caption" style="white-space: pre-wrap;">EMA = ราคาวันนี้ x K + EMA เมื่อวาน x (1 - K)
K = 2 / (period + 1)</code>
              </v-sheet>

              <v-chip size="small" color="purple" variant="flat" class="mb-3">EMA 20 — แนวโน้มระยะสั้น</v-chip>

              <v-list density="compact" class="bg-transparent pa-0 mb-2">
                <v-list-item prepend-icon="mdi-arrow-up-bold" class="px-0">
                  <v-list-item-title class="text-caption">ราคาเหนือ EMA 20 → ระยะสั้นยังขาขึ้น</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-arrow-down-bold" class="px-0">
                  <v-list-item-title class="text-caption">ราคาใต้ EMA 20 → ระยะสั้นเริ่มอ่อนแรง</v-list-item-title>
                </v-list-item>
                <v-list-item prepend-icon="mdi-swap-vertical" class="px-0">
                  <v-list-item-title class="text-caption">ราคาตัด EMA 20 → อาจกำลังเปลี่ยนทิศทาง</v-list-item-title>
                </v-list-item>
              </v-list>

              <v-alert type="info" variant="tonal" density="compact" icon="mdi-lightbulb">
                SMA เหมือนคนใจเย็น ช้าแต่มั่นคง / EMA เหมือนคนตื่นตัว ไวแต่บางทีตกใจง่าย
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 2.3 MACD -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon icon="mdi-chart-bar" color="orange" size="20" class="mr-2" />
              <span class="text-body-2 font-weight-medium">MACD — Momentum</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="text-body-2 mb-2">
                วัด <strong>"แรงส่ง" (Momentum)</strong> ของราคา ว่าแนวโน้มกำลังแรงขึ้นหรืออ่อนลง
              </p>

              <v-sheet color="grey-darken-3" rounded="lg" class="pa-3 mb-3">
                <code class="text-caption" style="white-space: pre-wrap;">MACD Line   = EMA(12) - EMA(26)
Signal Line = EMA(9) ของ MACD Line
Histogram   = MACD Line - Signal</code>
              </v-sheet>

              <v-table density="compact" class="mb-3">
                <thead><tr><th>Parameter</th><th>ค่า</th></tr></thead>
                <tbody>
                  <tr><td class="text-caption">Fast Period</td><td>12</td></tr>
                  <tr><td class="text-caption">Slow Period</td><td>26</td></tr>
                  <tr><td class="text-caption">Signal Period</td><td>9</td></tr>
                </tbody>
              </v-table>

              <v-list density="compact" class="bg-transparent pa-0 mb-2">
                <v-list-item class="px-0">
                  <template #prepend><v-icon color="success" icon="mdi-square" size="16" /></template>
                  <v-list-item-title class="text-caption">Histogram > 0 → Bullish Momentum (แรงซื้อแรงกว่า)</v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend><v-icon color="error" icon="mdi-square" size="16" /></template>
                  <v-list-item-title class="text-caption">Histogram &lt; 0 → Bearish Momentum (แรงขายแรงกว่า)</v-list-item-title>
                </v-list-item>
              </v-list>

              <v-sheet color="success" variant="tonal" rounded="lg" class="pa-2 mb-2">
                <div class="text-caption"><v-icon icon="mdi-check" size="14" color="success" /> ซื้อ: MACD Line ตัดขึ้นเหนือ Signal Line</div>
              </v-sheet>
              <v-sheet color="error" variant="tonal" rounded="lg" class="pa-2 mb-3">
                <div class="text-caption"><v-icon icon="mdi-close" size="14" color="error" /> ขาย: MACD Line ตัดลงใต้ Signal Line</div>
              </v-sheet>

              <v-alert type="info" variant="tonal" density="compact" icon="mdi-lightbulb">
                MACD เหมือนวัด "ความเร็ว" ของรถ ถ้าเข็มกำลังขึ้น = รถกำลังเร่ง ถ้าเข็มกำลังลง = รถกำลังชะลอ
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 2.4 Bollinger Bands -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon icon="mdi-chart-bell-curve" color="cyan" size="20" class="mr-2" />
              <span class="text-body-2 font-weight-medium">Bollinger Bands — แถบราคา</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="text-body-2 mb-2">
                <strong>"กรอบ" ครอบราคา</strong> ที่ขยายและหดตามความผันผวน บอกว่าราคาตอนนี้ "แพง" หรือ "ถูก"
              </p>

              <v-sheet color="grey-darken-3" rounded="lg" class="pa-3 mb-3">
                <code class="text-caption" style="white-space: pre-wrap;">Upper  = SMA(20) + (2 x StdDev)
Middle = SMA(20)
Lower  = SMA(20) - (2 x StdDev)</code>
              </v-sheet>

              <v-table density="compact" class="mb-3">
                <thead><tr><th>Parameter</th><th>ค่า</th></tr></thead>
                <tbody>
                  <tr><td class="text-caption">Period</td><td>20</td></tr>
                  <tr><td class="text-caption">StdDev</td><td>2</td></tr>
                </tbody>
              </v-table>

              <v-list density="compact" class="bg-transparent pa-0 mb-2">
                <v-list-item class="px-0">
                  <template #prepend><v-icon color="error" icon="mdi-arrow-up-bold-circle" size="20" /></template>
                  <v-list-item-title class="text-caption">ราคาเหนือ Upper → ราคาแพงผิดปกติ (Overbought)</v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend><v-icon color="success" icon="mdi-arrow-down-bold-circle" size="20" /></template>
                  <v-list-item-title class="text-caption">ราคาใต้ Lower → ราคาถูกผิดปกติ (Oversold)</v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend><v-icon color="warning" icon="mdi-arrow-expand-horizontal" size="20" /></template>
                  <v-list-item-title class="text-caption">แถบกว้าง → ตลาดผันผวนมาก</v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend><v-icon color="info" icon="mdi-arrow-collapse-horizontal" size="20" /></template>
                  <v-list-item-title class="text-caption">แถบแคบ (Squeeze) → อาจเกิดการเคลื่อนไหวใหญ่เร็วๆ นี้!</v-list-item-title>
                </v-list-item>
              </v-list>

              <v-alert type="info" variant="tonal" density="compact" icon="mdi-lightbulb">
                BB เหมือน "ยางยืด" ดึงราคา ราคายิ่งห่างจากเส้นกลาง ก็ยิ่งมีแรงดึงกลับ เหมือนหนังสติ๊ก
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 2.5 RSI -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon icon="mdi-gauge" color="green" size="20" class="mr-2" />
              <span class="text-body-2 font-weight-medium">RSI — Relative Strength Index</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="text-body-2 mb-2">
                วัดว่า <strong>"แรงซื้อ" กับ "แรงขาย" อันไหนแรงกว่า</strong> — ค่า 0-100
              </p>

              <v-sheet color="grey-darken-3" rounded="lg" class="pa-3 mb-3">
                <code class="text-caption" style="white-space: pre-wrap;">RSI = 100 - (100 / (1 + RS))
RS  = ค่าเฉลี่ยกำไร / ค่าเฉลี่ยขาดทุน (14 แท่ง)</code>
              </v-sheet>

              <v-table density="compact" class="mb-3">
                <thead><tr><th>Parameter</th><th>ปกติ</th><th>Crypto</th></tr></thead>
                <tbody>
                  <tr><td class="text-caption">Period</td><td>14</td><td>14</td></tr>
                  <tr><td class="text-caption">Overbought</td><td>70</td><td>75</td></tr>
                  <tr><td class="text-caption">Oversold</td><td>30</td><td>25</td></tr>
                </tbody>
              </v-table>

              <v-row dense class="mb-3">
                <v-col cols="4">
                  <v-sheet color="error" variant="tonal" rounded="lg" class="pa-2 text-center">
                    <div class="text-h6 font-weight-bold text-error">&gt;70</div>
                    <div class="text-caption">Overbought</div>
                  </v-sheet>
                </v-col>
                <v-col cols="4">
                  <v-sheet color="grey" variant="tonal" rounded="lg" class="pa-2 text-center">
                    <div class="text-h6 font-weight-bold">30-70</div>
                    <div class="text-caption">Neutral</div>
                  </v-sheet>
                </v-col>
                <v-col cols="4">
                  <v-sheet color="success" variant="tonal" rounded="lg" class="pa-2 text-center">
                    <div class="text-h6 font-weight-bold text-success">&lt;30</div>
                    <div class="text-caption">Oversold</div>
                  </v-sheet>
                </v-col>
              </v-row>

              <v-sheet color="warning" variant="tonal" rounded="lg" class="pa-2 mb-3">
                <div class="text-caption font-weight-bold text-warning">Divergence (สัญญาณแรง)</div>
                <div class="text-caption">Bullish: ราคาทำจุดต่ำใหม่ แต่ RSI ไม่ทำ → อาจกลับตัวขึ้น</div>
                <div class="text-caption">Bearish: ราคาทำจุดสูงใหม่ แต่ RSI ไม่ทำ → อาจกลับตัวลง</div>
              </v-sheet>

              <v-alert type="info" variant="tonal" density="compact" icon="mdi-lightbulb">
                RSI เหมือน "เกจวัดความเหนื่อย" ของนักวิ่ง ถ้าเกจขึ้นถึง 70+ = วิ่งมานานแล้ว อาจต้องพัก
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 2.6 Stochastic -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon icon="mdi-sine-wave" color="teal" size="20" class="mr-2" />
              <span class="text-body-2 font-weight-medium">Stochastic Oscillator</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="text-body-2 mb-2">
                วัดว่า <strong>ราคาปิดอยู่ตรงไหน</strong> เทียบกับช่วงสูงสุด-ต่ำสุด ใน N แท่ง — ค่า 0-100
              </p>

              <v-sheet color="grey-darken-3" rounded="lg" class="pa-3 mb-3">
                <code class="text-caption" style="white-space: pre-wrap;">%K = ((Close - Low14) / (High14 - Low14)) x 100
%D = SMA(3) ของ %K</code>
              </v-sheet>

              <v-table density="compact" class="mb-3">
                <thead><tr><th>Parameter</th><th>ค่า</th></tr></thead>
                <tbody>
                  <tr><td class="text-caption">%K Period</td><td>14</td></tr>
                  <tr><td class="text-caption">%D Smoothing</td><td>3</td></tr>
                  <tr><td class="text-caption">Overbought</td><td>80</td></tr>
                  <tr><td class="text-caption">Oversold</td><td>20</td></tr>
                </tbody>
              </v-table>

              <v-sheet color="success" variant="tonal" rounded="lg" class="pa-2 mb-2">
                <div class="text-caption"><v-icon icon="mdi-check" size="14" color="success" /> ซื้อ: %K ตัดขึ้นเหนือ %D ในโซน Oversold (&lt; 20)</div>
              </v-sheet>
              <v-sheet color="error" variant="tonal" rounded="lg" class="pa-2 mb-3">
                <div class="text-caption"><v-icon icon="mdi-close" size="14" color="error" /> ขาย: %K ตัดลงใต้ %D ในโซน Overbought (&gt; 80)</div>
              </v-sheet>

              <v-alert type="info" variant="tonal" density="compact" icon="mdi-lightbulb">
                RSI วัด "แรง" ของการขึ้น/ลง / Stochastic วัด "ตำแหน่ง" ของราคาในกรอบ — เหมือนหมอดูทั้งชีพจร (RSI) และตำแหน่งคนไข้ (Stochastic)
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 2.7 OBV -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon icon="mdi-chart-areaspline" color="blue" size="20" class="mr-2" />
              <span class="text-body-2 font-weight-medium">OBV — On-Balance Volume</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="text-body-2 mb-2">
                สะสม Volume ตามทิศทางราคา เพื่อดูว่า <strong>"เงินไหล" เข้าหรือออก</strong>
              </p>

              <v-sheet color="grey-darken-3" rounded="lg" class="pa-3 mb-3">
                <code class="text-caption" style="white-space: pre-wrap;">ราคาขึ้น: OBV = OBV เดิม + Volume (เงินไหลเข้า)
ราคาลง:  OBV = OBV เดิม - Volume (เงินไหลออก)
เท่ากัน: OBV = ไม่เปลี่ยน</code>
              </v-sheet>

              <v-list density="compact" class="bg-transparent pa-0 mb-2">
                <v-list-item class="px-0">
                  <template #prepend><v-icon color="success" icon="mdi-check-circle" size="18" /></template>
                  <v-list-item-title class="text-caption">ราคาขึ้น + OBV ขึ้น = ขาขึ้นแท้จริง (มี Volume สนับสนุน)</v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend><v-icon color="warning" icon="mdi-alert" size="18" /></template>
                  <v-list-item-title class="text-caption">ราคาขึ้น + OBV ลง = ขาขึ้นเทียม! อาจกลับตัวลง</v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend><v-icon color="error" icon="mdi-close-circle" size="18" /></template>
                  <v-list-item-title class="text-caption">ราคาลง + OBV ลง = ขาลงแท้จริง</v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend><v-icon color="info" icon="mdi-help-circle" size="18" /></template>
                  <v-list-item-title class="text-caption">ราคาลง + OBV ขึ้น = อาจมีคนแอบสะสม!</v-list-item-title>
                </v-list-item>
              </v-list>

              <v-alert type="info" variant="tonal" density="compact" icon="mdi-lightbulb">
                ถ้าราคาเหมือน "รถ" OBV เหมือน "น้ำมัน" — รถวิ่งขึ้นเขาแต่น้ำมันหมด = ไปได้อีกไม่นาน
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 2.8 ATR -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon icon="mdi-pulse" color="red" size="20" class="mr-2" />
              <span class="text-body-2 font-weight-medium">ATR — Average True Range</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="text-body-2 mb-2">
                วัด <strong>"ความผันผวน"</strong> ของราคา — ไม่ได้บอกทิศทาง แค่บอกว่า "ตลาดสั่นแรงแค่ไหน"
              </p>

              <v-sheet color="grey-darken-3" rounded="lg" class="pa-3 mb-3">
                <code class="text-caption" style="white-space: pre-wrap;">True Range = max(High-Low, |High-PrevClose|, |Low-PrevClose|)
ATR = SMA(14) ของ True Range</code>
              </v-sheet>

              <v-table density="compact" class="mb-3">
                <thead><tr><th>Parameter</th><th>ค่า</th></tr></thead>
                <tbody>
                  <tr><td class="text-caption">Period</td><td>14</td></tr>
                  <tr><td class="text-caption">SL Multiplier</td><td>1.5x</td></tr>
                  <tr><td class="text-caption">TP Multiplier</td><td>3.0x</td></tr>
                </tbody>
              </v-table>

              <v-sheet color="surface-variant" rounded="lg" class="pa-3 mb-3">
                <div class="text-caption font-weight-bold mb-1">Dynamic Stop Loss / Take Profit:</div>
                <div class="text-caption">BUY → SL = Entry - (1.5 x ATR), TP = Entry + (3.0 x ATR)</div>
                <div class="text-caption">SELL → SL = Entry + (1.5 x ATR), TP = Entry - (3.0 x ATR)</div>
                <v-divider class="my-2" />
                <div class="text-caption text-medium-emphasis">ตัวอย่าง: ATR = 50 pips, Entry = 1.1000</div>
                <div class="text-caption text-medium-emphasis">→ SL = 1.0925 (75 pips) / TP = 1.1150 (150 pips)</div>
              </v-sheet>

              <v-alert type="info" variant="tonal" density="compact" icon="mdi-lightbulb">
                ATR เหมือน "เครื่องวัดแผ่นดินไหว" ยิ่งสั่นแรง ก็ต้องตั้ง SL ห่างขึ้น ไม่งั้นโดนเขย่าหลุดก่อน
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- 2.9 ADX -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon icon="mdi-trending-up" color="amber" size="20" class="mr-2" />
              <span class="text-body-2 font-weight-medium">ADX — Trend Strength</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <p class="text-body-2 mb-2">
                วัด <strong>"ความแรง" ของเทรนด์</strong> ไม่สนขึ้นหรือลง — +DI/-DI บอกทิศทาง
              </p>

              <v-sheet color="grey-darken-3" rounded="lg" class="pa-3 mb-3">
                <code class="text-caption" style="white-space: pre-wrap;">ADX  → วัดความแรง (0-100)
+DI  → แรงขาขึ้น
-DI  → แรงขาลง</code>
              </v-sheet>

              <div class="text-overline mb-2">ระดับความแรง ADX</div>
              <v-list density="compact" class="bg-transparent pa-0 mb-3">
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-chip size="x-small" color="grey" variant="flat" class="mr-2">&lt; 20</v-chip>
                  </template>
                  <v-list-item-title class="text-caption">ไม่มีเทรนด์ / Sideways</v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-chip size="x-small" color="warning" variant="flat" class="mr-2">20-25</v-chip>
                  </template>
                  <v-list-item-title class="text-caption">เทรนด์เริ่มก่อตัว</v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-chip size="x-small" color="success" variant="flat" class="mr-2">25-40</v-chip>
                  </template>
                  <v-list-item-title class="text-caption">เทรนด์กำลังดี</v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-chip size="x-small" color="error" variant="flat" class="mr-2">40-60</v-chip>
                  </template>
                  <v-list-item-title class="text-caption">เทรนด์แรงมาก</v-list-item-title>
                </v-list-item>
                <v-list-item class="px-0">
                  <template #prepend>
                    <v-chip size="x-small" color="purple" variant="flat" class="mr-2">&gt; 60</v-chip>
                  </template>
                  <v-list-item-title class="text-caption">รุนแรงสุดๆ (อาจใกล้จบเทรนด์!)</v-list-item-title>
                </v-list-item>
              </v-list>

              <v-sheet color="success" variant="tonal" rounded="lg" class="pa-2 mb-2">
                <div class="text-caption"><v-icon icon="mdi-check" size="14" color="success" /> ซื้อ: +DI ตัดขึ้นเหนือ -DI AND ADX &gt; 20</div>
              </v-sheet>
              <v-sheet color="error" variant="tonal" rounded="lg" class="pa-2 mb-2">
                <div class="text-caption"><v-icon icon="mdi-close" size="14" color="error" /> ขาย: -DI ตัดขึ้นเหนือ +DI AND ADX &gt; 20</div>
              </v-sheet>
              <v-sheet color="warning" variant="tonal" rounded="lg" class="pa-2 mb-3">
                <div class="text-caption"><v-icon icon="mdi-alert" size="14" color="warning" /> ADX &lt; 20: ไม่ควรเทรดตาม trend เลย!</div>
              </v-sheet>

              <v-alert type="info" variant="tonal" density="compact" icon="mdi-lightbulb">
                ADX เหมือน "มาตรวัดลม" +DI/-DI บอกทิศลม ADX บอกลมแรงแค่ไหน — ถ้าลมอ่อน เรือใบไปไหนไม่ได้
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>

        </v-expansion-panels>
      </v-card-text>
    </v-card>

    <!-- ============================================================ -->
    <!-- SECTION 3: Multi-Timeframe Trend Analysis -->
    <!-- ============================================================ -->
    <v-card id="multi-tf" class="mb-4" elevation="2" rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon icon="mdi-clock-outline" color="primary" class="mr-2" />
        3. Multi-Timeframe Trends
      </v-card-title>
      <v-card-subtitle>ดูทิศทางจากหลายมุมมองเวลาพร้อมกัน</v-card-subtitle>

      <v-card-text>
        <p class="text-body-2 mb-3">
          เหมือนดูแผนที่ทั้ง zoom เข้าใกล้ (15 นาที) และ zoom ออกไกล (1 วัน) เพื่อให้มั่นใจว่าทิศทางเดียวกัน
        </p>

        <!-- Timeframes -->
        <v-list density="compact" class="bg-transparent pa-0 mb-3">
          <v-list-item v-for="tf in [
            { label: '15m', aggregate: 'raw candles', view: 'การเคลื่อนไหวเฉพาะหน้า', icon: 'mdi-walk' },
            { label: '30m', aggregate: 'รวม 2 แท่ง 15m', view: 'ทิศทางรายครึ่งชั่วโมง', icon: 'mdi-bike' },
            { label: '1H', aggregate: 'รวม 4 แท่ง 15m', view: 'ทิศทางรายชั่วโมง', icon: 'mdi-car' },
            { label: '4H', aggregate: 'รวม 16 แท่ง 15m', view: 'ทิศทางระยะกลาง', icon: 'mdi-airplane' },
            { label: '1D', aggregate: 'รวม 96 แท่ง 15m', view: 'ทิศทางหลัก', icon: 'mdi-rocket-launch' },
          ]" :key="tf.label" class="px-0">
            <template #prepend>
              <v-chip size="x-small" color="primary" variant="flat" class="mr-2" style="min-width: 40px; justify-content: center;">{{ tf.label }}</v-chip>
            </template>
            <v-list-item-title class="text-caption">
              <v-icon :icon="tf.icon" size="14" class="mr-1" />
              {{ tf.view }}
            </v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{ tf.aggregate }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <!-- Decision Logic -->
        <div class="text-overline text-primary mb-2">วิธีตัดสินทิศทาง</div>
        <v-sheet color="surface-variant" rounded="lg" class="pa-3 mb-3">
          <div class="text-caption mb-1"><v-chip size="x-small" variant="flat" color="success" class="mr-1">UP</v-chip> EMA12 &gt; EMA26 + MACD &gt; 0 + ADX &gt; 20</div>
          <div class="text-caption mb-1"><v-chip size="x-small" variant="flat" color="error" class="mr-1">DOWN</v-chip> EMA12 &lt; EMA26 + MACD &lt; 0 + ADX &gt; 20</div>
          <div class="text-caption"><v-chip size="x-small" variant="flat" color="grey" class="mr-1">NEUTRAL</v-chip> ที่เหลือทั้งหมด</div>
        </v-sheet>

        <!-- Consensus -->
        <v-sheet color="success" variant="tonal" rounded="lg" class="pa-2 mb-2">
          <div class="text-caption"><v-icon icon="mdi-check" size="14" color="success" /> 3/5 เป็น UP → ส่งให้ AI ได้ (BUY/WAIT)</div>
        </v-sheet>
        <v-sheet color="error" variant="tonal" rounded="lg" class="pa-2 mb-2">
          <div class="text-caption"><v-icon icon="mdi-check" size="14" color="error" /> 3/5 เป็น DOWN → ส่งให้ AI ได้ (SELL/WAIT)</div>
        </v-sheet>
        <v-sheet color="warning" variant="tonal" rounded="lg" class="pa-2 mb-2">
          <div class="text-caption"><v-icon icon="mdi-close" size="14" color="warning" /> ไม่มีฝ่ายได้ 3+ → ตลาดสับสน → ไม่ส่ง AI</div>
        </v-sheet>
        <v-sheet color="warning" variant="tonal" rounded="lg" class="pa-2 mb-3">
          <div class="text-caption"><v-icon icon="mdi-close" size="14" color="warning" /> 4H + 1D สวนทาง majority → ไม่ส่ง AI</div>
        </v-sheet>

        <v-alert type="info" variant="tonal" density="compact" icon="mdi-lightbulb">
          เหมือนถามความเห็นคน 5 คน ถ้า 3 คนเห็นตรงกัน พอเชื่อได้ แต่ถ้าผู้ใหญ่ 2 คน (4H, 1D) ไม่เห็นด้วย ก็ต้องฟังผู้ใหญ่
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- ============================================================ -->
    <!-- SECTION 4: Pre-Filters -->
    <!-- ============================================================ -->
    <v-card id="pre-filters" class="mb-4" elevation="2" rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon icon="mdi-filter" color="primary" class="mr-2" />
        4. Pre-Filters
      </v-card-title>
      <v-card-subtitle>ด่านกรองก่อนส่ง AI — ประหยัดเงิน + ลดสัญญาณเฟอะ</v-card-subtitle>

      <v-card-text>
        <v-alert type="warning" variant="tonal" density="compact" class="mb-4" icon="mdi-cash-remove">
          ถ้าส่งทุกอย่างให้ AI โดยไม่กรอง → เสีย API cost ฟรีๆ + AI อาจให้สัญญาณผิดในตลาด sideways
        </v-alert>

        <!-- Layer 1 -->
        <v-card variant="outlined" class="mb-3" rounded="lg">
          <v-card-title class="text-body-2 font-weight-bold">
            <v-chip size="x-small" color="primary" variant="flat" class="mr-2">ชั้น 1</v-chip>
            Multi-Timeframe Pre-Filter
          </v-card-title>
          <v-card-text class="pt-0">
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item class="px-0">
                <template #prepend><v-icon icon="mdi-close-circle" color="error" size="18" class="mr-2" /></template>
                <v-list-item-title class="text-caption font-weight-bold">Sideways Detection</v-list-item-title>
                <v-list-item-subtitle class="text-caption">ADX &lt; 20 ใน &ge; 3/5 timeframes → SKIP</v-list-item-subtitle>
              </v-list-item>
              <v-list-item class="px-0">
                <template #prepend><v-icon icon="mdi-close-circle" color="error" size="18" class="mr-2" /></template>
                <v-list-item-title class="text-caption font-weight-bold">No Majority Trend</v-list-item-title>
                <v-list-item-subtitle class="text-caption">ไม่มีทิศทางที่ได้ &ge; 3/5 เสียง → SKIP</v-list-item-subtitle>
              </v-list-item>
              <v-list-item class="px-0">
                <template #prepend><v-icon icon="mdi-close-circle" color="error" size="18" class="mr-2" /></template>
                <v-list-item-title class="text-caption font-weight-bold">Higher TF Conflict</v-list-item-title>
                <v-list-item-subtitle class="text-caption">4H+1D สวนทาง majority → SKIP</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Layer 2 -->
        <v-card variant="outlined" class="mb-3" rounded="lg">
          <v-card-title class="text-body-2 font-weight-bold">
            <v-chip size="x-small" color="secondary" variant="flat" class="mr-2">ชั้น 2</v-chip>
            ProIndicator Validation
          </v-card-title>
          <v-card-text class="pt-0">
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item class="px-0">
                <template #prepend><v-icon icon="mdi-close-circle" color="error" size="18" class="mr-2" /></template>
                <v-list-item-title class="text-caption font-weight-bold">Channel Detection</v-list-item-title>
                <v-list-item-subtitle class="text-caption">ราคาอยู่ในกรอบ BB → sideways → ไม่ควรเทรด</v-list-item-subtitle>
              </v-list-item>
              <v-list-item class="px-0">
                <template #prepend><v-icon icon="mdi-close-circle" color="error" size="18" class="mr-2" /></template>
                <v-list-item-title class="text-caption font-weight-bold">New High/Low</v-list-item-title>
                <v-list-item-subtitle class="text-caption">ราคาทำ new H/L ใน 50 แท่ง → รอยืนยันก่อน</v-list-item-subtitle>
              </v-list-item>
              <v-list-item class="px-0">
                <template #prepend><v-icon icon="mdi-alert" color="warning" size="18" class="mr-2" /></template>
                <v-list-item-title class="text-caption font-weight-bold">Candle Close</v-list-item-title>
                <v-list-item-subtitle class="text-caption">เวลาไม่ตรงจุดปิดแท่ง → ส่ง warning</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-alert type="info" variant="tonal" density="compact" icon="mdi-lightbulb">
          Pre-Filter เหมือน "รปภ. หน้าตึก" คัดกรองก่อนว่าใครควรเข้า ไม่ใช่ปล่อยทุกคนเข้าไปรบกวน AI
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- ============================================================ -->
    <!-- SECTION 5: News Analysis Pipeline -->
    <!-- ============================================================ -->
    <v-card id="news" class="mb-4" elevation="2" rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon icon="mdi-newspaper" color="primary" class="mr-2" />
        5. News Analysis
      </v-card-title>
      <v-card-subtitle>Fundamental Analysis เสริม Technical</v-card-subtitle>

      <v-card-text>
        <!-- Pipeline Steps -->
        <v-timeline side="end" density="compact" class="mb-4">
          <v-timeline-item dot-color="info" size="small" icon="mdi-download">
            <div class="text-caption font-weight-bold">Step 1: เก็บข่าว</div>
            <div class="text-caption text-medium-emphasis">Yahoo Finance → title, source, url</div>
          </v-timeline-item>
          <v-timeline-item dot-color="purple" size="small" icon="mdi-robot">
            <div class="text-caption font-weight-bold">Step 2: สรุปข่าว (GPT-5-mini)</div>
            <div class="text-caption text-medium-emphasis">วิเคราะห์ sentiment + score (-10 ถึง +10)</div>
          </v-timeline-item>
          <v-timeline-item dot-color="warning" size="small" icon="mdi-merge">
            <div class="text-caption font-weight-bold">Step 3: รวบรวม context</div>
            <div class="text-caption text-medium-emphasis">ข่าว 24 ชม. → avg sentiment, highlights</div>
          </v-timeline-item>
          <v-timeline-item dot-color="success" size="small" icon="mdi-brain">
            <div class="text-caption font-weight-bold">Step 4: ส่งให้ AI วิเคราะห์</div>
            <div class="text-caption text-medium-emphasis">รวม Technical + News → Trading Signal</div>
          </v-timeline-item>
        </v-timeline>

        <!-- Sentiment Scale -->
        <div class="text-overline text-primary mb-2">Sentiment Score</div>
        <v-row dense class="mb-3">
          <v-col cols="6">
            <v-sheet color="success" variant="tonal" rounded="lg" class="pa-2 text-center">
              <div class="text-caption font-weight-bold">+5 ถึง +10</div>
              <div class="text-caption">ข่าวบวกมาก</div>
            </v-sheet>
          </v-col>
          <v-col cols="6">
            <v-sheet color="success" variant="tonal" rounded="lg" class="pa-2 text-center" style="opacity: 0.7;">
              <div class="text-caption font-weight-bold">+2 ถึง +5</div>
              <div class="text-caption">ข่าวบวก</div>
            </v-sheet>
          </v-col>
          <v-col cols="4">
            <v-sheet color="grey" variant="tonal" rounded="lg" class="pa-2 text-center">
              <div class="text-caption font-weight-bold">-2 ถึง +2</div>
              <div class="text-caption">เป็นกลาง</div>
            </v-sheet>
          </v-col>
          <v-col cols="4">
            <v-sheet color="error" variant="tonal" rounded="lg" class="pa-2 text-center" style="opacity: 0.7;">
              <div class="text-caption font-weight-bold">-5 ถึง -2</div>
              <div class="text-caption">ข่าวลบ</div>
            </v-sheet>
          </v-col>
          <v-col cols="4">
            <v-sheet color="error" variant="tonal" rounded="lg" class="pa-2 text-center">
              <div class="text-caption font-weight-bold">-10 ถึง -5</div>
              <div class="text-caption">ข่าวลบมาก</div>
            </v-sheet>
          </v-col>
        </v-row>

        <!-- Weight -->
        <v-sheet color="surface-variant" rounded="lg" class="pa-3 mb-3">
          <div class="text-caption font-weight-bold mb-2">น้ำหนักการตัดสินใจ (includeNews=true)</div>
          <div class="d-flex align-center mb-1">
            <span class="text-caption mr-2" style="min-width: 80px;">Technical</span>
            <v-progress-linear model-value="60" color="primary" rounded height="8" class="flex-grow-1" />
            <span class="text-caption ml-2">60%</span>
          </div>
          <div class="d-flex align-center">
            <span class="text-caption mr-2" style="min-width: 80px;">News</span>
            <v-progress-linear model-value="40" color="warning" rounded height="8" class="flex-grow-1" />
            <span class="text-caption ml-2">40%</span>
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>

    <!-- ============================================================ -->
    <!-- SECTION 6: AI Analysis -->
    <!-- ============================================================ -->
    <v-card id="ai-analysis" class="mb-4" elevation="2" rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon icon="mdi-robot" color="primary" class="mr-2" />
        6. AI Analysis (OpenAI)
      </v-card-title>

      <v-card-text>
        <!-- Models -->
        <div class="text-overline text-primary mb-2">Models ที่ใช้</div>
        <v-row dense class="mb-4">
          <v-col cols="12" sm="4">
            <v-sheet color="primary" variant="tonal" rounded="lg" class="pa-3 text-center">
              <v-icon icon="mdi-star" color="primary" size="24" />
              <div class="text-caption font-weight-bold mt-1">Primary</div>
              <div class="text-caption">GPT-5.1</div>
              <div class="text-caption text-medium-emphasis">Trading Signal</div>
            </v-sheet>
          </v-col>
          <v-col cols="6" sm="4">
            <v-sheet color="secondary" variant="tonal" rounded="lg" class="pa-3 text-center">
              <v-icon icon="mdi-shield" color="secondary" size="24" />
              <div class="text-caption font-weight-bold mt-1">Fallback</div>
              <div class="text-caption">GPT-4o</div>
              <div class="text-caption text-medium-emphasis">Backup</div>
            </v-sheet>
          </v-col>
          <v-col cols="6" sm="4">
            <v-sheet color="warning" variant="tonal" rounded="lg" class="pa-3 text-center">
              <v-icon icon="mdi-lightning-bolt" color="warning" size="24" />
              <div class="text-caption font-weight-bold mt-1">Mini</div>
              <div class="text-caption">GPT-5-mini</div>
              <div class="text-caption text-medium-emphasis">สรุปข่าว</div>
            </v-sheet>
          </v-col>
        </v-row>

        <!-- Data sent to AI -->
        <div class="text-overline text-primary mb-2">ข้อมูลที่ส่งให้ AI</div>
        <v-list density="compact" class="bg-transparent pa-0 mb-3">
          <v-list-item v-for="item in [
            { icon: 'mdi-currency-usd', text: 'Market Data (Symbol, Price, Timestamp)' },
            { icon: 'mdi-chart-line', text: 'Technical Indicators (10 ตัว + derived values)' },
            { icon: 'mdi-clock-outline', text: 'Multi-Timeframe Trends (5 TF + majority)' },
            { icon: 'mdi-alert', text: 'ProIndicator Warnings' },
            { icon: 'mdi-chart-box', text: 'Recent Performance (24h High/Low/Volume)' },
            { icon: 'mdi-newspaper', text: 'News Context (ถ้าเปิด includeNews)' },
          ]" :key="item.text" class="px-0">
            <template #prepend><v-icon :icon="item.icon" size="18" color="primary" class="mr-2" /></template>
            <v-list-item-title class="text-caption">{{ item.text }}</v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- AI Response -->
        <div class="text-overline text-primary mb-2">AI ตอบกลับอะไร</div>
        <v-table density="compact" class="mb-3">
          <thead><tr><th>Field</th><th>คำอธิบาย</th></tr></thead>
          <tbody>
            <tr><td><v-chip size="x-small" variant="flat" color="primary">strategy</v-chip></td><td class="text-caption">BUY / SELL / WAIT</td></tr>
            <tr><td><v-chip size="x-small" variant="flat" color="info">confidence</v-chip></td><td class="text-caption">ความมั่นใจ 0-100</td></tr>
            <tr><td class="text-caption">entry_price</td><td class="text-caption">จุดเข้า</td></tr>
            <tr><td class="text-caption">take_profit</td><td class="text-caption">จุดทำกำไร</td></tr>
            <tr><td class="text-caption">stop_loss</td><td class="text-caption">จุดตัดขาดทุน</td></tr>
            <tr><td class="text-caption">risk_reward</td><td class="text-caption">R:R &ge; 1:1.5</td></tr>
            <tr><td class="text-caption">support/resistance</td><td class="text-caption">แนวรับ/แนวต้าน (1-5 ระดับ)</td></tr>
            <tr><td class="text-caption">analysis</td><td class="text-caption">สรุปวิเคราะห์ภาษาไทย</td></tr>
          </tbody>
        </v-table>

        <!-- Validation Rules -->
        <v-sheet color="surface-variant" rounded="lg" class="pa-3">
          <div class="text-caption font-weight-bold mb-1">Validation Rules</div>
          <div class="text-caption">BUY: Stop Loss &lt; Entry &lt; Take Profit</div>
          <div class="text-caption">SELL: Take Profit &lt; Entry &lt; Stop Loss</div>
          <div class="text-caption">R:R &ge; 1:1.5 (กำไรมากกว่าขาดทุน 1.5 เท่า)</div>
          <div class="text-caption">Support &lt; Resistance เสมอ</div>
        </v-sheet>
      </v-card-text>
    </v-card>

    <!-- ============================================================ -->
    <!-- SECTION 7: Signal Flow -->
    <!-- ============================================================ -->
    <v-card id="signal-flow" class="mb-4" elevation="2" rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon icon="mdi-sitemap" color="primary" class="mr-2" />
        7. Signal Flow
      </v-card-title>
      <v-card-subtitle>ลำดับการทำงานทั้งหมด</v-card-subtitle>

      <v-card-text>
        <v-timeline side="end" density="compact">
          <v-timeline-item
            v-for="(step, idx) in [
              { icon: 'mdi-format-list-bulleted', color: 'info', title: 'Get Symbol Info', desc: 'ดึงข้อมูล symbol' },
              { icon: 'mdi-chart-line', color: 'info', title: 'Get Indicators', desc: 'ดึง indicators จาก DB' },
              { icon: 'mdi-currency-usd', color: 'info', title: 'Get Latest Price', desc: 'ดึงราคาล่าสุด' },
              { icon: 'mdi-clock-outline', color: 'warning', title: 'Multi-TF Trend Analysis', desc: 'คำนวณ trend 5 TF + Pre-filter' },
              { icon: 'mdi-shield-check', color: 'warning', title: 'ProIndicator Validation', desc: 'BB channel / New H-L / Candle close' },
              { icon: 'mdi-text-box', color: 'purple', title: 'Build Prompt', desc: 'รวม Technical + Trends + Warnings' },
              { icon: 'mdi-newspaper', color: 'purple', title: 'Fetch News Context', desc: 'ดึงข่าว + aggregate sentiment' },
              { icon: 'mdi-robot', color: 'primary', title: 'Send to OpenAI', desc: 'GPT-5.1 → fallback GPT-4o' },
              { icon: 'mdi-check-circle', color: 'success', title: 'Validate Response', desc: 'Zod Schema validation' },
              { icon: 'mdi-database', color: 'success', title: 'Save Signal', desc: 'บันทึกลง Database' },
              { icon: 'mdi-bell', color: 'success', title: 'Send Notification', desc: 'แจ้งเตือนผ่าน LINE' },
            ]"
            :key="idx"
            :dot-color="step.color"
            size="small"
            :icon="step.icon"
          >
            <div class="text-caption font-weight-bold">{{ idx + 1 }}. {{ step.title }}</div>
            <div class="text-caption text-medium-emphasis">{{ step.desc }}</div>
          </v-timeline-item>
        </v-timeline>

        <v-alert type="warning" variant="tonal" density="compact" class="mt-3" icon="mdi-filter">
          Step 4-5 คือ Pre-Filter — ถ้าไม่ผ่าน จะ SKIP ไม่ส่งให้ AI (ประหยัด cost)
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- ============================================================ -->
    <!-- SECTION 8: Quick Reference -->
    <!-- ============================================================ -->
    <v-card id="quick-ref" class="mb-4" elevation="2" rounded="lg">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon icon="mdi-lightning-bolt" color="primary" class="mr-2" />
        8. Quick Reference
      </v-card-title>
      <v-card-subtitle>เมื่อไหร่ควรซื้อ / ขาย / รอ</v-card-subtitle>

      <v-card-text>
        <!-- BUY -->
        <v-card color="success" variant="tonal" class="mb-3" rounded="lg">
          <v-card-title class="text-body-2 font-weight-bold">
            <v-icon icon="mdi-arrow-up-bold-circle" class="mr-2" />
            สัญญาณ BUY ที่แรง
          </v-card-title>
          <v-card-text class="pt-0">
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item v-for="item in [
                'ราคาอยู่เหนือ SMA 50 และ SMA 200 (Golden Cross)',
                'MACD Histogram เป็นบวกและกำลังเพิ่ม',
                'RSI ดีดขึ้นจากโซน Oversold (30) หรืออยู่ 40-60',
                'Stochastic %K ตัดขึ้นเหนือ %D',
                'ราคาอยู่ใกล้/ใต้ Lower BB (ราคาถูก)',
                'OBV กำลังเพิ่มขึ้น (เงินไหลเข้า)',
                'ADX > 25 + (+DI > -DI)',
                'Multi-TF: 3+ timeframes เป็น UP',
                'ข่าว positive',
              ]" :key="item" class="px-0" style="min-height: 28px;">
                <template #prepend><v-icon icon="mdi-check" size="14" color="success" class="mr-1" /></template>
                <v-list-item-title class="text-caption">{{ item }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- SELL -->
        <v-card color="error" variant="tonal" class="mb-3" rounded="lg">
          <v-card-title class="text-body-2 font-weight-bold">
            <v-icon icon="mdi-arrow-down-bold-circle" class="mr-2" />
            สัญญาณ SELL ที่แรง
          </v-card-title>
          <v-card-text class="pt-0">
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item v-for="item in [
                'ราคาอยู่ใต้ SMA 50 และ SMA 200 (Death Cross)',
                'MACD Histogram เป็นลบและกำลังลด',
                'RSI ร่วงจากโซน Overbought (70)',
                'Stochastic %K ตัดลงใต้ %D',
                'ราคาอยู่ใกล้/เหนือ Upper BB (ราคาแพง)',
                'OBV กำลังลดลง (เงินไหลออก)',
                'ADX > 25 + (-DI > +DI)',
                'Multi-TF: 3+ timeframes เป็น DOWN',
                'ข่าว negative',
              ]" :key="item" class="px-0" style="min-height: 28px;">
                <template #prepend><v-icon icon="mdi-close" size="14" color="error" class="mr-1" /></template>
                <v-list-item-title class="text-caption">{{ item }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- WAIT -->
        <v-card color="warning" variant="tonal" class="mb-3" rounded="lg">
          <v-card-title class="text-body-2 font-weight-bold">
            <v-icon icon="mdi-hand-back-left" class="mr-2" />
            สัญญาณ WAIT (ไม่ควรเทรด)
          </v-card-title>
          <v-card-text class="pt-0">
            <v-list density="compact" class="bg-transparent pa-0">
              <v-list-item v-for="item in [
                'ADX < 20 → ตลาด sideways ไม่มีเทรนด์',
                'RSI อยู่ 40-60 → ไม่มีสัญญาณชัด',
                'MACD histogram ใกล้ 0 → ไม่มี momentum',
                'BB หุบแคบ → ตลาดสะสมแรง รอ breakout',
                'Multi-TF ขัดแย้ง → ไม่มี consensus',
                'ข่าวมีเหตุการณ์สำคัญ (Fed, earnings) → รอดูผลก่อน',
              ]" :key="item" class="px-0" style="min-height: 28px;">
                <template #prepend><v-icon icon="mdi-pause-circle" size="14" color="warning" class="mr-1" /></template>
                <v-list-item-title class="text-caption">{{ item }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>

    <!-- Footer -->
    <v-sheet color="surface-variant" rounded="lg" class="pa-3 text-center mb-4">
      <div class="text-caption text-medium-emphasis">
        <v-icon icon="mdi-update" size="14" class="mr-1" />
        Last updated: 2025
      </div>
      <div class="text-caption text-medium-emphasis">
        Smart Trader — AI-Powered Trading Signal Bot
      </div>
    </v-sheet>

  </v-container>
</template>

<style scoped>
code {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>

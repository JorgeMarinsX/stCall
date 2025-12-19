<template>
  <div class="container mx-auto p-6 max-w-full">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">
        Teste de Microfone
      </h1>
      <p class="text-surface-600 dark:text-surface-400">
        Teste a qualidade do seu microfone e ouça a si mesmo
      </p>
    </div>

    <div class="grid gap-6">
     <div class="grid grid-cols-3 gap-5">
      <Card class="flex flex-col h-[600px]">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-microphone text-orange-500"></i>
            Dispositivo de Entrada
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <!-- Microphone Selector -->
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
                Selecionar Microfone
              </label>
              <MicrophoneSelector />
            </div>

            <!-- Volume Control -->
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
                Volume de Entrada: {{ audioStore.microphoneVolume }}%
              </label>
              <Slider
                v-model="audioStore.microphoneVolume"
                :min="0"
                :max="100"
                class="w-full"
              />
            </div>

            <!-- Noise Cancellation Toggle -->
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-surface-700 dark:text-surface-300">
                Cancelamento de Ruído
              </label>
              <ToggleSwitch v-model="audioStore.noiseCancellation" />
            </div>
          </div>
        </template>
      </Card>

      <!-- Audio Level Visualization Card -->
      <Card class="flex flex-col h-[600px]">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-chart-bar text-orange-500"></i>
            Nível de Áudio
          </div>
        </template>
        <template #content>
          <div class="space-y-4">
            <!-- Start/Stop Test Button -->
            <div class="flex gap-3">
              <Button
                v-if="!micTest.isTestRunning.value"
                @click="micTest.startTest"
                label="Iniciar Teste"
                icon="pi pi-play"
                severity="success"
                class="flex-1"
              />
              <Button
                v-else
                @click="micTest.stopTest"
                label="Parar Teste"
                icon="pi pi-stop"
                severity="danger"
                class="flex-1"
              />

              <Transition
                enter-active-class="transition-opacity duration-300 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition-opacity duration-200 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <Button
                  v-if="micTest.isTestRunning.value"
                  @click="micTest.toggleLoopback"
                  :label="micTest.loopbackEnabled.value ? 'Desativar Retorno' : 'Ativar Retorno'"
                  :icon="micTest.loopbackEnabled.value ? 'pi pi-volume-off' : 'pi pi-volume-up'"
                  :severity="micTest.loopbackEnabled.value ? 'warn' : 'secondary'"
                  outlined
                  class="flex-1"
                />
              </Transition>
            </div>

            <!-- Audio Level Meter -->
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Nível de Sinal
                </span>
                <span class="text-sm font-mono text-surface-600 dark:text-surface-400">
                  {{ Math.round(micTest.currentLevel.value) }}%
                </span>
              </div>
              <ProgressBar
                :value="micTest.currentLevel.value"
                :show-value="false"
                :class="[
                  'h-8',
                  micTest.currentLevel.value < 20 ? 'opacity-50' : '',
                  micTest.currentLevel.value > 80 ? 'animate-pulse' : ''
                ]"
                :pt="{
                  value: {
                    style: {
                      background: getProgressBarColor(micTest.currentLevel.value)
                    }
                  }
                }"
              />
            </div>

            <!-- Visual Audio Bars -->
            <div class="flex gap-1 items-end h-32 bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
              <div
                v-for="(bar, index) in micTest.audioVisualization.value"
                :key="index"
                class="flex-1 rounded-t transition-all duration-75"
                :style="{
                  height: `${bar}%`,
                  backgroundColor: getBarColor(bar)
                }"
              ></div>
            </div>

            <!-- Quality Indicator -->
            <Transition
              enter-active-class="transition-opacity duration-300 ease-out"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition-opacity duration-200 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <div v-if="micTest.isTestRunning.value" class="flex items-center gap-2 p-3 rounded-lg" :class="qualityStatusClass">
                <i :class="qualityIcon" class="text-xl"></i>
                <div class="flex-1">
                  <div class="font-medium">{{ qualityLabel }}</div>
                  <div class="text-sm opacity-90">{{ qualityDescription }}</div>
                </div>
                <Tag :severity="qualitySeverity" :value="micTest.qualityScore.value + '/10'" />
              </div>
            </Transition>
          </div>
        </template>
      </Card>

      <!-- Audio Metrics Card -->
      <Transition
        enter-active-class="transition-all duration-400 ease-out"
        enter-from-class="opacity-0 translate-x-4"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 -translate-x-4"
      >
        <Card v-if="micTest.isTestRunning.value" class="flex flex-col h-[600px]">
          <template #title>
            <div class="flex items-center gap-2">
              <i class="pi pi-info-circle text-orange-500"></i>
              Métricas de Qualidade
            </div>
          </template>
          <template #content>
            <div class="grid grid-cols-2 gap-4">
              <!-- Average Level -->
              <div class="flex flex-col gap-1 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <span class="text-xs text-surface-600 dark:text-surface-400">Nível Médio</span>
                <span class="text-2xl font-bold text-orange-500">{{ micTest.averageLevel.value }}%</span>
              </div>

              <!-- Peak Level -->
              <div class="flex flex-col gap-1 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <span class="text-xs text-surface-600 dark:text-surface-400">Pico Máximo</span>
                <span class="text-2xl font-bold text-orange-500">{{ micTest.peakLevel.value }}%</span>
              </div>

              <!-- Noise Floor -->
              <div class="flex flex-col gap-1 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <span class="text-xs text-surface-600 dark:text-surface-400">Ruído de Fundo</span>
                <span class="text-2xl font-bold" :class="micTest.noiseLevel.value < 10 ? 'text-green-500' : 'text-yellow-500'">
                  {{ micTest.noiseLevel.value }}%
                </span>
              </div>

              <!-- Dynamic Range -->
              <div class="flex flex-col gap-1 p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <span class="text-xs text-surface-600 dark:text-surface-400">Faixa Dinâmica</span>
                <span class="text-2xl font-bold text-orange-500">{{ micTest.dynamicRange.value }}%</span>
              </div>
            </div>
          </template>
        </Card>
      </Transition>
</div>
      <!-- Tips Card -->
      <Card>
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-lightbulb text-orange-500"></i>
            Dicas para Melhor Qualidade
          </div>
        </template>
        <template #content>
          <Message severity="info" :closable="false">
            <div class="flex flex-col gap-2">
              <div class="flex items-start gap-2">
                <i class="pi pi-check-circle text-green-500 mt-1"></i>
                <span>Posicione o microfone a 15-30cm da boca</span>
              </div>
              <div class="flex items-start gap-2">
                <i class="pi pi-check-circle text-green-500 mt-1"></i>
                <span>Evite ambientes com muito ruído de fundo</span>
              </div>
              <div class="flex items-start gap-2">
                <i class="pi pi-check-circle text-green-500 mt-1"></i>
                <span>Mantenha o nível entre 30-70% ao falar normalmente</span>
              </div>
              <div class="flex items-start gap-2">
                <i class="pi pi-check-circle text-green-500 mt-1"></i>
                <span>Use fone de ouvido com o retorno ativo para evitar eco</span>
              </div>
            </div>
          </Message>
        </template>
      </Card>
    </div>

    <!-- Hidden Audio Element for Loopback -->
    <audio
      ref="loopbackAudio"
      autoplay
      muted
      style="display: none"
    ></audio>
  </div>
</template>

<script setup lang="ts">
const audioStore = useAudioStore()
const micTest = useMicTest()
const loopbackAudio = ref<HTMLAudioElement | null>(null)

watch(loopbackAudio, (element) => {
  if (element) {
    micTest.loopbackAudioElement.value = element
  }
})


function getProgressBarColor(level: number): string {
  if (level < 20) return 'linear-gradient(to right, #6b7280, #9ca3af)' // Gray - too quiet
  if (level < 40) return 'linear-gradient(to right, #f97316, #fb923c)' // Orange - good
  if (level < 80) return 'linear-gradient(to right, #22c55e, #4ade80)' // Green - excellent
  return 'linear-gradient(to right, #ef4444, #f87171)' // Red - too loud
}

function getBarColor(level: number): string {
  if (level < 20) return '#6b7280' 
  if (level < 40) return '#f97316' 
  if (level < 80) return '#22c55e' 
  return '#ef4444' // Red
}

const qualityLabel = computed(() => {
  if (!micTest.isTestRunning.value) return 'Aguardando...'

  const score = micTest.qualityScore.value
  if (score >= 8) return 'Excelente'
  if (score >= 6) return 'Boa'
  if (score >= 4) return 'Aceitável'
  return 'Ruim'
})

const qualityDescription = computed(() => {
  if (!micTest.isTestRunning.value) return 'Clique em "Iniciar Teste" para começar'

  const score = micTest.qualityScore.value
  if (score >= 8) return 'Qualidade ideal para chamadas'
  if (score >= 6) return 'Qualidade adequada para chamadas'
  if (score >= 4) return 'Qualidade aceitável, considere ajustes'
  return 'Qualidade baixa, ajuste o microfone'
})

const qualitySeverity = computed(() => {
  const score = micTest.qualityScore.value
  if (score >= 8) return 'success'
  if (score >= 6) return 'info'
  if (score >= 4) return 'warn'
  return 'danger'
})

const qualityIcon = computed(() => {
  const score = micTest.qualityScore.value
  if (score >= 8) return 'pi pi-check-circle text-green-500'
  if (score >= 6) return 'pi pi-info-circle text-blue-500'
  if (score >= 4) return 'pi pi-exclamation-triangle text-yellow-500'
  return 'pi pi-times-circle text-red-500'
})


const qualityStatusClass = computed(() => {
  const score = micTest.qualityScore.value
  if (score >= 8) return 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100'
  if (score >= 6) return 'bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
  if (score >= 4) return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-100'
  return 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100'
})
</script>

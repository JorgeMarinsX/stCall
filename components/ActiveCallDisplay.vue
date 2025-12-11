<template>
  <div class="flex items-center" :class="compact ? 'gap-3 px-4 py-2' : 'flex-col text-center py-8'">
    <div class="relative" :class="compact ? '' : 'mb-6'">
      <Avatar
        v-if="call?.callerName"
        :label="call.callerName.charAt(0).toUpperCase()"
        :size="compact ? 'normal' : 'xlarge'"
        shape="circle"
        :class="compact ? 'w-10 h-10 bg-orange-500 text-white text-base' : 'w-32 h-32 bg-orange-500 text-white text-5xl'"
      />
      <Avatar
        v-else
        icon="pi pi-phone"
        :size="compact ? 'normal' : 'xlarge'"
        shape="circle"
        :class="compact ? 'w-10 h-10 bg-gray-500 text-white text-base' : 'w-32 h-32 bg-gray-500 text-white text-5xl'"
      />

      <div
        v-if="!compact"
        class="absolute bottom-2 right-2 w-8 h-8 rounded-full border-4 border-white dark:border-gray-800"
        :class="{
          'bg-green-500': call?.status === 'active' && !call?.isOnHold,
          'bg-orange-500': call?.status === 'ringing',
          'bg-yellow-500': call?.isOnHold,
          'bg-blue-500': call?.status === 'transferring'
        }"
      ></div>
    </div>

    <div :class="compact ? 'flex flex-col' : ''">
      <h2 v-if="!compact" class="text-3xl font-semibold text-gray-900 dark:text-white mb-2">
        {{ call?.callerName || 'Desconhecido' }}
      </h2>
      <span v-else class="font-semibold text-gray-900 dark:text-gray-100">
        {{ call?.callerName || call?.number || 'Desconhecido' }}
      </span>

      <p v-if="!compact" class="text-xl text-gray-600 dark:text-gray-400 mb-1">
        {{ call?.number }}
      </p>

      <p v-if="!compact" class="text-sm text-gray-500 dark:text-gray-400 mb-6">
        {{ getCallStatusText() }}
      </p>

      <span v-else class="text-sm text-gray-600 dark:text-gray-400">
        {{ formatDuration(duration) }}
      </span>
    </div>

    <div v-if="!compact && call?.status === 'active'" class="mb-8">
      <p class="text-5xl font-mono font-bold text-orange-500">
        {{ formatDuration(duration) }}
      </p>
    </div>

    <div v-if="!compact && call?.status === 'ringing'" class="mb-8">
      <ProgressSpinner
        style="width: 60px; height: 60px"
        stroke-width="4"
        fill="transparent"
        animation-duration="1s"
      />
    </div>

    <div v-if="!compact && showControls" class="flex gap-4 justify-center flex-wrap">
      <Button
        v-tooltip.top="call?.isMuted ? 'Ativar microfone' : 'Silenciar microfone'"
        :icon="call?.isMuted ? 'pi pi-microphone-slash' : 'pi pi-microphone'"
        rounded
        :severity="call?.isMuted ? 'danger' : 'secondary'"
        size="large"
        @click="$emit('toggle-mute')"
        :disabled="call?.status !== 'active'"
      />

      <Button
        v-tooltip.top="call?.isOnHold ? 'Retomar chamada' : 'Colocar em espera'"
        :icon="call?.isOnHold ? 'pi pi-play' : 'pi pi-pause'"
        rounded
        :severity="call?.isOnHold ? 'warn' : 'secondary'"
        size="large"
        @click="$emit('toggle-hold')"
        :disabled="call?.status === 'ringing' || call?.status === 'transferring'"
      />

      <Button
        v-tooltip.top="'Transferir chamada'"
        icon="pi pi-arrow-right-arrow-left"
        rounded
        severity="secondary"
        size="large"
        @click="$emit('show-transfer')"
        :disabled="call?.status !== 'active' || call?.isOnHold"
      />

      <Button
        v-tooltip.top="'Encerrar chamada'"
        icon="pi pi-phone"
        rounded
        severity="danger"
        size="large"
        class="rotate-[135deg]"
        @click="$emit('hangup')"
      />
    </div>

    <div v-if="!compact && showBadge" class="mt-6">
      <Tag
        :value="call?.direction === 'inbound' ? 'Entrada' : 'Saída'"
        :icon="call?.direction === 'inbound' ? 'pi pi-arrow-down' : 'pi pi-arrow-up'"
        :severity="call?.direction === 'inbound' ? 'info' : 'warn'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Call } from '~/types'

interface Props {
  call: Call | null
  duration?: number
  compact?: boolean
  showControls?: boolean
  showBadge?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  duration: 0,
  compact: false,
  showControls: true,
  showBadge: true,
})

defineEmits<{
  'toggle-mute': []
  'toggle-hold': []
  'show-transfer': []
  'hangup': []
}>()

const { formatDuration } = useCallFormatters()

const getCallStatusText = () => {
  if (!props.call) return ''

  if (props.call.isOnHold) return 'Em espera'
  if (props.call.status === 'active') return 'Conectado'
  if (props.call.status === 'ringing') return props.call.direction === 'outbound' ? 'Chamando...' : 'Recebendo...'
  if (props.call.status === 'transferring') return 'Transferindo...'

  return ''
}
</script>

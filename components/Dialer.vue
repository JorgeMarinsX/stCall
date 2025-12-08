<template>
  <div class="dialer-component" @keydown="handleKeydown">
    <!-- Phone Number Input -->
    <div class="mb-6">
      <InputGroup>
        <InputText
          ref="inputRef"
          v-model="localPhoneNumber"
          placeholder="Digite o número"
          class="text-center text-2xl font-mono"
          @keyup.enter="handleCall"
          @keydown="handleInputKeydown"
          @input="filterInput"
        />
        <Button
          v-if="localPhoneNumber"
          icon="pi pi-times"
          severity="secondary"
          text
          @click="localPhoneNumber = ''"
        />
      </InputGroup>
    </div>

    <!-- Number Pad -->
    <div class="grid grid-cols-3 gap-3 mb-6">
      <Button
        v-for="digit in ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']"
        :key="digit"
        :ref="(el) => setButtonRef(digit, el)"
        :label="digit"
        outlined
        size="large"
        :class="[
          'h-16 text-2xl font-semibold transition-all duration-100',
          pressedKey === digit ? 'scale-95 bg-orange-100 dark:bg-orange-900' : ''
        ]"
        @click="addDigit(digit)"
      />
    </div>

    <!-- Call Button -->
    <Button
      :label="buttonLabel"
      icon="pi pi-phone"
      class="w-full"
      size="large"
      :disabled="!localPhoneNumber || localPhoneNumber.length < minDigits"
      :loading="isDialing"
      @click="handleCall"
    />

    <!-- Recent Calls (optional) -->
    <div v-if="showRecentCalls && recentCalls.length > 0" class="mt-6">
      <Divider />
      <p class="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
        Chamadas recentes
      </p>
      <div class="space-y-2">
        <div
          v-for="call in recentCalls.slice(0, 3)"
          :key="call.id"
          class="flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          @click="localPhoneNumber = call.number"
        >
          <div class="flex items-center gap-3">
            <Avatar
              v-if="call.callerName"
              :label="call.callerName.charAt(0).toUpperCase()"
              shape="circle"
              class="bg-orange-500 text-white"
            />
            <Avatar
              v-else
              icon="pi pi-user"
              shape="circle"
              class="bg-gray-500 text-white"
            />
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ call.callerName || 'Desconhecido' }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ call.number }}
              </p>
            </div>
          </div>
          <i
            :class="call.direction === 'inbound' ? 'pi pi-arrow-down text-blue-500' : 'pi pi-arrow-up text-green-500'"
          ></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CallHistory } from '~/types'

interface Props {
  phoneNumber?: string
  isDialing?: boolean
  showRecentCalls?: boolean
  recentCalls?: CallHistory[]
  buttonLabel?: string
  minDigits?: number
}

interface Emits {
  (e: 'update:phoneNumber', value: string): void
  (e: 'call', number: string): void
}

const props = withDefaults(defineProps<Props>(), {
  phoneNumber: '',
  isDialing: false,
  showRecentCalls: false,
  recentCalls: () => [],
  buttonLabel: 'Ligar',
  minDigits: 8,
})

const emit = defineEmits<Emits>()

// DOM ref
const inputRef = ref<HTMLInputElement | null>(null)

// Local state synced with prop (v-model)
const localPhoneNumber = computed({
  get: () => props.phoneNumber,
  set: (value) => emit('update:phoneNumber', value),
})

// Handle call emit
const handleCall = () => {
  if (localPhoneNumber.value && localPhoneNumber.value.length >= props.minDigits) {
    emit('call', localPhoneNumber.value)
  }
}

// Use dialer composable for all logic
const {
  pressedKey,
  setButtonRef,
  addDigit,
  handleInputKeydown,
  filterInput,
  handleKeydown,
  focusInput,
} = useDialer({
  phoneNumber: localPhoneNumber,
  inputRef,
  onCall: handleCall,
})

// Auto-focus input when component mounts
onMounted(() => {
  focusInput()
})
</script>

<style scoped>
/* Component-specific styles if needed */
</style>

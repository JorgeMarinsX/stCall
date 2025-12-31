<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    header="Recuperar senha"
    :style="{ width: '25rem' }"
    :draggable="false"
  >
    <form @submit.prevent="onSubmit" class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label for="recovery-email" class="font-medium">Email</label>
        <InputText
          id="recovery-email"
          v-model="email"
          type="email"
          placeholder="Digite seu email"
          :disabled="loading"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label for="recovery-extension" class="font-medium">Ramal</label>
        <InputText
          id="recovery-extension"
          v-model="extension"
          type="text"
          placeholder="Digite seu ramal"
          :disabled="loading"
        />
      </div>

      <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded text-sm text-blue-800 dark:text-blue-200">
        <p class="text-xs">
          Informe seu email e ramal cadastrados. Você receberá instruções para redefinir sua senha.
        </p>
      </div>

      <div class="flex justify-end gap-3 mt-2">
        <Button
          type="button"
          label="Cancelar"
          severity="secondary"
          @click="onCancel"
          :disabled="loading"
        />
        <Button
          type="submit"
          label="Enviar"
          icon="pi pi-send"
          :loading="loading"
          :disabled="loading"
        />
      </div>
    </form>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const toast = useToast()

const isVisible = ref(props.visible)
const email = ref('')
const extension = ref('')
const loading = ref(false)

watch(() => props.visible, (newValue) => {
  isVisible.value = newValue
})

watch(isVisible, (newValue) => {
  emit('update:visible', newValue)

  // Reset form when dialog is closed
  if (!newValue) {
    email.value = ''
    extension.value = ''
    loading.value = false
  }
})

function onCancel() {
  isVisible.value = false
}

async function onSubmit() {
  // Validate inputs
  if (!email.value || !extension.value) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha email e ramal',
      life: 3000
    })
    return
  }

  loading.value = true

  // TODO: Implement password recovery logic
  // Simulate API call
  setTimeout(() => {
    toast.add({
      severity: 'info',
      summary: 'Solicitação enviada',
      detail: 'Em breve: Instruções enviadas para seu email',
      life: 5000
    })
    loading.value = false
    isVisible.value = false
  }, 1500)
}
</script>

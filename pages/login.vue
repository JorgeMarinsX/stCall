<template>
  <div class="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50">
    <div class="flex flex-row items-center mb-8">
      <h1 class="text-3xl font-bold mb-6 text-center text-primary-500">stCall</h1>
    </div>
    <Card class="w-full max-w-md">
      <template #title>
        <h2 class="text-xl font-semibold w-full align-middle justify-center text-center">Login</h2>
      </template>
      <template #content>
        <form @submit.prevent="onSubmit" class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <label for="email" class="font-medium">Email</label>
            <InputText 
              id="email"
              v-model="email" 
              type="email" 
              placeholder="Digite seu email"
            />
          </div>
          
          <div class="flex flex-col gap-2">
            <label for="password" class="font-medium">Password</label>
            <Password
              id="password"
              v-model="password"
              :feedback="false"
              toggleMask
              placeholder="Digite sua senha"
              class="w-full"
              inputClass="w-full"
            />
          </div>
          
          <div class="flex items-center gap-3 mt-4">
            <Button
              type="submit"
              label="Entrar"
              icon="pi pi-sign-in"
              :loading="loading"
              :disabled="loading"
            />
            <Button
              type="button"
              label="Esqueci minha senha"
              severity="secondary"
              @click="onForgotPassword"
            />
          </div>

        </form>
      </template>
    </Card>

    <PasswordRecoveryDialog v-model:visible="showRecoveryDialog" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

definePageMeta({
  layout: 'blank'
})

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const showRecoveryDialog = ref(false)

function onForgotPassword() {
  showRecoveryDialog.value = true
}

async function onSubmit() {
  // Validate inputs
  if (!email.value || !password.value) {
    toast.add({
      severity: 'warn',
      summary: 'Atenção',
      detail: 'Preencha email e senha',
      life: 3000
    })
    return
  }

  loading.value = true

  const loginSuccess = await authStore.login(email.value, password.value)

  if (loginSuccess) {
    router.push('/')
  }

  loading.value = false
}
</script>
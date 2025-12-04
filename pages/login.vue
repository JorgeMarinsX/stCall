<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div class="flex flex-row items-center mb-8">
      <h1 class="text-3xl font-bold mb-6 text-center">stCall</h1>
    </div>
    <Card class="w-full max-w-md">
      <template #title>
        <h2 class="text-xl font-semibold">Login</h2>
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
          
          <div class="flex flex-col gap-2 w-full">
            <label for="password" class="font-medium">Password</label>
            <Password 
              id="password"
              v-model="password" 
              :feedback="false"
              toggleMask
              placeholder="Digite sua senha"
               />
          </div>
          
          <div class="flex items-center justify-between mt-4">
            <Button
              type="submit"
              label="Entrar"
              icon="pi pi-sign-in"
              :loading="loading"
              :disabled="loading"
            />
            <NuxtLink to="/" class="text-sm text-primary-600 hover:underline">
              Voltar
            </NuxtLink>
          </div>

          <!-- Development hint -->
          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded text-sm text-blue-800 dark:text-blue-200">
            <p class="font-medium mb-1">💡 Desenvolvimento:</p>
            <p class="text-xs"> <b>Atenção</b> <code>No momento, o login está sendo dsenvolvido. É provável que você não consiga acessar enquanto este processo não for concluído</code></p>
            
          </div>
        </form>
      </template>
    </Card>
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

  try {
    const success = await authStore.login(email.value, password.value)

    if (success) {
      toast.add({
        severity: 'success',
        summary: 'Login realizado',
        detail: `Bem-vindo, ${authStore.userName}!`,
        life: 3000
      })

      // Redirect to dashboard
      router.push('/')
    } else {
      // Show error from authStore
      toast.add({
        severity: 'error',
        summary: 'Erro de autenticação',
        detail: authStore.lastError || 'Email ou senha inválidos',
        life: 5000
      })
    }
  } catch (error: any) {
    console.error('Login error:', error)
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Falha ao conectar ao servidor',
      life: 5000
    })
  } finally {
    loading.value = false
  }
}
</script>
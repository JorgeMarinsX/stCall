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
          
          <div class="flex flex-col gap-2">
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
            />
            <NuxtLink to="/" class="text-sm text-primary-600 hover:underline">
              Voltar
            </NuxtLink>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

definePageMeta({
  layout: 'blank'
});

const email = ref('');
const password = ref('');
const router = useRouter();

function onSubmit() {
  // Placeholder auth flow — replace with real logic
  router.push('/');
}
</script>
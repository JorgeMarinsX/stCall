<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="w-full max-w-md bg-white p-6 rounded shadow">
      <h2 class="text-xl font-semibold mb-4">Sign In</h2>
      <form @submit.prevent="onSubmit" class="space-y-4">
        <div>
          <label class="block text-sm mb-1">Email</label>
          <input v-model="email" type="email" class="w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label class="block text-sm mb-1">Password</label>
          <input v-model="password" type="password" class="w-full border rounded px-3 py-2" />
        </div>
        <div class="flex items-center justify-between">
          <button type="submit" class="bg-primary-600 text-white px-4 py-2 rounded">Sign in</button>
          <NuxtLink to="/" class="text-sm text-primary-600">Back</NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const router = useRouter();

function onSubmit() {
  // Placeholder auth flow — replace with real logic
  router.push('/');
}
</script>

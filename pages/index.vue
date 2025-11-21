<template>
  <div class="p-6">
    <h1 class="text-2xl font-semibold">Bem vindo, {{ employeeName }}</h1>
    <NuxtLink to="/call" class="text-primary-600">Carregando sua Dashboard...</NuxtLink>
  </div>
</template>


<script setup>
import { ref } from 'vue';

const employeeName = ref(
  'Fulano da Silva'
);

</script>
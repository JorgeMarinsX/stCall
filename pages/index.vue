<template>
  <div class="p-6 h-full">
    <h1 class="text-2xl font-semibold">Bem vindo, {{ employeeName }}</h1>
    <NuxtLink to="/call" class="text-primary-600">Carregando sua Dashboard...</NuxtLink>
    <div class="flex col-12 h-full">

  </div>
  </div>
</template>


<script setup>
import { ref } from 'vue';

useHead({
  title: 'stCall - Dashboard',
});

const employeeName = ref(
  'Fulano da Silva'
);

</script>
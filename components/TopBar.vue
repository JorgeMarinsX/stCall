<!-- Login information, profile picture and 
    current call information go here
-->

<template>
<Toolbar class="sticky top-0 shadow-md shadow-orange">
    <template #start>
        <Button icon="pi pi-plus color-primary-400" label="Nova chamada" class="bg-primary-400 text-primary-50 p-4" severity="secondary" text />
        <Button icon="pi pi-print" class="mr-2 p-3" severity="secondary" text />
        <Button icon="pi pi-upload p-3" severity="secondary" text />
    </template>

    <template #center>
        <IconField>
            <InputIcon>
                <i class="pi pi-search" />
            </InputIcon>
            <InputText placeholder="Search"/>
        </IconField>
    </template>

    <template #end>
        <div class="flex flex-col items-center gap-2" role="navigation" aria-label="Main navigation">
            <Avatar image="/avatar.png" alt="User avatar" class="w-14 h-14" size="large" />
            <div class="text-sm text-gray-700">Nome do Colaborador</div>
        </div>
        <div class="flex flex-col items-center gap-1" aria-label="Toggle dark mode">
            <Button :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="p-button-text p-button-plain" @click="toggleDarkMode" />
        </div>                        
    </template>
</Toolbar>
</template>

<script setup>
import { ref } from 'vue';

const isDark = ref(false);

function toggleDarkMode() {
    document.documentElement.classList.toggle('stcall-dark-mode');
    isDark.value = !isDark.value;
    
}
</script>
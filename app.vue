
<template>
    <div class="flex h-screen">
    
    
        <AppSidebar />

        <div class="flex-1 flex flex-col">
            <header class="p-4 border-b bg-white">
                <Toolbar>
                    <template #start>
                        <Button icon="pi pi-plus" class="mr-2" severity="secondary" text />
                        <Button icon="pi pi-print" class="mr-2" severity="secondary" text />
                        <Button icon="pi pi-upload" severity="secondary" text />
                    </template>

                    <template #center>
                        <IconField>
                            <InputIcon>
                                <i class="pi pi-search" />
                            </InputIcon>
                            <InputText placeholder="Search" />
                        </IconField>
                    </template>

                    <template #end>
                        <SplitButton label="Save" :model="items"></SplitButton>
                    </template>
                </Toolbar>
            </header>

            <main class="flex-1 overflow-auto p-4">
                <NuxtPage />
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const items = ref([
    {
        label: 'Update',
        icon: 'pi pi-refresh'
    },
    {
        label: 'Delete',
        icon: 'pi pi-times'
    }
])
</script>

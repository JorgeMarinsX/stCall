<!-- Login information, profile picture and
    current call information go here
-->

<template>
<Toolbar class="sticky top-0 shadow-md shadow-orange">
    <template #start>
        <Button
            :icon="isConnected ? 'pi pi-link' : 'pi pi-link-slash'"
            :label="isConnected ? 'Desconectar' : 'Conectar'"
            :class="isConnected ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'"
            class="mr-2 p-3"
            @click="toggleConnection"
        />

        <Button
            icon="pi pi-phone"
            label="Nova chamada"
            class="bg-primary-400 text-white p-3 mr-2"
            @click="initiateNewCall"
        />
    </template>

    <template #center>
        <div v-if="isLoadingCallInfo" class="flex items-center gap-2">
            <Skeleton width="200px" height="24px" />
            <Skeleton width="100px" height="20px" />
        </div>
        <div v-else-if="activeCall" class="flex items-center gap-3 px-4 py-2 bg-green-50 dark:bg-green-900 rounded-lg">
            <i class="pi pi-phone text-green-600 dark:text-green-400" />
            <div class="flex flex-col">
                <span class="font-semibold text-gray-900 dark:text-gray-100">{{ activeCall.callerName || activeCall.callerNumber }}</span>
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ formatCallDuration(activeCall.duration) }}</span>
            </div>
        </div>
        <div v-else class="text-gray-500 dark:text-gray-400 px-4 py-2">
            Nenhuma chamada ativa
        </div>
    </template>

    <template #end>
        <div class="flex items-center gap-4">
            <div class="flex flex-col items-center gap-1" role="navigation" aria-label="Main navigation">
                <Avatar :image="authStore.user?.avatar || '/avatar.png'" alt="User avatar" class="w-12 h-12" size="large" />
                <div class="text-sm text-gray-700 dark:text-gray-300">{{ authStore.userName }}</div>
            </div>
            <div class="flex flex-col items-center gap-1" aria-label="Toggle dark mode">
                <Button :icon="isDark ? 'pi pi-sun' : 'pi pi-moon'" class="p-button-text p-button-plain" @click="toggleDarkMode" />
            </div>
        </div>
    </template>
</Toolbar>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '~/stores/authStore';
import { useUiStore } from '~/stores/uiStore';

const authStore = useAuthStore();
const uiStore = useUiStore();

const isDark = computed(() => uiStore.isDarkMode);
const isConnected = ref(false);
const isLoadingCallInfo = ref(false);
const activeCall = ref(null);
let callDurationInterval = null;

// Mock active call data - replace with actual WebSocket data
// activeCall structure: { callerName: string, callerNumber: string, duration: number (seconds) }

function toggleDarkMode() {
    uiStore.toggleDarkMode();
}

function toggleConnection() {
    isConnected.value = !isConnected.value;
    // TODO: Implement actual connection logic with Asterisk
    console.log('Connection toggled:', isConnected.value ? 'Connected' : 'Disconnected');
}

function initiateNewCall() {
    // TODO: Open new call dialog
    console.log('Initiating new call');
}

function formatCallDuration(seconds) {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Simulate loading and active call for demonstration
onMounted(() => {
    // Example: Simulate loading state
    // isLoadingCallInfo.value = true;
    // setTimeout(() => {
    //     isLoadingCallInfo.value = false;
    //     // Example active call
    //     activeCall.value = {
    //         callerName: 'João Silva',
    //         callerNumber: '+55 11 98765-4321',
    //         duration: 0
    //     };
    //     // Start duration counter
    //     callDurationInterval = setInterval(() => {
    //         if (activeCall.value) {
    //             activeCall.value.duration++;
    //         }
    //     }, 1000);
    // }, 2000);
});

onUnmounted(() => {
    if (callDurationInterval) {
        clearInterval(callDurationInterval);
    }
});
</script>
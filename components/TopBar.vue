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
            :disabled="hasActiveCall || callStore.isDialing"
            @click="initiateNewCall"
        />
    </template>

    <template #center>
        <div v-if="isLoadingCallInfo" class="flex items-center gap-2">
            <Skeleton width="200px" height="24px" />
            <Skeleton width="100px" height="20px" />
        </div>
        <div v-else-if="callStore.hasActiveCall" class="bg-green-50 dark:bg-green-900 rounded-lg">
            <ActiveCallDisplay
                :call="callStore.activeCall"
                :duration="callDuration"
                :compact="true"
                :show-controls="false"
                :show-badge="false"
            />
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

<!-- Dialer Dialog -->
<Dialog
    v-model:visible="dialerVisible"
    header="Nova chamada"
    modal
    :style="{ width: '500px' }"
>
    <Dialer
        v-model:phone-number="phoneNumber"
        :is-dialing="callStore.isDialing"
        :show-recent-calls="true"
        :recent-calls="recentCalls"
        @call="handleCall"
    />
</Dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAuthStore } from '~/stores/authStore';
import { useUiStore } from '~/stores/uiStore';
import { useCallStore } from '~/stores/callStore';

const authStore = useAuthStore();
const uiStore = useUiStore();
const callStore = useCallStore();
const toast = useToast();

const isDark = computed(() => uiStore.isDarkMode);
const isConnected = ref(false);
const isLoadingCallInfo = ref(false);
const dialerVisible = ref(false);
const phoneNumber = ref('');

// Computed
const recentCalls = computed(() => callStore.recentCalls);
const hasActiveCall = computed(() => callStore.hasActiveCall);

// Call duration tracking
const { callDuration } = useCallDuration(() => callStore.activeCall);

function toggleDarkMode() {
    uiStore.toggleDarkMode();
}

function toggleConnection() {
    isConnected.value = !isConnected.value;
    // TODO: Implement actual connection logic with Asterisk
    console.log('Connection toggled:', isConnected.value ? 'Connected' : 'Disconnected');
}

function initiateNewCall() {
    dialerVisible.value = true;
    phoneNumber.value = '';
}

function handleCall(number) {
    callStore.startOutboundCall(number);
    dialerVisible.value = false;
    phoneNumber.value = '';

    toast.add({
        severity: 'info',
        summary: 'Discando',
        detail: 'Iniciando chamada...',
        life: 2000,
    });
}
</script>
<!-- Login information, profile picture and
    current call information go here
-->

<template>
<Toolbar class="sticky top-0 shadow-md shadow-orange">
    <template #start>
        <ClientOnly>
            <div v-if="connectionStatus !== 'connected'" class="bg-red-500 text-white px-3 py-2 rounded-md text-sm mr-2 flex items-center gap-2">
                <i class="pi pi-exclamation-triangle"></i>
                <span>WebSocket desconectado</span>
                <Button
                    icon="pi pi-refresh"
                    label="Reconectar"
                    size="small"
                    severity="secondary"
                    outlined
                    class="bg-white text-red-500 border-white hover:bg-red-50"
                    :loading="asteriskStore.connectionStatus === 'connecting'"
                    @click="retryWebSocketConnection"
                />
            </div>

            <Button
                :icon="isConnected ? 'pi pi-link' : 'pi pi-link-slash'"
                :label="isConnected ? 'Desconectar' : 'Conectar'"
                :class="isConnected ? 'bg-red-500 text-white' : 'bg-green-600 text-white'"
                class="mr-2 p-3"
                :disabled="connectionStatus !== 'connected'"
                @click="toggleConnection"
                v-tooltip.bottom="connectionStatus !== 'connected' ? 'WebSocket desconectado - clique em Reconectar primeiro' : ''"
            />

            <Button
                icon="pi pi-phone"
                label="Nova chamada"
                class="bg-primary-400 text-white p-3 mr-2"
                :disabled="hasActiveCall || callStore.isDialing || !isConnected"
                @click="initiateNewCall"
            />

            <template #fallback>
                <!-- Skeleton loading state while client-side JS loads -->
                <div class="flex items-center gap-2">
                    <Skeleton width="140px" height="44px" borderRadius="6px" />
                    <Skeleton width="150px" height="44px" borderRadius="6px" />
                </div>
            </template>
        </ClientOnly>
    </template>

    <template #center>
        <div v-if="isLoadingCallInfo" class="flex items-center gap-2">
            <Skeleton width="200px" height="24px" />
            <Skeleton width="100px" height="20px" />
        </div>
        <div v-else-if="callStore.hasActiveCall" class="bg-green-50 dark:bg-green-900 rounded-lg">
            <NuxtLink to="/call">
            <ActiveCallDisplay
                :call="callStore.activeCall"
                :duration="callDuration"
                :compact="true"
                :show-controls="false"
                :show-badge="false"
            />
            </NuxtLink>
        </div>
        <div v-else class="text-gray-500 dark:text-gray-400 px-4 py-2">
            Nenhuma chamada ativa
        </div>
    </template>

    <template #end>
        <div class="flex items-center gap-4">
            <ClientOnly>
                <div class="flex flex-col items-center gap-1" role="navigation" aria-label="Main navigation">
                    <Avatar :image="authStore.user?.avatar || '/avatar.png'" alt="User avatar" class="w-12 h-12" size="large" />
                    <div class="text-sm text-gray-700 dark:text-gray-300">{{ authStore.userName }}</div>
                </div>
                <template #fallback>
                    <div class="flex flex-col items-center gap-1">
                        <Skeleton shape="circle" size="3rem" />
                        <Skeleton width="6rem" height="1rem" />
                    </div>
                </template>
            </ClientOnly>
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

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '~/stores/authStore';
import { useUiStore } from '~/stores/uiStore';
import { useCallStore } from '~/stores/callStore';
import { useAgentStore } from '~/stores/agentStore';
import { useAsteriskStore } from '~/stores/asteriskStore';

const authStore = useAuthStore();
const uiStore = useUiStore();
const callStore = useCallStore();
const agentStore = useAgentStore();
const asteriskStore = useAsteriskStore();

const { toast } = useGlobalToast();

// Debug: Log store states
onMounted(() => {
    console.log('TopBar mounted - Initial states:', {
        connectionStatus: asteriskStore.connectionStatus,
        isConnectedToQueue: agentStore.isConnectedToQueue,
        isAuthenticated: authStore.isAuthenticated,
    });
});

// Watch for connectionStatus changes
watch(() => asteriskStore.connectionStatus, (newStatus, oldStatus) => {
    console.log('connectionStatus changed:', { oldStatus, newStatus });
});

watch(() => agentStore.isConnectedToQueue, (newValue, oldValue) => {
    console.log('isConnectedToQueue changed:', { oldValue, newValue });
});

const isDark = computed(() => uiStore.isDarkMode);
const isLoadingCallInfo = ref(false);
const dialerVisible = ref(false);
const phoneNumber = ref('');

// Computed - use agentStore for connection status
const isConnected = computed(() => agentStore.isConnectedToQueue);
const recentCalls = computed(() => callStore.recentCalls);
const hasActiveCall = computed(() => callStore.hasActiveCall);
const connectionStatus = computed(() => asteriskStore.connectionStatus);

// Call duration tracking
const { callDuration } = useCallDuration(() => callStore.activeCall);

function toggleDarkMode() {
    uiStore.toggleDarkMode();
}

async function toggleConnection() {
    console.log('toggleConnection called', {
        isConnectedToQueue: agentStore.isConnectedToQueue,
        connectionStatus: connectionStatus.value
    });

    try {
        if (agentStore.isConnectedToQueue) {
            console.log('Disconnecting from queue...');
            await agentStore.disconnectFromQueue();
            toast.add({
                severity: 'info',
                summary: 'Desconectado',
                detail: 'Você não receberá mais chamadas',
                life: 3000,
            });
        } else {
            console.log('Connecting to queue...');
            await agentStore.connectToQueue();
            toast.add({
                severity: 'success',
                summary: 'Conectado',
                detail: 'Você está pronto para receber chamadas',
                life: 3000,
            });
        }
    } catch (error) {
        console.error('toggleConnection error:', error);
        toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: error instanceof Error ? error.message : 'Falha ao alterar status de conexão',
            life: 5000,
        });
    }
}

function initiateNewCall() {
    dialerVisible.value = true;
    phoneNumber.value = '';
}

async function handleCall(number: string) {
    try {
        await callStore.startOutboundCall(number);
        dialerVisible.value = false;
        phoneNumber.value = '';

        toast.add({
            severity: 'info',
            summary: 'Discando',
            detail: `Iniciando chamada para ${number}...`,
            life: 2000,
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Erro ao iniciar chamada',
            detail: error instanceof Error ? error.message : 'Falha ao iniciar chamada',
            life: 5000,
        });
    }
}

async function retryWebSocketConnection() {
    try {
        // Reset reconnection attempts to allow retry
        asteriskStore.reconnectAttempts = 0;
        asteriskStore.isReconnecting = false;

        // Get fresh token from auth store
        const tokenFromStore = authStore.token;
        const tokenFromStorage = localStorage.getItem('auth_token');
        const token = tokenFromStore || tokenFromStorage;

        if (!token) {
            toast.add({
                severity: 'error',
                summary: 'Token não encontrado',
                detail: 'Faça login novamente',
                life: 5000,
            });
            return;
        }

        toast.add({
            severity: 'info',
            summary: 'Reconectando',
            detail: 'Tentando reconectar ao WebSocket...',
            life: 2000,
        });

        // Disconnect first if needed
        if (asteriskStore.websocket) {
            asteriskStore.disconnect();
            // Wait a moment before reconnecting
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Reconnect with the token (guaranteed to be string after null check)
        await asteriskStore.connect(token);

    } catch (error) {
        console.error('Manual reconnection failed:', error);
        toast.add({
            severity: 'error',
            summary: 'Falha ao reconectar',
            detail: 'Verifique se o servidor WebSocket está online',
            life: 5000,
        });
    }
}
</script>
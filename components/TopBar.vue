<template>
<Toolbar class="sticky top-0 shadow-md shadow-orange">
    <template #start>
        <ClientOnly>
            <div v-if="isDisconnected" class="bg-red-500 text-white px-3 py-2 rounded-md text-sm mr-2 flex items-center gap-2">
                <i class="pi pi-exclamation-triangle"></i>
                <span>WebSocket desconectado</span>
                <Button
                    icon="pi pi-refresh"
                    label="Reconectar"
                    size="small"
                    severity="secondary"
                    outlined
                    class="bg-white text-red-500 border-white hover:bg-red-50"
                    :loading="isConnecting"
                    @click="retryWebSocketConnection"
                />
            </div>

            <Button
                :icon="connectButtonIcon"
                :label="connectButtonLabel"
                :class="connectButtonClass"
                class="mr-2 p-3"
                :disabled="isDisconnected || isTogglingConnection"
                :loading="isTogglingConnection"
                @click="handleToggleConnection"
                v-tooltip.bottom="connectTooltip"
            />

            <Button
                icon="pi pi-phone"
                label="Nova chamada"
                class="bg-primary-400 text-white p-3 mr-2"
                :disabled="newCallDisabled"
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
        <div v-if="hasActiveCall" class="bg-green-50 dark:bg-green-900 rounded-lg">
            <NuxtLink to="/call">
            <ActiveCallDisplay
                :call="activeCall"
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
                    <Avatar :image="userAvatar" alt="User avatar" class="w-12 h-12" size="large" />
                    <div class="text-sm text-gray-700 dark:text-gray-300">{{ userName }}</div>
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
        :is-dialing="isDialing"
        :show-recent-calls="true"
        :recent-calls="recentCalls"
        @call="handleCall"
    />
</Dialog>
</template>

<script setup lang="ts">
const authStore = useAuthStore();
const uiStore = useUiStore();
const callStore = useCallStore();
const agentStore = useAgentStore();
const asteriskStore = useAsteriskStore();
const dialerStore = useDialerStore();

const { toggleConnection, startOutboundCall } = useCallHandler();
const { retryWebSocketConnection } = useWebSocketHandler();
const { callDuration } = useCallDuration(() => callStore.activeCall);
const isTogglingConnection = ref(false);

// Dialer UI management
const initiateNewCall = () => {
    dialerStore.show();
    dialerStore.clearPhoneNumber();
};

const handleCall = async (number: string) => {
    await startOutboundCall(number);
    // Close dialer and clear phone number after successful call initiation
    dialerStore.hide();
    dialerStore.clearPhoneNumber();
};

const isDark = computed(() => uiStore.isDarkMode);

const dialerVisible = computed({
    get: () => dialerStore.visible,
    set: (value) => value ? dialerStore.show() : dialerStore.hide()
});
const phoneNumber = computed({
    get: () => dialerStore.phoneNumber,
    set: (value) => dialerStore.setPhoneNumber(value)
});

const isConnected = computed(() => agentStore.isConnectedToQueue);
const connectionStatus = computed(() => asteriskStore.connectionStatus);
const isConnecting = computed(() => asteriskStore.connectionStatus === 'connecting');
const isDisconnected = computed(() => connectionStatus.value !== 'connected');

const recentCalls = computed(() => callStore.recentCalls);
const hasActiveCall = computed(() => callStore.hasActiveCall);
const activeCall = computed(() => callStore.activeCall);
const isDialing = computed(() => callStore.isDialing);

const userAvatar = computed(() => authStore.user?.avatar || '/avatar.png');
const userName = computed(() => authStore.userName);

const connectButtonIcon = computed(() => isConnected.value ? 'pi pi-link' : 'pi pi-link-slash');
const connectButtonLabel = computed(() => isConnected.value ? 'Desconectar' : 'Conectar');
const connectButtonClass = computed(() =>
    isConnected.value ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
);
const newCallDisabled = computed(() =>
    hasActiveCall.value || isDialing.value || !isConnected.value
);
const connectTooltip = computed(() =>
    isDisconnected.value ? 'WebSocket desconectado - clique em Reconectar primeiro' : ''
);

function toggleDarkMode() {
    uiStore.toggleDarkMode();
}

async function handleToggleConnection() {
    isTogglingConnection.value = true;
    console.log('🔄 Toggling agent connection...');

    await toggleConnection();

    isTogglingConnection.value = false;
    console.log('✅ Connection toggle completed');
}

// Debug watchers (only in development)
if (import.meta.dev) {
    watch(() => asteriskStore.connectionStatus, (newStatus, oldStatus) => {
        console.log('connectionStatus changed:', { oldStatus, newStatus });
    });

    watch(() => agentStore.isConnectedToQueue, (newValue, oldValue) => {
        console.log('isConnectedToQueue changed:', { oldValue, newValue });
    });

    onMounted(() => {
        console.log('TopBar mounted - Initial states:', {
            connectionStatus: asteriskStore.connectionStatus,
            isConnectedToQueue: agentStore.isConnectedToQueue,
            isAuthenticated: authStore.isAuthenticated,
        });
    });
}
</script>
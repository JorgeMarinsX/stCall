/**
 * Composable for handling WebSocket operations
 * Properly initializes stores inside the composable for SSR compatibility
 */
export const useWebSocketHandler = () => {
    // Initialize stores inside the composable (called during component setup)
    const asteriskStore = useAsteriskStore();
    const authStore = useAuthStore();
    const { toast } = useGlobalToast();

    const retryWebSocketConnection = async (): Promise<void> => {
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
    };

    return {
        retryWebSocketConnection,
    };
};

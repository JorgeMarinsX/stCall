<template>
  <div class="p-6">
    <Card>
      <template #title>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-cog text-2xl"></i>
          <span>Teste de Conexão Asterisk ARI</span>
        </div>
      </template>

      <template #content>
        <div class="flex flex-column gap-4">
          <!-- Connection Info -->
          <div class="p-4 bg-primary-50 dark:bg-primary-900 border-round">
            <h3 class="text-lg font-semibold mb-2">Configuração</h3>
            <div class="grid">
              <div class="col-6">
                <strong>Host:</strong> {{ config.public.asteriskHost }}
              </div>
              <div class="col-6">
                <strong>Porta ARI:</strong> {{ config.public.asteriskAriPort }}
              </div>
              <div class="col-12">
                <strong>URL:</strong> http://{{ config.public.asteriskHost }}:{{ config.public.asteriskAriPort }}/ari
              </div>
            </div>
          </div>

          <!-- Test Button -->
          <div class="flex gap-2">
            <Button
              label="Testar Conexão"
              icon="pi pi-play"
              @click="testConnection"
              :loading="loading"
              :disabled="loading"
            />
            <Button
              label="Limpar"
              icon="pi pi-trash"
              severity="secondary"
              outlined
              @click="clearResults"
              :disabled="loading"
            />
          </div>

          <!-- Results -->
          <div v-if="result" class="mt-4">
            <Divider />

            <div
              v-if="result.success"
              class="p-4 bg-green-50 dark:bg-green-900 border-round"
            >
              <div class="flex align-items-center gap-2 mb-3">
                <i class="pi pi-check-circle text-green-600 text-2xl"></i>
                <h3 class="text-lg font-semibold text-green-700 dark:text-green-300">
                  Conexão Bem-Sucedida!
                </h3>
              </div>

              <div class="grid">
                <div class="col-12">
                  <strong>Mensagem:</strong> {{ result.message }}
                </div>
                <div class="col-12">
                  <strong>Canais Ativos:</strong> {{ result.channelCount }}
                </div>
                <div class="col-12">
                  <strong>Timestamp:</strong> {{ formatTimestamp(result.timestamp) }}
                </div>
              </div>

              <!-- Channel List -->
              <div v-if="result.channels && result.channels.length > 0" class="mt-3">
                <h4 class="font-semibold mb-2">Canais:</h4>
                <DataTable
                  :value="result.channels"
                  size="small"
                  striped-rows
                  class="text-sm"
                >
                  <Column field="id" header="ID" />
                  <Column field="name" header="Nome" />
                  <Column field="state" header="Estado" />
                  <Column field="caller.number" header="Número" />
                </DataTable>
              </div>
            </div>

            <div
              v-else
              class="p-4 bg-red-50 dark:bg-red-900 border-round"
            >
              <div class="flex align-items-center gap-2 mb-3">
                <i class="pi pi-times-circle text-red-600 text-2xl"></i>
                <h3 class="text-lg font-semibold text-red-700 dark:text-red-300">
                  Falha na Conexão
                </h3>
              </div>

              <div class="grid">
                <div class="col-12">
                  <strong>Erro:</strong> {{ result.error }}
                </div>
                <div class="col-12" v-if="result.statusCode">
                  <strong>Código HTTP:</strong> {{ result.statusCode }}
                </div>
                <div class="col-12">
                  <strong>Timestamp:</strong> {{ formatTimestamp(result.timestamp) }}
                </div>
              </div>

              <div class="mt-3 p-3 bg-surface-100 dark:bg-surface-800 border-round">
                <h4 class="font-semibold mb-2">Dicas de Solução:</h4>
                <ul class="pl-4">
                  <li>Verifique se o Asterisk está rodando em {{ config.public.asteriskHost }}:{{ config.public.asteriskAriPort }}</li>
                  <li>Confirme que o usuário 'stcall' está configurado no ari.conf</li>
                  <li>Verifique se o firewall permite conexões na porta {{ config.public.asteriskAriPort }}</li>
                  <li>Teste manualmente: curl -u stcall:stcall http://{{ config.public.asteriskHost }}:{{ config.public.asteriskAriPort }}/ari/channels</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'default',
})

useHead({
  title: 'stCall - Teste Asterisk',
})

const config = useRuntimeConfig()
const loading = ref(false)
const result = ref<any>(null)

const testConnection = async () => {
  loading.value = true
  result.value = null

  try {
    const response = await $fetch('/api/asterisk/test')
    result.value = response
  } catch (error: any) {
    result.value = {
      success: false,
      error: error.message || 'Erro desconhecido',
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
    }
  } finally {
    loading.value = false
  }
}

const clearResults = () => {
  result.value = null
}

const formatTimestamp = (timestamp: string) => {
  return new Date(timestamp).toLocaleString('pt-BR')
}
</script>

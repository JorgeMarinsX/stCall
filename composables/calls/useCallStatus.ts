export function useCallStatus() {
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'completed': return 'Completada'
      case 'missed': return 'Perdida'
      case 'rejected': return 'Rejeitada'
      case 'abandoned': return 'Abandonada'
      case 'queued': return 'Na fila'
      default: return status
    }
  }

  const getStatusSeverity = (status: string): 'success' | 'danger' | 'secondary' | 'warn' => {
    switch (status) {
      case 'completed': return 'success'
      case 'missed': return 'danger'
      case 'rejected': return 'secondary'
      case 'abandoned': return 'warn'
      case 'queued': return 'secondary'
      default: return 'secondary'
    }
  }

  return {
    getStatusLabel,
    getStatusSeverity,
  }
}

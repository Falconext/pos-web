import { useCallback, useEffect, useState } from 'react';
import useAlertStore from '@/zustand/alert';
import * as api from '@/utils/api/logistica';
import type {
  IApiKey,
  IApiKeyCreada,
  IWebhook,
  IWebhookCreado,
} from './IntegracionesModel';

type SecretReveal =
  | { kind: 'apiKey'; data: IApiKeyCreada }
  | { kind: 'webhook'; data: IWebhookCreado };

type PendingDelete =
  | { kind: 'apiKey'; id: string; label: string }
  | { kind: 'webhook'; id: string; label: string };

export function useIntegracionesViewModel() {
  const { alert } = useAlertStore();

  const [apiKeys, setApiKeys] = useState<IApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<IWebhook[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [loadingHooks, setLoadingHooks] = useState(true);

  const [isKeyModalOpen, setKeyModalOpen] = useState(false);
  const [isHookModalOpen, setHookModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [reveal, setReveal] = useState<SecretReveal | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      const res = await api.getApiKeys();
      if (res.success) setApiKeys((res.data as IApiKey[]) ?? []);
      else alert(res.error || 'No se pudieron cargar las API keys', 'error');
    } finally {
      setLoadingKeys(false);
    }
  }, [alert]);

  const fetchWebhooks = useCallback(async () => {
    setLoadingHooks(true);
    try {
      const res = await api.getWebhooks();
      if (res.success) setWebhooks((res.data as IWebhook[]) ?? []);
      else alert(res.error || 'No se pudieron cargar los webhooks', 'error');
    } finally {
      setLoadingHooks(false);
    }
  }, [alert]);

  useEffect(() => {
    fetchApiKeys();
    fetchWebhooks();
  }, [fetchApiKeys, fetchWebhooks]);

  const handleCreateApiKey = async (data: { nombre?: string; entorno: 'live' | 'test' }) => {
    setCreating(true);
    try {
      const res = await api.createApiKey(data);
      if (res.success && res.data) {
        setKeyModalOpen(false);
        setReveal({ kind: 'apiKey', data: res.data as IApiKeyCreada });
        alert('API key generada correctamente', 'success');
        fetchApiKeys();
      } else {
        alert(res.error || 'No se pudo generar la API key', 'error');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCreateWebhook = async (data: { url: string; events: string[] }) => {
    setCreating(true);
    try {
      const res = await api.createWebhook(data);
      if (res.success && res.data) {
        setHookModalOpen(false);
        setReveal({ kind: 'webhook', data: res.data as IWebhookCreado });
        alert('Webhook registrado correctamente', 'success');
        fetchWebhooks();
      } else {
        alert(res.error || 'No se pudo registrar el webhook', 'error');
      }
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res =
        pendingDelete.kind === 'apiKey'
          ? await api.deleteApiKey(pendingDelete.id)
          : await api.deleteWebhook(pendingDelete.id);
      if (res.success) {
        alert(
          pendingDelete.kind === 'apiKey' ? 'API key revocada' : 'Webhook eliminado',
          'success',
        );
        if (pendingDelete.kind === 'apiKey') fetchApiKeys();
        else fetchWebhooks();
        setPendingDelete(null);
      } else {
        alert(res.error || 'No se pudo completar la operación', 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  return {
    apiKeys,
    webhooks,
    loadingKeys,
    loadingHooks,
    creating,
    isKeyModalOpen,
    isHookModalOpen,
    reveal,
    pendingDelete,
    deleting,
    actions: {
      openKeyModal: () => setKeyModalOpen(true),
      closeKeyModal: () => setKeyModalOpen(false),
      openHookModal: () => setHookModalOpen(true),
      closeHookModal: () => setHookModalOpen(false),
      closeReveal: () => setReveal(null),
      requestDeleteApiKey: (k: IApiKey) =>
        setPendingDelete({ kind: 'apiKey', id: k.id, label: k.nombre || `${k.prefijo}…${k.ultimosCuatro}` }),
      requestDeleteWebhook: (w: IWebhook) =>
        setPendingDelete({ kind: 'webhook', id: w.id, label: w.url }),
      cancelDelete: () => setPendingDelete(null),
      confirmDelete,
      handleCreateApiKey,
      handleCreateWebhook,
    },
  };
}

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';

export function NewOrder() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const mutation = useMutation({
    mutationFn: async (data: { notes: string; files: File[] }) => {
      // 1. Create order
      const order = await api.post<{ id: string }>('/api/portal/orders', {
        notes: data.notes,
      });

      // 2. Upload files if any
      if (data.files.length > 0) {
        await api.uploadFiles(`/api/portal/orders/${order.id}/files`, data.files);
      }

      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['portal', 'orders'] });
      navigate(`/portal/orders/${order.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;
    mutation.mutate({ notes, files });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-semibold mb-6">{t('portal.newOrder')}</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {mutation.isError && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
            {t('common.error')}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('order.notes')} *
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={4}
            placeholder={t('order.notes')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('order.attachments')}
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          {files.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={mutation.isPending}
        >
          {t('common.submit')}
        </Button>
      </form>
    </div>
  );
}

export default NewOrder;

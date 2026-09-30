import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { PageSkeleton } from '@/components/ui/skeleton';
import { Page, Stagger, StaggerItem } from '@/components/ui/motion';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/dialog';
import { interviewApi } from '@/lib/services';
import { errorMessage } from '@/lib/api';
import { formatDate, SCORE_TEXT, scoreTone } from '@/lib/format';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    interviewApi
      .list(page, 10)
      .then(setData)
      .catch((error) => toast.error(errorMessage(error)));
  }, [page]);

  useEffect(load, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await interviewApi.remove(toDelete.id);
      toast.success('Interview deleted');
      setToDelete(null);
      load();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  if (!data) return <PageSkeleton label="Loading history..." />;

  return (
    <Page className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-eyebrow text-brand-600">History</p>
          <h1 className="text-title mt-1 text-ink-950">Your interviews</h1>
          <p className="mt-1 text-ink-700">{data.total} interview{data.total === 1 ? '' : 's'}</p>
        </div>
        <Button variant="ink" onClick={() => navigate('/interview/new')}>
          <Plus className="size-4" /> New interview
        </Button>
      </div>

      <Panel className="p-2 sm:p-3">
        {data.items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold">No interviews yet</p>
            <p className="mt-1 text-sm text-white/55">Your completed interviews and reports will appear here.</p>
          </div>
        ) : (
          <Stagger as="ul" className="divide-y divide-white/[0.06]" step={0.04}>
            {data.items.map((item) => {
              const inProgress = item.status === 'in_progress';
              const href = inProgress ? `/interview/${item.id}` : `/interview/${item.id}/report`;
              return (
                <StaggerItem as="li" key={item.id} className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.03] sm:px-4">
                  <Link to={href} className="flex min-w-0 flex-1 items-center gap-4">
                    <span className={`w-12 shrink-0 text-center text-2xl font-semibold tabular-nums ${SCORE_TEXT[scoreTone(item.overallScore)]}`}>
                      {inProgress ? <PlayCircle className="mx-auto size-6 text-brand-300" /> : item.overallScore ?? '-'}
                    </span>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {item.roleTitle}
                        <Badge>{item.difficultyLabel}</Badge>
                        {inProgress && <Badge tone="brand">In progress</Badge>}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-white/50">{item.headline ?? `Started ${formatDate(item.createdAt)}`}</p>
                    </div>
                  </Link>
                  <span className="hidden text-xs text-white/40 sm:block">{formatDate(item.completedAt ?? item.createdAt)}</span>
                  <button
                    onClick={() => setToDelete(item)}
                    aria-label={`Delete ${item.roleTitle} interview`}
                    className="grid size-9 cursor-pointer place-items-center rounded-lg text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </StaggerItem>
              );
            })}
          </Stagger>
        )}
      </Panel>

      {data.pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="ink" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
            <ChevronLeft className="size-4" /> Previous
          </Button>
          <span className="text-sm text-ink-700">
            Page {data.page} of {data.pages}
          </span>
          <Button variant="ink" size="sm" disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)}>
            Next <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this interview?"
        description="The transcript and report will be permanently removed. This can't be undone."
        confirmLabel="Delete"
        loading={deleting}
        onClose={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </Page>
  );
}

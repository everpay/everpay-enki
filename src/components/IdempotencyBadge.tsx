import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RefreshCw, Repeat } from 'lucide-react';

export interface IdempotencyInfo {
  key?: string | null;
  replay?: boolean;
  duplicate?: boolean;
  attempt?: number;
  total_attempts?: number;
}

export function extractIdempotency(
  metadata: Record<string, unknown> | undefined | null,
  fallbackKey?: string | null,
): IdempotencyInfo {
  const m = (metadata ?? {}) as any;
  const attempts = m.attempts ?? m.retry_attempts ?? m.cascade_attempts;
  return {
    key: m.idempotency_key ?? fallbackKey ?? null,
    replay: !!(m.idempotent_replay ?? m._idempotent_replay),
    duplicate: !!m.idempotency_conflict,
    attempt: typeof m.attempt === 'number' ? m.attempt : Array.isArray(attempts) ? attempts.length : undefined,
    total_attempts: Array.isArray(attempts) ? attempts.length : m.total_attempts,
  };
}

export function IdempotencyBadge({ info }: { info: IdempotencyInfo }) {
  if (!info.key && !info.replay && !info.duplicate && !(info.total_attempts && info.total_attempts > 1)) {
    return null;
  }
  if (info.duplicate) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className="gap-1 text-[10px]"><Repeat className="h-3 w-3" /> Duplicate</Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Duplicate request — idempotency key was sent while a prior request was still processing.</p>
          {info.key && <p className="mt-1 font-mono text-[10px] opacity-70">{info.key}</p>}
        </TooltipContent>
      </Tooltip>
    );
  }
  if (info.replay) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="gap-1 text-[10px]"><RefreshCw className="h-3 w-3" /> Replay</Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Idempotent replay — cached response returned. No new charge was made.</p>
          {info.key && <p className="mt-1 font-mono text-[10px] opacity-70">{info.key}</p>}
        </TooltipContent>
      </Tooltip>
    );
  }
  if (info.total_attempts && info.total_attempts > 1) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1 text-[10px]"><RefreshCw className="h-3 w-3" /> Retry ×{info.total_attempts}</Badge>
        </TooltipTrigger>
        <TooltipContent><p className="text-xs">Cascaded across {info.total_attempts} provider attempts.</p></TooltipContent>
      </Tooltip>
    );
  }
  return null;
}
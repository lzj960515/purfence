import { getBackendBaseUrl } from '@/lib/backend';

/**
 * Queue statistics from liteque
 */
export interface QueueStats {
  pending: number;
  pending_retry: number;
  running: number;
  failed: number;
}

/**
 * Queue status response
 */
export interface QueueStatus {
  isRunning: boolean;
  concurrency: number;
  stats: QueueStats;
}

/**
 * Job information
 */
export interface JobInfo {
  id: number;
  issueId: string;
  status: 'pending' | 'running' | 'pending_retry' | 'failed';
  priority: number;
  createdAt: string;
  availableAt?: string;
  numRunsLeft: number;
  error?: string;
}

/**
 * Jobs list response
 */
export interface JobsListResponse {
  jobs: JobInfo[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Clear queue response
 */
export interface ClearQueueResponse {
  message: string;
  count: number;
}

/**
 * Generic API response
 */
export interface ApiResponse {
  message: string;
}

/**
 * Get queue statistics and status
 */
export async function fetchQueueStats(): Promise<QueueStatus> {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(`${backendBaseUrl}/api/queue/stats`);
  if (!response.ok) {
    throw new Error(`Failed to fetch queue stats: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Pause the queue
 */
export async function pauseQueue(): Promise<ApiResponse> {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(`${backendBaseUrl}/api/queue/pause`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to pause queue: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Resume the queue
 */
export async function resumeQueue(): Promise<ApiResponse> {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(`${backendBaseUrl}/api/queue/resume`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error(`Failed to resume queue: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Clear all non-running jobs from the queue
 */
export async function clearQueue(): Promise<ClearQueueResponse> {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(`${backendBaseUrl}/api/queue/clear`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to clear queue: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get jobs list (currently not implemented in backend)
 * This is a placeholder for future implementation
 */
export async function fetchJobs(
  _status?: string,
  _page: number = 1,
  _limit: number = 20,
): Promise<JobsListResponse> {
  const backendBaseUrl = getBackendBaseUrl();
  const params = new URLSearchParams();
  if (_status) params.append('status', _status);
  params.append('page', String(_page));
  params.append('limit', String(_limit));

  const response = await fetch(
    `${backendBaseUrl}/api/queue/jobs?${params.toString()}`,
  );

  if (response.status === 404) {
    // Endpoint not implemented - return empty state
    return {
      jobs: [],
      total: 0,
      page: _page,
      limit: _limit,
    };
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch jobs: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Retry a failed job (currently not implemented in backend)
 */
export async function retryJob(_jobId: number): Promise<ApiResponse> {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(
    `${backendBaseUrl}/api/queue/jobs/${_jobId}/retry`,
    {
      method: 'POST',
    },
  );

  if (response.status === 404) {
    throw new Error('此功能后端尚未实现');
  }

  if (!response.ok) {
    throw new Error(`Failed to retry job: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Delete a job (currently not implemented in backend)
 */
export async function deleteJob(_jobId: number): Promise<ApiResponse> {
  const backendBaseUrl = getBackendBaseUrl();
  const response = await fetch(
    `${backendBaseUrl}/api/queue/jobs/${_jobId}`,
    {
      method: 'DELETE',
    },
  );

  if (response.status === 404) {
    throw new Error('此功能后端尚未实现');
  }

  if (!response.ok) {
    throw new Error(`Failed to delete job: ${response.statusText}`);
  }
  return response.json();
}

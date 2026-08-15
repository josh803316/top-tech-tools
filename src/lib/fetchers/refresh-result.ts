export type RefreshResult = { synced: number; errors: string[] };

export function isAuthorizedRefresh(
  authorization: string | null,
  cronSecret: string | undefined
): boolean {
  return Boolean(cronSecret && authorization === `Bearer ${cronSecret}`);
}

export function refreshHttpStatus(result: RefreshResult): 200 | 207 | 500 {
  if (result.errors.length === 0) return 200;
  return result.synced > 0 ? 207 : 500;
}

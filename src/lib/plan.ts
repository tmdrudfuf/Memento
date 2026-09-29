// Free plan rules (MONETIZATION.md §2, §7). Pure so they can be tested without a store.

export const FREE_JAR_LIMIT = 3;

/** Free users may hold 3 jars. Existing jars are never locked, even if Premium lapses. */
export function canCreateJar(jarCount: number, isPremium: boolean) {
  return isPremium || jarCount < FREE_JAR_LIMIT;
}

export type PaywallReason = 'jars' | 'rediscover' | 'recap' | 'settings';

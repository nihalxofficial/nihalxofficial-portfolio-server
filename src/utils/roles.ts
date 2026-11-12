/**
 * Role utilities matching Sparq-Server architecture.
 */
export const ROLES = ["admin", "demoadmin", "user"] as const;

export type UserRole = (typeof ROLES)[number];

export const normalizeRole = (role?: string | null) => (role || "").toLowerCase().trim();

export const isAdminRole = (role?: string | null) => {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "demoadmin";
};

export function normalizeRoles(input?: unknown): string[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  const seen = new Set<string>();
  for (const raw of list) {
    const value = normalizeRole(typeof raw === "string" ? raw : null);
    if (value) seen.add(value);
  }
  return Array.from(seen);
}

export function hasAnyRole(
  roles: unknown,
  allowed: readonly string[],
  legacyRole?: string | null
): boolean {
  const list = normalizeRoles(roles);
  const pool = list.length > 0 ? list : normalizeRoles(legacyRole);
  const wanted = allowed.map(normalizeRole);
  return wanted.some((role) => pool.includes(role));
}


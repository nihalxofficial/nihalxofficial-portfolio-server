export const ROLES = ["admin", "demoadmin", "user"] as const;

export type UserRole = (typeof ROLES)[number];

export const normalizeRole = (role?: string | null) => (role || "").toLowerCase().trim();

export const isAdminRole = (role?: string | null) => {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "demoadmin";
};

export function hasRole(userRole: unknown, allowedRole: string): boolean {
  return normalizeRole(typeof userRole === "string" ? userRole : null) === normalizeRole(allowedRole);
}

export function hasAnyRole(
  userRole: unknown,
  allowed: readonly string[],
): boolean {
  const normalized = normalizeRole(typeof userRole === "string" ? userRole : null);
  const wanted = allowed.map(normalizeRole);
  return wanted.includes(normalized);
}

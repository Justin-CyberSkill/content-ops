import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export const ac = createAccessControl(defaultStatements);

// Admins manage members; members only work on content.
export const roles = {
  admin: ac.newRole(adminAc.statements),
  member: ac.newRole({ user: [], session: [] }),
};

export type Role = keyof typeof roles;
export const ROLES = Object.keys(roles) as [Role, ...Role[]];

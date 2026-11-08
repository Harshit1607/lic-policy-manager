import { listPolicies } from '../db/policies';
import { PolicyWithStatus, withStatus } from './aggregate';

/** Load all policies (optionally filtered) with their derived premium status. */
export async function loadPoliciesWithStatus(search?: string): Promise<PolicyWithStatus[]> {
  const policies = await listPolicies(search);
  return policies.map((p) => withStatus(p));
}

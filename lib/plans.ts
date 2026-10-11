export const PLANS = {
  BASIC: { id: 'BASIC', name: 'Plan Básico', maxUsers: 2, maxProducts: 300, price: 49000, allowExpirationTracking: false, isEnterprise: false, maxBranches: 1 },
  INTERMEDIATE: { id: 'INTERMEDIATE', name: 'Plan Intermedio', maxUsers: 5, maxProducts: 1000, price: 99000, allowExpirationTracking: true, isEnterprise: false, maxBranches: 1 },
  PREMIUM: { id: 'PREMIUM', name: 'Plan Premium', maxUsers: 9999, maxProducts: 999999, price: 199000, allowExpirationTracking: true, isEnterprise: false, maxBranches: 1 },
  ENTERPRISE_2: { id: 'ENTERPRISE_2', name: 'Plan Enterprise (Hasta 2 Sedes)', maxUsers: 9999, maxProducts: 999999, price: 299000, allowExpirationTracking: true, isEnterprise: true, maxBranches: 2 },
  ENTERPRISE_5: { id: 'ENTERPRISE_5', name: 'Plan Enterprise (Hasta 5 Sedes)', maxUsers: 9999, maxProducts: 999999, price: 499000, allowExpirationTracking: true, isEnterprise: true, maxBranches: 5 },
  ENTERPRISE_10: { id: 'ENTERPRISE_10', name: 'Plan Enterprise (Hasta 10 Sedes)', maxUsers: 9999, maxProducts: 999999, price: 799000, allowExpirationTracking: true, isEnterprise: true, maxBranches: 10 },
  ENTERPRISE_UNLIMITED: { id: 'ENTERPRISE_UNLIMITED', name: 'Plan Enterprise (Sedes Ilimitadas)', maxUsers: 9999, maxProducts: 999999, price: 1199000, allowExpirationTracking: true, isEnterprise: true, maxBranches: 999 },
  ENTERPRISE: { id: 'ENTERPRISE', name: 'Plan Enterprise (Multi-Sedes)', maxUsers: 9999, maxProducts: 999999, price: 399000, allowExpirationTracking: true, isEnterprise: true, maxBranches: 999 }
};

export function normalizePlanKey(planId: string | null | undefined): keyof typeof PLANS {
  if (!planId) return 'PREMIUM';
  const clean = planId.trim().toUpperCase();
  if (clean === 'BASICO' || clean === 'BASIC') return 'BASIC';
  if (clean === 'INTERMEDIO' || clean === 'INTERMEDIATE') return 'INTERMEDIATE';
  if (clean === 'PREMIUM') return 'PREMIUM';
  if (clean === 'ENTERPRISE_2' || clean === 'ENTERPRISE-2') return 'ENTERPRISE_2';
  if (clean === 'ENTERPRISE_5' || clean === 'ENTERPRISE-5') return 'ENTERPRISE_5';
  if (clean === 'ENTERPRISE_10' || clean === 'ENTERPRISE-10') return 'ENTERPRISE_10';
  if (clean === 'ENTERPRISE_UNLIMITED' || clean === 'ENTERPRISE-UNLIMITED') return 'ENTERPRISE_UNLIMITED';
  if (clean === 'ENTERPRISE') return 'ENTERPRISE';
  return (PLANS[clean as keyof typeof PLANS] ? clean : 'PREMIUM') as keyof typeof PLANS;
}

export function getPlanLimits(planId: string | null | undefined, overrides?: { maxUsers?: number | null, maxProducts?: number | null, maxBranches?: number | null }) {
  const key = normalizePlanKey(planId);
  const defaultPlan = PLANS[key] || PLANS.PREMIUM;

  return {
    ...defaultPlan,
    maxUsers: overrides?.maxUsers ?? defaultPlan.maxUsers,
    maxProducts: overrides?.maxProducts ?? defaultPlan.maxProducts,
    maxBranches: overrides?.maxBranches ?? defaultPlan.maxBranches,
  };
}

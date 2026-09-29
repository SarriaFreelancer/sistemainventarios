export const PLANS = {
  BASIC: { name: 'Plan Básico', maxUsers: 2, maxProducts: 300, price: 49000, allowExpirationTracking: false, isEnterprise: false, maxBranches: 1 },
  INTERMEDIATE: { name: 'Plan Intermedio', maxUsers: 5, maxProducts: 1000, price: 99000, allowExpirationTracking: true, isEnterprise: false, maxBranches: 1 },
  PREMIUM: { name: 'Plan Premium', maxUsers: 9999, maxProducts: 999999, price: 199000, allowExpirationTracking: true, isEnterprise: false, maxBranches: 1 },
  ENTERPRISE_2: { name: 'Plan Enterprise (Hasta 2 Sedes)', maxUsers: 9999, maxProducts: 999999, price: 299000, allowExpirationTracking: true, isEnterprise: true, maxBranches: 2 },
  ENTERPRISE_5: { name: 'Plan Enterprise (Hasta 5 Sedes)', maxUsers: 9999, maxProducts: 999999, price: 499000, allowExpirationTracking: true, isEnterprise: true, maxBranches: 5 },
  ENTERPRISE_10: { name: 'Plan Enterprise (Hasta 10 Sedes)', maxUsers: 9999, maxProducts: 999999, price: 799000, allowExpirationTracking: true, isEnterprise: true, maxBranches: 10 },
  ENTERPRISE_UNLIMITED: { name: 'Plan Enterprise (Sedes Ilimitadas)', maxUsers: 9999, maxProducts: 999999, price: 1199000, allowExpirationTracking: true, isEnterprise: true, maxBranches: 999 },
  ENTERPRISE: { name: 'Plan Enterprise (Multi-Sedes)', maxUsers: 9999, maxProducts: 999999, price: 399000, allowExpirationTracking: true, isEnterprise: true, maxBranches: 999 }
};

export function getPlanLimits(planId: string | null | undefined, overrides?: { maxUsers?: number | null, maxProducts?: number | null, maxBranches?: number | null }) {
  let defaultPlan = PLANS.PREMIUM;

  if (planId) {
    const key = planId.toUpperCase() as keyof typeof PLANS;
    if (PLANS[key]) defaultPlan = PLANS[key];
  }

  return {
    ...defaultPlan,
    maxUsers: overrides?.maxUsers ?? defaultPlan.maxUsers,
    maxProducts: overrides?.maxProducts ?? defaultPlan.maxProducts,
    maxBranches: overrides?.maxBranches ?? defaultPlan.maxBranches,
  };
}

export const PLANS = {
  BASIC: { name: 'Plan Básico', maxUsers: 2, maxProducts: 300, price: 49000 },
  INTERMEDIATE: { name: 'Plan Intermedio', maxUsers: 5, maxProducts: 1000, price: 99000 },
  PREMIUM: { name: 'Plan Premium', maxUsers: 9999, maxProducts: 999999, price: 199000 }
};

export function getPlanLimits(planId: string | null | undefined, overrides?: { maxUsers?: number | null, maxProducts?: number | null }) {
  let defaultPlan = PLANS.PREMIUM;
  
  if (planId) {
    const key = planId.toUpperCase() as keyof typeof PLANS;
    if (PLANS[key]) defaultPlan = PLANS[key];
  }
  
  return {
    ...defaultPlan,
    maxUsers: overrides?.maxUsers ?? defaultPlan.maxUsers,
    maxProducts: overrides?.maxProducts ?? defaultPlan.maxProducts,
  };
}

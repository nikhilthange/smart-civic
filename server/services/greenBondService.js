"use strict";

/**
 * ─── Municipal Green Bonds & Predictive Budgeting Engine ────────────────────────
 */

const DEFAULT_GREEN_BOND_PORTFOLIO = {
  bondSeries: "BMC Green Climate Municipal Infrastructure Bond 2026 (Series I)",
  totalIssuanceAmountInr: 1000000000, // ₹100 Crores
  couponRatePercent: 7.15,
  maturityYears: 10,
  creditRating: "CRISIL AA+ (Stable Outlook)",
  escrowBacking: "Dedicated Octroi & Property Tax Collection Sinking Fund",
  totalCarbonCreditsEarnedTonnes: 14280,
  carbonOffsetValueInr: 28560000, // @ ₹2,000 / tCO2e
};

const DEFAULT_CARBON_STREAMS = [
  {
    streamId: "CARB-SWM-01",
    sector: "SWM Wet Waste Aerobic Composting",
    ward: "Ward G-North",
    processedTonnage: 4200,
    carbonOffsetTons: 1890, // 4200 * 0.45
    annualRevenueInr: 3780000,
  },
  {
    streamId: "CARB-EV-02",
    sector: "BEST Electric Bus Transit Fleet",
    ward: "Ward H-East",
    processedTonnage: 1250000, // Electric KM
    carbonOffsetTons: 3500, // 1250000 * 0.0028
    annualRevenueInr: 7000000,
  },
  {
    streamId: "CARB-CRZ-03",
    sector: "Protected Mangrove Wetland Sequestration",
    ward: "Ward K-West",
    processedTonnage: 850, // Hectares protected
    carbonOffsetTons: 4420, // 850 * 5.2
    annualRevenueInr: 8840000,
  },
];

/**
 * Calculates predictive Ward CapEx and OpEx infrastructure requirements
 */
function calculatePredictiveWardBudget({
  ward = "Ward G-North",
  historicalRoadDefects = 140,
  nullahDesiltingLengthKm = 18.5,
  projectedRainfallAnomalyPercent = 15,
}) {
  const defects = Number(historicalRoadDefects);
  const nullahKm = Number(nullahDesiltingLengthKm);
  const rainAnomaly = Number(projectedRainfallAnomalyPercent);

  // Unit costs: ₹45,000 / pothole cluster repair; ₹8.5 Lakhs / km major nullah desilting
  const baselineRoadOpEx = defects * 45000;
  const baselineSwmSwdOpEx = Math.round(nullahKm * 850000);
  const climateResilienceCapEx = Math.round((baselineRoadOpEx + baselineSwmSwdOpEx) * (1 + rainAnomaly / 100) * 0.35);

  const totalRecommendedBudgetInr = baselineRoadOpEx + baselineSwmSwdOpEx + climateResilienceCapEx;
  const greenBondFundingAllocationInr = Math.round(totalRecommendedBudgetInr * 0.40); // 40% funded via green bonds

  return {
    ward,
    fiscalYear: "2026-2027",
    historicalRoadDefects: defects,
    nullahDesiltingLengthKm: nullahKm,
    projectedRainfallAnomalyPercent: rainAnomaly,
    budgetBreakdown: {
      roadMaintenanceOpExInr: baselineRoadOpEx,
      swdDesiltingOpExInr: baselineSwmSwdOpEx,
      climateResilienceCapExInr: climateResilienceCapEx,
      totalRecommendedBudgetInr,
    },
    greenBondFundingAllocationInr,
    budgetUtilizationEfficiencyScore: 94.6,
    executiveRecommendation: `Recommended FY26-27 allocation of ₹${(totalRecommendedBudgetInr / 10000000).toFixed(2)} Cr for ${ward}, with ₹${(greenBondFundingAllocationInr / 10000000).toFixed(2)} Cr subvention via BMC Green Climate Bond Series I.`,
  };
}

module.exports = {
  DEFAULT_GREEN_BOND_PORTFOLIO,
  DEFAULT_CARBON_STREAMS,
  calculatePredictiveWardBudget,
};

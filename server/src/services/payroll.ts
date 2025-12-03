import { supabase } from '../lib/supabase.js';

// Tax brackets for Canada (2024 rates)
const CANADA_TAX_BRACKETS: Record<string, { federal: number; provincial: Record<string, number> }> = {
  'Alberta': {
    federal: 0.15, // 15% federal
    provincial: {
      '0-53359': 0.10, // 10% on first $53,359
      '53359-106717': 0.12, // 12% on next bracket
      '106717-165430': 0.13, // 13% on next bracket
      '165430+': 0.14 // 14% on highest bracket
    }
  },
  'British Columbia': {
    federal: 0.15,
    provincial: {
      '0-47937': 0.0506,
      '47937-95875': 0.077,
      '95875-110076': 0.105,
      '110076-133664': 0.1229,
      '133664-181232': 0.147,
      '181232+': 0.168
    }
  },
  'Ontario': {
    federal: 0.15,
    provincial: {
      '0-51446': 0.0505,
      '51446-102894': 0.0915,
      '102894-150000': 0.1116,
      '150000-220000': 0.1216,
      '220000+': 0.1316
    }
  },
  'Quebec': {
    federal: 0.15,
    provincial: {
      '0-51480': 0.14,
      '51480-103545': 0.19,
      '103545-126000': 0.24,
      '126000+': 0.2575
    }
  },
  'Saskatchewan': {
    federal: 0.15,
    provincial: {
      '0-49720': 0.105,
      '49720-142058': 0.125,
      '142058+': 0.145
    }
  },
  'Manitoba': {
    federal: 0.15,
    provincial: {
      '0-47000': 0.108,
      '47000-100000': 0.1275,
      '100000+': 0.174
    }
  },
  'Nova Scotia': {
    federal: 0.15,
    provincial: {
      '0-29590': 0.0879,
      '29590-59180': 0.1495,
      '59180-93000': 0.1667,
      '93000-150000': 0.175,
      '150000+': 0.21
    }
  },
  'New Brunswick': {
    federal: 0.15,
    provincial: {
      '0-49958': 0.094,
      '49958-99916': 0.14,
      '99916-185064': 0.16,
      '185064+': 0.195
    }
  },
  'Newfoundland and Labrador': {
    federal: 0.15,
    provincial: {
      '0-43198': 0.087,
      '43198-86395': 0.145,
      '86395-154244': 0.158,
      '154244+': 0.173
    }
  },
  'Prince Edward Island': {
    federal: 0.15,
    provincial: {
      '0-32656': 0.098,
      '32656-65312': 0.138,
      '65312-105000': 0.167,
      '105000-180000': 0.18,
      '180000+': 0.198
    }
  },
  'Northwest Territories': {
    federal: 0.15,
    provincial: {
      '0-48326': 0.059,
      '48326-96655': 0.086,
      '96655-157139': 0.122,
      '157139+': 0.1405
    }
  },
  'Nunavut': {
    federal: 0.15,
    provincial: {
      '0-48326': 0.04,
      '48326-96655': 0.07,
      '96655-157139': 0.09,
      '157139+': 0.115
    }
  },
  'Yukon': {
    federal: 0.15,
    provincial: {
      '0-53359': 0.064,
      '53359-106717': 0.09,
      '106717-165430': 0.109,
      '165430-500000': 0.128,
      '500000+': 0.15
    }
  }
};

// Tax brackets for USA (2024 rates - simplified)
const USA_TAX_BRACKETS: Record<string, { federal: number; state: Record<string, number> }> = {
  'California': {
    federal: 0.10, // Progressive, but simplified
    state: {
      '0-10099': 0.01,
      '10099-23942': 0.02,
      '23942-37788': 0.04,
      '37788-52455': 0.06,
      '52455-66295': 0.08,
      '66295-338639': 0.093,
      '338639-406364': 0.103,
      '406364-677275': 0.113,
      '677275+': 0.123
    }
  },
  'Texas': {
    federal: 0.10,
    state: {} // No state income tax
  },
  'Florida': {
    federal: 0.10,
    state: {} // No state income tax
  },
  'New York': {
    federal: 0.10,
    state: {
      '0-8500': 0.04,
      '8500-11700': 0.045,
      '11700-13900': 0.0525,
      '13900-21400': 0.059,
      '21400-80650': 0.0621,
      '80650-215400': 0.0649,
      '215400-1077550': 0.0685,
      '1077550+': 0.0882
    }
  }
};

interface PayrollCalculation {
  grossPay: number;
  taxAmount: number;
  netPay: number;
  taxRate: number;
  hours: number;
}

/**
 * Calculate payroll for a shift
 */
export async function calculateShiftPayroll(
  userId: string,
  shiftId: string,
  hours: number,
  hourlyRate: number
): Promise<PayrollCalculation> {
  // Get user's location for tax calculation
  const { data: user } = await supabase
    .from('users')
    .select('province_state, country')
    .eq('id', userId)
    .single();

  const provinceState = user?.province_state || 'Alberta';
  const country = user?.country || 'Canada';

  const grossPay = hours * hourlyRate;
  const { taxRate, taxAmount } = calculateTax(grossPay, provinceState, country);
  const netPay = grossPay - taxAmount;

  // Update shift with payroll info
  await supabase
    .from('shifts')
    .update({
      hourly_rate: hourlyRate,
      total_hours: hours,
      gross_pay: grossPay,
      tax_rate: taxRate * 100, // Store as percentage
      tax_amount: taxAmount,
      net_pay: netPay,
      province_state: provinceState,
      country: country
    })
    .eq('id', shiftId);

  return {
    grossPay,
    taxAmount,
    netPay,
    taxRate: taxRate * 100,
    hours
  };
}

/**
 * Calculate tax based on location and income
 */
function calculateTax(annualIncome: number, provinceState: string, country: string): { taxRate: number; taxAmount: number } {
  if (country === 'USA' || country === 'United States') {
    return calculateUSTax(annualIncome, provinceState);
  } else {
    return calculateCanadaTax(annualIncome, provinceState);
  }
}

function calculateCanadaTax(annualIncome: number, province: string): { taxRate: number; taxAmount: number } {
  const brackets = CANADA_TAX_BRACKETS[province] || CANADA_TAX_BRACKETS['Alberta'];
  
  // Simplified calculation - use average rate
  // In production, you'd want progressive tax calculation
  const federalRate = brackets.federal;
  const provincialRate = Object.values(brackets.provincial)[0] || 0.10; // Use first bracket rate as average
  
  const totalRate = federalRate + provincialRate;
  const taxAmount = annualIncome * totalRate;
  
  return {
    taxRate: totalRate,
    taxAmount
  };
}

function calculateUSTax(annualIncome: number, state: string): { taxRate: number; taxAmount: number } {
  const brackets = USA_TAX_BRACKETS[state] || USA_TAX_BRACKETS['California'];
  
  // Simplified - use average federal rate (10-37% progressive)
  const federalRate = annualIncome < 11000 ? 0.10 : 
                      annualIncome < 44725 ? 0.12 :
                      annualIncome < 95375 ? 0.22 :
                      annualIncome < 201050 ? 0.24 :
                      annualIncome < 578125 ? 0.32 :
                      annualIncome < 693750 ? 0.35 : 0.37;
  
  // State tax (simplified)
  const stateRate = Object.values(brackets.state)[0] || 0;
  
  const totalRate = federalRate + stateRate;
  const taxAmount = annualIncome * totalRate;
  
  return {
    taxRate: totalRate,
    taxAmount
  };
}

/**
 * Calculate hours worked from shift times
 */
export function calculateShiftHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  
  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours
  }
  
  const totalMinutes = endMinutes - startMinutes;
  return totalMinutes / 60; // Convert to hours
}

/**
 * Generate payroll summary for a period
 */
export async function generatePayrollSummary(
  userId: string,
  periodStart: Date,
  periodEnd: Date,
  periodType: 'weekly' | 'biweekly' | 'monthly'
): Promise<any> {
  const { data: shifts } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', userId)
    .gte('date', periodStart.toISOString().split('T')[0])
    .lte('date', periodEnd.toISOString().split('T')[0]);

  if (!shifts || shifts.length === 0) {
    return {
      totalHours: 0,
      totalShifts: 0,
      grossPay: 0,
      taxAmount: 0,
      netPay: 0
    };
  }

  let totalHours = 0;
  let grossPay = 0;
  let taxAmount = 0;

  for (const shift of shifts) {
    const hours = shift.total_hours || calculateShiftHours(shift.start_time, shift.end_time);
    totalHours += hours;
    grossPay += shift.gross_pay || 0;
    taxAmount += shift.tax_amount || 0;
  }

  const netPay = grossPay - taxAmount;

  // Save summary
  await supabase
    .from('payroll_summaries')
    .upsert({
      user_id: userId,
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      period_type: periodType,
      total_hours: totalHours,
      total_shifts: shifts.length,
      gross_pay: grossPay,
      tax_amount: taxAmount,
      net_pay: netPay,
      province_state: shifts[0]?.province_state,
      country: shifts[0]?.country
    }, { onConflict: 'user_id,period_start,period_type' });

  return {
    totalHours,
    totalShifts: shifts.length,
    grossPay,
    taxAmount,
    netPay
  };
}


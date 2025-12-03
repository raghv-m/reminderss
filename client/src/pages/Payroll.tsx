import { useState, useEffect } from 'react';
import { DollarSign, Clock, TrendingUp, Calendar, MapPin } from 'lucide-react';
import { getPayrollSummary, getWorkingHours, updatePayrollSettings, getCurrentUser } from '../lib/api';
import { useToast } from '../components/Toast';

interface PayrollSummary {
  totalHours: number;
  totalShifts: number;
  grossPay: number;
  taxAmount: number;
  netPay: number;
}

interface WorkingHours {
  shiftHours: number;
  goalHours: number;
  totalHours: number;
  shiftCount: number;
  goalDays: number;
}

export function Payroll() {
  const [summary, setSummary] = useState<PayrollSummary | null>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHours | null>(null);
  const [periodType, setPeriodType] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [hourlyRate, setHourlyRate] = useState('');
  const [provinceState, setProvinceState] = useState('');
  const [country, setCountry] = useState('Canada');
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const canadianProvinces = [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 
    'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 
    'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 
    'Saskatchewan', 'Yukon'
  ];

  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
    'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
    'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
    'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
    'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
    'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
    'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming'
  ];

  useEffect(() => {
    loadData();
    loadUserSettings();
  }, [periodType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryData, hoursData] = await Promise.all([
        getPayrollSummary(periodType),
        getWorkingHours(30)
      ]);
      setSummary(summaryData as PayrollSummary);
      setWorkingHours(hoursData as WorkingHours);
    } catch (error) {
      console.error('Failed to load payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserSettings = async () => {
    try {
      const user = await getCurrentUser() as any;
      setHourlyRate(user.default_hourly_rate || '');
      setProvinceState(user.province_state || '');
      setCountry(user.country || 'Canada');
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updatePayrollSettings({
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        provinceState: provinceState || undefined,
        country: country
      });
      showToast('Payroll settings saved!', 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: country === 'Canada' ? 'CAD' : 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Payroll & Earnings</h1>
        <p className="text-dark-400">Track your working hours and earnings</p>
      </div>

      {/* Payroll Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary-500" />
          Payroll Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Default Hourly Rate
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="input w-full"
              placeholder="25.00"
            />
            <p className="text-xs text-dark-400 mt-1">
              This rate will be used for all shifts unless specified otherwise
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setProvinceState(''); // Reset province/state when country changes
              }}
              className="input w-full"
            >
              <option value="Canada">Canada</option>
              <option value="United States">United States</option>
              <option value="USA">USA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              {country === 'Canada' ? 'Province' : 'State'}
            </label>
            <select
              value={provinceState}
              onChange={(e) => setProvinceState(e.target.value)}
              className="input w-full"
            >
              <option value="">Select {country === 'Canada' ? 'Province' : 'State'}</option>
              {(country === 'Canada' ? canadianProvinces : usStates).map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <p className="text-xs text-dark-400 mt-1">
              Required for accurate tax calculations
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {(['weekly', 'biweekly', 'monthly'] as const).map(period => (
          <button
            key={period}
            onClick={() => setPeriodType(period)}
            className={`btn-secondary capitalize ${
              periodType === period ? 'bg-primary-500 text-white' : ''
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card animate-pulse">
          <div className="h-32 bg-dark-800 rounded-lg" />
        </div>
      ) : (
        <>
          {/* Working Hours Summary */}
          {workingHours && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary-500" />
                Working Hours (Last 30 Days)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-dark-400">Total Hours</p>
                  <p className="text-2xl font-bold">{workingHours.totalHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-sm text-dark-400">From Shifts</p>
                  <p className="text-2xl font-bold">{workingHours.shiftHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-sm text-dark-400">From Goals</p>
                  <p className="text-2xl font-bold">{workingHours.goalHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-sm text-dark-400">Shifts</p>
                  <p className="text-2xl font-bold">{workingHours.shiftCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payroll Summary */}
          {summary && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                  {periodType.charAt(0).toUpperCase() + periodType.slice(1)} Summary
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-dark-400">Total Hours</span>
                    <span className="text-xl font-bold">{summary.totalHours.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-dark-400">Shifts</span>
                    <span className="text-xl font-bold">{summary.totalShifts}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-dark-700">
                    <span className="text-dark-400">Gross Pay</span>
                    <span className="text-2xl font-bold text-green-400">
                      {formatCurrency(summary.grossPay)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-dark-400">Tax ({((summary.taxAmount / summary.grossPay) * 100).toFixed(1)}%)</span>
                    <span className="text-xl font-bold text-red-400">
                      -{formatCurrency(summary.taxAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t-2 border-primary-500">
                    <span className="text-lg font-semibold">Net Pay</span>
                    <span className="text-3xl font-bold text-primary-400">
                      {formatCurrency(summary.netPay)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  Breakdown
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-dark-400">Hours Worked</span>
                      <span className="text-sm font-medium">{summary.totalHours.toFixed(1)}h</span>
                    </div>
                    <div className="w-full bg-dark-800 rounded-full h-2">
                      <div
                        className="bg-primary-500 h-2 rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-dark-400">Gross Earnings</span>
                      <span className="text-sm font-medium">{formatCurrency(summary.grossPay)}</span>
                    </div>
                    <div className="w-full bg-dark-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-dark-400">Tax Deduction</span>
                      <span className="text-sm font-medium">{formatCurrency(summary.taxAmount)}</span>
                    </div>
                    <div className="w-full bg-dark-800 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${(summary.taxAmount / summary.grossPay) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}


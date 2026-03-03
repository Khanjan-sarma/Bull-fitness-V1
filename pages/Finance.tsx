import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import {
  Landmark, DollarSign, TrendingUp,
  CreditCard, Search, Download, Filter,
  ArrowUpRight, BarChart3
} from 'lucide-react';

export const Finance: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    count: 0,
    avg: 0
  });
  const [monthlyData, setMonthlyData] = useState<{ month: string, revenue: number }[]>([]);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*, members(name)')
        .order('paid_on', { ascending: false });

      if (error) throw error;
      setPayments(data || []);

      const now = new Date();
      const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      let total = 0;
      let monthTotal = 0;
      const monthlyMap: Record<string, number> = {};

      data?.forEach(p => {
        const amt = Number(p.amount) || 0;
        total += amt;
        if (p.paid_on?.startsWith(currentMonthStr)) {
          monthTotal += amt;
        }

        if (p.paid_on) {
          const mKey = p.paid_on.substring(0, 7);
          monthlyMap[mKey] = (monthlyMap[mKey] || 0) + amt;
        }
      });

      // Prepare last 6 months for chart, filling zeros where no data exists
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        chartData.push({
          month: d.toLocaleString('en-US', { month: 'short' }),
          revenue: monthlyMap[mKey] || 0
        });
      }

      setMonthlyData(chartData);
      setStats({
        total,
        thisMonth: monthTotal,
        count: data?.length || 0,
        avg: data?.length ? Math.round(total / data.length) : 0
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue), 1);

  const exportCSV = () => {
    if (payments.length === 0) return;
    const header = 'Member,Date,Amount,Next Due\n';
    const rows = payments.map(p =>
      `"${p.members?.name || 'Unknown'}",${p.paid_on},${p.amount},${p.next_due_date || '-'}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bull-fitness-payments.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-bullDark uppercase tracking-tight leading-none">Financial Treasury</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-xs tracking-widest">Real-time revenue monitoring and transaction history.</p>
        </div>
        <div className="flex gap-4">
          <button onClick={exportCSV} className="px-6 py-3 bg-bullDark text-white rounded-xl font-bold hover:bg-bullDark/90 transition-all uppercase text-xs tracking-widest flex items-center">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <FinanceCard label="Lifetime Revenue" value={formatCurrency(stats.total)} icon={<Landmark />} color="text-bullRed" />
        <FinanceCard label="This Month" value={formatCurrency(stats.thisMonth)} icon={<DollarSign />} color="text-bullYellow" />
        <FinanceCard label="Transactions" value={stats.count.toString()} icon={<CreditCard />} color="text-bullDark" />
        <FinanceCard label="Avg. Ticket" value={formatCurrency(stats.avg)} icon={<TrendingUp />} color="text-emerald-600" />
      </section>

      {/* Analytics Preview */}
      <section className="grid grid-cols-1 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-lg font-black uppercase tracking-widest text-bullDark flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-bullRed" /> Monthly Revenue
            </h3>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last 6 Months</span>
          </div>

          {stats.total === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-300 gap-2 border-2 border-dashed border-gray-100 rounded-2xl">
              <TrendingUp className="h-10 w-10 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50">No financial data yet</p>
            </div>
          ) : (
            <div className="h-48 flex items-end justify-between gap-4 px-4">
              {monthlyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full bg-bullGray rounded-xl overflow-hidden relative h-48 border border-gray-50">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-bullRed transition-all duration-700 ease-out rounded-xl group-hover:bg-bullYellow"
                      style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase">{d.month}</span>
                  <span className="text-[9px] font-bold text-bullDark opacity-0 group-hover:opacity-100 transition-opacity">₹{d.revenue}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Transactions Table */}
      <section className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-black uppercase tracking-widest text-bullDark">Transaction History</h3>
          <div className="flex gap-2">
            <button className="p-2 bg-bullGray rounded-xl hover:bg-gray-200 transition-colors">
              <Filter className="h-4 w-4 text-bullDark" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Member</th>
                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                <th className="px-8 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Next Due</th>
                <th className="px-8 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bullRed mx-auto" /></td></tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4 text-gray-300">
                      <CreditCard className="h-12 w-12 opacity-20" />
                      <p className="text-sm font-black uppercase tracking-widest opacity-50">No payments recorded</p>
                    </div>
                  </td>
                </tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap font-bold text-bullDark">{p.members?.name || 'Unknown'}</td>
                  <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500 font-medium">{p.paid_on}</td>
                  <td className="px-8 py-5 whitespace-nowrap font-black text-bullDark">{formatCurrency(p.amount)}</td>
                  <td className="px-8 py-5 whitespace-nowrap text-xs font-bold text-gray-400">{p.next_due_date || '-'}</td>
                  <td className="px-8 py-5 whitespace-nowrap text-right">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Paid</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const FinanceCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all">
    <div className="flex items-center gap-4 mb-4">
      <div className={`p-3 rounded-xl bg-bullGray ${color}`}>
        {React.cloneElement(icon, { className: 'h-6 w-6' })}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</p>
    </div>
    <h3 className="text-3xl font-black text-bullDark leading-none mb-2">{value}</h3>
  </div>
);
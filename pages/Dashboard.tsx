import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { calculateStatus } from '../utils/statusUtils';
import { 
  Users, UserCheck, AlertCircle, XCircle, 
  TrendingUp, CalendarDays, 
  Clock, CalendarClock, AlertOctagon, History,
  UserPlus, CalendarOff, ArrowRight
} from 'lucide-react';

interface MonthlyRevenue {
  sortKey: string;
  month: string;
  revenue: number;
}

interface AlertMember {
  id: string;
  name: string;
  phone: string;
  membership_end: string;
}

export const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  
  const [memberStats, setMemberStats] = useState({
    total: 0,
    active: 0,
    due: 0,
    expired: 0,
  });

  const [revenueStats, setRevenueStats] = useState({
    total: 0,
    currentMonth: 0,
    paymentsCount: 0,
  });

  const [alerts, setAlerts] = useState({
    in3Days: [] as AlertMember[],
    tomorrow: [] as AlertMember[],
    today: [] as AlertMember[],
    ago3Days: [] as AlertMember[],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [membersResponse, paymentsResponse] = await Promise.all([
        supabase.from('members').select('id, name, phone, membership_end'),
        supabase.from('payments').select('amount, paid_on')
      ]);

      if (membersResponse.error) throw membersResponse.error;
      if (paymentsResponse.error) throw paymentsResponse.error;

      if (membersResponse.data) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const calculatedAlerts = {
          in3Days: [] as AlertMember[],
          tomorrow: [] as AlertMember[],
          today: [] as AlertMember[],
          ago3Days: [] as AlertMember[],
        };

        const calculatedMemberStats = membersResponse.data.reduce(
          (acc, member) => {
            acc.total += 1;
            const status = calculateStatus(member.membership_end);
            if (status === 'Active') acc.active += 1;
            else if (status === 'Due') acc.due += 1;
            else if (status === 'Expired') acc.expired += 1;

            if (member.membership_end) {
              const [year, month, day] = member.membership_end.split('-').map(Number);
              const endDate = new Date(year, month - 1, day);
              endDate.setHours(0, 0, 0, 0);

              const diffTime = endDate.getTime() - today.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === 3) calculatedAlerts.in3Days.push(member);
              else if (diffDays === 1) calculatedAlerts.tomorrow.push(member);
              else if (diffDays === 0) calculatedAlerts.today.push(member);
              else if (diffDays === -3) calculatedAlerts.ago3Days.push(member);
            }

            return acc;
          },
          { total: 0, active: 0, due: 0, expired: 0 }
        );

        setMemberStats(calculatedMemberStats);
        setAlerts(calculatedAlerts);
      }

      if (paymentsResponse.data) {
        let totalRev = 0;
        let currentMonthRev = 0;
        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        paymentsResponse.data.forEach((payment) => {
          const amt = Number(payment.amount) || 0;
          totalRev += amt;
          if (payment.paid_on && payment.paid_on.startsWith(currentMonthStr)) {
            currentMonthRev += amt;
          }
        });

        setRevenueStats({
          total: totalRev,
          currentMonth: currentMonthRev,
          paymentsCount: paymentsResponse.data.length,
        });
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bullRed"></div>
      </div>
    );
  }

  const kpiCards = [
    { name: 'Total Members', value: memberStats.total, icon: Users, color: 'text-bullRed', bg: 'bg-red-50' },
    { name: 'Active Members', value: memberStats.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Due Today', value: memberStats.due, icon: AlertCircle, color: 'text-bullYellow', bg: 'bg-yellow-50' },
    { name: 'Expired', value: memberStats.expired, icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-100' },
  ];

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-10">
      {/* Greeting Area */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-bullDark uppercase tracking-tight">Welcome Back, Coach</h1>
          <p className="text-gray-500 font-medium mt-1 flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> {todayStr}
          </p>
        </div>
        <div className="flex gap-4">
          <Link
            to="/off-days"
            className="px-6 py-3 border-2 border-bullDark rounded-xl text-bullDark font-bold hover:bg-bullDark hover:text-white transition-all uppercase text-sm tracking-widest flex items-center"
          >
            <CalendarOff className="h-4 w-4 mr-2" /> Mark Off Day
          </Link>
          <Link
            to="/add-member"
            className="px-6 py-3 bg-bullRed rounded-xl text-white font-bold hover:bg-red-700 shadow-xl shadow-red-900/20 transition-all uppercase text-sm tracking-widest flex items-center"
          >
            <UserPlus className="h-4 w-4 mr-2" /> Add Member
          </Link>
        </div>
      </section>

      {/* KPI Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all">
              <div className={`inline-block p-4 rounded-2xl ${card.bg} mb-6`}>
                <Icon className={`h-8 w-8 ${card.color}`} />
              </div>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">{card.name}</p>
              <h3 className="text-4xl font-black text-bullDark mt-1 leading-none">{card.value}</h3>
            </div>
          );
        })}
      </section>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Alerts Grid - Takes 2 cols */}
        <section className="xl:col-span-2 space-y-6">
          <h2 className="text-xl font-black text-bullDark uppercase tracking-widest flex items-center gap-3">
            <span className="w-10 h-1 bg-bullRed rounded-full" />
            Membership Alerts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <AlertBox title="Due Today" items={alerts.today} color="bg-bullRed text-white" subColor="bg-white/20" icon={<AlertOctagon />} />
            <AlertBox title="Due Tomorrow" items={alerts.tomorrow} color="bg-bullYellow text-bullDark" subColor="bg-bullDark/10" icon={<CalendarClock />} />
            <AlertBox title="Due in 3 Days" items={alerts.in3Days} color="bg-white text-bullDark border border-gray-100" subColor="bg-gray-100" icon={<Clock />} />
            <AlertBox title="Expired 3 Days Ago" items={alerts.ago3Days} color="bg-bullDark text-white" subColor="bg-white/10" icon={<History />} />
          </div>
        </section>

        {/* Financial Preview Sidebar */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-bullDark uppercase tracking-widest flex items-center gap-3">
              <span className="w-10 h-1 bg-bullYellow rounded-full" />
              Finance Summary
            </h2>
            <Link to="/finance" className="text-bullRed font-bold text-xs uppercase tracking-widest flex items-center gap-1 group">
              View All <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="bg-bullDark rounded-3xl p-8 text-white shadow-2xl space-y-8">
            <div className="space-y-1">
              <p className="text-white/40 uppercase text-[10px] font-black tracking-[0.2em]">This Month Revenue</p>
              <h3 className="text-4xl font-black">{formatCurrency(revenueStats.currentMonth)}</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-white/40 uppercase text-[8px] font-black tracking-widest">Total Rev</p>
                <p className="text-lg font-bold truncate">{formatCurrency(revenueStats.total)}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4">
                <p className="text-white/40 uppercase text-[8px] font-black tracking-widest">Payments</p>
                <p className="text-lg font-bold">{revenueStats.paymentsCount}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-white/40 uppercase text-[10px] font-black tracking-[0.2em] mb-4">Current Month Progress (Goal: ₹2L)</p>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-bullYellow h-full rounded-full" 
                  style={{ width: `${Math.min((revenueStats.currentMonth / 200000) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const AlertBox = ({ title, items, color, subColor, icon }: any) => (
  <div className="rounded-3xl overflow-hidden shadow-sm flex flex-col h-64 border border-gray-100 bg-white">
    <div className={`p-4 flex items-center justify-between ${color}`}>
      <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest">
        {React.cloneElement(icon, { className: 'h-4 w-4' })}
        {title}
      </div>
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${subColor}`}>
        {items.length}
      </span>
    </div>
    <div className="p-2 flex-1 overflow-y-auto custom-scrollbar">
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
          <UserCheck className="h-8 w-8 opacity-20" />
          <span className="text-[10px] font-black uppercase tracking-widest opacity-50">No Members</span>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((m: any) => (
            <div key={m.id} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
              <p className="text-sm font-bold text-bullDark truncate">{m.name}</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-[10px] text-gray-400 font-medium">{m.phone}</p>
                <p className="text-[10px] font-black text-bullRed">{m.membership_end}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
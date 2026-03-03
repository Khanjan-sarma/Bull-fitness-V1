import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Member } from '../types';
import { calculateStatus } from '../utils/statusUtils';
import {
  Search, UserPlus, Edit2, RefreshCw, X, Receipt,
  Trash2, CheckCircle, AlertCircle, Users, Phone,
  Calendar, Target, Activity, DollarSign, Maximize2
} from 'lucide-react';

// --- Sub-components moved to top for better hoisting and explicit typing ---

/**
 * InfoLine component for displaying member details
 */
const InfoLine: React.FC<{ icon: React.ReactElement, label: string, value: string, bold?: boolean }> = ({ icon, label, value, bold = false }) => (
  <div className="flex items-center justify-between group/info">
    <div className="flex items-center gap-2 text-gray-400 group-hover/info:text-bullRed transition-colors">
      {React.cloneElement(icon, { className: 'h-4 w-4' } as any)}
      <span className="text-[10px] font-black uppercase tracking-[0.1em]">{label}</span>
    </div>
    <span className={`text-sm ${bold ? 'font-black text-bullDark' : 'font-semibold text-gray-600'}`}>{value}</span>
  </div>
);

/**
 * Modal component for forms and history
 */
const Modal: React.FC<{ children: React.ReactNode, onClose: () => void, title: string }> = ({ children, onClose, title }) => (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
    <div className="fixed inset-0 bg-bullDark/80 backdrop-blur-sm" onClick={onClose} />
    <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 overflow-hidden shadow-2xl animate-fade-in-up">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8 border-b border-gray-50 pb-4">
          <h3 className="text-lg font-black text-bullDark uppercase tracking-widest">{title}</h3>
          <button onClick={onClose} className="p-2 bg-bullGray rounded-xl text-gray-400 hover:text-bullRed transition-colors"><X /></button>
        </div>
        {children}
      </div>
    </div>
  </div>
);

/**
 * MemberCard component for displaying member summary
 */
const MemberCard: React.FC<{
  member: Member,
  onRenew: () => void,
  onEdit: () => void,
  onPayments: () => void,
  onAvatarClick: (member: Member) => void
}> = ({ member, onRenew, onEdit, onPayments, onAvatarClick }) => {
  const status = calculateStatus(member.membership_end);
  const statusColors = {
    Active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    Due: 'bg-bullYellow/10 text-bullYellow border-bullYellow/20',
    Expired: 'bg-red-50 text-bullRed border-red-100',
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-2xl hover:scale-[1.02] transition-all relative overflow-hidden group">
      {/* Decorative corner accent */}
      <div className={`absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 rounded-full opacity-10 transition-transform group-hover:scale-110 ${status === 'Active' ? 'bg-emerald-500' : status === 'Due' ? 'bg-bullYellow' : 'bg-bullRed'}`} />

      <div className="flex items-start justify-between mb-4 min-w-0">
        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
          <button
            onClick={() => onAvatarClick(member)}
            className="w-12 h-12 rounded-xl bg-bullGray flex-shrink-0 flex items-center justify-center font-black text-lg text-bullDark shadow-inner border border-white hover:border-bullRed transition-all relative group/avatar overflow-hidden"
          >
            {member.name.charAt(0)}
            <div className="absolute inset-0 bg-bullDark/20 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
              <Maximize2 className="h-4 w-4 text-white" />
            </div>
          </button>
          <div className="min-w-0 overflow-hidden">
            <h3 className="text-lg font-black text-bullDark leading-tight mb-1 group-hover:text-bullRed transition-colors truncate">{member.name}</h3>
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColors[status as keyof typeof statusColors]}`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <InfoLine icon={<Phone />} label="Phone" value={member.phone} />
        <InfoLine icon={<Calendar />} label="Expires" value={member.membership_end} bold />
        {member.goal && <InfoLine icon={<Target />} label="Goal" value={member.goal} />}
        {member.fitness_level && <InfoLine icon={<Activity />} label="Level" value={member.fitness_level} />}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-50">
        <button
          onClick={onRenew}
          className="py-2.5 bg-bullRed text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-900/10 transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw className="h-3 w-3" /> Renew
        </button>
        <button
          onClick={onPayments}
          className="py-2.5 border-2 border-bullGray text-bullDark rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-bullGray transition-all flex items-center justify-center gap-2"
        >
          <Receipt className="h-3 w-3" /> Payments
        </button>
      </div>

      {/* Absolute floating edit button */}
      <button
        onClick={onEdit}
        className="absolute top-4 right-4 p-2 rounded-full bg-bullGray text-gray-400 hover:bg-bullRed hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
      >
        <Edit2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal States
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [expandedAvatarMember, setExpandedAvatarMember] = useState<Member | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentsModalOpen, setIsPaymentsModalOpen] = useState(false);

  // Form States
  const [renewDuration, setRenewDuration] = useState('1');
  const [renewAmount, setRenewAmount] = useState('2000');
  const [renewCustomDate, setRenewCustomDate] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      showToast('Failed to fetch members.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members
    .filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm)
    )
    .sort((a, b) => {
      const statusA = calculateStatus(a.membership_end);
      const statusB = calculateStatus(b.membership_end);
      const priority: Record<string, number> = { Expired: 0, Due: 1, Active: 2 };
      if (priority[statusA] !== priority[statusB]) {
        return priority[statusA] - priority[statusB];
      }
      // Within same status, sort by closest expiry date first
      return new Date(a.membership_end).getTime() - new Date(b.membership_end).getTime();
    });

  // --- Modal Opening Handlers ---
  const handleRenew = (member: Member) => {
    setSelectedMember(member);
    setRenewDuration('1');
    setRenewAmount('2000');
    setIsRenewModalOpen(true);
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handlePayments = async (member: Member) => {
    setSelectedMember(member);
    setIsPaymentsModalOpen(true);
    setPaymentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('member_id', member.id)
        .order('paid_on', { ascending: false });
      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      showToast('Failed to load payments.', 'error');
    } finally {
      setPaymentsLoading(false);
    }
  };

  // --- Submit Handlers ---
  const submitRenewal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      let newEndDateStr: string;

      if (renewDuration === 'custom') {
        if (!renewCustomDate) {
          showToast('Please select a custom end date.', 'error');
          setSubmitting(false);
          return;
        }
        newEndDateStr = renewCustomDate;
      } else {
        const currentEnd = new Date(selectedMember.membership_end);
        const newEndDate = new Date(currentEnd);
        newEndDate.setMonth(newEndDate.getMonth() + parseInt(renewDuration));
        newEndDateStr = newEndDate.toISOString().split('T')[0];
      }

      // Update membership_end, set renewal_reminder = false
      const { error: updateError } = await supabase
        .from('members')
        .update({
          membership_end: newEndDateStr,
          renewal_reminder: false
        })
        .eq('id', selectedMember.id);

      if (updateError) throw updateError;

      const { error: paymentError } = await supabase
        .from('payments')
        .insert([{
          member_id: selectedMember.id,
          amount: parseFloat(renewAmount),
          paid_on: new Date().toISOString().split('T')[0],
          next_due_date: newEndDateStr
        }]);

      if (paymentError) throw paymentError;

      showToast(`Renewed until ${newEndDateStr}`, 'success');
      setIsRenewModalOpen(false);
      fetchMembers();
    } catch (err) {
      showToast('Failed to renew.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('members')
        .update(selectedMember)
        .eq('id', selectedMember.id);
      if (error) throw error;
      showToast('Member updated.', 'success');
      setIsEditModalOpen(false);
      fetchMembers();
    } catch (err) {
      showToast('Update failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteMember = async () => {
    if (!selectedMember || !window.confirm(`Delete ${selectedMember.name} permanently?`)) return;
    setSubmitting(true);
    try {
      await supabase.from('payments').delete().eq('member_id', selectedMember.id);
      const { error } = await supabase.from('members').delete().eq('id', selectedMember.id);
      if (error) throw error;
      showToast('Member deleted.', 'success');
      setIsEditModalOpen(false);
      fetchMembers();
    } catch (err) {
      showToast('Delete failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      {toast && (
        <div className="fixed top-20 right-4 z-[100] flex items-center p-4 rounded-2xl shadow-2xl animate-fade-in-down max-w-sm w-full bg-white border-2 border-bullGray">
          {toast.type === 'success' ? (
            <CheckCircle className="flex-shrink-0 w-5 h-5 mr-3 text-emerald-500" />
          ) : (
            <AlertCircle className="flex-shrink-0 w-5 h-5 mr-3 text-bullRed" />
          )}
          <div className="font-bold text-bullDark text-sm">{toast.message}</div>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-bullDark">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-bullDark uppercase tracking-tight">Army of Bulls</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-xs tracking-widest">Live Member Management Interface</p>
        </div>
        <Link
          to="/add-member"
          className="px-8 py-4 bg-bullRed rounded-2xl text-white font-black hover:bg-red-700 shadow-xl shadow-red-900/20 transition-all uppercase text-sm tracking-widest flex items-center justify-center"
        >
          <UserPlus className="h-5 w-5 mr-2" /> New Member
        </Link>
      </section>

      {/* Filter Section */}
      <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="relative w-full max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 border-2 border-gray-50 rounded-2xl leading-5 bg-bullGray placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bullRed focus:border-bullRed sm:text-sm font-bold transition-all"
            placeholder="Search by name, phone or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Members Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bullRed"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                onRenew={() => handleRenew(member)}
                onEdit={() => handleEdit(member)}
                onPayments={() => handlePayments(member)}
                onAvatarClick={(m) => setExpandedAvatarMember(m)}
              />
            ))
          ) : (
            <div className="col-span-full bg-white p-20 rounded-3xl border-2 border-dashed border-gray-200 text-center flex flex-col items-center gap-4">
              <Users className="h-16 w-16 text-gray-200" />
              <p className="text-xl font-bold text-gray-400 uppercase tracking-widest">No Members Found</p>
            </div>
          )}
        </div>
      )}

      {/* Image Expansion Overlay (Avatar Expansion) */}
      {expandedAvatarMember && (
        <div
          className="fixed inset-0 z-[200] bg-bullDark/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
          onClick={() => setExpandedAvatarMember(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setExpandedAvatarMember(null); }}
            className="absolute top-6 right-6 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all border border-white/10"
          >
            <X className="h-8 w-8" />
          </button>
          <div className="max-w-xl w-full flex flex-col items-center">
            <div
              className="w-64 h-64 sm:w-80 sm:h-80 rounded-[3rem] bg-bullGray flex items-center justify-center text-8xl font-black text-bullRed shadow-2xl border-4 border-bullRed/20 transform animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {expandedAvatarMember.name.charAt(0)}
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mt-10 text-center">{expandedAvatarMember.name}</h2>
            <p className="text-bullYellow font-black uppercase tracking-[0.2em] text-sm mt-2">Active Warrior</p>
            <button
              onClick={() => setExpandedAvatarMember(null)}
              className="mt-8 px-8 py-3 bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all"
            >
              Back to normal
            </button>
          </div>
        </div>
      )}

      {/* Modals Container */}
      {isRenewModalOpen && selectedMember && (
        <Modal onClose={() => setIsRenewModalOpen(false)} title={`Renew - ${selectedMember.name}`}>
          <form onSubmit={submitRenewal} className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Duration</label>
              <select
                value={renewDuration}
                onChange={e => { setRenewDuration(e.target.value); if (e.target.value !== 'custom') setRenewCustomDate(''); }}
                className="w-full bg-bullGray border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-bullRed"
              >
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>
            {renewDuration === 'custom' && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">New End Date</label>
                <input
                  type="date"
                  value={renewCustomDate}
                  onChange={e => setRenewCustomDate(e.target.value)}
                  className="w-full bg-bullGray border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-bullRed"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2">Amount (₹)</label>
              <input
                type="number"
                value={renewAmount}
                onChange={e => setRenewAmount(e.target.value)}
                className="w-full bg-bullGray border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-bullRed"
                required
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-bullRed text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-red-900/10 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Confirm Renewal'}
            </button>
          </form>
        </Modal>
      )}

      {isEditModalOpen && selectedMember && (
        <Modal onClose={() => setIsEditModalOpen(false)} title={`Edit - ${selectedMember.name}`}>
          <form onSubmit={submitEdit} className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={selectedMember.name}
                  onChange={e => setSelectedMember({ ...selectedMember, name: e.target.value } as Member)}
                  className="w-full bg-bullGray border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-bullRed"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Phone</label>
                <input
                  type="text"
                  value={selectedMember.phone}
                  onChange={e => setSelectedMember({ ...selectedMember, phone: e.target.value } as Member)}
                  className="w-full bg-bullGray border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-bullRed"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Goal</label>
                <select
                  value={selectedMember.goal || ''}
                  onChange={e => setSelectedMember({ ...selectedMember, goal: e.target.value } as Member)}
                  className="w-full bg-bullGray border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-bullRed"
                >
                  <option value="">None</option>
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Muscle Gain">Muscle Gain</option>
                  <option value="General Fitness">General Fitness</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Level</label>
                <select
                  value={selectedMember.fitness_level || ''}
                  onChange={e => setSelectedMember({ ...selectedMember, fitness_level: e.target.value } as Member)}
                  className="w-full bg-bullGray border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-bullRed"
                >
                  <option value="">None</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Join Date</label>
                <input
                  type="date"
                  value={selectedMember.join_date}
                  onChange={e => setSelectedMember({ ...selectedMember, join_date: e.target.value } as Member)}
                  className="w-full bg-bullGray border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-bullRed"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Start</label>
                <input
                  type="date"
                  value={selectedMember.membership_start}
                  onChange={e => setSelectedMember({ ...selectedMember, membership_start: e.target.value } as Member)}
                  className="w-full bg-bullGray border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-bullRed"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">End</label>
                <input
                  type="date"
                  value={selectedMember.membership_end}
                  onChange={e => setSelectedMember({ ...selectedMember, membership_end: e.target.value } as Member)}
                  className="w-full bg-bullGray border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-bullRed"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-6">
              <button
                type="button"
                onClick={deleteMember}
                className="flex-1 py-3 border-2 border-red-50 text-bullRed rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-50"
              >
                Delete Member
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-[2] py-3 bg-bullRed text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {isPaymentsModalOpen && selectedMember && (
        <Modal onClose={() => setIsPaymentsModalOpen(false)} title={`Payment History - ${selectedMember.name}`}>
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar p-1">
            {paymentsLoading ? (
              <div className="py-10 text-center"><div className="animate-spin h-6 w-6 border-b-2 border-bullRed mx-auto rounded-full" /></div>
            ) : payments.length === 0 ? (
              <p className="text-center py-10 text-gray-400 font-bold uppercase text-[10px] tracking-widest">No payments found</p>
            ) : (
              payments.map(p => (
                <div key={p.id} className="bg-bullGray p-4 rounded-2xl flex items-center justify-between border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg text-emerald-600"><DollarSign className="h-4 w-4" /></div>
                    <div>
                      <p className="text-sm font-black text-bullDark">₹{p.amount}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{p.paid_on}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest">Success</span>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { CalendarOff, X, Trash2, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

interface OffDay {
  id: string;
  off_date: string;
  note: string;
}

export const OffDays: React.FC = () => {
  const [offDaysMap, setOffDaysMap] = useState<Record<string, OffDay>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [selectedOffDay, setSelectedOffDay] = useState<OffDay | null>(null);
  const [saving, setSaving] = useState(false);

  const YEAR = new Date().getFullYear();
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    fetchOffDays();
  }, []);

  const fetchOffDays = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('off_days')
        .select('*')
        .gte('off_date', `${YEAR}-01-01`)
        .lte('off_date', `${YEAR}-12-31`);
      if (error) throw error;
      const map: Record<string, OffDay> = {};
      data?.forEach((item) => { map[item.off_date] = item; });
      setOffDaysMap(map);
    } catch (err) {
      showToast('Failed to load off days.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (dateStr: string, offDay: OffDay | undefined) => {
    setSelectedDate(dateStr);
    setSelectedOffDay(offDay || null);
    setNoteInput(offDay ? offDay.note : '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate('');
    setNoteInput('');
    setSelectedOffDay(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selectedOffDay) {
        await supabase.from('off_days').update({ note: noteInput }).eq('id', selectedOffDay.id);
        showToast('Off day updated.', 'success');
      } else {
        await supabase.from('off_days').insert([{ off_date: selectedDate, note: noteInput }]);
        showToast('Off day saved.', 'success');
      }
      await fetchOffDays();
      closeModal();
    } catch (err) {
      showToast('Failed to save off day.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOffDay) return;
    setSaving(true);
    try {
      await supabase.from('off_days').delete().eq('id', selectedOffDay.id);
      showToast('Off day removed.', 'success');
      await fetchOffDays();
      closeModal();
    } catch (err) {
      showToast('Failed to delete.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      {toast && (
        <div className="fixed top-20 right-4 z-50 flex items-center p-4 rounded-2xl shadow-2xl animate-fade-in-down max-w-sm w-full bg-white border-2 border-bullGray">
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 mr-3 text-emerald-500" /> : <AlertCircle className="w-5 h-5 mr-3 text-bullRed" />}
          <div className="font-bold text-bullDark text-sm">{toast.message}</div>
          <button onClick={() => setToast(null)} className="ml-auto text-gray-400"><X className="w-5 h-5" /></button>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-bullDark uppercase tracking-tight">Gym Calendar {YEAR}</h1>
          <p className="text-gray-500 font-medium mt-1 uppercase text-xs tracking-widest">Schedule operational off-days and holidays.</p>
        </div>
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 px-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-bullRed" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Off Day</span>
          </div>
          <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
            <div className="w-3 h-3 rounded-full border-2 border-bullRed" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Today</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {MONTHS.map((monthName, monthIndex) => {
          const daysInMonth = new Date(YEAR, monthIndex + 1, 0).getDate();
          const firstDay = new Date(YEAR, monthIndex, 1).getDay();
          const blanks = Array.from({ length: firstDay }, (_, i) => i);
          const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

          return (
            <div key={monthName} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col hover:shadow-xl transition-all">
              <h3 className="text-lg font-black text-bullDark text-center mb-6 uppercase tracking-[0.2em]">{monthName}</h3>
              
              <div className="grid grid-cols-7 gap-2 text-center mb-4">
                {DAYS_OF_WEEK.map((d) => (
                  <div key={d} className="text-[10px] font-black text-gray-300 uppercase">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {blanks.map((b) => <div key={b} className="aspect-square" />)}
                {days.map((day) => {
                  const dateStr = `${YEAR}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const offDay = offDaysMap[dateStr];
                  const isToday = dateStr === todayStr;

                  let cellClass = "aspect-square flex items-center justify-center text-xs rounded-xl font-bold transition-all ";
                  if (offDay) cellClass += "bg-bullRed text-white shadow-lg shadow-red-900/20 ";
                  else cellClass += "hover:bg-bullGray text-gray-500 ";
                  if (isToday) cellClass += "ring-2 ring-bullRed ring-offset-2 ";

                  return (
                    <button key={day} onClick={() => handleDayClick(dateStr, offDay)} className={cellClass}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-bullDark/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg relative z-10 overflow-hidden shadow-2xl animate-fade-in-up">
            <form onSubmit={handleSave} className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-bullDark uppercase tracking-widest">{selectedOffDay ? 'Edit Event' : 'New Off Day'}</h3>
                <button type="button" onClick={closeModal} className="p-2 bg-bullGray rounded-xl text-gray-400"><X /></button>
              </div>
              
              <div className="mb-6 bg-bullGray p-6 rounded-3xl border border-gray-100 flex items-center gap-4">
                <Calendar className="h-10 w-10 text-bullRed" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Event Date</p>
                  <p className="text-2xl font-black text-bullDark leading-none mt-1">{selectedDate}</p>
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2">Reason for closure</label>
                <textarea
                  required rows={3} value={noteInput} onChange={(e) => setNoteInput(e.target.value)}
                  className="w-full bg-bullGray border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-bullRed transition-all"
                  placeholder="e.g. Diwali Holiday, Renovation..."
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-4">
                {selectedOffDay && (
                  <button type="button" onClick={handleDelete} className="flex-1 py-4 text-bullRed font-black uppercase tracking-widest text-xs hover:bg-red-50 rounded-2xl transition-colors">
                    Remove Event
                  </button>
                )}
                <button type="submit" disabled={saving} className="flex-[2] py-4 bg-bullRed text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 shadow-xl shadow-red-900/20 transition-all">
                  {saving ? 'Saving...' : 'Confirm Off-Day'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
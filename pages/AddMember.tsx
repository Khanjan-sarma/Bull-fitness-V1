import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { AlertCircle } from 'lucide-react';

export const AddMember: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duration, setDuration] = useState('1'); 
  const [totalAmount, setTotalAmount] = useState('2000'); 

  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    join_date: today,
    membership_start: today,
    membership_end: '',
    goal: '',
    fitness_level: '',
  });

  // Auto-calculate the end date and total amount when duration or start date changes
  useEffect(() => {
    if (duration !== 'custom' && formData.membership_start) {
      const startDate = new Date(formData.membership_start);
      const months = parseInt(duration, 10);
      
      startDate.setMonth(startDate.getMonth() + months);
      const newEndDate = startDate.toISOString().split('T')[0];
      
      setFormData((prev) => ({
        ...prev,
        membership_end: newEndDate,
      }));

      setTotalAmount((1000 + (1000 * months)).toString());
    } else if (duration === 'custom') {
      setTotalAmount('');
    }
  }, [duration, formData.membership_start]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }
    if (new Date(formData.membership_end) <= new Date(formData.membership_start)) {
      setError("Membership end date must be after the start date.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Insert Member
      const { data: memberData, error: insertError } = await supabase.from('members').insert([
        {
          name: formData.name,
          phone: formData.phone,
          join_date: formData.join_date,
          membership_start: formData.membership_start,
          membership_end: formData.membership_end,
          goal: formData.goal,
          fitness_level: formData.fitness_level,
        },
      ]).select().single();

      if (insertError) throw insertError;

      // 2. Insert Initial Payment if Amount provided
      if (totalAmount && !isNaN(Number(totalAmount)) && Number(totalAmount) > 0) {
        const { error: paymentError } = await supabase.from('payments').insert([{
          member_id: memberData.id,
          amount: Number(totalAmount),
          paid_on: formData.join_date,
          next_due_date: formData.membership_end
        }]);

        if (paymentError) throw paymentError;
      }

      navigate('/members');
    } catch (err: any) {
      setError(err.message || 'Failed to add member. Check your database permissions or input values.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Member</h1>
        <button
          type="button"
          onClick={() => navigate('/members')}
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Back to List
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-md p-4 text-sm text-red-700 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" /> 
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border transition-shadow"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    required
                    pattern="\d{10}"
                    title="Must be exactly 10 digits"
                    value={formData.phone}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border transition-shadow"
                    placeholder="10 digit number"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700">
                  Fitness Goal
                </label>
                <div className="mt-1">
                  <select
                    id="goal"
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border transition-shadow bg-white"
                  >
                    <option value="">Select a goal</option>
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="General Fitness">General Fitness</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="fitness_level" className="block text-sm font-medium text-gray-700">
                  Fitness Level
                </label>
                <div className="mt-1">
                  <select
                    id="fitness_level"
                    name="fitness_level"
                    value={formData.fitness_level}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border transition-shadow bg-white"
                  >
                    <option value="">Select level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Membership Details</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                  Duration <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <select
                    id="duration"
                    name="duration"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border transition-shadow bg-white"
                  >
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                    <option value="custom">Custom Date</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="join_date" className="block text-sm font-medium text-gray-700">
                  Join Date <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="join_date"
                    id="join_date"
                    required
                    value={formData.join_date}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border transition-shadow"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="membership_start" className="block text-sm font-medium text-gray-700">
                  Membership Start <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="membership_start"
                    id="membership_start"
                    required
                    value={formData.membership_start}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border transition-shadow"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="membership_end" className="block text-sm font-medium text-gray-700">
                  Membership End <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="date"
                    name="membership_end"
                    id="membership_end"
                    required
                    value={formData.membership_end}
                    onChange={handleChange}
                    readOnly={duration !== 'custom'}
                    className={`shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border transition-shadow ${
                      duration !== 'custom' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
                  Total Amount <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    name="totalAmount"
                    id="totalAmount"
                    min="0"
                    step="0.01"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-2 border transition-shadow"
                    placeholder="e.g. 2000"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/members')}
              className="w-full sm:w-auto bg-white py-2 px-6 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

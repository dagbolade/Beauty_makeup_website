import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { TimeSlot, Booking, BlockedDate } from '../types';
import toast from 'react-hot-toast';

export default function AdminPanel() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState({ start_time: '', end_time: '' });
  const [newBlockedDate, setNewBlockedDate] = useState({ date: '', reason: '' });

  useEffect(() => {
    fetchTimeSlots();
    fetchBookings();
    fetchBlockedDates();
  }, []);

  const fetchTimeSlots = async () => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('start_time');

    if (error) {
      toast.error('Failed to load time slots');
      return;
    }

    setTimeSlots(data || []);
  };

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date');

    if (error) {
      toast.error('Failed to load bookings');
      return;
    }

    setBookings(data || []);
  };

  const fetchBlockedDates = async () => {
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('*')
      .order('date');

    if (error) {
      toast.error('Failed to load blocked dates');
      return;
    }

    setBlockedDates(data || []);
  };

  const addTimeSlot = async () => {
    const { error } = await supabase
      .from('time_slots')
      .insert([newTimeSlot]);

    if (error) {
      toast.error('Failed to add time slot');
      return;
    }

    toast.success('Time slot added successfully');
    fetchTimeSlots();
    setNewTimeSlot({ start_time: '', end_time: '' });
  };

  const deleteTimeSlot = async (id: string) => {
    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete time slot');
      return;
    }

    toast.success('Time slot deleted successfully');
    fetchTimeSlots();
  };

  const addBlockedDate = async () => {
    const { error } = await supabase
      .from('blocked_dates')
      .insert([newBlockedDate]);

    if (error) {
      toast.error('Failed to add blocked date');
      return;
    }

    toast.success('Date blocked successfully');
    fetchBlockedDates();
    setNewBlockedDate({ date: '', reason: '' });
  };

  const deleteBlockedDate = async (id: string) => {
    const { error } = await supabase
      .from('blocked_dates')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete blocked date');
      return;
    }

    toast.success('Blocked date removed successfully');
    fetchBlockedDates();
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update booking status');
      return;
    }

    toast.success('Booking status updated successfully');
    fetchBookings();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Time Slots Management */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Manage Time Slots</h2>
          
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <input
                type="time"
                value={newTimeSlot.start_time}
                onChange={(e) => setNewTimeSlot({ ...newTimeSlot, start_time: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
              <input
                type="time"
                value={newTimeSlot.end_time}
                onChange={(e) => setNewTimeSlot({ ...newTimeSlot, end_time: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
              <button
                onClick={addTimeSlot}
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
              >
                Add
              </button>
            </div>

            <div className="space-y-2">
              {timeSlots.map((slot) => (
                <div key={slot.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span>{slot.start_time} - {slot.end_time}</span>
                  <button
                    onClick={() => deleteTimeSlot(slot.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Blocked Dates Management */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Manage Blocked Dates</h2>
          
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <input
                type="date"
                value={newBlockedDate.date}
                onChange={(e) => setNewBlockedDate({ ...newBlockedDate, date: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
              <input
                type="text"
                placeholder="Reason"
                value={newBlockedDate.reason}
                onChange={(e) => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
              <button
                onClick={addBlockedDate}
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
              >
                Block
              </button>
            </div>

            <div className="space-y-2">
              {blockedDates.map((date) => (
                <div key={date.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{format(new Date(date.date), 'MMM dd, yyyy')}</span>
                    {date.reason && <span className="ml-2 text-gray-500">- {date.reason}</span>}
                  </div>
                  <button
                    onClick={() => deleteBlockedDate(date.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Management */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Manage Bookings</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.time_slot_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium">{booking.client_name}</div>
                      <div className="text-sm text-gray-500">{booking.client_email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.service_option}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={booking.status}
                      onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                      className="rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
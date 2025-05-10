import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, X, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { TimeSlot } from '../types';
import toast from 'react-hot-toast';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  serviceOption: string;
}

export default function BookingModal({ isOpen, onClose, serviceId, serviceName, serviceOption }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });

  // Fetch Time Slots when modal opens or date changes
  useEffect(() => {
    if (isOpen) {
      fetchTimeSlots();
    }
  }, [isOpen, selectedDate]);

  // Fetch available time slots
  const fetchTimeSlots = async () => {
    setIsLoading(true);
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      // Important: This query MUST filter for is_available = true
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('slot_date', formattedDate)
        .eq('is_available', true) // This ensures only available slots are shown
        .order('start_time');

      if (error) {
        toast.error('Failed to load time slots');
        console.error('Error fetching time slots:', error.message);
        setTimeSlots([]);
      } else {
        console.log(`Found ${data?.length || 0} available slots for ${formattedDate}`);
        setTimeSlots(data || []);
      }
    } catch (error) {
      console.error('Exception in fetchTimeSlots:', error);
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send Confirmation Email
  const sendConfirmationEmail = async (
    recipient: string, 
    serviceName: string, 
    serviceOption: string, 
    date: Date,
    time?: string,
    clientInfo?: any
  ) => {
    try {
      const isClient = recipient !== "yemisiartistry@example.com";
      const emailTemplate = isClient ? 
        `Your appointment for ${serviceOption} (${serviceName}) is confirmed for ${format(date, 'EEEE, MMMM do, yyyy')} at ${time}.` :
        `New booking: ${clientInfo?.name} (${clientInfo?.email}, ${clientInfo?.phone}) has booked ${serviceOption} (${serviceName}) for ${format(date, 'EEEE, MMMM do, yyyy')} at ${time}. ${clientInfo?.notes ? `Notes: ${clientInfo.notes}` : ''}`;
      
      await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipient,
          subject: isClient ? `Booking Confirmation for ${serviceName}` : `New Booking: ${serviceName}`,
          text: emailTemplate
        })
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      // Don't show error to user since booking was successful
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    setIsLoading(true);

    try {
      // Double-check that this time slot is still available
      const { data: slotCheck, error: slotCheckError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('id', selectedSlot)
        .eq('is_available', true)
        .single();
      
      if (slotCheckError || !slotCheck) {
        toast.error('This time slot is no longer available. Please select another time.');
        await fetchTimeSlots(); // Refresh available slots
        setSelectedSlot('');
        setIsLoading(false);
        return;
      }

      // Create the booking
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            service_type_id: serviceId,
            service_option: serviceOption,
            booking_date: format(selectedDate, 'yyyy-MM-dd'),
            time_slot_id: selectedSlot,
            client_name: formData.name,
            client_email: formData.email,
            client_phone: formData.phone,
            notes: formData.notes,
            status: 'pending'
          }
        ]);

      if (error) {
        console.error('Error creating booking:', error);
        toast.error('Failed to create booking');
        setIsLoading(false);
        return;
      }

      // CRITICAL STEP: Mark the time slot as unavailable
      const { error: updateError } = await supabase
        .from('time_slots')
        .update({ is_available: false })
        .eq('id', selectedSlot);
      
      if (updateError) {
        console.error('Error marking time slot as unavailable:', updateError);
        // Continue anyway since the booking was created
      } else {
        console.log(`Time slot ${selectedSlot} marked as unavailable successfully`);
      }

      // Find the selected time slot info for the confirmation
      const selectedTimeSlotInfo = timeSlots.find(slot => slot.id === selectedSlot);
      
      // Store booking details for confirmation screen
      setBookingDetails({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        notes: formData.notes,
        date: format(selectedDate, 'EEEE, MMMM do, yyyy'),
        time: selectedTimeSlotInfo?.start_time || '',
        service: serviceName,
        option: serviceOption
      });
      
      // Send confirmation emails
      sendConfirmationEmail(formData.email, serviceName, serviceOption, selectedDate, selectedTimeSlotInfo?.start_time);
      sendConfirmationEmail("yemisiartistry@example.com", serviceName, serviceOption, selectedDate, selectedTimeSlotInfo?.start_time, formData);

      // Show confirmation screen
      setShowConfirmation(true);
    } catch (error) {
      console.error('Unexpected error in booking process:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle closing after booking is complete
  const handleCloseConfirmation = () => {
    // Reset everything
    setFormData({
      name: '',
      email: '',
      phone: '',
      notes: ''
    });
    setSelectedSlot('');
    setShowConfirmation(false);
    
    // Refresh available time slots before closing (in case user wants to book again)
    fetchTimeSlots();
    
    onClose();
  };

  if (!isOpen) return null;

  // Show confirmation screen if booking was successful
  if (showConfirmation && bookingDetails) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-green-700">Booking Confirmed!</h2>
            <p className="text-gray-600 mt-1">Your appointment has been scheduled successfully.</p>
          </div>

          <div className="border-t border-b border-gray-200 py-4 my-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-500">Service</p>
                <p className="font-medium">{bookingDetails.service}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Option</p>
                <p className="font-medium">{bookingDetails.option}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{bookingDetails.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{bookingDetails.time}</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600 mb-4">
              A confirmation email has been sent to {bookingDetails.email}
            </p>
            <button
              onClick={handleCloseConfirmation}
              className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 w-full"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Regular booking form
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Book {serviceName}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Additional Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              placeholder="Any special requests or information..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Select a Date</label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Select a Time Slot</label>
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Loading available times...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-gray-200 rounded-md">
                <p className="text-sm text-gray-500">No time slots available for this date</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`p-2 text-sm rounded-md border ${
                      selectedSlot === slot.id
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-300 hover:border-pink-500'
                    }`}
                  >
                    {slot.start_time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 ${
                isLoading ? 'opacity-75 cursor-wait' : ''
              }`}
              disabled={isLoading || !selectedSlot}
            >
              {isLoading ? 'Processing...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { Calendar, Clock, X, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Type definitions matching your exact database schema
interface TimeSlot {
  id: string; // UUID
  slot_date: string; // date
  start_time: string; // time without time zone
  end_time: string; // time without time zone
  is_available: boolean;
  created_at?: string;
  // UI enhancement fields
  formattedStartTime?: string;
  formattedEndTime?: string;
  durationText?: string;
}

interface EnquiryData {
  id?: string; // UUID
  user_id?: string; // UUID, nullable
  service_type_id?: string; // UUID, nullable  
  service_option: string;
  enquiry_date: string; // Will be converted to date
  time_slot_id?: string; // UUID, nullable
  client_name: string;
  client_email: string;
  client_phone?: string; // nullable
  notes?: string; // nullable
  status?: string; // defaults to 'pending'
  created_at?: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

interface EnquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId?: number;
  serviceName: string;
  serviceOption: string;
}

const EnquiryModal: React.FC<EnquiryModalProps> = ({ 
  isOpen, 
  onClose, 
  serviceId, 
  serviceName, 
  serviceOption 
}) => {
  // Component state with proper types
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);

  // Generate calendar days for the current month
  useEffect(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    setCalendarDays(days);
  }, [currentMonth]);
  
  // Fetch time slots when the date changes
  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedDate]);
  
  // Reset selected slot when date changes
  useEffect(() => {
    setSelectedSlot('');
  }, [selectedDate]);

  // Calendar navigation
  const previousMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, -1));
  };

  const nextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Format time function
  const formatTime = (timeString: string): string => {
    if (!timeString) return 'TBD';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${period}`;
  };

  // Fetch available time slots for the selected date
  const fetchTimeSlots = async () => {
    setIsLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      console.log('Fetching time slots for date:', formattedDate);
      
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('slot_date', formattedDate)
        .eq('is_available', true)
        .order('start_time');
      
      if (error) {
        console.error('Error fetching time slots:', error);
        toast.error('Failed to load available time slots');
        setTimeSlots([]);
        return;
      }
      
      console.log('Fetched time slots:', data);
      
      if (!data || data.length === 0) {
        console.log('No time slots available for this date');
        setTimeSlots([]);
        return;
      }
      
      // Add formatting to each time slot
      const enhancedTimeSlots = data.map(slot => {
        const isBridalService = serviceOption && serviceOption.toLowerCase().includes('bridal');
        
        return {
          ...slot,
          formattedStartTime: formatTime(slot.start_time),
          formattedEndTime: formatTime(slot.end_time),
          durationText: isBridalService ? '2 hours' : '1 hour 30 minutes'
        };
      });
      
      setTimeSlots(enhancedTimeSlots);
      
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast.error('Failed to load available time slots');
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Send confirmation email function
  const sendConfirmationEmail = async (enquiryData: EnquiryData): Promise<boolean> => {
    try {
      console.log('Sending confirmation emails for:', enquiryData);
      
      const { client_name, client_email, service_option, enquiry_date, notes, client_phone } = enquiryData;
      
      // Get time slot details
      let timeSlotData = null;
      if (enquiryData.time_slot_id) {
        try {
          const { data, error: timeSlotError } = await supabase
            .from('time_slots')
            .select('*')
            .eq('id', enquiryData.time_slot_id)
            .single();
            
          if (timeSlotError) {
            console.warn('Could not fetch time slot details:', timeSlotError);
          } else {
            timeSlotData = data;
          }
        } catch (timeSlotError) {
          console.warn('Time slot fetch failed:', timeSlotError);
        }
      }
      
      // Prepare data for email
      const emailData = {
        type: 'booking',
        client_name,
        client_email,
        client_phone: client_phone || 'Not provided',
        service_option,
        enquiry_date,
        time: timeSlotData ? `${formatTime(timeSlotData.start_time)} - ${formatTime(timeSlotData.end_time)}` : 'Time to be confirmed',
        notes: notes || ''
      };
      
      console.log('Sending email with data:', emailData);
      
      // Send emails via Netlify function
      const response = await fetch('/.netlify/functions/send-booking-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Email API error response:', errorText);
        throw new Error(`Email API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Emails sent successfully:', result);
      return true;
      
    } catch (error) {
      console.error('Error in sendConfirmationEmail:', error);
      // Don't throw - let the booking succeed even if email fails
      return false;
    }
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      toast.error('Please select a time slot');
      return;
    }

    // Validate form data
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create the enquiry data object matching your exact schema
      const enquiryData = {
        service_option: serviceOption,
        enquiry_date: format(selectedDate, 'yyyy-MM-dd'),
        time_slot_id: selectedSlot, // UUID from time_slots table
        client_name: formData.name.trim(),
        client_email: formData.email.trim(),
        client_phone: formData.phone.trim() || null,
        notes: formData.notes.trim() || null,
        status: 'pending'
        // Don't include user_id, service_type_id, id, or created_at - let database handle them
      };
      
      console.log('Submitting enquiry with data:', enquiryData);
      
      const { data, error } = await supabase
        .from('enquiries')
        .insert([enquiryData])
        .select();
        
      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from database');
      }

      console.log('Enquiry saved successfully:', data[0]);
      
      // Send confirmation emails
      try {
        await sendConfirmationEmail({
          ...enquiryData,
          id: data[0].id
        });
        console.log('Confirmation emails sent successfully');
      } catch (emailError) {
        console.error('Email error (continuing anyway):', emailError);
        // Don't fail the whole process if email fails
      }
      
      toast.success('Enquiry submitted successfully!');
      setShowConfirmation(true);
      
    } catch (error) {
      console.error('Error submitting enquiry:', error);
      
      // Show specific error message
      if (error instanceof Error) {
        toast.error(`Failed to submit enquiry: ${error.message}`);
      } else {
        toast.error('There was a problem submitting your enquiry. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render the month calendar
  const renderMonthCalendar = () => {
    return (
      <div className="mb-4">
        {/* Month navigation */}
        <div className="flex justify-between items-center mb-2">
          <button 
            type="button"
            onClick={previousMonth}
            className="p-2 rounded-full hover:bg-gray-100 flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="font-medium text-lg">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button 
            type="button"
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100 flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before start of month */}
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
            <div key={`empty-start-${i}`} className="p-2 text-center text-gray-300"></div>
          ))}
          
          {/* Actual days in month */}
          {calendarDays.map((day, i) => {
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());
            const isDisabled = day < new Date(); // Disable past dates
            
            return (
              <button
                key={i}
                type="button"
                disabled={isDisabled}
                onClick={() => handleDateSelect(day)}
                className={`p-2 text-center rounded-full ${
                  isSelected 
                    ? 'bg-pink-600 text-white' 
                    : isToday 
                      ? 'bg-pink-100 text-pink-800'
                      : isDisabled
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                {format(day, 'd')}
              </button>
            );
          })}
          
          {/* Empty cells for days after end of month */}
          {Array.from({ length: (6 - endOfMonth(currentMonth).getDay()) % 7 }).map((_, i) => (
            <div key={`empty-end-${i}`} className="p-2 text-center text-gray-300"></div>
          ))}
        </div>
              
        <div className="text-center text-sm text-gray-500 mt-3">
          Selected: <span className="font-medium">{format(selectedDate, 'EEEE, MMMM do, yyyy')}</span>
        </div>
      </div>
    );
  };

  // Render time slot selection UI
  const renderTimeSlotSelection = () => {
    // Group time slots by time of day
    const groupedSlots = {
      morning: timeSlots.filter(slot => {
        const hour = parseInt(slot.start_time.split(':')[0], 10);
        return hour >= 9 && hour < 12;
      }),
      afternoon: timeSlots.filter(slot => {
        const hour = parseInt(slot.start_time.split(':')[0], 10);
        return hour >= 12 && hour < 17;
      }),
      evening: timeSlots.filter(slot => {
        const hour = parseInt(slot.start_time.split(':')[0], 10);
        return hour >= 17;
      })
    };
    
    const isBridal = serviceOption && serviceOption.toLowerCase().includes('bridal');
    const serviceTypeText = isBridal ? 'Bridal Service' : 'Regular Service';
    const durationText = isBridal ? '2 hours' : '1 hour 30 minutes';
    
    return (
      <div className="mt-4">
        <div className="bg-gray-50 p-3 rounded-md mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium">{serviceTypeText}:</span> {durationText} per appointment
          </p>
        </div>
        
        {timeSlots.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-md">
            <p className="text-gray-500">No available time slots for this date</p>
            <p className="text-xs text-gray-400 mt-1">Please select a different date</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Morning slots */}
            {groupedSlots.morning.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Morning</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {groupedSlots.morning.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`py-2 px-3 rounded-md border text-center ${
                        selectedSlot === slot.id 
                          ? 'bg-pink-100 border-pink-500 text-pink-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{slot.formattedStartTime}</div>
                      <div className="text-xs text-gray-500">to {slot.formattedEndTime}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Afternoon slots */}
            {groupedSlots.afternoon.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Afternoon</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {groupedSlots.afternoon.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`py-2 px-3 rounded-md border text-center ${
                        selectedSlot === slot.id 
                          ? 'bg-pink-100 border-pink-500 text-pink-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{slot.formattedStartTime}</div>
                      <div className="text-xs text-gray-500">to {slot.formattedEndTime}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Evening slots */}
            {groupedSlots.evening.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Evening</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {groupedSlots.evening.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlot(slot.id)}
                      className={`py-2 px-3 rounded-md border text-center ${
                        selectedSlot === slot.id 
                          ? 'bg-pink-100 border-pink-500 text-pink-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{slot.formattedStartTime}</div>
                      <div className="text-xs text-gray-500">to {slot.formattedEndTime}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render confirmation screen
  const renderConfirmation = () => {
    return (
      <div className="text-center py-8">
        <div className="flex justify-center mb-4">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Enquiry Submitted!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your interest in {serviceName}. Yemisi will get back to you soon to confirm your appointment.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left max-w-md mx-auto">
          <h3 className="font-medium mb-3">Your Enquiry Details:</h3>
          <p><span className="font-medium">Service:</span> {serviceOption}</p>
          <p><span className="font-medium">Date:</span> {format(selectedDate, 'EEEE, MMMM do, yyyy')}</p>
          <p><span className="font-medium">Name:</span> {formData.name}</p>
          <p><span className="font-medium">Email:</span> {formData.email}</p>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          A confirmation email has been sent to your email address.
        </p>
        
        <button
          onClick={onClose}
          className="px-6 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
        >
          Close
        </button>
      </div>
    );
  };

  // Reset form
  const resetForm = () => {
    setSelectedDate(new Date());
    setSelectedSlot('');
    setFormData({
      name: '',
      email: '',
      phone: '',
      notes: ''
    });
    setShowConfirmation(false);
  };

  // Close modal and reset form
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Don't render anything if modal is not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Enquire about {serviceName}</h2>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {showConfirmation ? (
          renderConfirmation()
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <span className="bg-pink-100 text-pink-800 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2">1</span>
                  Your Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 px-3 py-2 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 px-3 py-2 border"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 px-3 py-2 border"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Date Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <span className="bg-pink-100 text-pink-800 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2">2</span>
                  Choose a Date
                </h3>
                
                {renderMonthCalendar()}
              </div>
              
              {/* Time Slot Selection */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center">
                  <span className="bg-pink-100 text-pink-800 w-6 h-6 rounded-full inline-flex items-center justify-center mr-2">3</span>
                  Choose a Time
                </h3>
                
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading available times...</p>
                  </div>
                ) : (
                  renderTimeSlotSelection()
                )}
              </div>
              
              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 px-3 py-2 border"
                  placeholder="Any specific requirements or questions..."
                ></textarea>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !selectedSlot}
                className={`w-full py-3 rounded-md text-white font-medium ${
                  isLoading || !selectedSlot 
                    ? 'bg-pink-300 cursor-not-allowed' 
                    : 'bg-pink-600 hover:bg-pink-700'
                }`}
              >
                {isLoading ? 'Submitting...' : 'Submit Enquiry'}
              </button>
              
              <p className="text-xs text-gray-500 text-center mt-2">
                By submitting this form, you agree to be contacted regarding your enquiry.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EnquiryModal;
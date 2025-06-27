import React, { useState, useEffect } from 'react';
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { format, addDays, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isValid } from 'date-fns';
import PortfolioImageManager from './PortfolioImageManager';
import PriceManagement from './PriceManagement';


export default function AdminPanel() {
  // State for different data types
  const [timeSlots, setTimeSlots] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  
  // Form state
  const [newTimeSlot, setNewTimeSlot] = useState({ 
    start_time: '', 
    end_time: '',
    slot_date: format(new Date(), 'yyyy-MM-dd'),
    is_available: true
  });
  const [newBlockedDate, setNewBlockedDate] = useState({ date: '', reason: '' });
  const [editingTimeSlot, setEditingTimeSlot] = useState(null);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [enquiryNote, setEnquiryNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isLoading, setIsLoading] = useState({
    timeSlots: false,
    enquiries: false,
    blockedDates: false
  });

  // Bulk time slot generator state
  const [generating, setGenerating] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bulkEndDate, setBulkEndDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [selectedServiceType, setSelectedServiceType] = useState('default');
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState({
    pendingEnquiries: 0,
    confirmedEnquiries: 0,
    todayEnquiries: 0,
    totalEnquiries: 0
  });
  
  // Generate calendar days for the current month
  useEffect(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysArray = eachDayOfInterval({ start: monthStart, end: monthEnd });
    setCalendarDays(daysArray);
  }, [currentMonth]);
  
  // Load data on component mount
  useEffect(() => {
    fetchTimeSlots();
    fetchEnquiries();
    fetchBlockedDates();
  }, []);

  // Calculate dashboard stats when enquiries change
  useEffect(() => {
    if (!enquiries || enquiries.length === 0) {
      setDashboardStats({
        pendingEnquiries: 0,
        confirmedEnquiries: 0,
        todayEnquiries: 0,
        totalEnquiries: 0
      });
      return;
    }

    // Current date for today's enquiries comparison
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const pendingCount = enquiries.filter(e => e.status === 'pending').length;
    const confirmedCount = enquiries.filter(e => e.status === 'confirmed').length;
    const todayCount = enquiries.filter(e => e.enquiry_date === today).length;
    
    setDashboardStats({
      pendingEnquiries: pendingCount,
      confirmedEnquiries: confirmedCount,
      todayEnquiries: todayCount,
      totalEnquiries: enquiries.length
    });
  }, [enquiries]);

  // Data fetching functions
  const fetchTimeSlots = async () => {
    setIsLoading(prevState => ({ ...prevState, timeSlots: true }));
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .order('slot_date')
        .order('start_time');

      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast.error('Failed to load time slots');
    } finally {
      setIsLoading(prevState => ({ ...prevState, timeSlots: false }));
    }
  };

  const fetchEnquiries = async () => {
    setIsLoading(prevState => ({ ...prevState, enquiries: true }));
    try {
      console.log('Fetching enquiries from database...');
      
      // Direct query with detailed logging
      const { data: enquiryData, error: enquiryError } = await supabase
        .from('enquiries')
        .select('*');
      
      // Log the raw response
      console.log('Supabase enquiries response:', { data: enquiryData, error: enquiryError });
      
      if (enquiryError) {
        console.error('Error fetching enquiries:', enquiryError);
        toast.error('Failed to load enquiries');
        setEnquiries([]);
        return;
      }
      
      // Now fetch all time slots to associate with enquiries
      const { data: allTimeSlots, error: timeSlotsError } = await supabase
        .from('time_slots')
        .select('*');
        
      if (timeSlotsError) {
        console.error('Error fetching time slots for enquiries:', timeSlotsError);
      }
      
      // Create a lookup map for time slots
      const timeSlotsMap = {};
      if (allTimeSlots && allTimeSlots.length > 0) {
        allTimeSlots.forEach(slot => {
          timeSlotsMap[slot.id] = slot;
        });
      }
      
      // Enhance enquiries with time slot data
      const enhancedEnquiries = enquiryData.map(enquiry => ({
        ...enquiry,
        timeSlot: timeSlotsMap[enquiry.time_slot_id] || null
      }));
      
      console.log(`Successfully fetched ${enhancedEnquiries.length} enquiries with time slot data`);
      setEnquiries(enhancedEnquiries);
    } catch (error) {
      console.error('Exception in fetchEnquiries:', error);
      toast.error('Failed to load enquiries');
      setEnquiries([]);
    } finally {
      setIsLoading(prevState => ({ ...prevState, enquiries: false }));
    }
  };

  const fetchBlockedDates = async () => {
    setIsLoading(prevState => ({ ...prevState, blockedDates: true }));
    try {
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .order('date');

      if (error) throw error;
      setBlockedDates(data || []);
    } finally {
      setIsLoading(prevState => ({ ...prevState, blockedDates: false }));
    }
  };

  // Time slot management
  const addTimeSlot = async () => {
    try {
      // Validate the input
      if (!newTimeSlot.start_time || !newTimeSlot.end_time || !newTimeSlot.slot_date) {
        toast.error('Please fill all time slot fields');
        return;
      }

      const { error } = await supabase
        .from('time_slots')
        .insert([newTimeSlot]);

      if (error) throw error;

      toast.success('Time slot added successfully');
      fetchTimeSlots();
      setNewTimeSlot({ 
        start_time: '', 
        end_time: '',
        slot_date: format(new Date(), 'yyyy-MM-dd'),
        is_available: true
      });
    } catch (error) {
      console.error('Error adding time slot:', error);
      toast.error('Failed to add time slot');
    }
  };

  const editTimeSlot = (slot) => {
    setEditingTimeSlot(slot);
    setNewTimeSlot({
      id: slot.id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      slot_date: slot.slot_date,
      is_available: slot.is_available
    });
  };

  const updateTimeSlot = async () => {
    if (!editingTimeSlot) return;
    
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({
          start_time: newTimeSlot.start_time,
          end_time: newTimeSlot.end_time,
          slot_date: newTimeSlot.slot_date,
          is_available: newTimeSlot.is_available
        })
        .eq('id', editingTimeSlot.id);
        
      if (error) throw error;
      
      toast.success('Time slot updated successfully');
      fetchTimeSlots();
      setEditingTimeSlot(null);
      setNewTimeSlot({ 
        start_time: '', 
        end_time: '',
        slot_date: format(new Date(), 'yyyy-MM-dd'),
        is_available: true
      });
    } catch (error) {
      console.error('Error updating time slot:', error);
      toast.error('Failed to update time slot');
    }
  };

  // New time slot generation function
  const generateTimeSlots = async (startDate, endDate, serviceType = 'default') => {
    try {
      // Define time slot durations based on service type
      const getDuration = (serviceType) => {
        // Convert service type to lowercase for case-insensitive comparison
        const type = serviceType.toLowerCase();
        
        // Check if it's a bridal service
        if (type.includes('bridal')) {
          return 120; // 2 hours for bridal services
        }
        
        // Default duration is 90 minutes (1 hour 30 minutes)
        return 90;
      };
      
      // Get appropriate duration based on service type
      const durationMinutes = getDuration(serviceType);
      
      // Convert dates to JavaScript Date objects if they're strings
      const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
      const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
      
      // Initialize array to hold all new time slots
      const newSlots = [];
      
      // Loop through each day in the date range
      const currentDate = new Date(start);
      while (currentDate <= end) {
        // Start times for each day (24-hour format)
        const dailyStartTimes = ['09:00', '11:00', '13:00', '15:00', '17:00'];
        
        // Adjust end times based on duration
        const dailyTimePairs = dailyStartTimes.map(startTime => {
          // Parse start time
          const [startHour, startMinute] = startTime.split(':').map(num => parseInt(num, 10));
          
          // Calculate end time based on duration
          let endHour = startHour + Math.floor(durationMinutes / 60);
          let endMinute = startMinute + (durationMinutes % 60);
          
          // Adjust for minute overflow
          if (endMinute >= 60) {
            endHour += 1;
            endMinute -= 60;
          }
          
          // Format the end time with leading zeros if needed
          const formattedEndHour = endHour.toString().padStart(2, '0');
          const formattedEndMinute = endMinute.toString().padStart(2, '0');
          const endTime = `${formattedEndHour}:${formattedEndMinute}`;
          
          return { startTime, endTime };
        });
        
        // Format the current date as yyyy-MM-dd
        const formattedDate = currentDate.toISOString().split('T')[0]; // yyyy-MM-dd format
        
        // Create time slot objects for this day
        for (const { startTime, endTime } of dailyTimePairs) {
          newSlots.push({
            start_time: startTime,
            end_time: endTime,
            slot_date: formattedDate,
            is_available: true
          });
        }
        
        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Insert the new time slots into the database
      const { data, error } = await supabase
        .from('time_slots')
        .insert(newSlots);
        
      if (error) throw error;
      
      return { success: true, count: newSlots.length };
    } catch (error) {
      console.error('Error generating time slots:', error);
      return { success: false, error };
    }
  };

  const handleGenerateTimeSlots = async () => {
    if (!bulkStartDate || !bulkEndDate) {
      toast.error('Please select start and end dates');
      return;
    }
    
    const start = new Date(bulkStartDate);
    const end = new Date(bulkEndDate);
    
    if (start > end) {
      toast.error('Start date must be before end date');
      return;
    }
    
    setGenerating(true);
    
    try {
      const result = await generateTimeSlots(start, end, selectedServiceType);
      
      if (result.success) {
        toast.success(`Generated ${result.count} time slots successfully`);
        fetchTimeSlots(); // Refresh the time slots list
      } else {
        toast.error('Failed to generate time slots');
      }
    } catch (error) {
      console.error('Error in handleGenerateTimeSlots:', error);
      toast.error('An error occurred while generating time slots');
    } finally {
      setGenerating(false);
    }
  };

  const deleteTimeSlot = async (id) => {
    try {
      const { error } = await supabase
        .from('time_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Time slot deleted successfully');
      fetchTimeSlots();
    } catch (error) {
      console.error('Error deleting time slot:', error);
      toast.error('Failed to delete time slot');
    }
  };

  const toggleTimeSlotAvailability = async (id, currentAvailability) => {
    try {
      const { error } = await supabase
        .from('time_slots')
        .update({ is_available: !currentAvailability })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Time slot marked as ${!currentAvailability ? 'available' : 'unavailable'}`);
      fetchTimeSlots();
    } catch (error) {
      console.error('Error updating time slot availability:', error);
      toast.error('Failed to update time slot');
    }
  };

  // Blocked dates management
  const addBlockedDate = async () => {
    try {
      if (!newBlockedDate.date) {
        toast.error('Please select a date to block');
        return;
      }

      const { error } = await supabase
        .from('blocked_dates')
        .insert([newBlockedDate]);

      if (error) throw error;

      toast.success('Date blocked successfully');
      fetchBlockedDates();
      setNewBlockedDate({ date: '', reason: '' });
    } catch (error) {
      console.error('Error adding blocked date:', error);
      toast.error('Failed to add blocked date');
    }
  };

  const deleteBlockedDate = async (id) => {
    try {
      const { error } = await supabase
        .from('blocked_dates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Blocked date removed successfully');
      fetchBlockedDates();
    } catch (error) {
      console.error('Error deleting blocked date:', error);
      toast.error('Failed to delete blocked date');
    }
  };

  // Enquiry management with manual slot confirmation
  const updateEnquiryStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('enquiries')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      // Get the full enquiry details to access the time slot
      const { data: enquiryData, error: enquiryError } = await supabase
        .from('enquiries')
        .select('*')
        .eq('id', id)
        .single();
        
      if (enquiryError) {
        console.error('Error fetching enquiry details:', enquiryError);
      } else {
        // Handle time slot based on the new status
        if (status === 'confirmed') {
          // When an enquiry is confirmed, mark its time slot as unavailable
          await supabase
            .from('time_slots')
            .update({ is_available: false })
            .eq('id', enquiryData.time_slot_id);
            
          console.log(`Time slot ${enquiryData.time_slot_id} marked as unavailable after confirmation`);
          
          // Optionally, you might want to reject other pending enquiries for the same time slot
          const { data: conflictingEnquiries } = await supabase
            .from('enquiries')
            .select('id')
            .eq('time_slot_id', enquiryData.time_slot_id)
            .neq('id', id)
            .eq('status', 'pending');
            
          if (conflictingEnquiries?.length > 0) {
            // Auto-reject all conflicting enquiries
            await supabase
              .from('enquiries')
              .update({ status: 'cancelled' })
              .in('id', conflictingEnquiries.map(e => e.id));
              
            console.log(`${conflictingEnquiries.length} conflicting enquiries automatically cancelled`);
          }
        } 
        else if (status === 'cancelled' && enquiryData.status === 'confirmed') {
          // If a previously confirmed enquiry is cancelled, free up the time slot again
          await supabase
            .from('time_slots')
            .update({ is_available: true })
            .eq('id', enquiryData.time_slot_id);
            
          console.log(`Time slot ${enquiryData.time_slot_id} marked as available after cancellation`);
        }
      }

      toast.success('Enquiry status updated successfully');
      fetchEnquiries();
      fetchTimeSlots(); // Refresh time slots to show updated availability
    } catch (error) {
      console.error('Error updating enquiry status:', error);
      toast.error('Failed to update enquiry status');
    }
  };

  const confirmEnquiryWithTimeSlot = async (enquiryId) => {
    try {
      // Get the enquiry first to get its time slot
      const { data: enquiry, error: enquiryError } = await supabase
        .from('enquiries')
        .select('*')
        .eq('id', enquiryId)
        .single();
        
      if (enquiryError) throw enquiryError;
      
      // Check if the time slot is still available
      const { data: timeSlot, error: timeSlotError } = await supabase
        .from('time_slots')
        .select('*')
        .eq('id', enquiry.time_slot_id)
        .single();
        
      if (timeSlotError) throw timeSlotError;
      
      if (!timeSlot.is_available) {
        toast.error('This time slot is no longer available. Please select a different time slot.');
        return;
      }
      
      // First, update the enquiry to confirmed status
      const { error: updateError } = await supabase
        .from('enquiries')
        .update({ status: 'confirmed' })
        .eq('id', enquiryId);
        
      if (updateError) throw updateError;
      
      // Then, mark the time slot as unavailable
      const { error: slotError } = await supabase
        .from('time_slots')
        .update({ is_available: false })
        .eq('id', enquiry.time_slot_id);
        
      if (slotError) throw slotError;
      
      // Handle conflicting enquiries
      const { data: conflictingEnquiries } = await supabase
        .from('enquiries')
        .select('id')
        .eq('time_slot_id', enquiry.time_slot_id)
        .neq('id', enquiryId)
        .eq('status', 'pending');
        
      if (conflictingEnquiries?.length > 0) {
        // Auto-reject all conflicting enquiries
        await supabase
          .from('enquiries')
          .update({ status: 'cancelled' })
          .in('id', conflictingEnquiries.map(e => e.id));
          
        console.log(`${conflictingEnquiries.length} conflicting enquiries automatically cancelled`);
      }
      
      toast.success('Enquiry confirmed successfully');
      fetchEnquiries();
      fetchTimeSlots();
    } catch (error) {
      console.error('Error confirming enquiry:', error);
      toast.error('Failed to confirm enquiry');
    }
  };

  const rejectEnquiry = async (enquiryId) => {
    try {
      // Update the enquiry to cancelled status
      const { error } = await supabase
        .from('enquiries')
        .update({ status: 'cancelled' })
        .eq('id', enquiryId);
        
      if (error) throw error;
      
      toast.success('Enquiry rejected successfully');
      fetchEnquiries();
      setShowRejectionModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting enquiry:', error);
      toast.error('Failed to reject enquiry');
    }
  };

  // For blocked date ranges
const [blockDateRange, setBlockDateRange] = useState(false);
const [endBlockedDate, setEndBlockedDate] = useState('');

// Add this function to handle blocking a range of dates
const addBlockedDateRange = async () => {
  try {
    if (!newBlockedDate.date || !endBlockedDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    // Parse and validate the dates
    if (!isValid(parseISO(newBlockedDate.date)) || !isValid(parseISO(endBlockedDate))) {
      toast.error('Invalid date format');
      return;
    }

    const startDate = parseISO(newBlockedDate.date);
    const endDate = parseISO(endBlockedDate);
    
    if (startDate > endDate) {
      toast.error('Start date must be before end date');
      return;
    }

    // Create an array of dates to block
    const blockedDates = [];
    const currentDate = new Date(startDate);
    
    // Generate all dates in the range
    while (currentDate <= endDate) {
      blockedDates.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        reason: newBlockedDate.reason
      });
      
      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Insert all dates in one batch
    const { error } = await supabase
      .from('blocked_dates')
      .insert(blockedDates);

    if (error) throw error;

    toast.success(`Blocked ${blockedDates.length} dates successfully`);
    fetchBlockedDates();
    
    // Reset form
    setNewBlockedDate({ date: '', reason: '' });
    setEndBlockedDate('');
    setBlockDateRange(false);
  } catch (error) {
    console.error('Error adding blocked date range:', error);
    toast.error('Failed to block dates');
  }
};

const renderPortfolio = () => {
  return (
    <div>
      <PortfolioImageManager />
    </div>
  );
};

  // Calendar navigation
  const previousMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, -1));
  };

  const nextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  // Debug function
  const debugAdminPanel = () => {
    console.log('=== ADMIN PANEL DEBUG ===');
    console.log('Current state:');
    console.log('- Enquiries:', enquiries);
    console.log('- Time Slots:', timeSlots);
    console.log('- Active Tab:', activeTab);
    console.log('- Dashboard Stats:', dashboardStats);
    
    // Check if Supabase is working
    supabase
      .from('enquiries')
      .select('count')
      .then(({ data, error }) => {
        if (error) {
          console.error('Supabase error:', error);
        } else {
          console.log('Direct query to enquiries table:', data);
        }
      });

    console.log('=== DEBUG END ===');
  };

  // Renders
  const renderTabs = () => {
    return (
      <div className="flex border-b mb-6 overflow-x-auto">
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'dashboard' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'enquiries' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('enquiries')}
        >
          Enquiries
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'time-slots' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('time-slots')}
        >
          Time Slots
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'blocked-dates' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('blocked-dates')}
        >
          Blocked Dates
        </button>
        <button 
          className={`px-4 py-2 font-medium ${activeTab === 'portfolio' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
      </button>
      <button 
          className={`px-4 py-2 font-medium ${activeTab === 'pricing' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('pricing')}
        >
          Pricing
        </button>

      </div>
    );
  };

  const renderDashboard = () => {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-2xl font-bold">{dashboardStats.pendingEnquiries}</h3>
            <p className="text-gray-500">Pending Enquiries</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-2xl font-bold">{dashboardStats.confirmedEnquiries}</h3>
            <p className="text-gray-500">Confirmed Enquiries</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-2xl font-bold">{dashboardStats.todayEnquiries}</h3>
            <p className="text-gray-500">Today's Enquiries</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Enquiries</h3>
          {enquiries.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No enquiries yet</p>
          ) : (
            <div className="space-y-4">
              {enquiries.slice(0, 5).map(enquiry => (
                <div key={enquiry.id} className="p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{enquiry.client_name}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(enquiry.enquiry_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <span className={`px-2 py-1 h-fit rounded-full text-xs font-medium ${
                      enquiry.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      enquiry.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {enquiry.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEnquiries = () => {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Manage Enquiries</h2>
        
        {isLoading.enquiries ? (
          <div className="text-center py-8">Loading enquiries...</div>
        ) : enquiries.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center">
            <p className="text-gray-500 mb-4">No enquiries found</p>
            <button 
              onClick={() => fetchEnquiries()} 
              className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
            >
              Refresh Enquiries
            </button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow">
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
                  {enquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedEnquiry(enquiry)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(enquiry.enquiry_date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {enquiry.timeSlot ? 
                          `${enquiry.timeSlot.start_time} - ${enquiry.timeSlot.end_time}` : 
                          (enquiry.time_slot_id || 'Unknown Time')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium">{enquiry.client_name}</div>
                          <div className="text-sm text-gray-500">{enquiry.client_email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {enquiry.service_option}
                      </td> 
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          enquiry.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          enquiry.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          enquiry.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {enquiry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                          {enquiry.status === 'pending' && (
                            <>
                              <button
                                onClick={() => confirmEnquiryWithTimeSlot(enquiry.id)}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedEnquiry(enquiry);
                                  setShowRejectionModal(true);
                                }}
                                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {enquiry.status === 'confirmed' && (
                            <button
                              onClick={() => updateEnquiryStatus(enquiry.id, 'completed')}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Complete
                            </button>
                          )}
                          {enquiry.status !== 'cancelled' && (
                            <button
                              onClick={() => updateEnquiryStatus(enquiry.id, 'cancelled')}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Enquiry Details Modal */}
        {selectedEnquiry && !showRejectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Enquiry Details</h2>
                <button 
                  onClick={() => setSelectedEnquiry(null)} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-500">Client</h3>
                  <p className="font-medium">{selectedEnquiry.client_name}</p>
                  <p className="text-sm">{selectedEnquiry.client_email}</p>
                  <p className="text-sm">{selectedEnquiry.client_phone}</p>
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-500">Service</h3>
                  <p className="font-medium">{selectedEnquiry.service_option}</p>
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-500">Date & Time</h3>
                  <p className="font-medium">
                    {format(new Date(selectedEnquiry.enquiry_date), 'EEEE, MMMM do, yyyy')} at{' '}
                    {selectedEnquiry.timeSlot ? 
                      `${selectedEnquiry.timeSlot.start_time}` : 
                      selectedEnquiry.time_slot_id}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm text-gray-500">Status</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedEnquiry.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      selectedEnquiry.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      selectedEnquiry.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedEnquiry.status}
                    </span>
                    
                    {selectedEnquiry.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            confirmEnquiryWithTimeSlot(selectedEnquiry.id);
                            setSelectedEnquiry(null);
                          }}
                          className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => {
                            setShowRejectionModal(true);
                          }}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedEnquiry.notes && (
                  <div>
                    <h3 className="text-sm text-gray-500">Client Notes</h3>
                    <p className="text-sm p-2 bg-gray-50 rounded mt-1">{selectedEnquiry.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Rejection Modal */}
        {showRejectionModal && selectedEnquiry && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Reject Enquiry</h2>
                <button 
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                  }} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
              
              <p className="mb-4">
                You are about to reject the enquiry from <span className="font-medium">{selectedEnquiry.client_name}</span>.
                Are you sure?
              </p>
              
              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    rejectEnquiry(selectedEnquiry.id);
                    setSelectedEnquiry(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Reject Enquiry
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTimeSlots = () => {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Manage Time Slots</h2>
        
        {/* Bulk Time Slot Generation */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Bulk Generate Time Slots</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={bulkStartDate}
                  onChange={(e) => setBulkStartDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={bulkEndDate}
                  onChange={(e) => setBulkEndDate(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
              <select
                value={selectedServiceType}
                onChange={(e) => setSelectedServiceType(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              >
                <option value="default">Regular Service (1h 30m)</option>
                <option value="bridal">Bridal Service (2h)</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              <p className="font-medium">Time Slot Information:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Regular services: 1 hour 30 minutes per slot</li>
                <li>Bridal services: 2 hours per slot</li>
                <li>Available times: 9:00, 11:00, 13:00, 15:00, 17:00</li>
                <li>Time slots will be created for all days in the selected range</li>
              </ul>
            </div>
            
            <button
              onClick={handleGenerateTimeSlots}
              disabled={generating}
              className="w-full px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 disabled:bg-pink-300"
            >
              {generating ? 'Generating...' : 'Generate Time Slots'}
            </button>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Add Single Time Slot</h3>
          
          {editingTimeSlot ? (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium mb-2">Edit Time Slot</h3>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-sm text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={newTimeSlot.start_time}
                    onChange={(e) => setNewTimeSlot({ ...newTimeSlot, start_time: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={newTimeSlot.end_time}
                    onChange={(e) => setNewTimeSlot({ ...newTimeSlot, end_time: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={updateTimeSlot} 
                  className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Save Changes
                </button>
                <button 
                  onClick={() => {
                    setEditingTimeSlot(null);
                    setNewTimeSlot({ 
                      start_time: '', 
                      end_time: '',
                      slot_date: format(new Date(), 'yyyy-MM-dd'),
                      is_available: true
                    });
                  }} 
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={newTimeSlot.slot_date}
                  onChange={(e) => setNewTimeSlot({ ...newTimeSlot, slot_date: e.target.value })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newTimeSlot.start_time}
                    onChange={(e) => setNewTimeSlot({ ...newTimeSlot, start_time: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newTimeSlot.end_time}
                    onChange={(e) => setNewTimeSlot({ ...newTimeSlot, end_time: e.target.value })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  />
                </div>
              </div>
  
              <button
                onClick={addTimeSlot}
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
              >
                Add Single Slot
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by date</label>
            
            {/* Month Calendar for Date Selection */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <button 
                  onClick={previousMonth}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  &lt; Prev
                </button>
                <h3 className="font-medium text-gray-700">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <button 
                  onClick={nextMonth}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  Next &gt;
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-xs font-medium text-gray-500 p-1">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day, i) => {
                  const isSelected = format(day, 'yyyy-MM-dd') === selectedDate;
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(format(day, 'yyyy-MM-dd'))}
                      className={`aspect-square p-1 text-sm rounded-md ${
                        isSelected ? 'bg-pink-600 text-white' :
                        isToday ? 'bg-pink-100 text-pink-700' :
                        'hover:bg-gray-100'
                      }`}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <p className="text-center text-sm text-gray-500 mt-2">
              Selected: <span className="font-medium">{format(new Date(selectedDate), 'EEEE, MMMM do, yyyy')}</span>
            </p>
          </div>
          
          {isLoading.timeSlots ? (
            <div className="text-center py-4">Loading time slots...</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {timeSlots
                .filter(slot => slot.slot_date === selectedDate)
                .map((slot) => (
                  <div key={slot.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <span className="font-medium">{slot.start_time} - {slot.end_time}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        slot.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {slot.is_available ? 'Available' : 'Reserved'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTimeSlot(slot)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit time slot"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => toggleTimeSlotAvailability(slot.id, slot.is_available)}
                        className={`p-1 rounded ${
                          slot.is_available ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={slot.is_available ? 'Mark as unavailable' : 'Mark as available'}
                      >
                        {slot.is_available ? '❌' : '✅'}
                      </button>
                      <button
                        onClick={() => deleteTimeSlot(slot.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete time slot"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                
              {timeSlots.filter(slot => slot.slot_date === selectedDate).length === 0 && (
                <p className="text-center text-gray-500 py-4">No time slots for this date</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderBlockedDates = () => {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Manage Blocked Dates</h2>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Add Blocked Date Range</h3>
          
          <div className="space-y-4 mb-4">
            {/* Start Date Calendar */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <button 
                    onClick={previousMonth}
                    className="p-1 rounded hover:bg-gray-100"
                    type="button"
                  >
                    &lt; Prev
                  </button>
                  <h3 className="font-medium text-gray-700">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h3>
                  <button 
                    onClick={nextMonth}
                    className="p-1 rounded hover:bg-gray-100"
                    type="button"
                  >
                    Next &gt;
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center">
                  {/* Day headers */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-xs font-medium text-gray-500 p-1">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {calendarDays.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = dateStr === newBlockedDate.date;
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewBlockedDate({...newBlockedDate, date: dateStr})}
                        className={`aspect-square p-1 text-sm rounded-md ${
                          isSelected ? 'bg-pink-600 text-white' :
                          isToday ? 'bg-pink-100 text-pink-700' :
                          'hover:bg-gray-100'
                        }`}
                      >
                        {format(day, 'd')}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <p className="text-center text-sm text-gray-500 mb-4">
                Selected: <span className="font-medium">
                  {newBlockedDate.date && isValid(parseISO(newBlockedDate.date)) ? 
                    format(parseISO(newBlockedDate.date), 'EEEE, MMMM do, yyyy') : 
                    'No date selected'}
                </span>
              </p>
            </div>
  
            {/* End Date (Optional) */}
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="blockRange"
                  checked={blockDateRange}
                  onChange={() => setBlockDateRange(!blockDateRange)}
                  className="h-4 w-4 text-pink-600 rounded"
                />
                <label htmlFor="blockRange" className="ml-2 text-sm font-medium text-gray-700">
                  Block a range of dates
                </label>
              </div>
              
              {blockDateRange && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endBlockedDate}
                    min={newBlockedDate.date} // Ensure end date is after start date
                    onChange={(e) => setEndBlockedDate(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  />
                  
                  {endBlockedDate && isValid(parseISO(endBlockedDate)) && newBlockedDate.date && isValid(parseISO(newBlockedDate.date)) && (
                    <p className="text-xs text-gray-500 mt-1">
                      This will block all dates from {format(parseISO(newBlockedDate.date), 'MMM d, yyyy')} 
                      to {format(parseISO(endBlockedDate), 'MMM d, yyyy')} inclusive.
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
              <input
                type="text"
                placeholder="Why are these dates blocked?"
                value={newBlockedDate.reason}
                onChange={(e) => setNewBlockedDate({ ...newBlockedDate, reason: e.target.value })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
            </div>
          </div>
  
          <button
            onClick={blockDateRange ? addBlockedDateRange : addBlockedDate}
            disabled={!newBlockedDate.date || (blockDateRange && !endBlockedDate)}
            className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 w-full disabled:bg-pink-300 disabled:cursor-not-allowed"
          >
            {blockDateRange ? 'Block Date Range' : 'Block Date'}
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Current Blocked Dates</h3>
          
          {isLoading.blockedDates ? (
            <div className="text-center py-4">Loading blocked dates...</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {blockedDates.map((date) => (
                <div key={date.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">
                      {date.date && isValid(parseISO(date.date)) ? 
                        format(parseISO(date.date), 'EEEE, MMMM d, yyyy') : 
                        date.date}
                    </span>
                    {date.reason && <span className="ml-2 text-sm text-gray-500">- {date.reason}</span>}
                  </div>
                  <button
                    onClick={() => deleteBlockedDate(date.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                  >
                    🗑️
                  </button>
                </div>
              ))}
              
              {blockedDates.length === 0 && (
                <p className="text-center text-gray-500 py-4">No blocked dates</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      
      {renderTabs()}
      
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'enquiries' && renderEnquiries()}
      {activeTab === 'time-slots' && renderTimeSlots()}
      {activeTab === 'blocked-dates' && renderBlockedDates()}
      {activeTab === 'portfolio' && renderPortfolio()}
      {activeTab === 'pricing' && <PriceManagement />}

      {/* Debug button (can be removed in production) */}
      <button 
        onClick={debugAdminPanel}
        className="fixed bottom-4 right-4 px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-xs"
      >
        Debug
      </button>
    </div>
  );
}

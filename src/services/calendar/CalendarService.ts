import { supabase } from '../supabase';
import type { ShowingTimeSlot } from '../../types/propertyShowing';

export class CalendarService {
  async createTimeSlot(propertyId: string, data: Omit<ShowingTimeSlot, 'id'>) {
    try {
      // First, get or create property showing
      const { data: showing, error: showingError } = await supabase
        .from('property_showings')
        .select()
        .eq('property_id', propertyId)
        .single();

      let showingId;
      
      if (showingError && showingError.code === 'PGRST116') {
        // Create new showing if it doesn't exist
        const { data: newShowing, error: createError } = await supabase
          .from('property_showings')
          .insert({ property_id: propertyId })
          .select()
          .single();

        if (createError) throw createError;
        showingId = newShowing.id;
      } else if (showingError) {
        throw showingError;
      } else {
        showingId = showing.id;
      }

      // Create time slot
      const { data: timeSlot, error } = await supabase
        .from('showing_time_slots')
        .insert({
          showing_id: showingId,
          date: data.date,
          start_time: data.startTime,
          end_time: data.endTime,
          max_attendees: data.maxAttendees || 1,
          is_booked: false,
          current_attendees: 0
        })
        .select()
        .single();

      if (error) throw error;
      return timeSlot;
    } catch (err) {
      console.error('Error creating time slot:', err);
      throw err;
    }
  }

  async getTimeSlots(propertyId: string) {
    const { data, error } = await supabase
      .from('showing_time_slots')
      .select(`
        *,
        property_showings!inner(
          property_id
        )
      `)
      .eq('property_showings.property_id', propertyId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) throw error;
    return data;
  }

  async updateTimeSlot(slotId: string, updates: Partial<ShowingTimeSlot>) {
    const { data, error } = await supabase
      .from('showing_time_slots')
      .update({
        date: updates.date,
        start_time: updates.startTime,
        end_time: updates.endTime,
        max_attendees: updates.maxAttendees,
        is_booked: updates.isBooked,
        current_attendees: updates.currentAttendees
      })
      .eq('id', slotId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const calendarService = new CalendarService();
import { supabase } from '../supabase';
import type { OpenHouse } from '../../types/openHouse';

export class OpenHouseService {
  async createOpenHouse(data: Omit<OpenHouse, 'id' | 'currentAttendees'>) {
    try {
      const { data: openHouse, error } = await supabase
        .from('open_houses')
        .insert({
          property_id: data.propertyId,
          agent_id: data.agentId,
          date: data.date,
          start_time: data.startTime,
          end_time: data.endTime,
          max_attendees: data.maxAttendees || 20,
          current_attendees: 0,
          address: data.address,
          city: data.city,
          province: data.province,
          postal_code: data.postalCode
        })
        .select(`
          *,
          properties (
            title,
            images
          ),
          agent_profiles (
            name
          )
        `)
        .single();

      if (error) throw error;
      return openHouse;
    } catch (err) {
      console.error('Create open house error:', err);
      throw new Error('Failed to create open house');
    }
  }
}

export const openHouseService = new OpenHouseService();
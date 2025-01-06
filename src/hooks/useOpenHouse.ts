import { useState } from 'react';
import { openHouseService } from '../services/openHouse/OpenHouseService';
import type { OpenHouse } from '../types/openHouse';

export function useOpenHouse() {
  const [openHouses, setOpenHouses] = useState<OpenHouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOpenHouse = async (data: Omit<OpenHouse, 'id' | 'currentAttendees'>) => {
    try {
      setLoading(true);
      setError(null);
      const newOpenHouse = await openHouseService.createOpenHouse(data);
      setOpenHouses(prev => [...prev, newOpenHouse]);
      return newOpenHouse;
    } catch (err) {
      console.error('Error creating open house:', err);
      setError(err instanceof Error ? err.message : 'Failed to create open house');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    openHouses,
    loading,
    error,
    createOpenHouse
  };
}
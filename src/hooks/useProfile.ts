import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../services/supabase';
import { syncExistingProfile } from '../services/auth/syncProfile';
import type { AuthUser } from '../types/auth';

export function useProfile() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.id) throw new Error('User not authenticated');

      // Filter out null/undefined values
      const validUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, value]) => value !== null && value !== undefined)
      );

      const { error: updateError } = await supabase
        .from(user.role === 'agent' ? 'agent_profiles' : 'client_profiles')
        .update(validUpdates)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      updateUser(validUpdates);
      return true;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const syncProfile = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      await syncExistingProfile(user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from(user.role === 'agent' ? 'agent_profiles' : 'client_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Filter out null/undefined values
      const validProfile = Object.fromEntries(
        Object.entries(profile).filter(([_, value]) => value !== null && value !== undefined)
      );

      updateUser({
        ...user,
        ...validProfile
      });
    } catch (err) {
      console.error('Profile sync error:', err);
      setError(err instanceof Error ? err.message : 'Failed to sync profile');
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProfile,
    syncProfile,
    loading,
    error
  };
}
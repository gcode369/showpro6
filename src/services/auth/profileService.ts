import { supabase } from '../supabase';
import type { UserRole } from '../../types/auth';
import type { AgentProfile, ClientProfile } from './types';

export async function getUserProfile(userId: string, role: UserRole): Promise<AgentProfile | ClientProfile> {
  const profileTable = role === 'agent' ? 'agent_profiles' : 'client_profiles';
  
  try {
    // First ensure profile exists
    await ensureProfileExists(userId, role);

    const { data: profile, error } = await supabase
      .from(profileTable)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return profile;
  } catch (err) {
    console.error('Profile fetch error:', err);
    throw err;
  }
}

async function ensureProfileExists(userId: string, role: UserRole) {
  const table = role === 'agent' ? 'agent_profiles' : 'client_profiles';
  
  const { data: existing } = await supabase
    .from(table)
    .select('user_id')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    const profileData = {
      user_id: userId,
      name: '',
      areas: [],
      ...(role === 'agent' && {
        languages: [],
        certifications: [],
        subscription_status: 'trial',
        subscription_tier: 'basic'
      })
    };

    const { error: createError } = await supabase
      .from(table)
      .insert(profileData);

    if (createError) throw createError;
  }
}
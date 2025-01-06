import { supabase } from '../supabase';

export async function syncExistingProfile(userId: string) {
  try {
    // Get user metadata
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const role = user?.user_metadata?.role || 'client';
    const table = role === 'agent' ? 'agent_profiles' : 'client_profiles';

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .single();

    // Create or update profile
    const { error: updateError } = await supabase
      .from(table)
      .upsert({
        user_id: userId,
        name: existingProfile?.name || user?.user_metadata?.name || '',
        areas: existingProfile?.areas || [],
        languages: existingProfile?.languages || [],
        certifications: existingProfile?.certifications || [],
        ...(role === 'agent' && {
          subscription_status: existingProfile?.subscription_status || 'trial',
          subscription_tier: existingProfile?.subscription_tier || 'basic'
        })
      });

    if (updateError) throw updateError;
    return true;
  } catch (err) {
    console.error('Profile sync error:', err);
    throw err;
  }
}
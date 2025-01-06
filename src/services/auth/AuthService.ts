import { supabase } from '../supabase';
import { getUserProfile } from './profileService';
import type { AuthUser, UserRegistrationData } from '../../types/auth';

export class AuthService {
  async register(email: string, password: string, data: UserRegistrationData): Promise<{ user: AuthUser }> {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: data.name,
            role: data.role
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('Registration failed - no user created');

      // Create profile
      const { error: profileError } = await supabase
        .from(data.role === 'agent' ? 'agent_profiles' : 'client_profiles')
        .insert({
          user_id: authData.user.id,
          name: data.name,
          phone: data.phone,
          areas: data.areas || [],
          languages: data.languages || [],
          certifications: data.certifications || [],
          ...(data.role === 'agent' && {
            subscription_status: 'trial',
            subscription_tier: 'basic'
          })
        });

      if (profileError) throw profileError;

      return {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          name: data.name,
          role: data.role,
          phone: data.phone,
          areas: data.areas || [],
          languages: data.languages || [],
          certifications: data.certifications || [],
          subscriptionStatus: data.role === 'agent' ? 'trial' : undefined,
          subscriptionTier: data.role === 'agent' ? 'basic' : undefined
        }
      };
    } catch (err) {
      console.error('Registration error:', err);
      throw err;
    }
  }

  async login(email: string, password: string): Promise<{ user: AuthUser }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    if (!data.session?.user) throw new Error('Login failed - no session created');

    const userRole = data.session.user.user_metadata.role || 'client';
    const profile = await getUserProfile(data.session.user.id, userRole);

    const user: AuthUser = {
      id: data.session.user.id,
      email: data.session.user.email!,
      name: profile.name,
      role: userRole,
      phone: profile.phone,
      areas: profile.areas || [],
      languages: profile.languages || [],
      certifications: profile.certifications || [],
      subscriptionStatus: 'subscription_status' in profile ? profile.subscription_status : undefined,
      subscriptionTier: 'subscription_tier' in profile ? profile.subscription_tier : undefined
    };

    return { user };
  }
}

export const authService = new AuthService();
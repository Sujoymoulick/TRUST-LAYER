import { createClient } from '@supabase/supabase-js';

// Type definitions for the trust_records table
export type VerificationStatus = 'pending' | 'verified' | 'failed';

export interface TrustRecord {
  id?: string;
  created_at?: string;
  identity_hash: string;
  verification_status: VerificationStatus;
  metadata?: Record<string, any>;
}

// Database schema for Supabase
export interface Database {
  public: {
    Tables: {
      trust_records: {
        Row: TrustRecord;
        Insert: Omit<TrustRecord, 'id' | 'created_at'>;
        Update: Partial<Omit<TrustRecord, 'id' | 'created_at'>>;
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: 'user' | 'admin';
          plan?: string | null;
          status?: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string;
          action_type: string;
          target_user_id: string | null;
          details: Record<string, any> | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['admin_audit_log']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['admin_audit_log']['Row']>;
      };
    };
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please check your .env file.');
}

// Only initialize if we have a URL, otherwise use a proxy to provide a clear error message
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : new Proxy({}, {
      get: (_target, _prop) => {
        // Handle 'auth' or any other nested access
        return new Proxy({}, {
          get: () => {
            console.error('Supabase Error: Client not initialized. Check your .env file.');
            return () => alert('Supabase is not connected. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file and restart the server.');
          }
        });
      }
    }) as any;


/**
 * Antigravity Protocol Verification Mock
 * In a real scenario, this would interact with the Antigravity protocol
 */
async function verifyWithAntigravity(identityHash: string): Promise<boolean> {
  console.log(`[Antigravity] Verifying hash: ${identityHash}...`);
  // Simulate network latency/protocol processing
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Basic validation logic (for demo purposes)
  return identityHash.length > 0;
}

/**
 * Wrapper for logging trust transactions with Antigravity verification
 */
export async function logTrustTransaction(identityHash: string, metadata: Record<string, any> = {}) {
  try {
    // 1. Log initial transaction in Supabase with 'pending' status
    const { data: record, error: insertError } = await supabase
      .from('trust_records')
      .insert({
        identity_hash: identityHash,
        verification_status: 'pending',
        metadata
      })
      .select()
      .single();

    if (insertError) throw insertError;
    if (!record) throw new Error('Failed to create trust record');

    console.log(`[Supabase] Transaction logged: ${record.id}`);

    // 2. Verify via Antigravity Protocol
    const isVerified = await verifyWithAntigravity(identityHash);
    const finalStatus: VerificationStatus = isVerified ? 'verified' : 'failed';

    // 3. Update Supabase record with final verification status
    const { error: updateError } = await supabase
      .from('trust_records')
      .update({ verification_status: finalStatus })
      .eq('id', record.id);

    if (updateError) throw updateError;

    return {
      id: record.id,
      status: finalStatus,
      verified: isVerified
    };
  } catch (error) {
    console.error('Error in logTrustTransaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

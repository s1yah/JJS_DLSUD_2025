import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Received Camlytics data:', JSON.stringify(body));

    const { channel_id, channel_name, rule_name, event_time } = body;

    // Only process Enter or Exit events
    if (rule_name !== 'Enter' && rule_name !== 'Exit') {
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored (not Enter/Exit)' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current counts for this channel
    const { data: existing, error: fetchError } = await supabase
      .from('passenger_counts')
      .select('*')
      .eq('channel_id', channel_id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching passenger count:', fetchError);
      throw fetchError;
    }

    let newCount = 0;
    let totalEnters = 0;
    let totalExits = 0;

    if (existing) {
      totalEnters = existing.total_enters;
      totalExits = existing.total_exits;
    }

    // Update counts based on rule_name
    if (rule_name === 'Enter') {
      totalEnters += 1;
    } else if (rule_name === 'Exit') {
      totalExits += 1;
    }

    // Calculate current count (Enter - Exit), minimum 0
    newCount = Math.max(0, totalEnters - totalExits);

    // Upsert the passenger count
    const { error: upsertError } = await supabase
      .from('passenger_counts')
      .upsert({
        channel_id,
        channel_name,
        current_count: newCount,
        total_enters: totalEnters,
        total_exits: totalExits,
        last_event_time: event_time,
      }, {
        onConflict: 'channel_id'
      });

    if (upsertError) {
      console.error('Error upserting passenger count:', upsertError);
      throw upsertError;
    }

    console.log(`Updated passenger count: Enter=${totalEnters}, Exit=${totalExits}, Current=${newCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Data received and processed',
        current_count: newCount,
        total_enters: totalEnters,
        total_exits: totalExits
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process request' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

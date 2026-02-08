import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THINGSBOARD_JWT = Deno.env.get('THINGSBOARD_JWT');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!THINGSBOARD_JWT) {
      throw new Error('THINGSBOARD_JWT environment variable is not configured');
    }

    console.log('Fetching data from ThingsBoard API...');
    
    const response = await fetch(
      'https://demo.thingsboard.io/api/plugins/telemetry/DEVICE/458fd2c0-889a-11f0-8c95-7536037a85df/values/timeseries?keys=latitude%2Clongitude%2CpeopleCount&useStrictDataTypes=false',
      {
        headers: {
          'Authorization': `Bearer ${THINGSBOARD_JWT}`,
        },
      }
    );

    if (!response.ok) {
      console.error('ThingsBoard API error:', response.status);
      throw new Error(`Failed to fetch bus data`);
    }

    const thingsboardData = await response.json();
    console.log('Successfully fetched data from ThingsBoard');

    // Fetch passenger count from Camlytics data in database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: passengerData, error: passengerError } = await supabase
      .from('passenger_counts')
      .select('current_count, total_enters, total_exits')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (passengerError) {
      console.error('Error fetching passenger count:', passengerError);
    }

    // Use Camlytics count if available, otherwise fall back to ThingsBoard
    const camlyticsCount = passengerData?.current_count ?? null;
    
    // Replace peopleCount with Camlytics data if available
    if (camlyticsCount !== null) {
      console.log(`Using Camlytics passenger count: ${camlyticsCount} (Enter: ${passengerData?.total_enters}, Exit: ${passengerData?.total_exits})`);
      thingsboardData.peopleCount = [{ 
        ts: Date.now(), 
        value: camlyticsCount.toString() 
      }];
    }

    return new Response(JSON.stringify(thingsboardData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in thingsboard-proxy:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch bus data'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THINGSBOARD_JWT = Deno.env.get('THINGSBOARD_JWT');

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

    const data = await response.json();
    console.log('Successfully fetched data from ThingsBoard');

    return new Response(JSON.stringify(data), {
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

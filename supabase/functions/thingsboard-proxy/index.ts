const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THINGSBOARD_JWT = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhcGl1c2VyQGdtYWlsLmNvbSIsInVzZXJJZCI6IjBhZjcwOWQwLWJjNmItMTFmMC05ZGFjLWYxNGFhN2Y3NTU5ZiIsInNjb3BlcyI6WyJDVVNUT01FUl9VU0VSIl0sInNlc3Npb25JZCI6IjFjNzIwZmFmLTQ3Y2QtNGQxNS04MmJjLWY2ODkzNDQzY2Q0MyIsImV4cCI6MTc2NDQwNDk1NCwiaXNzIjoidGhpbmdzYm9hcmQuaW8iLCJpYXQiOjE3NjI2MDQ5NTQsImZpcnN0TmFtZSI6IkFQSSIsImxhc3ROYW1lIjoiVXNlciIsImVuYWJsZWQiOnRydWUsInByaXZhY3lQb2xpY3lBY2NlcHRlZCI6ZmFsc2UsImlzUHVibGljIjpmYWxzZSwidGVuYW50SWQiOiIwMjcxOGQxMC04MGZlLTExZjAtYTliNS03OTJlMjE5NGE1ZDQiLCJjdXN0b21lcklkIjoiMDQ5YTg3OTAtODBmZS0xMWYwLWE5YjUtNzkyZTIxOTRhNWQ0In0.OCGyYppcDJhm1pmmyJNz6Ma0iZymLVAGs74MxbxbdO4u_tdvlzvcf6IQvjEtrEONKDMBiEe2T3QW3-Vxf0riJQ';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      const errorText = await response.text();
      console.error('ThingsBoard API error:', response.status, errorText);
      throw new Error(`ThingsBoard API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('Successfully fetched data from ThingsBoard');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in thingsboard-proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch bus data';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: String(error)
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

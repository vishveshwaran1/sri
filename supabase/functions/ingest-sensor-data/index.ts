import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing x-api-key header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate API key and get device
    const { data: keyRecord, error: keyError } = await supabase
      .from("device_api_keys")
      .select("device_id")
      .eq("api_key", apiKey)
      .single();

    if (keyError || !keyRecord) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deviceId = keyRecord.device_id;
    const body = await req.json();

    const { voltage = 0, current = 0, power = 0, ldr = 0, pir = 0 } = body;

    // Calculate energy (rough: power * interval in hours, assume ~5s between readings)
    const energyKwh = (power / 1000) * (5 / 3600);

    // Insert sensor reading
    const { error: insertError } = await supabase.from("sensor_readings").insert({
      device_id: deviceId,
      voltage,
      current,
      power,
      ldr,
      pir,
      energy_kwh: energyKwh,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to insert reading" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update device status to online
    await supabase
      .from("devices")
      .update({ status: "online" })
      .eq("id", deviceId);

    // Detect theft: high current but very low/no power, or very high current spike
    let alertType: string | null = null;
    let alertSeverity = "medium";
    let alertMessage = "";

    if (current > 5 && power < 50) {
      alertType = "theft";
      alertSeverity = "critical";
      alertMessage = `Suspected theft: High current (${current}A) but low power (${power}W). Possible bypass detected.`;
    } else if (power > 5000) {
      alertType = "anomaly";
      alertSeverity = "high";
      alertMessage = `Abnormal power spike: ${power}W detected. Check for unauthorized load.`;
    }

    // Detect wastage: power on but no motion (PIR=0) and high light (LDR high = bright, lights might be on unnecessarily)
    if (!alertType && pir === 0 && ldr > 800 && power > 100) {
      alertType = "wastage";
      alertSeverity = "medium";
      alertMessage = `Energy wastage: Power (${power}W) active with high ambient light (LDR: ${ldr}) and no motion detected.`;
    }

    if (alertType) {
      await supabase.from("alerts").insert({
        device_id: deviceId,
        type: alertType,
        severity: alertSeverity,
        message: alertMessage,
      });

      // Update device status to alert if theft
      if (alertType === "theft") {
        await supabase
          .from("devices")
          .update({ status: "alert" })
          .eq("id", deviceId);
      }
    }

    return new Response(
      JSON.stringify({ success: true, device_id: deviceId, alert: alertType }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import { serve } from "https://deno.land/std@0.177.0/http/server.ts"

const BACKEND_URL = Deno.env.get("BACKEND_URL") || "http://localhost:5000";
const SYSTEM_API_KEY = Deno.env.get("SYSTEM_API_KEY") || "";

serve(async (req) => {
  // Handle CORS preflight headers
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { to, templateName, variables } = await req.json();

    if (!to || !templateName) {
      return new Response(
        JSON.stringify({ error: "Required params 'to' and 'templateName' are missing." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    console.log(`[Edge Function] Dispatching email to: <${to}>, template: "${templateName}"`);

    // Relay the dispatch call securely to the Express backend
    const response = await fetch(`${BACKEND_URL}/api/v1/emails/send-test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SYSTEM_API_KEY}`,
      },
      body: JSON.stringify({ to, templateName, variables }),
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { message: responseText };
    }

    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("[Edge Function Exception]:", err.message || err);
    return new Response(
      JSON.stringify({ error: err.message || "Edge function compilation or fetch execution failed." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }
});

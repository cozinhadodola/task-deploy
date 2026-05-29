import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const WAHA_URL = Deno.env.get("WAHA_URL")!;
const WAHA_API_KEY = Deno.env.get("WAHA_API_KEY")!;
const WAHA_SESSION = Deno.env.get("WAHA_SESSION") ?? "andredola";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { telefone } = await req.json();
    if (!telefone) {
      return new Response(JSON.stringify({ error: "telefone obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Limpa o número: remove tudo que não for dígito
    const numero = telefone.replace(/\D/g, "");
    if (numero.length < 10) {
      return new Response(JSON.stringify({ exists: false, error: "Número inválido" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const pn = `${numero}@c.us`;

    // Verifica se existe no WhatsApp
    const checkRes = await fetch(
      `${WAHA_URL}/api/contacts/check-exists?session=${WAHA_SESSION}&phone=${encodeURIComponent(pn)}`,
      { headers: { "X-Api-Key": WAHA_API_KEY } }
    );
    const checkData = await checkRes.json();

    if (!checkData.numberExists) {
      return new Response(JSON.stringify({ exists: false, pn: null, lid: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca detalhes do contato para tentar obter lid
    let lid: string | null = null;
    try {
      const contactRes = await fetch(
        `${WAHA_URL}/api/contacts?session=${WAHA_SESSION}&contactId=${encodeURIComponent(pn)}`,
        { headers: { "X-Api-Key": WAHA_API_KEY } }
      );
      const contactData = await contactRes.json();
      lid = contactData.lid ?? null;
    } catch (_) {}

    return new Response(JSON.stringify({ exists: true, pn, lid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

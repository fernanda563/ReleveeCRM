import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderData {
  id: string;
  custom_id: string | null;
  clients: {
    nombre: string;
    apellido: string;
    email: string;
  };
  precio_venta: number;
  importe_anticipo: number;
  forma_pago: string;
  estatus_pago: string;
  metal_tipo: string;
  metal_pureza: string | null;
  metal_color: string | null;
  piedra_tipo: string;
  tipo_accesorio: string | null;
  talla: number | null;
  fecha_entrega_esperada: string | null;
  diamante_forma: string | null;
  diamante_quilataje: number | null;
  diamante_color: string | null;
  diamante_claridad: string | null;
  diamante_corte: string | null;
  notas: string | null;
  signature_status: string | null;
  signature_request_id: string | null;
  signed_document_url: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const dropboxSignApiKey = Deno.env.get('DROPBOX_SIGN_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!dropboxSignApiKey) {
      throw new Error('DROPBOX_SIGN_API_KEY no está configurado');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { orderId, pdfUrl } = await req.json();

    if (!orderId || !pdfUrl) {
      return new Response(
        JSON.stringify({ error: 'orderId y pdfUrl son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Obteniendo información de la orden:', orderId);

    // Get order data with client info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        clients (
          nombre,
          apellido,
          email
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error obteniendo orden:', orderError);
      return new Response(
        JSON.stringify({ error: 'Orden no encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orderData = order as unknown as OrderData;

    // Check if already sent
    if (orderData.signature_status === 'pending' || orderData.signature_status === 'signed') {
      return new Response(
        JSON.stringify({ 
          error: orderData.signature_status === 'signed' 
            ? 'Esta orden ya está firmada' 
            : 'Esta orden ya fue enviada a firmar' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Preparando documento para enviar a Dropbox Sign');
    console.log('PDF URL:', pdfUrl);

    // Prepare document title
    const documentTitle = `Orden de Compra - ${orderData.custom_id || orderData.id.slice(0, 8)}`;

    // Send signature request to Dropbox Sign
    const dropboxResponse = await fetch('https://api.hellosign.com/v3/signature_request/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(dropboxSignApiKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        test_mode: 1, // Set to 1 for testing, 0 for production
        title: documentTitle,
        subject: `Firma de Orden de Compra - ${orderData.clients.nombre} ${orderData.clients.apellido}`,
        message: 'Por favor firma este documento para confirmar tu orden de compra de joyería personalizada.',
        signers: [
          {
            email_address: orderData.clients.email,
            name: `${orderData.clients.nombre} ${orderData.clients.apellido}`,
            order: 0,
          },
        ],
        file_url: [pdfUrl],
        signing_redirect_url: `${supabaseUrl}/orders`,
      }),
    });

    if (!dropboxResponse.ok) {
      const errorText = await dropboxResponse.text();
      console.error('Error de Dropbox Sign:', errorText);
      return new Response(
        JSON.stringify({ error: 'Error al enviar documento a Dropbox Sign', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const dropboxData = await dropboxResponse.json();
    console.log('Respuesta de Dropbox Sign:', dropboxData);

    const signatureRequestId = dropboxData.signature_request?.signature_request_id;

    if (!signatureRequestId) {
      console.error('No se recibió signature_request_id');
      return new Response(
        JSON.stringify({ error: 'Error inesperado de Dropbox Sign' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order with signature request info
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        signature_request_id: signatureRequestId,
        signature_status: 'pending',
        signature_sent_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error actualizando orden:', updateError);
      return new Response(
        JSON.stringify({ error: 'Error actualizando estado de la orden' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Documento enviado exitosamente');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Documento enviado a firmar exitosamente',
        signatureRequestId 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en send-to-sign:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

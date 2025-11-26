import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle Dropbox Sign verification request (usually GET)
  if (req.method === 'GET') {
    console.log('Solicitud GET recibida - verificación de Dropbox Sign');
    return new Response('Hello API Event Received', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const dropboxSignApiKey = Deno.env.get('DROPBOX_SIGN_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Dropbox Sign envía webhooks como multipart/form-data con un campo 'json'
    const formData = await req.formData();
    const jsonString = formData.get('json');
    
    if (!jsonString || typeof jsonString !== 'string') {
      console.log('No se encontró campo json en form-data - probablemente una prueba');
      return new Response('Hello API Event Received', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const body = JSON.parse(jsonString);
    console.log('Webhook recibido de Dropbox Sign:', JSON.stringify(body, null, 2));

    // If no event data, it's a test ping
    if (!body || !body.event) {
      console.log('No se encontró estructura de evento - probablemente una prueba');
      return new Response('Hello API Event Received', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const event = body.event;
    const eventType = event.event_type;
    const signatureRequest = body.signature_request;

    if (!signatureRequest) {
      console.error('No se encontró signature_request en el evento');
      return new Response('OK', { status: 200 });
    }

    const signatureRequestId = signatureRequest.signature_request_id;

    console.log('Evento tipo:', eventType);
    console.log('Signature Request ID:', signatureRequestId);

    // Buscar la orden usando signature_request_id
    const { data: order, error: findError } = await supabase
      .from('orders')
      .select('id')
      .eq('signature_request_id', signatureRequestId)
      .maybeSingle();

    if (findError) {
      console.error('Error buscando orden:', findError);
      return new Response('OK', { status: 200 });
    }

    if (!order) {
      console.error('No se encontró orden con signature_request_id:', signatureRequestId);
      return new Response('OK', { status: 200 });
    }

    const orderId = order.id;
    console.log('Orden encontrada:', orderId);

    // Handle different event types
    switch (eventType) {
      case 'signature_request_signed':
      case 'signature_request_all_signed': {
        console.log('Todos los firmantes han firmado');
        
        try {
          // Descargar el PDF firmado desde Dropbox Sign
          console.log('Descargando documento firmado...');
          const filesResponse = await fetch(
            `https://api.hellosign.com/v3/signature_request/files/${signatureRequestId}`,
            {
              headers: {
                'Authorization': `Basic ${btoa(dropboxSignApiKey + ':')}`,
              },
            }
          );

          if (!filesResponse.ok) {
            throw new Error(`Error descargando PDF: ${filesResponse.status}`);
          }

          const pdfBlob = await filesResponse.blob();
          const pdfArrayBuffer = await pdfBlob.arrayBuffer();
          
          // Subir el PDF firmado a Supabase Storage
          const signedFileName = `signed-${signatureRequestId}.pdf`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('payment-receipts')
            .upload(`signed-documents/${signedFileName}`, pdfArrayBuffer, {
              contentType: 'application/pdf',
              upsert: true,
            });

          if (uploadError) {
            console.error('Error subiendo PDF firmado:', uploadError);
            throw uploadError;
          }

          // Obtener URL pública del documento firmado
          const { data: urlData } = supabase.storage
            .from('payment-receipts')
            .getPublicUrl(`signed-documents/${signedFileName}`);

          const signedDocumentUrl = urlData.publicUrl;
          console.log('PDF firmado subido:', signedDocumentUrl);

          // Actualizar la orden con la URL del documento firmado
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              signature_status: 'signed',
              signed_document_url: signedDocumentUrl,
              signature_completed_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (updateError) {
            console.error('Error actualizando orden:', updateError);
          } else {
            console.log('Orden actualizada exitosamente como firmada');
          }
        } catch (error) {
          console.error('Error procesando documento firmado:', error);
        }
        break;
      }

      case 'signature_request_declined': {
        console.log('El firmante rechazó la solicitud');
        
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            signature_status: 'declined',
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error actualizando orden:', updateError);
        } else {
          console.log('Orden actualizada como rechazada');
        }
        break;
      }

      case 'signature_request_sent': {
        console.log('Solicitud de firma enviada');
        // Already handled in send-to-sign function
        break;
      }

      default:
        console.log('Evento no manejado:', eventType);
    }

    // Always return 200 OK to Dropbox Sign for real events
    return new Response('OK', { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' } 
    });

  } catch (error) {
    console.log('Error procesando webhook:', error);
    // Return 200 para que Dropbox Sign no reintente
    return new Response('Hello API Event Received', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
});

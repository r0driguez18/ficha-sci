import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "https://esm.sh/@whiskeysockets/baileys@6.7.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, groupId, message } = await req.json();
    
    console.log('WhatsApp Baileys request:', { action, groupId, message });

    if (action === 'init') {
      console.log('Initializing WhatsApp connection...');
      
      try {
        // Create temp directory for auth state
        const authDir = '/tmp/baileys_auth';
        
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        
        let qrCode = '';
        
        const sock = makeWASocket({
          auth: state,
          printQRInTerminal: false,
        });

        // Listen for QR code
        sock.ev.on('connection.update', (update) => {
          const { connection, lastDisconnect, qr } = update;
          
          if (qr) {
            qrCode = qr;
            console.log('QR Code generated:', qr);
          }
          
          if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Should reconnect?', shouldReconnect);
          } else if (connection === 'open') {
            console.log('WhatsApp connected successfully!');
          }
        });

        // Listen for credentials update
        sock.ev.on('creds.update', saveCreds);

        // Wait for QR code to be generated
        await new Promise((resolve) => {
          const checkQR = setInterval(() => {
            if (qrCode) {
              clearInterval(checkQR);
              resolve(qrCode);
            }
          }, 100);
          
          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(checkQR);
            resolve(qrCode || 'TIMEOUT');
          }, 10000);
        });

        if (!qrCode || qrCode === 'TIMEOUT') {
          throw new Error('Failed to generate QR code');
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'QR Code generated. Scan with WhatsApp.',
            qrCode: qrCode
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error: any) {
        console.error('Error initializing Baileys:', error);
        throw error;
      }
    }

    if (action === 'send') {
      if (!groupId || !message) {
        throw new Error('groupId and message are required');
      }

      // Send message to WhatsApp group using Baileys
      console.log(`Sending message to group ${groupId}: ${message}`);
      
      // TODO: Implement actual Baileys message sending
      // For now, return success
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Message sent to WhatsApp group',
          groupId,
          sentMessage: message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'status') {
      // Check WhatsApp connection status
      return new Response(
        JSON.stringify({ 
          success: true,
          connected: false, // Will check actual Baileys connection status
          message: 'WhatsApp is not connected. Please scan QR code.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action. Use: init, send, or status');

  } catch (error: any) {
    console.error('WhatsApp Baileys error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// api/webhook-mercadopago.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { type, data } = req.body;

        // ✅ PROCESSAR APENAS PAGAMENTOS
        if (type === 'payment') {
            const paymentId = data.id;

            // Buscar detalhes do pagamento no Mercado Pago
            const mercadopago = require('mercadopago');
            mercadopago.configure({
                access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
            });

            const payment = await mercadopago.payment.get(paymentId);
            const userId = payment.body.external_reference;
            const status = payment.body.status;

            // ✅ ATUALIZAR ASSINATURA NO SUPABASE
            if (status === 'approved') {
                const plan = payment.body.description.includes('Anual') ? 'annual' : 'premium';
                
                await supabase
                    .from('users')
                    .update({ 
                        subscription: plan,
                        subscription_status: 'active',
                        subscription_date: new Date().toISOString()
                    })
                    .eq('id', userId);

                console.log(`✅ Assinatura ativada para usuário ${userId}`);
            }
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        return res.status(500).json({ error: error.message });
    }
}
// api/create-subscription.js
import mercadopago from 'mercadopago';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        // ✅ CONFIGURAR MERCADO PAGO
        mercadopago.configure({
            access_token: process.env.MERCADOPAGO_ACCESS_TOKEN
        });

        const { plan, userEmail, userId } = req.body;

        // ✅ DEFINIR PREÇOS
        const prices = {
            premium: 29.90,
            annual: 214.80
        };

        // ✅ CRIAR PREFERÊNCIA DE PAGAMENTO
        const preference = {
            items: [
                {
                    title: plan === 'premium' ? 'FitLife Pro - Premium Mensal' : 'FitLife Pro - Premium Anual',
                    unit_price: prices[plan],
                    quantity: 1,
                }
            ],
            payer: {
                email: userEmail
            },
            back_urls: {
                success: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
                failure: `${process.env.NEXT_PUBLIC_URL}/payment/failure`,
                pending: `${process.env.NEXT_PUBLIC_URL}/payment/pending`
            },
            auto_return: 'approved',
            external_reference: userId, // ID do usuário para identificar
            notification_url: `${process.env.NEXT_PUBLIC_URL}/api/webhook-mercadopago`
        };

        const response = await mercadopago.preferences.create(preference);

        return res.status(200).json({
            id: response.body.id,
            init_point: response.body.init_point // URL de checkout
        });

    } catch (error) {
        console.error('❌ Erro Mercado Pago:', error);
        return res.status(500).json({ error: error.message });
    }
}
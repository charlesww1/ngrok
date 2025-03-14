// const express = require('express');
// const bodyParser = require('body-parser');

// const app = express();
// const PORT = process.env.PORT || 3000;

// const VERIFY_TOKEN = '2qaqxlJIL7xzjVzn2FS80qgJpLA_5uCQhKdeb5xfpaA98gf9P';

// app.use(bodyParser.json());

// app.get('/webhook', (req, res) => {
//     const mode = req.query['hub.mode'];
//     const token = req.query['hub.verify_token'];
//     const challenge = req.query['hub.challenge'];

//     if (mode && token === VERIFY_TOKEN) {
//         console.log('WEBHOOK VERIFICADO!');
//         res.status(200).send(challenge);
//     } else {
//         res.status(403).send('Falha na verificação');
//     }
// });

// // https://571e-45-232-7-169.ngrok-free.app/webhook?hub.mode=subscribe&hub.verify_token=2qaqxlJIL7xzjVzn2FS80qgJpLA_5uCQhKdeb5xfpaA98gf9P&hub.challenge=12345

// app.post('/webhook', (req, res) => { 
//     const body = req.body;

//     if (body.object === 'whatsapp_business_account') {
//         console.log('Mensagem recebida:', JSON.stringify(body, null, 2));
//         res.sendStatus(200);
//     } else {
//         res.sendStatus(404);
//     }
// });

// app.listen(PORT, () => {
//     console.log(`Servidor rodando na porta ${PORT}`);
// });


const axios = require('axios');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const PHONE_ID = process.env.PHONE_ID;
const API_URL = `https://graph.facebook.com/v17.0/${PHONE_ID}/messages`;

async function sendMessage(to, message, buttons = null) {
    const data = {
        messaging_product: 'whatsapp',
        to,
        type: buttons ? 'interactive' : 'text',
    };

    if (buttons) {
        data.interactive = {
            type: 'button',
            body: { text: message },
            action: {
                buttons: buttons.map((button, index) => ({
                    type: 'reply',
                    reply: { id: `btn_${index}`, title: button },
                })),
            },
        };
    } else {
        data.text = { body: message };
    }

    try {
        const response = await axios.post(API_URL, data, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${TOKEN}`,
            },
        });
        console.log('Mensagem enviada:', response.data);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
    }
}

module.exports = { sendMessage };

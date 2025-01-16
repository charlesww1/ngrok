const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

const VERIFY_TOKEN = '2qaqxlJIL7xzjVzn2FS80qgJpLA_5uCQhKdeb5xfpaA98gf9P';

app.use(bodyParser.json());

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
        console.log('WEBHOOK VERIFICADO!');
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Falha na verificação');
    }
});

// https://571e-45-232-7-169.ngrok-free.app/webhook?hub.mode=subscribe&hub.verify_token=2qaqxlJIL7xzjVzn2FS80qgJpLA_5uCQhKdeb5xfpaA98gf9P&hub.challenge=12345

app.post('/webhook', (req, res) => { 
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        console.log('Mensagem recebida:', JSON.stringify(body, null, 2));
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

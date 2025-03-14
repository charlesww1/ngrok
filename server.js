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



const express = require('express');
const bodyParser = require('body-parser');
const { sendMessage } = require('../app/ngrok');

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = '2qaqxlJIL7xzjVzn2FS80qgJpLA_5uCQhKdeb5xfpaA98gf9P';

const userSessions = {};

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

app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
        const messages = body.entry?.[0]?.changes?.[0]?.value?.messages;

        if (messages) {
            for (const message of messages) {
                const from = message.from;
                const userInput = message.text?.body || message.button?.text || message?.interactive?.button_reply?.title || '';

                if (!userSessions[from]) {
                    userSessions[from] = { step: 1, data: {} };
                }

                const session = userSessions[from];
                const { reply, buttons } = await handleConversation(session, userInput, from);

                await sendMessage(from, reply, buttons);
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

let medicineCreated = []

async function handleConversation(session, userInput, from) {
    switch (session.step) {
        case 1:
            session.step++;
            return {
                reply: 'Olá, o que você gostaria de fazer?',
                buttons: ['Add medicamento', 'List medicamento', 'Sair'],
            };
        case 2:
            switch (userInput) {
                case 'Add medicamento':
                    session.step = 3;
                    return {
                        reply: 'Qual o nome do medicamento?',
                        buttons: null,
                    };
                case 'List medicamento':
                    // session.step = 100;
                    // return {
                    //     reply: 'Aqui está a lista de medicamentos registrados:',
                    //     buttons: ['Sair'],
                    // };
                    // const medicines = Object.entries(userSessions[from]?.data || {}).map(([key, value]) => {
                    //     // ${key}: ${value}`);
                    //     return {
                    //         Medicamento: `${key === 'medicineName'} ? ${value}`,
                    //         Medicamento: `${value}`,
                    //     }
                    // });

                    console.log('userSessions', userSessions)
                    console.log('from', from)
                    const medicines = {
                        Medicamento: userSessions[from]?.data.medicineName,
                        Dosagem: userSessions[from]?.data.medicineMl,
                        Dias: userSessions[from]?.data.medicineQtdDays,
                    }
                    console.log('medicines', medicines)

                    return {
                        reply: medicines.Medicamento !== undefined
                            ? `Medicamentos registrados:
                            \nMedicamento: ${medicines.Medicamento}
                            \nDosagem: ${medicines.Dosagem}
                            \nDias: ${medicines.Dias}`
                            : 'Nenhum medicamento registrado.',
                        buttons: ['Sair'],
                    };
                case 'Sair':
                    session.step = 1;
                    return {
                        reply: 'Atendimento finalizado! Caso precise de algo, é só chamar novamente.',
                        buttons: null,
                    };
                default:
                    session.step = 1;
                    return {
                        reply: 'Opção inválida. Vamos começar de novo.',
                        buttons: ['Add medicamento', 'List medicamento', 'Sair'],
                    };
            }
        case 3:
            session.data.medicineName = userInput;
            session.step = 4;
            return {
                reply: `Quantos ml você tem que tomar do medicamento "${session.data.medicineName}"?`,
                buttons: null,
            };
        case 4:
            session.data.medicineMl = userInput;
            session.step = 5;
            return {
                reply: 'Por quantos dias vai tomar esse medicamento?',
                buttons: null,
            };
        case 5:
            session.data.medicineQtdDays = userInput;
            session.step = 6;
            return {
                reply: `Você tem certeza que quer criar o medicamento "${session.data.medicineName}", com dosagem de ${session.data.medicineMl} ml e com previsão para ser tomado em ${session.data.medicineQtdDays} dias?`,
                buttons: ['Confirmar', 'Cancelar'],
            };
        case 6:
        session.data.confirmToCreate = userInput;
            if(session.data.confirmToCreate === 'Confirmar'){
                session.step = 1;
                console.log('userSessions[from]?.data', userSessions);

                // medicineCreated.push(userSessions.data)
                return {
                    reply: `O medicamento "${session.data.medicineName}" foi registrado com sucesso!`,
                    // reply: `O medicamento "${session.data.medicineName}", com dosagem de ${session.data.medicineMl} ml e com previsão para ser tomado em ${session.data.medicineQtdDays} dias, foi registrado com sucesso!`,
                    // buttons: ['Add medicamento', 'List medicamento', 'Sair'],
                }
            } else if (session.data.confirmToCreate === 'Cancelar'){
                session.step = 1;
                session.step = 1;
                return {
                    reply: 'Criação do medicamento cancelada!',
                }
            } else {
                session.step = 6;
                return {
                    reply: 'Resposta invalida, por favor confirma ou cancela',
                    buttons: ['Confirmar', 'Cancelar'],
                }
            }
        case 100:
        // if(session.data.back){
        //     session.step = 1; // Volta para o início após listar
        // }
            // const medicines = Object.entries(userSessions[from]?.data || {}).map(
            //     ([key, value]) => `${key}: ${value}`
            // );
            return {
                reply: userSessions[from]?.data
                    // ? `Medicamentos registrados:\n${medicines.join('\n')}`
                    ? `${userSessions[from]?.data.medicineName}`
                    : 'Nenhum medicamento registrado.',
                buttons: ['Add medicamento', 'Sair'],
            };
        // case 200:
        //     session.step = 1;
        //     return {
        //         reply: 'Atendimento finalizado! Caso precise de algo, é só chamar novamente.',
        //         buttons: null,
        //     };
        default:
            session.step = 1;
            return {
                reply: 'Não entendi. Vamos começar de novo.',
                buttons: ['Add medicamento', 'List medicamento', 'Sair'],
            };
    }
}

app.listen(PORT, () => {
    console.log(`Servidor de Webhook rodando na porta ${PORT}`);
});

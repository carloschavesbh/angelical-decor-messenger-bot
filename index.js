const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'angelical_bot_token';
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Menu de opções
const MENU = `
*🎉 Bem-vindo à Angelical Decor!*

Escolha uma opção:

*1* - Ver promoções de *Colchões*
*2* - Ver *Sofás e Salas*
*3* - Ver *Camas Box e Quartos*
*4* - Falar com *Atendente*
*5* - Ver *Condições de Pagamento*
*#* - Voltar ao menu

Responda com o número da opção que deseja 👉
`;

// Respostas por categoria
const RESPONSES = {
  '1': `
*🛴 COLCHÕES - PROMOÇÕES*

Temos as melhores marcas com parcelamento facilitado:

💸 *Colchão Casal Espuma* - A partir de R$ 599
💸 *Colchão Casal Mola* - A partir de R$ 899
💸 *Colchão Solteiro* - A partir de R$ 399

✅ Entrega Rápida em BH, Ibirité, Contagem e região
✅ Parcelamento em até 12x

*Quer informações detalhadas?*
👉 Fale com um atendente digitando *4*
`,

  '2': `
*💺 SOFÁS E SALAS*

Coleção completa para sua sala:

💺 *Sofá 2 Lugares* - A partir de R$ 1.200
💺 *Sofá 3 Lugares* - A partir de R$ 1.599
💪 *Poltronas* - A partir de R$ 599

✅ Diversas cores e materiais
✅ Consulte disponibilidade

*Quer saber mais?*
👉 Fale com um atendente digitando *4*
`,

  '3': `
*🏠 CAMAS BOX E QUARTOS*

Móveis completos para seu quarto:

💸 *Cama Box Casal* - A partir de R$ 1.899
💸 *Cama Box Solteiro* - A partir de R$ 999
💪 *Guarda-roupas* - A partir de R$ 899

✅ Qualidade e durabilidade garantidas
✅ Até 12x parcelado

*Quer mais detalhes?*
👉 Fale com um atendente digitando *4*
`,

  '4': `
*👋 TRANSFERINDO PARA ATENDENTE...*

Você será transferido para um atendente em breve.

📞 Telefone: (31) 98637-6255
📧 Email: decorangelical@gmail.com

Um atendente logo entrará em contato! ✨
`,

  '5': `
*💳 CONDIÇÕES DE PAGAMENTO*

Oferecemos as melhores condições:

✅ *À Vista* - 10% de desconto
✅ *Débito* - Desconto de 5%
✅ *Crédito* - Até 3x sem juros
✅ *Parcelado* - Até 12x com juros

🏔 Financiamento disponível
🚚 Frete grátis para BH (acima de R$ 500)

*Dúvidas?*
👉 Fale com um atendente digitando *4*
`
};

// Webhook GET - Verificação do Facebook
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WEBHOOK VERIFICADO');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook POST - Recebe mensagens
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach((entry) => {
      const webhookEvent = entry.messaging[0];
      const senderPsid = webhookEvent.sender.id;

      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Função para processar mensagens
function handleMessage(senderPsid, messageObj) {
  let response;
  const messageText = messageObj.text ? messageObj.text.trim().toUpperCase() : '';

  console.log(`📨 Mensagem de ${senderPsid}: ${messageText}`);

  if (messageText === 'OI' || messageText === 'OLA' || messageText === 'MENU' || messageText === 'HELP') {
    response = MENU;
  } else if (RESPONSES[messageText]) {
    response = RESPONSES[messageText];
    if (messageText !== '4') {
      response += `\n\n${MENU}`;
    }
  } else if (messageText === '#') {
    response = MENU;
  } else {
    response = `
❌ Desculpe, não entendi sua mensagem.

Digite um número para escolher uma opção:

*1* - Colchões
*2* - Sofás e Salas
*3* - Camas Box
*4* - Falar com Atendente
*5* - Condições de Pagamento

Ou digite *MENU* para ver novamente 📋
    `;
  }

  callSendAPI(senderPsid, response);
}

// Função para enviar mensagens via Facebook API
function callSendAPI(senderPsid, message) {
  const requestBody = {
    recipient: {
      id: senderPsid,
    },
    message: {
      text: message,
    },
  };

  axios
    .post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      requestBody
    )
    .then((response) => {
      console.log(`✅ Mensagem enviada para ${senderPsid}`);
    })
    .catch((error) => {
      console.error(`❌ Erro ao enviar mensagem: ${error.message}`);
    });
}

app.listen(PORT, () => {
  console.log(`🚀 Bot Angelical Decor rodando na porta ${PORT}`);
});

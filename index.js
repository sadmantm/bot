// Importe as funções necessárias do wa-automate
const { create,sendButtons  } = require('@open-wa/wa-automate');
const burger = require('./burger');

// Função para iniciar a sessão e gerar o QR code
async function start() {
  // Cria uma instância do cliente
  const client = await create({ sessionId: "burger",
  authTimeout: 0, //wait only 60 seconds to get a connection with the host account device
  blockCrashLogs: true,
  disableSpins: true,
  headless: true,
  hostNotificationLang: 'PT_BR',
  logConsole: false,
  popup: true,
  qrTimeout: 0, //0 means it will wait forever for you to scan the qr code
});

  // Gera o QR code para autenticação
  client.onStateChanged((state) => {
    if (state === 'CONFLICT' || state === 'UNLAUNCHED') {
      client.forceRefocus();
    }
  });

  // Passa o objeto client para o burger.js
  burger(client);

  // Printa o log de mensagens e erros no console
  client.onAnyMessage((message) => {
    if (!message.fromMe && !message.isGroupMsg) {
    console.log("mensagem:", message.body, "de:", message.sender.pushname);
    }
  });
}
// Inicia a sessão do bot
start().catch(console.error);

const moment = require("moment");
const moments = moment();
const hora = moments.format("HHmm");
const dia = moments.format("DD");
const cardapio = require('./cardapio.js');
const { MessageTypes } = require("@open-wa/wa-automate");

module.exports = function (client) {
  const estadoUsuarios = {};

  // Escuta todas as mensagens recebidas
  client.onMessage(async (message) => {
    responderMensagem(client, message, estadoUsuarios);
  });
}

function recebeuMensagemPrivada(message) {
  const { isGroupMsg } = message;
  return !isGroupMsg;
}

// Função para responder às mensagens recebidas
async function responderMensagem(client, message, estadoUsuarios) {
  if (recebeuMensagemPrivada(message) && hora < "2330" && hora > "0900" && dia !== "Thursday") { 
    const { from } = message;
    await aguardarRespostaPedido(client, message, estadoUsuarios);

    if (recebeuMensagemPrivada(message) && hora > "2330" && hora < "0900" && dia !== "Thursday") {
      const { from } = message;
      await client.sendText(from, 'Obrigado por entrar em contato com a Lopes Burger, mas estamos fechados. Volte entre 09:00 e 23:30.');
    }
    if (recebeuMensagemPrivada(message) && dia === "Thursday") {
      const { from } = message;
      await client.sendText(from, 'Obrigado por entrar em contato com a Lopes Burger, mas estamos fechados às quintas-feiras. Volte amanhã.');
    }
  }
}

async function aguardarRespostaPedido(client, message, estadoUsuarios) {
  const { from } = message;
  let estadoUsuario = estadoUsuarios[from];
  if (message.body.toLowerCase().includes('cancela')) {
    await client.sendText(from, 'Ok, vamos cancelar o pedido...');
    delete estadoUsuarios[from];
    return;
  }

  if (!estadoUsuario) {
    // Primeira interação com o usuário
    estadoUsuario = {
      passo: 1,
      pedido1: '',
      pedido2: '',
      total1: 0,
      total2: 0,
      User: '',
      Endereco: ''
    };

    estadoUsuarios[from] = estadoUsuario;

    if (hora > "0700" && hora < "1200") {
      await client.sendText(from, 'Bom dia!, e bem-vindo(a) ao atendimento virtual da Lopes Burguer. 🍔 Agradecemos desde já o seu interesse e contato!');
    }
    if (hora > "1200" && hora < "1800") {
      await client.sendText(from, 'Boa tarde!, e bem-vindo(a) ao atendimento virtual da Lopes Burguer. 🍔 Agradecemos desde já o seu interesse e contato!');
    }
    if (hora > "1800" && hora < "2359") {
      await client.sendText(from, 'Boa noite!, e bem-vindo(a) ao atendimento virtual da Lopes Burguer. 🍔 Agradecemos desde já o seu interesse e contato!');
    }
    if (hora > "0000" && hora < "0700") {
      await client.sendText(from, 'Boa madrugada!, e bem-vindo(a) ao atendimento virtual da Lopes Burguer. 🍔 Agradecemos desde já o seu interesse e contato!');
    }
    setTimeout(async () => {
      await client.sendText(from, 'Primeiramente, você gostaria de fazer algum pedido? se sim, dejesa que seja diretamente pelo nosso site ou prefere fazer por aqui mesmo?');
    }, 500);
  } else {
    const { passo } = estadoUsuario;
    if (passo === 1) {
      if (message.body.toLowerCase().includes('site')) {
        // O usuário escolheu fazer o pedido pelo site
        await client.sendText(from, 'Ok, para fazer o pedido pelo site, acesse https://lopes-burguer.ola.click/');
        await client.sendText(from, 'Obrigado pela sua atenção e volte sempre.');
        delete estadoUsuarios[from];
      } else if (message.body.toLowerCase().includes('aqui') || message.body.toLowerCase().includes('aq')) {
        // O usuário escolheu fazer o pedido por ali mesmo
        await client.sendText(from, 'Certo, vou te ajudar com o pedido por aqui.');
        await client.sendText(from, 'Primeiramente, vou te enviar o cardápio para você escolher os seus itens.');
        setTimeout(async () => {
          await client.sendImage(from, './cardapio/1.jpg', 'hamburgers.jpg', 'Cardápio de hamburgers:');
          await client.sendImage(from, './cardapio/2.jpg', 'tapiocas.jpg', 'Cardápio de tapiocas, fritas, bebidas e especiais.');
          await client.sendImage(from, './cardapio/combo.jpg', 'combo.jpg', 'Combo *QUARTA FEIRA TURBINADA*');
          await client.sendText(from, ` Não se esqueça de enviar o nome do pedido e a quantidade corretamente.
*exemplo: 2 lopes salada e 2 refrigerante 2l*`);
        }, 1000);
        setTimeout(async() => {
          await client.sendText(from, `Se estiver com problemas ou deseja cancelar o pedido, digite "cancelar" sem as aspas.`);
        }, 9000);
        estadoUsuarios[from].passo = 2;
      }    


    } else if (passo === 2) {
      estadoUsuario.pedido1 = '';
      estadoUsuario.total1 = 0;
      await client.sendText(from, 'Certo, irei verificar no sistema...');
      const respostaUsuario = message.body.toLowerCase();
      const itensEncontrados = [];
    
      Object.keys(cardapio).forEach(async item => {
        const regex = new RegExp(`(?:\\d+\\s+)?${item.replace('_', ' ').toLowerCase()}`, 'g');
        const matches = respostaUsuario.matchAll(regex);
        for (const match of matches) {
          let quantidade = 1;
          const quantidadeMatch = match[0].match(/\d+/);
          if (quantidadeMatch) {
            quantidade = parseInt(quantidadeMatch[0]);
          }
          itensEncontrados.push({ item, quantidade });
          if (item === 'refrigerante_2l' || item === 'refrigerante2l' || item === 'refrigerante 2l' || 'refrigerante_2litros') {
            quantidade -= 1;
          }
          if(dia !== "Sunday"){
          if(item === 'panelada_simples' || item === 'panelada_completa' || item === 'feijoada_simples' || item === 'feijoada_completa'){
            await client.sendText(from, 'Panelada e feijoada estão disponíveis apenas nos domingos a partir das 11:00, por favor, selecione outro item.');
        estadoUsuarios[from].passo = 2;
          }
         
        }
        if(dia === "Sunday"){
          if(item === 'panelada_simples' && hora < '1100' || item === 'panelada_completa' && hora < '1100' || item === 'feijoada_simples' && hora < '1100' || item === 'feijoada_completa' && hora < '1100'){
            await client.sendText(from, 'Panelada e feijoada estão disponíveis partir das 11:00, por favor, selecione outro item ou espere o horário.');
        estadoUsuarios[from].passo = 2;
          }
          }
        }
      });
      
      if (itensEncontrados.length > 0) {
    
        itensEncontrados.forEach(({ item, quantidade }) => {
          const preco = cardapio[item];
          const subtotal = preco * quantidade;
    
          estadoUsuario.pedido1 += `${quantidade} ${item.replace('_', ' ')} - R$ ${subtotal.toFixed(2)}\n`;
          estadoUsuario.total1 += subtotal;
        });
    
    
        await client.sendText(from, estadoUsuario.pedido1 + '\n' + '*total*: ' + 'R$' + estadoUsuario.total1);
        await client.sendText(from, 'Deseja continuar ou editar o pedido?');
        estadoUsuarios[from].passo = 3;
        
        // ...
      } else {
        await client.sendText(from, 'Não foi possível identificar os itens do seu pedido. Por favor, tente novamente.');
      }

    } else if (passo === 3) {
      const respostaUsuario = message.body.toLowerCase();
      if (respostaUsuario.includes('continuar')) {
        await client.sendText(from, 'Certo, você deseja adicionar algum adicional no pedido?');
        estadoUsuarios[from].passo = 4;
      } else if (respostaUsuario.includes('editar')) {
        await client.sendText(from, 'Certo, editando o pedido...');
        estadoUsuarios[from].passo = 2;
        await client.sendText(from, `Escolha o que preferir, e envie a quantidade que desejar em apenas uma mensagem. 
*exemplo: 3 lopes salada*`);
      } else {
        // Resposta inválida
        await client.sendText(from, 'Desculpe, não entendi sua resposta. Por favor, digite "continuar" para prosseguir com o pedido ou "editar" para editar o pedido.');
      }


    } else if (passo === 4) {
      const respostaUsuario = message.body.toLowerCase();
      if (respostaUsuario.includes('sim')) {
        await client.sendText(from, 'Certo, agora digite o nome do item que deseja adicionar');
        estadoUsuarios[from].passo = 5;

      }
       if (respostaUsuario.includes('não')) {
        await client.sendText(from, 'Certo, vamos continuar.');
          if(estadoUsuario.pedido1 !== undefined){
            await client.sendText(from, `Seu pedido final é:\n${estadoUsuario.pedido1} \n Total: R$${estadoUsuario.total1}`);
            estadoUsuarios[from].passo = 7;
            await client.sendText(from, 'Você deseja retirar o pedido no estabelecimento ou deseja que seja entregue na sua residência?');
          }
      }
      if (!respostaUsuario.includes('não') && !respostaUsuario.includes('sim')) {
        await client.sendText(from, 'Eu não entendi sua resposta, Digite "sim" para adicionar algum adicional e "não" para recusar.');
      }
    }
      else if (passo === 5) {
        estadoUsuario.total2 = 0;
        estadoUsuario.pedido2 = '';
        await client.sendText(from, 'Certo, irei verificar no sistema...');
      const respostaUsuario = message.body.toLowerCase();
      const itensEncontrados = [];
    
      const extrass = { 
        hamburguer : 6,
        calabresa : 3,
          bacon : 3,
         filé : 3,
         file : 3,
          frango : 3,
         salsicha: 1,
          ovo : 1,
          salada: 2,
          queijo : 2,
          cheddar : 2,
         catupiry : 2
        }
      // Extrair os itens da mensagem do usuário
      Object.keys(extrass).forEach(item => {
        const regex = new RegExp(`(?:\\d+\\s+)?${item.replace('_', ' ').toLowerCase()}`, 'g');
        const matches = respostaUsuario.matchAll(regex);
        for (const match of matches) {
          let quantidade = 1;
          const quantidadeMatch = match[0].match(/\d+/);
          if (quantidadeMatch) {
            quantidade = parseInt(quantidadeMatch[0]);
          }
          itensEncontrados.push({ item, quantidade });
        }
      });
      
      if (itensEncontrados.length > 0) {
        itensEncontrados.forEach(({ item, quantidade }) => {
          const preco = extrass[item]; // Usar 'extrass' para obter o preço dos adicionais
          const subtotal = preco * quantidade;
          
          estadoUsuario.pedido2 += `${quantidade} Extra ${item.replace('_', ' ')} - R$ ${subtotal.toFixed(2)}\n`;
          estadoUsuario.total2 += subtotal;
        });
      
        let totalFinal = estadoUsuario.total1 + estadoUsuario.total2;
        await client.sendText(from, estadoUsuario.pedido1 + '\n\n' + estadoUsuario.pedido2 + '\n' + ' *total:* ' + 'R$' + totalFinal);
        await client.sendText(from, 'Deseja continuar ou editar o pedido?');
        estadoUsuarios[from].passo = 6;
      }
       else {
        await client.sendText(from, 'Não foi possível identificar os itens do seu pedido. Por favor, tente novamente.');
      }
    }

    else if (passo === 6) {
      const respostaUsuario = message.body.toLowerCase();
      let totalFinal = 0;
      totalFinal = estadoUsuario.total1 + estadoUsuario.total2;
      if (respostaUsuario.includes('continuar')) {
        await client.sendText(from, 'Certo, estamos finalizando o seu pedido...');
        if (estadoUsuario.pedido1 !== undefined && estadoUsuario.pedido2 !== undefined) {
         
          await client.sendText(from, `Seu pedido final é: \n ${estadoUsuario.pedido1} \n \n ${estadoUsuario.pedido2} \n *Total:* R$${totalFinal}`);
            await client.sendText(from, 'Você deseja retirar o pedido no estabelecimento ou deseja que seja entregue na sua residência?');
            estadoUsuarios[from].passo = 7;
        } 
      } else if (respostaUsuario.includes('editar')) {
        await client.sendText(from, 'Certo, vamos editar o pedido.');
        await client.sendText(from, 'agora digite o nome do adicional');
        estadoUsuarios[from].passo = 5;
        estadoUsuario.pedido2 = '';
      } else {
        // Resposta inválida
        await client.sendText(from, 'Desculpe, não entendi sua resposta. Por favor, digite "continuar" para prosseguir com o pedido ou "editar" para editar o pedido.');
      }
    }
    else if (passo === 7){
      const respostaUsuario = message.body.toLowerCase();
 if(respostaUsuario.includes('retirar') || respostaUsuario.includes('vou')){
 await client.sendText(from, 'Tudo bem, se deseja retirar no estabelecimento irei enviar o endereço da *lopes burger.*');

 setTimeout (async() => {
  await client.sendText(from, `*Endereço:*
*Nome da rua:* Rua Urbano Santos ( final da rua da trizidela)
*Referência:* Depois da escola local, Próximo a oficina do edilton`);
 },1000);
 setTimeout(async() => {
  await client.sendText(from, '*Envie seu nome completo para fazermos o registro.*');
  estadoUsuarios[from].passo = 8;
 }, 2000);
    }
    if(respostaUsuario.includes('entrega') || respostaUsuario.includes('entregue')  || respostaUsuario.includes('delivery') || respostaUsuario.includes('deixar') ){
      await client.sendText(from, `*Delivery* Selecionado, Vamos fazer seu cadastro.`);
      estadoUsuario.pedido1 += 3;
      setTimeout(async() => {
        await client.sendText(from, `Primeiramente, Envie seu nome completo.`);
        estadoUsuarios[from].passo = 11;
      }, 1000);

    }
  }
  else if (passo === 8){
    
    const respostaUsuario = message.body.toLowerCase();
    await client.sendText(from, `Seu nome é ${respostaUsuario}. Está correto? `);
    estadoUsuario.User = respostaUsuario;
    estadoUsuarios[from].passo = 9;
}
else if(passo === 9){
  const respostaUsuario = message.body.toLowerCase();
  if(respostaUsuario.includes('sim')){
    await client.sendText(from, `Certo ${estadoUsuario.User}, Agora só falta a forma de pagamento.
*PIX*
*DINHEIRO*
*CARTÃO*
Digite sua forma de pagamento.`);

estadoUsuarios[from].passo = 10;
return;
  }
  if(respostaUsuario.includes('não') || (respostaUsuario.includes('nao'))){
      await client.sendText(from, `Bom, Então vamos editar, Digite seu nome.`)
      estadoUsuarios[from].passo = 8;

}
if(!respostaUsuario.includes('não') && !(respostaUsuario.includes('nao') && !respostaUsuario.includes('sim'))){
  await client.sendText(from, `Eu não entendi sua resposta, Digite "sim" para confirmar seu nome ou digite "não" para edita-lo`);
}
}
else if(passo === 10){
  let totalFinal = 0;
  totalFinal = estadoUsuario.total1 + estadoUsuario.total2;
  const respostaUsuario = message.body.toLowerCase();
  if(respostaUsuario.includes("pix")){
    if(estadoUsuario.pedido2 !== undefined && estadoUsuario.pedido1 !== undefined){
    await client.sendText(from, `*PIX* selecionado, irei enviar nossa chave pix para você efetuar o pagamento.
${estadoUsuario.pedido1} \n ${estadoUsuario.pedido2} \n *TOTAL:* R$${totalFinal}

Chave Pix 🔑☺: 61603853308 (CPF) 📂

Nome: Fabrício Oliveira Santos 🕺🏻

Depois de efetuar o pagamento, envie o comprovante para continuar.
`);
estadoUsuarios[from].passo = 19;

  }
  if(estadoUsuario.pedido2 === undefined && estadoUsuario.pedido1 !== undefined){
    await client.sendText(from, `*PIX* selecionado, irei enviar nossa chave pix para você efetuar o pagamento.
${pedido1} \n *TOTAL:* R$${estadoUsuario.total1}

Chave Pix 🔑☺: 61603853308 (CPF) 📂

Nome: Fabrício Oliveira Santos 🕺🏻

Depois de efetuar o pagamento, envie o comprovante para continuar.
`);
estadoUsuarios[from].passo = 19;
  }
}
  if(respostaUsuario.includes("dinheiro")){
    let totalFinal = 0;
    totalFinal = estadoUsuario.total1 + estadoUsuario.total2;
    if(estadoUsuario.pedido2 !== undefined && estadoUsuario.pedido1 !== undefined){
      await client.sendText(from, `Bom, o total ficou ${totalFinal}, Estaremos lhe esperando no estabelecimento com a forma de pagamento em dinheiro.`)
    }
    if(estadoUsuario.pedido2 === undefined && estadoUsuario.pedido1 !== undefined){
      await client.sendText(from, `Bom, o total ficou ${estadoUsuario.total1}, Estaremos lhe esperando no estabelecimento.`)
    }
    setTimeout(async() => {
    await client.sendText(from, `O tempo previsto para seu pedido é de 20 minutos, estaremos esperando você no estabelecimento com a forma de pagamento em dinheiro.

Deseja finalizar seu pedido ou cancelar?`);
    },2000);
  estadoUsuarios[from].passo = 18;

      
  }

  if(respostaUsuario.includes("cartao") || respostaUsuario.includes("cartão")){
    let totalFinal = 0;
    totalFinal = estadoUsuario.total1 + estadoUsuario.total2;
    if(estadoUsuario.pedido2 !== undefined && estadoUsuario.pedido1 !== undefined){
      await client.sendText(from, `Bom, o total ficou ${totalFinal}, Estaremos lhe esperando no estabelecimento com a forma de pagamento em cartão.`);
      delete estadoUsuarios[from];
    }
    if(estadoUsuario.pedido2 === undefined && estadoUsuario.pedido1 !== undefined){
      await client.sendText(from, `Bom, o total ficou ${estadoUsuario.total1}, Estaremos lhe esperando no estabelecimento com a forma de pagamento em cartão.`);
      delete estadoUsuarios[from];
    }
    setTimeout(async() => {
    await client.sendText(from, `O tempo previsto para seu pedido é de 20 minutos, estaremos esperando você no estabelecimento.

Deseja finalizar seu pedido ou cancelar?`);
    },2000);
    estadoUsuarios[from].passo = 18;
  }
  if(!respostaUsuario.includes("cartao") && !respostaUsuario.includes("cartão") && !respostaUsuario.includes("dinheiro") && !respostaUsuario.includes("pix")){
    await client.sendText(from, `não entendi o que você digitou. 
*PIX*
*DINHEIRO*
*CARTÃO*
Digite sua forma de pagamento.`);
  }
}
else if(passo === 11){
  const respostaUsuario = message.body.toLowerCase();
  await client.sendText(from, `Seu nome é ${respostaUsuario}. Está correto? `);
  estadoUsuarios[from].passo = 12;
  estadoUsuario.User = respostaUsuario;
}
else if(passo === 12){
  const respostaUsuario = message.body.toLowerCase();
  if(respostaUsuario.includes('sim')){
    await client.sendText(from, `Certo ${estadoUsuario.User}, Agora envie seu endereço completo em apenas 1 mensagem.
*EXEMPLO:*
Conjunto habitacional airton senna, rua 10 casa 10 próximo ao campo zé piano`);
    estadoUsuarios[from].passo = 13;
  }
  if(respostaUsuario.includes('nao') || respostaUsuario.includes('não')){
    await client.sendText(from, `Certo, Vamos editar.
*Digite seu nome*`);
estadoUsuarios[from].passo = 11;

  }
  if(!respostaUsuario.includes('nao') && !respostaUsuario.includes('não') && !respostaUsuario.includes('sim')){
    await client.sendText(from, `Eu não entendi sua resposta, Digite "sim" para confirmar seu nome ou digite "não" para edita-lo`);
  }
}
else if(passo === 13){
  const respostaUsuario = message.body.toLowerCase();
  estadoUsuario.Endereco = respostaUsuario;
 await client.sendText(from, `Seu endereço é: ${estadoUsuario.Endereco}
Está correto?`);
estadoUsuarios[from].passo = 14;

}
else if(passo === 14){
  const respostaUsuario = message.body.toLowerCase();
  
  let totall = estadoUsuario.total1 + estadoUsuario.total2 + 3;

  if(estadoUsuario.pedido2 !== undefined && respostaUsuario.includes('sim') ||estadoUsuario.pedido2 !== undefined && respostaUsuario.includes('ta') ||estadoUsuario.pedido2 !== undefined && respostaUsuario.includes('esta')){
    await client.sendText(from, `
${estadoUsuario.pedido1}
${estadoUsuario.pedido2}
Taxa de entrega R$3,00
*TOTAL:* ${totall}

Certo ${estadoUsuario.User}, Agora só falta a forma de pagamento.
  *PIX*
  *DINHEIRO*
  *CARTÃO*
  Digite sua forma de pagamento.`);
  
  estadoUsuarios[from].passo = 15;
  }
  let cuzin1 = estadoUsuario.total1 + 3;

  if(estadoUsuario.pedido2 === undefined && respostaUsuario.includes('sim') ||estadoUsuario.pedido2 === undefined && respostaUsuario.includes('ta') ||estadoUsuario.pedido2 === undefined && respostaUsuario.includes('esta')){
    await client.sendText(from, `
${estadoUsuario.pedido1}
Taxa de entrega R$3,00
*TOTAL:* ${cuzin1}

Certo ${estadoUsuario.User}, Agora só falta a forma de pagamento.
  *PIX*
  *DINHEIRO*
  *CARTÃO*
  Digite sua forma de pagamento.`);
estadoUsuarios[from].passo = 15;
  }
  if(respostaUsuario.includes('nao') || respostaUsuario.includes('não')){
    await client.sendText(from, `Certo, vamo editar.
Digite o seu endereço.`);
estadoUsuarios[from].passo = 13;
  }
  
}
else if(passo === 15){
  let totalFinal = 0;
  totalFinal = estadoUsuario.total1 + estadoUsuario.total2 + 3;
  const respostaUsuario = message.body.toLowerCase();
  if(respostaUsuario.includes("pix")){
    if(estadoUsuario.pedido2 !== undefined){
    await client.sendText(from, `*PIX* selecionado, irei enviar nossa chave pix para você efetuar o pagamento.
${estadoUsuario.pedido1} \n ${estadoUsuario.pedido2} \n *TOTAL:* ${totalFinal}

Chave Pix 🔑☺: 61603853308 (CPF) 📂

Nome: Fabrício Oliveira Santos 🕺🏻

Depois de efetuar o pagamento, envie-nos o comprovante para continuar.
`);
estadoUsuarios[from].passo = 20;

  }
  if(estadoUsuario.pedido2 === undefined && estadoUsuario.pedido1 !== undefined){
    await client.sendText(from, `*PIX* selecionado, irei enviar nossa chave pix para você efetuar o pagamento.
${pedido1} \n *TOTAL:* R$${estadoUsuario.total1}

Chave Pix 🔑☺: 61603853308 (CPF) 📂

Nome: Fabrício Oliveira Santos 🕺🏻
Depois de efetuar o pagamento, envie-nos o comprovante para continuar.
`);
estadoUsuarios[from].passo = 20;

  }
}
  if(respostaUsuario.includes("dinheiro")){
    let totalFinal2 = estadoUsuario.total1 + estadoUsuario.total2 + 3;
   let totalFinal1 = estadoUsuario.total1 + 3;
    if(estadoUsuario.pedido2 !== undefined && estadoUsuario.pedido1 !== undefined){
      await client.sendText(from, `Bom, o total ficou ${totalFinal2}, você vai precisar de troco ou o dinheiro já está trocado?`);
      estadoUsuarios[from].passo = 16;
    }
    if(estadoUsuario.pedido2 === undefined && estadoUsuario.pedido1 !== undefined){
      await client.sendText(from, `Bom, o total ficou ${totalFinal1}, você vai precisar de troco ou o dinheiro já está trocado?`);
    }estadoUsuarios[from].passo = 16;
    setTimeout(async() => {
    await client.sendText(from, `O tempo previsto para seu pedido é de 20 minutos`);
    },2000);

      
  }

  if(respostaUsuario.includes("cartao") || respostaUsuario.includes("cartão")){
    let totalFinal = 0;
    totalFinal = estadoUsuario.total1 + estadoUsuario.total2 + 3;
    if(estadoUsuario.pedido2 !== undefined && estadoUsuario.pedido1 !== undefined){
      delete estadoUsuarios[from];
      await client.sendText(from, `Bom, o total ficou ${totalFinal}, O entregador irá levar a maquininha, aguarde no endereço indicado.
      Obrigado por fazer seu pedido na lopes burger, se quiser, avalie nosso atendimento por inteligência artifial.`);
    }
    if(estadoUsuario.pedido2 === undefined && estadoUsuario.pedido1 !== undefined){
      delete estadoUsuarios[from];
      await client.sendText(from, `Bom, o total ficou ${estadoUsuario.total1 + 3}, O entregador irá levar a maquininha, aguarde no endereço indicado.
      Obrigado por fazer seu pedido na lopes burger, se quiser, avalie nosso atendimento por inteligência artifial.`);
    }
    setTimeout(async() => {
    await client.sendText(from, `O tempo previsto para seu pedido é de 20 minutos, estaremos esperando você no estabelecimento.
Obrigado por fazer seu pedido na lopes burger, se quiser, avalie nosso atendimento por inteligência artifial.`);
    },2000);
  }
  if(!respostaUsuario.includes("cartao") && !respostaUsuario.includes("cartão") && !respostaUsuario.includes("dinheiro") && !respostaUsuario.includes("pix")){
    await client.sendText(from, `não entendi o que você digitou. 
*PIX*
*DINHEIRO*
*CARTÃO*
Digite sua forma de pagamento.`);
  }
}
else if(passo === 16){
  const respostaUsuario = message.body.toLowerCase();
  if(respostaUsuario.includes('sim') || respostaUsuario.includes('vou')){
await client.sendText(from, 'Ok, digite a quantia que você tem e irei calcular seu troco.');
estadoUsuarios[from].passo = 17;
  }
  if(respostaUsuario.includes('nao') || respostaUsuario.includes('não')){
await client.sendText(from, `Certamente, Obrigado por fazer seu pedido na lopes burger, em breve o entregador entrará em contato avisando.
Se quiser pode avaliar este atendimento por inteligência artificial.`)
delete estadoUsuarios[from];
}
if(!respostaUsuario.includes('sim') && !respostaUsuario.includes('vou') && !respostaUsuario.includes('nao') && !respostaUsuario.includes('não')){
  await client.sendText(from, `Não entendi sua resposta, digite "sim" para calcular seu troco ou digite "não" para pular esta etapa.`)
}
}
else if(passo === 17){
  const respostaUsuario = message.body.toLowerCase();
  function extrairNumeros(texto) {
    const regex = /\d+/g;
    const numeros = texto.match(regex);
    return numeros ? numeros.map(Number) : [];
  }
  const numeros = extrairNumeros(message.body);
  totalFinal = estadoUsuario.total1 + estadoUsuario.total2 + 3;
  trocoFULL = totalFinal - numeros;
  troco1 = estadoUsuario.total1 - numeros + 3;

  if(estadoUsuario.pedido2 !== undefined){
    delete estadoUsuarios[from];
    await client.sendText(from, `Seu troco será de R$${trocoFULL}, aguarde no endereço indicado, o entregador avisará quando estiver indo.
Obrigado por fazer seu pedido na lopes burger, se quiser, avalie nosso atendimento por inteligência artifial.`)
  }
  if(estadoUsuario.pedido2 === undefined){
    delete estadoUsuarios[from];
    await client.sendText(from, `Seu troco será de R$${troco1}, aguarde no endereço indicado, o entregador avisará quando estiver indo.
Obrigado por fazer seu pedido na lopes burger, se quiser, avalie nosso atendimento por inteligência artifial.`)
  }
  }
  else if(passo === 18){
    const respostaUsuario = message.body.toLowerCase();
    if( respostaUsuario.includes('final')){
      await client.sendText(from, `Obrigado por fazer seu pedido na lopes burger, se quiser, avalie nosso atendimento por inteligência artifial.`)
        }
        if( respostaUsuario.includes('cance')){
          await client.sendText(from, 'Ok, vamos cancelar o pedido...');
          await client.sendText(from, 'Pedido cancelado.');
          delete estadoUsuarios[from];
        }


    }
    else if(passo === 19){
if(message.type === MessageTypes.IMAGE || message.type === MessageTypes.DOCUMENT){
  await client.sendText(from, `Certo, vamos verificar o comprovante, quando seu pedido estiver pronto vamos avisar para você buscar`);
  setTimeout(async() => {
    await client.sendText(from, `Obrigado por fazer seu pedido na lopes burger, se quiser, avalie nosso atendimento por inteligência artifial.`)
  }, 1000);
  delete estadoUsuarios[from];
  
}

    }
    else if(passo === 20){
      if(message.type === MessageTypes.IMAGE || message.type === MessageTypes.DOCUMENT){
        await client.sendText(from, `Certo, vamos verificar o comprovante, quando seu pedido estiver pronto, nosso entregador irá deixar no endereço indicado.`);
        setTimeout(async() => {
          await client.sendText(from, `Obrigado por fazer seu pedido na lopes burger, se quiser, avalie nosso atendimento por inteligência artifial.`)
        }, 1000);
        delete estadoUsuarios[from];
        
      }
  }


}
}




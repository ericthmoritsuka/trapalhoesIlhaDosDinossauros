/*
 * Companheiro de Aventura
 * Ficha digital do Didiana Jones, dado na tela e ajudante de CAFLITO.
 * A ficha fica salva no navegador (localStorage), então dá pra fechar a
 * página e continuar a aventura de onde parou.
 */
(function () {
  'use strict';

  var CHAVE_FICHA = 'trapalhoes.ficha.v1';
  var CHAVE_CAFLITO = 'trapalhoes.caflito.v1';
  var CHAVE_ABERTO = 'trapalhoes.painelAberto.v1';
  var PREFIXO_PENALIDADE = 'trapalhoes.penalidade.';

  // inimigos de cada página de CAFLITO (valores tirados dos quadrinhos)
  var INIMIGOS = {
    'aliado1.html': { nome: 'Barão Von Tade', ataque: 8, energia: 6, vitoria: 'baraoVitoria1.html' },
    'semCola1.html': { nome: 'Tilossauro', ataque: 8, energia: 8, vitoria: 'comCola2.html' },
    'comManual2.html': { nome: 'Pterodáctilo', ataque: 6, energia: 3, vitoria: 'pterodactiloVitoria1.html' },
    'atacarHomem.html': { nome: 'Zaca Tuca', ataque: 7, energia: 4, vitoria: 'homemVitoria1.html' },
    'semVeneno1.html': { nome: 'Samambaia Carnívora', ataque: 5, energia: 2, vitoria: 'comVeneno2.html' },
    'triceratopsCaflito.html': { nome: 'Triceratops', ataque: 8, energia: 8, vitoria: 'triceratopsVitoria1.html' },
    'tiranossauroCaflito.html': { nome: 'Tiranossauro', ataque: 12, energia: 14, vitoria: 'tiranossauroVitoria1.html' }
  };

  // páginas que mandam tirar pontos da ficha
  var PENALIDADES = {
    'anatossauroAtacar1.html': { stat: 'energia', pontos: 3 },
    'pousoFalha1.html': { stat: 'energia', pontos: 1 },
    'triceratopsFininho.html': { stat: 'energia', pontos: 2 },
    'semEstetoscopio1.html': { stat: 'ataque', pontos: 2 }
  };

  var PAGINA_CRIACAO = 'criandoPersonagemAtaqueEnergia.html';

  var PIPS = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  var pagina = (location.pathname.split('/').pop() || 'index.html');
  var inimigoDaPagina = INIMIGOS[pagina] || null;
  var penalidadeDaPagina = PENALIDADES[pagina] || null;

  // voltar pra capa = recomeçar a aventura: limpa a luta e os golpes anotados
  if (pagina === 'index.html') {
    localStorage.removeItem(CHAVE_CAFLITO);
    Object.keys(sessionStorage).forEach(function (chave) {
      if (chave.indexOf(PREFIXO_PENALIDADE) === 0) sessionStorage.removeItem(chave);
    });
  }

  /* ---------- estado ---------- */

  function lerJson(chave) {
    try {
      return JSON.parse(localStorage.getItem(chave));
    } catch (e) {
      return null;
    }
  }

  var ficha = lerJson(CHAVE_FICHA) || { nome: '', ataque: null, energia: null };

  function salvarFicha() {
    localStorage.setItem(CHAVE_FICHA, JSON.stringify(ficha));
  }

  var caflito = lerJson(CHAVE_CAFLITO);
  if (inimigoDaPagina) {
    // chegou numa página de caflito: começa (ou continua) a luta dela
    if (!caflito || caflito.pagina !== pagina) {
      caflito = { pagina: pagina, energiaInimigo: inimigoDaPagina.energia };
      localStorage.setItem(CHAVE_CAFLITO, JSON.stringify(caflito));
    }
  }

  function salvarCaflito() {
    localStorage.setItem(CHAVE_CAFLITO, JSON.stringify(caflito));
  }

  /* ---------- montagem do painel ---------- */

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function criarDado(extraClass) {
    var dado = el('div', 'av-dado' + (extraClass ? ' ' + extraClass : ''));
    for (var i = 0; i < 9; i++) dado.appendChild(el('span', 'av-pip'));
    return dado;
  }

  function mostrarFace(dado, valor) {
    var pips = dado.children;
    for (var i = 0; i < 9; i++) {
      pips[i].className = 'av-pip' + (PIPS[valor].indexOf(i) >= 0 ? ' on' : '');
    }
  }

  function rolarDado(dado, aoTerminar) {
    var valorFinal = Math.floor(Math.random() * 6) + 1;
    var inicio = Date.now();
    dado.classList.add('rolando');
    // termina por tempo (e não por número de giros): em abas sem foco o
    // navegador atrasa os timers e o dado não pode ficar preso rolando
    (function gira() {
      if (Date.now() - inicio >= 700) {
        dado.classList.remove('rolando');
        mostrarFace(dado, valorFinal);
        if (aoTerminar) aoTerminar(valorFinal);
        return;
      }
      mostrarFace(dado, Math.floor(Math.random() * 6) + 1);
      setTimeout(gira, 90);
    })();
  }

  var painel = el('aside', 'av-painel');
  painel.appendChild(el('h2', null, '🎒 Ficha de Aventura'));

  // --- seção: ficha do personagem ---
  var secFicha = el('section', 'av-secao');
  var tituloFicha = el('div', 'av-secao-titulo', 'Didiana Jones');
  secFicha.appendChild(tituloFicha);

  function atualizarTitulo() {
    var nome = (ficha.nome || '').trim();
    tituloFicha.textContent = nome ? '⭐ ' + nome + ' ⭐' : 'Didiana Jones';
  }

  var inputNome = el('input', 'av-nome');
  inputNome.type = 'text';
  inputNome.placeholder = 'Escreva seu nome aqui';
  inputNome.maxLength = 30;
  inputNome.value = ficha.nome || '';
  inputNome.addEventListener('input', function () {
    ficha.nome = inputNome.value;
    salvarFicha();
    atualizarTitulo();
  });
  secFicha.appendChild(inputNome);
  atualizarTitulo();

  var stats = el('div', 'av-stats');
  secFicha.appendChild(stats);

  var valorEls = {};

  function criarStat(chave, rotulo) {
    var caixa = el('div', 'av-stat ' + chave);
    caixa.appendChild(el('div', 'av-stat-nome', rotulo));
    var valor = el('div', 'av-stat-valor', '–');
    caixa.appendChild(valor);
    valorEls[chave] = valor;

    var botoes = el('div', 'av-stat-botoes');
    var menos = el('button', 'av-mini-botao', '−');
    var mais = el('button', 'av-mini-botao', '+');
    menos.type = mais.type = 'button';
    menos.setAttribute('aria-label', 'tirar 1 ponto de ' + rotulo);
    mais.setAttribute('aria-label', 'somar 1 ponto de ' + rotulo);
    menos.addEventListener('click', function () { mudarStat(chave, -1); });
    mais.addEventListener('click', function () { mudarStat(chave, 1); });
    botoes.appendChild(menos);
    botoes.appendChild(mais);
    caixa.appendChild(botoes);
    stats.appendChild(caixa);
  }

  criarStat('ataque', 'ATAQUE');
  criarStat('energia', 'ENERGIA');

  var avisoFicha = el('p', 'av-resultado');
  secFicha.appendChild(avisoFicha);
  painel.appendChild(secFicha);

  function mudarStat(chave, delta) {
    if (ficha[chave] === null) ficha[chave] = 0;
    ficha[chave] = Math.max(0, Math.min(30, ficha[chave] + delta));
    salvarFicha();
    atualizarFicha();
  }

  function atualizarFicha() {
    valorEls.ataque.textContent = ficha.ataque === null ? '–' : ficha.ataque;
    valorEls.energia.textContent = ficha.energia === null ? '–' : ficha.energia;
    if (ficha.energia === 0) {
      avisoFicha.textContent = '😵 Sem energia! Didiana foi derrotado...';
      avisoFicha.style.color = '#d43a2f';
    } else {
      avisoFicha.textContent = '';
    }
  }

  // --- seção: sortear ataque e energia (só na página de criação) ---
  if (pagina === PAGINA_CRIACAO) {
    var secCriacao = el('section', 'av-secao');
    secCriacao.appendChild(el('div', 'av-secao-titulo', '✨ Descubra seu poder'));
    secCriacao.appendChild(el('p', 'av-aviso', 'O dado gira, soma 6 e anota na ficha sozinho!'));

    [['ataque', 'meu ATAQUE'], ['energia', 'minha ENERGIA']].forEach(function (par) {
      var chave = par[0];
      var botao = el('button', 'av-botao', '🎲 Sortear ' + par[1]);
      botao.type = 'button';
      var resultado = el('p', 'av-resultado');
      botao.addEventListener('click', function () {
        botao.disabled = true;
        rolarDado(dadoLivre, function (valor) {
          botao.disabled = false;
          ficha[chave] = valor + 6;
          salvarFicha();
          atualizarFicha();
          resultado.textContent = 'Deu ' + valor + ' + 6 = ' + (valor + 6) + ' de ' + chave.toUpperCase() + '!';
          botao.innerHTML = '🎲 Sortear de novo (' + chave.toUpperCase() + ')';
        });
      });
      secCriacao.appendChild(botao);
      secCriacao.appendChild(resultado);
    });
    painel.appendChild(secCriacao);
  }

  // --- seção: penalidade da página ---
  if (penalidadeDaPagina) {
    var chavePenalidade = PREFIXO_PENALIDADE + pagina;
    var secPen = el('section', 'av-secao');
    secPen.appendChild(el('div', 'av-secao-titulo', '⚠️ Anote o golpe!'));
    var botaoPen = el('button', 'av-botao destaque',
      'Tirar ' + penalidadeDaPagina.pontos + ' ponto' + (penalidadeDaPagina.pontos > 1 ? 's' : '') +
      ' de ' + penalidadeDaPagina.stat.toUpperCase());
    botaoPen.type = 'button';

    function marcarPenalidadeFeita() {
      botaoPen.disabled = true;
      botaoPen.classList.remove('destaque');
      botaoPen.textContent = '✔ Já anotei na ficha!';
    }

    if (sessionStorage.getItem(chavePenalidade)) marcarPenalidadeFeita();

    botaoPen.addEventListener('click', function () {
      mudarStat(penalidadeDaPagina.stat, -penalidadeDaPagina.pontos);
      sessionStorage.setItem(chavePenalidade, '1');
      marcarPenalidadeFeita();
    });
    secPen.appendChild(botaoPen);
    painel.appendChild(secPen);
  }

  // --- seção: caflito ---
  if (inimigoDaPagina) {
    var secCaflito = el('section', 'av-secao caflito');
    secCaflito.appendChild(el('div', 'av-caflito-titulo', '💥 Caflito!'));

    var vs = el('div', 'av-vs');
    var heroi = el('div', 'av-lutador heroi');
    heroi.appendChild(el('span', 'quem', ficha.nome ? ficha.nome : 'Didiana'));
    var vidaHeroi = el('span', 'vida');
    heroi.appendChild(vidaHeroi);
    heroi.appendChild(el('span', 'quem', 'ATQ ' + (ficha.ataque === null ? '?' : '')));
    var atqHeroiEl = heroi.lastChild;

    var inimigo = el('div', 'av-lutador inimigo');
    inimigo.appendChild(el('span', 'quem', inimigoDaPagina.nome));
    var vidaInimigo = el('span', 'vida');
    inimigo.appendChild(vidaInimigo);
    inimigo.appendChild(el('span', 'quem', 'ATQ ' + inimigoDaPagina.ataque));

    vs.appendChild(heroi);
    vs.appendChild(el('span', 'av-vs-x', '✖'));
    vs.appendChild(inimigo);
    secCaflito.appendChild(vs);

    var dadosRodada = el('div', 'av-dados-rodada');
    var colHeroi = el('div', 'col', 'Didiana');
    var dadoHeroi = criarDado();
    var totalHeroi = el('div', null, '&nbsp;');
    colHeroi.appendChild(dadoHeroi);
    colHeroi.appendChild(totalHeroi);
    var colInimigo = el('div', 'col', 'Inimigo');
    var dadoInimigo = criarDado('inimigo');
    var totalInimigo = el('div', null, '&nbsp;');
    colInimigo.appendChild(dadoInimigo);
    colInimigo.appendChild(totalInimigo);
    dadosRodada.appendChild(colHeroi);
    dadosRodada.appendChild(colInimigo);
    mostrarFace(dadoHeroi, 1);
    mostrarFace(dadoInimigo, 1);
    secCaflito.appendChild(dadosRodada);

    var botaoRodada = el('button', 'av-botao destaque', '🎲 Jogar a rodada!');
    botaoRodada.type = 'button';
    secCaflito.appendChild(botaoRodada);

    var msgCaflito = el('p', 'av-caflito-msg');
    secCaflito.appendChild(msgCaflito);
    painel.appendChild(secCaflito);

    function destacarCaminho(vitoria) {
      var links = document.querySelectorAll('a.botao');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href') || '';
        if (vitoria && href.indexOf(inimigoDaPagina.vitoria) >= 0) {
          links[i].classList.add('av-caminho-vitoria');
        }
        if (!vitoria && (href === './' || href.indexOf('index.html') >= 0)) {
          links[i].classList.add('av-caminho-derrota');
        }
      }
    }

    function atualizarCaflito() {
      vidaHeroi.textContent = ficha.energia === null ? '?' : '❤️' + ficha.energia;
      vidaInimigo.textContent = '❤️' + caflito.energiaInimigo;
      atqHeroiEl.textContent = 'ATQ ' + (ficha.ataque === null ? '?' : ficha.ataque);
      heroi.firstChild.textContent = ficha.nome ? ficha.nome : 'Didiana';

      if (caflito.energiaInimigo <= 0) {
        msgCaflito.className = 'av-caflito-msg vitoria';
        msgCaflito.textContent = '🎉 VOCÊ VENCEU O CAFLITO!';
        botaoRodada.disabled = true;
        destacarCaminho(true);
      } else if (ficha.energia !== null && ficha.energia <= 0) {
        msgCaflito.className = 'av-caflito-msg derrota';
        msgCaflito.textContent = '😵 Você foi derrotado... Tente de novo!';
        botaoRodada.disabled = true;
        destacarCaminho(false);
        // na próxima aventura o inimigo volta com toda a energia
        localStorage.removeItem(CHAVE_CAFLITO);
      }
    }

    botaoRodada.addEventListener('click', function () {
      if (ficha.ataque === null || ficha.energia === null) {
        msgCaflito.className = 'av-caflito-msg derrota';
        msgCaflito.textContent = 'Primeiro anote seu ATAQUE e sua ENERGIA na ficha!';
        return;
      }
      botaoRodada.disabled = true;
      msgCaflito.className = 'av-caflito-msg';
      msgCaflito.textContent = 'Rolando os dados...';
      totalHeroi.innerHTML = '&nbsp;';
      totalInimigo.innerHTML = '&nbsp;';

      var valores = {};
      var prontos = 0;

      function terminouUm(quem, valor) {
        valores[quem] = valor;
        prontos++;
        if (prontos < 2) return;

        var somaHeroi = valores.heroi + ficha.ataque;
        var somaInimigo = valores.inimigo + inimigoDaPagina.ataque;
        totalHeroi.textContent = valores.heroi + ' + ' + ficha.ataque + ' = ' + somaHeroi;
        totalInimigo.textContent = valores.inimigo + ' + ' + inimigoDaPagina.ataque + ' = ' + somaInimigo;

        if (somaHeroi > somaInimigo) {
          caflito.energiaInimigo--;
          salvarCaflito();
          msgCaflito.textContent = '💪 Você ganhou a rodada! ' + inimigoDaPagina.nome + ' perde 1 de energia.';
        } else if (somaInimigo > somaHeroi) {
          ficha.energia = Math.max(0, ficha.energia - 1);
          salvarFicha();
          atualizarFicha();
          msgCaflito.textContent = '💢 O inimigo ganhou a rodada! Você perde 1 de energia.';
        } else {
          msgCaflito.textContent = '😮 Empate! Ninguém perde pontos. Joguem de novo!';
        }
        botaoRodada.disabled = false;
        atualizarCaflito();
      }

      rolarDado(dadoHeroi, function (v) { terminouUm('heroi', v); });
      rolarDado(dadoInimigo, function (v) { terminouUm('inimigo', v); });
    });

    atualizarCaflito();
  }

  // --- seção: dado livre ---
  var secDado = el('section', 'av-secao');
  secDado.appendChild(el('div', 'av-secao-titulo', '🎲 Dado'));
  var areaDado = el('div', 'av-dado-area');
  var dadoLivre = criarDado();
  mostrarFace(dadoLivre, 6);
  areaDado.appendChild(dadoLivre);
  secDado.appendChild(areaDado);
  var botaoDado = el('button', 'av-botao', 'Jogar o dado');
  botaoDado.type = 'button';
  var resultadoDado = el('p', 'av-resultado');
  botaoDado.addEventListener('click', function () {
    botaoDado.disabled = true;
    resultadoDado.textContent = '...';
    rolarDado(dadoLivre, function (valor) {
      botaoDado.disabled = false;
      resultadoDado.textContent = 'Deu ' + valor + '!';
    });
  });
  secDado.appendChild(botaoDado);
  secDado.appendChild(resultadoDado);
  painel.appendChild(secDado);

  // --- nova aventura (zera a ficha, com confirmação de dois cliques) ---
  var botaoReset = el('button', 'av-botao av-nova-aventura', '🔄 Começar uma nova aventura');
  botaoReset.type = 'button';
  var confirmandoReset = false;
  botaoReset.addEventListener('click', function () {
    if (!confirmandoReset) {
      confirmandoReset = true;
      botaoReset.textContent = 'Tem certeza? Isso apaga a ficha! (clique de novo)';
      setTimeout(function () {
        confirmandoReset = false;
        botaoReset.textContent = '🔄 Começar uma nova aventura';
      }, 4000);
      return;
    }
    localStorage.removeItem(CHAVE_FICHA);
    localStorage.removeItem(CHAVE_CAFLITO);
    Object.keys(sessionStorage).forEach(function (chave) {
      if (chave.indexOf(PREFIXO_PENALIDADE) === 0) sessionStorage.removeItem(chave);
    });
    location.href = './inicio.html';
  });
  painel.appendChild(botaoReset);

  /* ---------- botão flutuante ---------- */

  var toggle = el('button', 'av-toggle', '🎲<span class="av-toggle-alerta">!</span>');
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Abrir ou fechar a ficha de aventura');
  if (inimigoDaPagina || penalidadeDaPagina) toggle.classList.add('tem-alerta');

  function painelAberto() {
    return document.body.classList.contains('av-aberto');
  }

  function ajustarToggle() {
    toggle.firstChild.textContent = '';
    toggle.innerHTML = (painelAberto() ? '✕' : '🎲') + '<span class="av-toggle-alerta">!</span>';
  }

  toggle.addEventListener('click', function () {
    document.body.classList.toggle('av-aberto');
    localStorage.setItem(CHAVE_ABERTO, painelAberto() ? '1' : '0');
    toggle.classList.remove('tem-alerta');
    ajustarToggle();
  });

  // abre sozinho em telas largas (ou onde o jogador deixou aberto);
  // em páginas de caflito ou penalidade abre sempre, pra criança não perder
  var preferencia = localStorage.getItem(CHAVE_ABERTO);
  var abrir = preferencia === null ? window.innerWidth >= 1340 : preferencia === '1';
  if (inimigoDaPagina || penalidadeDaPagina || pagina === PAGINA_CRIACAO) abrir = true;
  if (abrir) document.body.classList.add('av-aberto');

  document.body.appendChild(painel);
  document.body.appendChild(toggle);
  ajustarToggle();
  atualizarFicha();
})();

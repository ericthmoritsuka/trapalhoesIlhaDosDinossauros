/*
 * Companheiro de Aventura
 * Dois modos de jogo:
 *  - digital: ficha completa no painel (nome, ATAQUE, ENERGIA), dado animado,
 *    ajudante de CAFLITO e botões de penalidade — tudo salvo no navegador.
 *  - papel: o jogador anota tudo numa folha; o painel vira só um dadão
 *    e o botão de nova aventura.
 * O modo escolhido, a ficha e a luta atual ficam no localStorage, então dá
 * pra fechar a página e continuar a aventura de onde parou.
 */
(function () {
  'use strict';

  var CHAVE_FICHA = 'trapalhoes.ficha.v1';
  var CHAVE_CAFLITO = 'trapalhoes.caflito.v1';
  var CHAVE_ABERTO = 'trapalhoes.painelAberto.v1';
  var CHAVE_MODO = 'trapalhoes.modo.v1';
  var PREFIXO_PENALIDADE = 'trapalhoes.penalidade.';
  var CHAVE_PROGRESSO = 'trapalhoes.progresso.v1';
  var TOUR_CRIACAO = 'trapalhoes.tour.criacao.v1';
  var TOUR_CAFLITO = 'trapalhoes.tour.caflito.v1';
  var TOUR_PENALIDADE = 'trapalhoes.tour.penalidade.v1';

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
  var PAGINA_NOME = 'criandoPersonagemNome.html';
  var PAGINA_ITENS = 'pagina3.html';

  // itens que dá pra escolher no guarda-roupa (página 3); o chicote vai sempre
  var ITENS = [
    { id: 'manual', nome: 'Manual de Pilotagem', img: './img/glossario/manual de pilotagem.webp' },
    { id: 'cola', nome: 'Cola-tudo', img: './img/glossario/cola tudo.webp' },
    { id: 'estetoscopio', nome: 'Estetoscópio', img: './img/glossario/estetoscopio.webp' },
    { id: 'isqueiro', nome: 'Isqueiro', img: './img/glossario/isqueiro.jpg' },
    { id: 'veneno', nome: 'Mata-erva daninha', img: './img/glossario/mata-erva daninha.jpg' },
    { id: 'carne', nome: 'Carne-seca', img: './img/glossario/carne seca.jpg' }
  ];
  var CHICOTE = { id: 'chicote', nome: 'Chicote', img: './img/glossario/chicote.jpg' };

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

  // modo de jogo: 'digital' (padrão) ou 'papel'
  var modo = localStorage.getItem(CHAVE_MODO) === 'papel' ? 'papel' : 'digital';
  var modoDigital = modo === 'digital';
  document.body.classList.add('modo-' + modo);

  // botões que escolhem o modo (ex.: na página "Como você quer jogar?")
  var escolhas = document.querySelectorAll('[data-modo]');
  for (var e = 0; e < escolhas.length; e++) {
    escolhas[e].addEventListener('click', function () {
      localStorage.setItem(CHAVE_MODO, this.getAttribute('data-modo'));
    });
  }

  // progresso na criação do personagem: 0 = ainda não chegou lá,
  // 1 = já pode escrever o nome, 2 = já pode mexer em ATAQUE/ENERGIA e no dado.
  // Fora das páginas iniciais o jogo está rolando, então libera tudo.
  var PAGINAS_INICIAIS = ['index.html', 'inicio.html', 'fichaPersonagem.html', 'criandoPersonagemNome.html'];
  var progresso = parseInt(localStorage.getItem(CHAVE_PROGRESSO), 10) || 0;
  if (PAGINAS_INICIAIS.indexOf(pagina) < 0) progresso = 2;
  else if (pagina === PAGINA_NOME) progresso = Math.max(progresso, 1);
  localStorage.setItem(CHAVE_PROGRESSO, String(progresso));

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
    } catch (err) {
      return null;
    }
  }

  var ficha = lerJson(CHAVE_FICHA) || { nome: '', ataque: null, energia: null };
  if (!ficha.itens) ficha.itens = [];

  function salvarFicha() {
    localStorage.setItem(CHAVE_FICHA, JSON.stringify(ficha));
  }

  var caflito = lerJson(CHAVE_CAFLITO);
  if (inimigoDaPagina && modoDigital) {
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

  var tourAlvos = {};

  var painel = el('aside', 'av-painel' + (modoDigital ? '' : ' papel'));
  painel.appendChild(el('h2', null, modoDigital ? '🎒 Ficha de Aventura' : '🎲 Seu Dado'));

  var inputNome = null;
  var atualizarTitulo = function () {};
  var atualizarFicha = function () {};
  var mudarStat = function () {};

  // --- seção: ficha do personagem (só no modo digital) ---
  if (modoDigital) {
    var secFicha = el('section', 'av-secao');
    var tituloFicha = el('div', 'av-secao-titulo', 'Didiana Jones');
    secFicha.appendChild(tituloFicha);

    atualizarTitulo = function () {
      var nome = (ficha.nome || '').trim();
      tituloFicha.textContent = nome ? '⭐ ' + nome + ' ⭐' : 'Didiana Jones';
    };

    inputNome = el('input', 'av-nome');
    inputNome.type = 'text';
    inputNome.maxLength = 30;
    inputNome.value = ficha.nome || '';
    if (progresso >= 1) {
      inputNome.placeholder = 'Escreva seu nome aqui';
    } else {
      inputNome.placeholder = 'Já já você escreve seu nome!';
      inputNome.disabled = true;
    }
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
      // trancados antes da hora, durante o sorteio e depois que os valores
      // estão definidos (as mudanças do jogo são automáticas — sem roubar!)
      var statsTravados = progresso < 2 || pagina === PAGINA_CRIACAO ||
        (ficha.ataque !== null && ficha.energia !== null);
      if (statsTravados) menos.disabled = mais.disabled = true;
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
    tourAlvos.ficha = secFicha;

    mudarStat = function (chave, delta) {
      if (ficha[chave] === null) ficha[chave] = 0;
      ficha[chave] = Math.max(0, Math.min(30, ficha[chave] + delta));
      salvarFicha();
      atualizarFicha();
    };

    atualizarFicha = function () {
      valorEls.ataque.textContent = ficha.ataque === null ? '–' : ficha.ataque;
      valorEls.energia.textContent = ficha.energia === null ? '–' : ficha.energia;
      if (ficha.energia === 0) {
        avisoFicha.textContent = '😵 Sem energia! Seu herói foi derrotado...';
        avisoFicha.style.color = '#d43a2f';
      } else {
        avisoFicha.textContent = '';
      }
    };
  }

  // --- seção: mochila (recolhível; aparece quando tem itens guardados) ---
  var atualizarMochila = function () {};
  if (modoDigital && (ficha.itens.length || pagina === PAGINA_ITENS)) {
    var secMochila = el('section', 'av-secao');
    var botaoMochila = el('button', 'av-botao', '🎒 Abrir a mochila');
    botaoMochila.type = 'button';
    var listaMochila = el('div', 'av-mochila-lista');
    secMochila.appendChild(botaoMochila);
    secMochila.appendChild(listaMochila);
    painel.appendChild(secMochila);

    botaoMochila.addEventListener('click', function () {
      listaMochila.classList.toggle('aberta');
      atualizarMochila();
    });

    atualizarMochila = function () {
      var aberta = listaMochila.classList.contains('aberta');
      botaoMochila.textContent = (aberta ? '🎒 Fechar a mochila' : '🎒 Abrir a mochila') +
        ' (' + (ficha.itens.length + 1) + ' itens)';
      listaMochila.innerHTML = '';
      [CHICOTE].concat(ITENS.filter(function (item) {
        return ficha.itens.indexOf(item.id) >= 0;
      })).forEach(function (item) {
        var linha = el('div', 'av-mochila-item');
        var img = el('img');
        img.src = item.img;
        img.alt = item.nome;
        linha.appendChild(img);
        linha.appendChild(el('span', null, item.nome));
        if (item.id === 'chicote') linha.appendChild(el('span', 'sempre', 'sempre com você'));
        listaMochila.appendChild(linha);
      });
    };
    atualizarMochila();
  }

  // --- seção: sortear ataque e energia (modo digital, página de criação) ---
  // cada poder é sorteado UMA vez só (nada de rolar de novo até sair um
  // número bom!); quando os dois saem, aparece o resumo e o Continuar
  if (modoDigital && pagina === PAGINA_CRIACAO) {
    var secCriacao = el('section', 'av-secao');
    secCriacao.appendChild(el('div', 'av-secao-titulo', '✨ Descubra seu poder'));
    secCriacao.appendChild(el('p', 'av-aviso', 'O dado gira, soma 6 e anota na ficha sozinho!'));

    var resumoCriacao = el('p', 'av-resultado');
    var continuarCriacao = el('a', 'av-botao verde', 'Continuar a aventura ➜');
    continuarCriacao.href = './explicandoCaflito.html';
    resumoCriacao.style.display = 'none';
    continuarCriacao.style.display = 'none';

    var botoesSorteio = {};

    function marcarSorteado(chave) {
      botoesSorteio[chave].disabled = true;
      botoesSorteio[chave].innerHTML = '✔ ' + chave.toUpperCase() + ': ' + ficha[chave];
    }

    function conferirCriacao() {
      if (ficha.ataque === null || ficha.energia === null) return;
      resumoCriacao.textContent = '⭐ Seu ATAQUE é ' + ficha.ataque +
        ' e sua ENERGIA é ' + ficha.energia + '. Herói pronto!';
      resumoCriacao.style.display = '';
      continuarCriacao.style.display = '';
    }

    [['ataque', 'meu ATAQUE'], ['energia', 'minha ENERGIA']].forEach(function (par) {
      var chave = par[0];
      var botao = el('button', 'av-botao', '🎲 Sortear ' + par[1]);
      botao.type = 'button';
      botoesSorteio[chave] = botao;
      var resultado = el('p', 'av-resultado');
      botao.addEventListener('click', function () {
        if (ficha[chave] !== null) return;
        botao.disabled = true;
        rolarDado(dadoLivre, function (valor) {
          ficha[chave] = valor + 6;
          salvarFicha();
          atualizarFicha();
          resultado.textContent = 'Deu ' + valor + ' + 6 = ' + (valor + 6) + '!';
          marcarSorteado(chave);
          conferirCriacao();
        });
      });
      secCriacao.appendChild(botao);
      secCriacao.appendChild(resultado);
      tourAlvos['sortear-' + chave] = botao;
      if (ficha[chave] !== null) marcarSorteado(chave);
    });

    secCriacao.appendChild(resumoCriacao);
    secCriacao.appendChild(continuarCriacao);
    conferirCriacao();
    painel.appendChild(secCriacao);
  }

  // --- seção: penalidade da página (só no modo digital) ---
  if (modoDigital && penalidadeDaPagina) {
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
    tourAlvos.penalidade = botaoPen;
  }

  // --- seção: caflito (só no modo digital) ---
  if (modoDigital && inimigoDaPagina) {
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
    var colHeroi = el('div', 'col', 'Você');
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
    tourAlvos.caflitoVs = vs;
    tourAlvos.caflitoBotao = botaoRodada;

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

  // --- seção: dado livre (nos dois modos; no papel é a estrela do painel) ---
  // sem botão: o jogador clica no próprio dado.
  // No modo digital ele destrava junto com o resto da ficha.
  var secDado = el('section', 'av-secao');
  if (modoDigital) secDado.appendChild(el('div', 'av-secao-titulo', '🎲 Dado'));
  var areaDado = el('div', 'av-dado-area');
  var dadoLivre = criarDado();
  mostrarFace(dadoLivre, 6);
  areaDado.appendChild(dadoLivre);
  secDado.appendChild(areaDado);
  var avisoDado = el('p', 'av-aviso');
  var resultadoDado = el('p', 'av-resultado');
  var dadoLiberado = !modoDigital || progresso >= 2;
  var dadoOcupado = false;
  if (dadoLiberado) {
    dadoLivre.classList.add('clicavel');
    dadoLivre.setAttribute('role', 'button');
    dadoLivre.setAttribute('aria-label', 'Jogar o dado');
    avisoDado.textContent = 'Clique no dado pra jogar!';
    dadoLivre.addEventListener('click', function () {
      if (dadoOcupado) return;
      dadoOcupado = true;
      resultadoDado.textContent = '...';
      rolarDado(dadoLivre, function (valor) {
        dadoOcupado = false;
        resultadoDado.textContent = 'Deu ' + valor + '!';
      });
    });
  }
  secDado.appendChild(avisoDado);
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
    // apaga TUDO do jogo: ficha (com o nome), luta, progresso, modo,
    // balõezinhos já vistos... a próxima aventura começa do zerinho
    Object.keys(localStorage).forEach(function (chave) {
      if (chave.indexOf('trapalhoes.') === 0) localStorage.removeItem(chave);
    });
    Object.keys(sessionStorage).forEach(function (chave) {
      if (chave.indexOf('trapalhoes.') === 0) sessionStorage.removeItem(chave);
    });
    location.href = './inicio.html';
  });
  painel.appendChild(botaoReset);

  // --- trocar de modo no meio do jogo ---
  var botaoModo = el('button', 'av-botao av-trocar-modo',
    modoDigital ? '📝 Prefiro jogar no papel' : '🖥️ Quero usar a ficha digital');
  botaoModo.type = 'button';
  botaoModo.addEventListener('click', function () {
    localStorage.setItem(CHAVE_MODO, modoDigital ? 'papel' : 'digital');
    location.reload();
  });
  painel.appendChild(botaoModo);

  /* ---------- nome escrito na própria página (modo digital) ---------- */

  var nomePagina = document.querySelector('.js-nome-jogador');
  var nomeEco = document.querySelector('.js-nome-eco');

  function ecoDoNome() {
    if (!nomeEco) return;
    var nome = (ficha.nome || '').trim();
    nomeEco.textContent = nome
      ? '⭐ Prazer, ' + nome + '! Você é o herói desta aventura!'
      : 'Sem nome? Sem problemas: seu herói será o Didiana Jones, o aventureiro destemido da revistinha!';
  }

  if (modoDigital && nomePagina) {
    nomePagina.value = ficha.nome || '';
    nomePagina.addEventListener('input', function () {
      ficha.nome = nomePagina.value;
      salvarFicha();
      if (inputNome) inputNome.value = nomePagina.value;
      atualizarTitulo();
    });
    nomePagina.addEventListener('input', ecoDoNome);
    if (inputNome) {
      inputNome.addEventListener('input', function () {
        nomePagina.value = inputNome.value;
        ecoDoNome();
      });
    }
  }
  ecoDoNome();

  /* ---------- tour de balõezinhos (modo digital) ---------- */

  function iniciarTour(chaveTour, passos) {
    if (localStorage.getItem(chaveTour)) return;
    var validos = passos.filter(function (p) { return p.alvo; });
    if (!validos.length) return;

    var overlay = el('div', 'av-tour-overlay');
    var balao = el('div', 'av-balao');
    var passosEl = el('div', 'av-balao-passos');
    var texto = el('p');
    var dica = el('p', 'av-balao-dica', '👆 Clique no botão brilhando pra continuar!');
    var botaoOk = el('button', 'av-botao', 'Entendi!');
    botaoOk.type = 'button';
    balao.appendChild(passosEl);
    balao.appendChild(texto);
    balao.appendChild(dica);
    balao.appendChild(botaoOk);
    document.body.appendChild(overlay);
    document.body.appendChild(balao);
    document.body.classList.add('av-tour');

    var i = -1;
    var alvoAtual = null;
    var alvoClicavel = null;

    function avancarPorClique() {
      alvoClicavel.removeEventListener('click', avancarPorClique);
      alvoClicavel = null;
      proximo();
    }

    function fim() {
      if (alvoAtual) alvoAtual.classList.remove('av-tour-alvo');
      if (alvoClicavel) alvoClicavel.removeEventListener('click', avancarPorClique);
      overlay.remove();
      balao.remove();
      document.body.classList.remove('av-tour');
      localStorage.setItem(chaveTour, '1');
    }

    function proximo() {
      i++;
      // pula passos que já foram cumpridos (ex.: poder já sorteado)
      while (i < validos.length && validos[i].pular && validos[i].pular()) i++;
      if (i >= validos.length) {
        fim();
        return;
      }
      if (alvoAtual) alvoAtual.classList.remove('av-tour-alvo');
      var passo = validos[i];
      alvoAtual = passo.alvo;
      alvoAtual.classList.add('av-tour-alvo');
      if (alvoAtual.scrollIntoView) alvoAtual.scrollIntoView({ block: 'nearest' });

      passosEl.textContent = validos.length > 1 ? (i + 1) + ' de ' + validos.length : '';
      texto.textContent = passo.texto;
      botaoOk.textContent = i === validos.length - 1 ? 'Entendi! Vamos lá!' : 'Entendi!';

      // passo interativo: só avança clicando no próprio alvo destacado
      if (passo.esperarClique) {
        botaoOk.style.display = 'none';
        dica.style.display = '';
        alvoClicavel = alvoAtual;
        alvoClicavel.addEventListener('click', avancarPorClique);
      } else {
        botaoOk.style.display = '';
        dica.style.display = 'none';
      }

      // posiciona o balão: de preferência à esquerda do alvo,
      // senão embaixo (ou em cima, se não couber)
      var r = alvoAtual.getBoundingClientRect();
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      balao.className = 'av-balao';
      var bw = balao.offsetWidth;
      var bh = balao.offsetHeight;
      var x = r.left - bw - 22;
      var y;
      if (x >= 8) {
        balao.classList.add('rabo-direita');
        y = Math.max(8, Math.min(r.top + r.height / 2 - bh / 2, vh - bh - 8));
      } else {
        x = Math.max(8, Math.min(r.left + r.width / 2 - bw / 2, vw - bw - 8));
        if (r.bottom + bh + 24 <= vh - 8) {
          balao.classList.add('rabo-cima');
          y = r.bottom + 20;
        } else {
          balao.classList.add('rabo-baixo');
          y = Math.max(8, r.top - bh - 20);
        }
      }
      balao.style.left = x + 'px';
      balao.style.top = y + 'px';
    }

    botaoOk.addEventListener('click', proximo);
    overlay.addEventListener('click', function () {
      if (validos[i] && validos[i].esperarClique) {
        balao.classList.add('chacoalha');
        setTimeout(function () { balao.classList.remove('chacoalha'); }, 700);
        return;
      }
      proximo();
    });
    proximo();
  }

  // botão "rever a explicação" (página do reExplicandoCaflito)
  var revers = document.querySelectorAll('.js-rever-caflito');
  for (var rv = 0; rv < revers.length; rv++) {
    revers[rv].addEventListener('click', function () {
      localStorage.removeItem(TOUR_CAFLITO);
      history.back();
    });
  }

  /* ---------- escolha de itens na página do guarda-roupa ---------- */

  var montarItens = document.querySelector('.js-escolher-itens');
  var avisoItens = null;
  if (modoDigital && montarItens) {
    var gradeItens = el('div', 'escolhaItens');
    var contadorItens = el('p', 'contadorItens');
    avisoItens = el('p', 'avisoItens');

    function atualizarContador() {
      contadorItens.textContent = 'Mochila: ' + ficha.itens.length + ' de 4 itens (+ o chicote, que vai sempre com você)';
      if (ficha.itens.length === 4) {
        avisoItens.textContent = '';
        contadorItens.style.color = '#2e7d32';
      } else {
        contadorItens.style.color = '';
      }
    }

    ITENS.forEach(function (item) {
      var carta = el('button', 'itemCard');
      carta.type = 'button';
      var img = el('img');
      img.src = item.img;
      img.alt = item.nome;
      carta.appendChild(img);
      carta.appendChild(el('span', null, item.nome));
      carta.appendChild(el('span', 'marcado', '✔'));
      if (ficha.itens.indexOf(item.id) >= 0) carta.classList.add('escolhido');

      carta.addEventListener('click', function () {
        var posicao = ficha.itens.indexOf(item.id);
        if (posicao >= 0) {
          ficha.itens.splice(posicao, 1);
          carta.classList.remove('escolhido');
        } else if (ficha.itens.length >= 4) {
          avisoItens.textContent = 'Só cabem 4 itens na mochila! Desmarque um pra trocar.';
          return;
        } else {
          ficha.itens.push(item.id);
          carta.classList.add('escolhido');
          avisoItens.textContent = '';
        }
        salvarFicha();
        atualizarContador();
        atualizarMochila();
      });
      gradeItens.appendChild(carta);
    });

    montarItens.appendChild(gradeItens);
    montarItens.appendChild(contadorItens);
    montarItens.appendChild(avisoItens);
    atualizarContador();
  }

  var continuarItens = document.querySelector('.js-continuar-itens');
  if (modoDigital && continuarItens) {
    continuarItens.addEventListener('click', function (ev) {
      if (ficha.itens.length < 4) {
        ev.preventDefault();
        if (avisoItens) avisoItens.textContent = 'Escolha 4 itens antes de continuar!';
        if (montarItens) montarItens.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  /* ---------- botão flutuante ---------- */

  // no modo papel só chamamos atenção onde o dado é necessário
  var precisaAtencao = modoDigital
    ? (inimigoDaPagina || penalidadeDaPagina || pagina === PAGINA_CRIACAO || pagina === PAGINA_NOME)
    : (inimigoDaPagina || pagina === PAGINA_CRIACAO);

  var toggle = el('button', 'av-toggle', '🎲<span class="av-toggle-alerta">!</span>');
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Abrir ou fechar a ficha de aventura');
  if (precisaAtencao) toggle.classList.add('tem-alerta');

  function painelAberto() {
    return document.body.classList.contains('av-aberto');
  }

  function ajustarToggle() {
    toggle.innerHTML = (painelAberto() ? '✕' : '🎲') + '<span class="av-toggle-alerta">!</span>';
  }

  toggle.addEventListener('click', function () {
    document.body.classList.toggle('av-aberto');
    localStorage.setItem(CHAVE_ABERTO, painelAberto() ? '1' : '0');
    toggle.classList.remove('tem-alerta');
    ajustarToggle();
  });

  // abre sozinho em telas largas (ou onde o jogador deixou aberto);
  // nas páginas que precisam do painel, abre sempre pra criança não perder
  var preferencia = localStorage.getItem(CHAVE_ABERTO);
  var abrir = preferencia === null ? window.innerWidth >= 1100 : preferencia === '1';
  if (precisaAtencao) abrir = true;
  if (abrir) document.body.classList.add('av-aberto');

  document.body.appendChild(painel);
  document.body.appendChild(toggle);
  ajustarToggle();
  atualizarFicha();

  // tours: só no modo digital, com o painel aberto na tela
  if (modoDigital && painelAberto()) {
    if (inimigoDaPagina) {
      iniciarTour(TOUR_CAFLITO, [
        { alvo: tourAlvos.caflitoVs, texto: 'CAFLITO! Você vai enfrentar o ' + inimigoDaPagina.nome + '! Olha ele aqui, já com o ATAQUE e a ENERGIA anotados. Nem precisou de lápis!' },
        { alvo: tourAlvos.caflitoVs, texto: 'Esses corações ❤️ são a ENERGIA de cada um. Quem ficar sem corações primeiro, perde o CAFLITO!' },
        { alvo: tourAlvos.caflitoBotao, texto: 'Pra lutar, clique aqui! Os dois dados giram, e cada lado soma o seu dado com o seu ATAQUE. Quem fizer MENOS perde 1 coração.' },
        { alvo: tourAlvos.caflitoBotao, texto: 'Empatou? Ninguém perde nada, é só jogar de novo. Quando a luta acabar, o botão certo da história vai piscar. Boa sorte, herói!' }
      ]);
    } else if (pagina === PAGINA_CRIACAO) {
      iniciarTour(TOUR_CRIACAO, [
        { alvo: tourAlvos.ficha, texto: 'Essa é a sua ficha digital! Ela guarda seu nome, seu ATAQUE e sua ENERGIA durante a aventura inteira.' },
        { alvo: tourAlvos['sortear-ataque'], texto: 'Clique aqui pra descobrir o seu ATAQUE: o dado gira, soma 6 e anota na ficha sozinho!', esperarClique: true, pular: function () { return ficha.ataque !== null; } },
        { alvo: tourAlvos['sortear-energia'], texto: 'Boa! Agora clique aqui pra descobrir a sua ENERGIA. Cada poder é sorteado uma vez só!', esperarClique: true, pular: function () { return ficha.energia !== null; } },
        { alvo: tourAlvos.ficha, texto: 'Herói pronto! Quando os dois números aparecerem na ficha, é só apertar o botão verde CONTINUAR A AVENTURA.' }
      ]);
    } else if (penalidadeDaPagina) {
      iniciarTour(TOUR_PENALIDADE, [
        { alvo: tourAlvos.penalidade, texto: 'Ui, seu herói levou um golpe! Quando isso acontecer, clique neste botão que eu desconto os pontos na sua ficha pra você.', esperarClique: true, pular: function () { return tourAlvos.penalidade.disabled; } }
      ]);
    }
  }
})();

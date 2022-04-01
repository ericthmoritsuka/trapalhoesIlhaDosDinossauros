//declarando variáveis
const botao = document.getElementById("botaoInicio");
const inputNome = document.getElementById("nomeInput");
const jsTexto = document.getElementById("jsTextoInicio");

const a = document.getElementById("linkInicio");
const mensagem = document.getElementById("jsMensagemInicio");
let nome = ''

//criando função do event
const salvaNome = () => {
  nome = document.getElementById("input").value;
  if (nome.length > 0) {
    inputNome.classList.toggle("ativo");
    const nomesDoJogador = document.querySelectorAll(".nomeDoJogador");
    nomesDoJogador.forEach((nomeDoJogador) => {
      nomeDoJogador.innerHTML = nome;
    });
    jsTexto.classList.toggle("ativo");
    mensagem.classList.remove("ativo");
    checkNome(nome);
  }
};

//chamando o event
if (botao) {
  botao.addEventListener("click", salvaNome);
}

//função para checar se há nome ou não
const checkNome = (nome) => {
  if (nome.length > 0) {
    a.href = "./ataque.html";
  } else {
    mensagem.classList.add("ativo");
  }
};



const insereNome = (nome) => {
  if (document.querySelector('.nomeDoJogador')){
    document.querySelector('.nomeDoJogador') = nome
}};

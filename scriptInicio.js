//declarando variáveis
const botao = document.querySelector("button");
const inputNome = document.querySelector(".inputNome");
const jsTexto = document.querySelector(".jsTexto");
let nome = "";

const img = document.querySelector('[src^="./img/Didiana"]');
const a = document.getElementById("link");
const mensagem = document.querySelector(".jsMensagem");

//criando função do event
const salvaNome = () => {
  nome = document.querySelector("input").value;
  if (document.querySelector("input").value.length > 0) {
    inputNome.classList.toggle("ativo");
    document.querySelector(".nomeDoJogador").innerHTML = nome;
    jsTexto.classList.toggle("ativo");
    mensagem.classList.remove("ativo");
    checkNome(nome);
  }
};

//chamando o event
botao.addEventListener("click", salvaNome);

//função para checar se há nome ou não
const checkNome = (nome) => {
  if (nome.length > 0) {
    a.href = "./ataque.html";
  } else {
    mensagem.classList.add("ativo");
  }
}
//inicio
const botao = document.querySelector("button");
const inputNome = document.querySelector(".inputNome");
const jsTexto = document.querySelector(".jsTexto");
let nome = "";

const salvaNome = () => {
  nome = document.querySelector("input").value;
  if (document.querySelector("input").value.length > 0) {
    inputNome.classList.toggle("ativo");
    document.querySelector(".nomeDoJogador").innerHTML = nome;
    jsTexto.classList.toggle("ativo");
  }
};

botao.addEventListener("click", salvaNome);

export { nome };

//checando se há um nome para continuar
const img = document.querySelector('[src^="./img/Didiana"]');
const a = document.querySelector("a");
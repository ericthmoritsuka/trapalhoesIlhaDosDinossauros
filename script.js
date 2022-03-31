const botao = document.querySelector("button");
const inputNome = document.querySelector(".inputNome");
const jsTexto = document.querySelector(".jsTexto");

const salvaNome = () => {
  if (document.querySelector("input").value.length > 0) {
    const nome = document.querySelector("input").value;
    inputNome.classList.toggle("ativo");
    document.querySelector(".nomeDoJogador").innerHTML = nome;
    jsTexto.classList.toggle("ativo");
  }
};

botao.addEventListener("click", salvaNome);
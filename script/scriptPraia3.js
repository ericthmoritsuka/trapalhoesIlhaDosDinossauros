// pousoSucesso2: a primeira imagem revela a surpresa; a imagem revelada
// leva pra próxima página — o quadrinho é o próprio botão
const imgs = document.querySelectorAll(".jsImagem");
const img1 = imgs[0];
const img2 = imgs[1];

let reveladaEm = 0;

img1.addEventListener("click", (event) => {
  event.preventDefault();
  img1.classList.remove("ativo");
  img2.classList.add("ativo");
  reveladaEm = Date.now();
});

img2.addEventListener("click", () => {
  // o segundo clique de um duplo-clique não pula a surpresa
  if (Date.now() - reveladaEm < 500) return;
  location.href = "./pousoSucesso3.html";
});

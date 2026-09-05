// pousoSucesso2: a primeira imagem revela a surpresa; a imagem revelada
// leva pra próxima página — o quadrinho é o próprio botão
const imgs = document.querySelectorAll(".jsImagem");
const img1 = imgs[0];
const img2 = imgs[1];

img1.addEventListener("click", (event) => {
  event.preventDefault();
  img1.classList.remove("ativo");
  img2.classList.add("ativo");
});

img2.addEventListener("click", () => {
  location.href = "./pousoSucesso3.html";
});

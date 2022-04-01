const imgs = document.querySelectorAll(".jsImagem");
const img1 = imgs[0]
const img2 = imgs[1]

const mudaImagem = (event) => {
  event.preventDefault();
  img2.classList.toggle('ativo')
  img1.classList.toggle('ativo')
};

img1.addEventListener("click", mudaImagem);

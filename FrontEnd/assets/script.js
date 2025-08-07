//---- Récupère les projets depuis l'API (format JSON)
const fetchWorks = async () => {
  const response = await fetch("http://localhost:5678/api/works");
  return await response.json();
};

//---- Crée un élément <figure> représentant un projet
const createFigure = (project) => {
  const figure = document.createElement("figure");
  // Crée l'image avec un texte alternatif
  const img = document.createElement("img");
  img.src = project.imageUrl;
  img.alt = project.title;
  // Crée la légende (titre) du projet
  const figcaption = document.createElement("figcaption");
  figcaption.textContent = project.title;
  // Insère l'image et la légende dans la figure
  figure.appendChild(img);
  figure.appendChild(figcaption);

  return figure;
};

//---- Création de la galerie de projets
const renderGallery = async () => {
  // Récupère l'élément du DOM qui accueillera les projets
  const gallery = document.querySelector(".gallery");
  // Réinitialise le contenu HTML existant de la galerie
  gallery.innerHTML = "";
  // Récupère les projets depuis l'API
  const works = await fetchWorks();
  // Crée et ajoute chaque projet à la galerie
  works.forEach((project) => {
    const figure = createFigure(project);
    gallery.appendChild(figure);
  });
};

//---- Lance le rendu de la galerie au chargement
renderGallery();

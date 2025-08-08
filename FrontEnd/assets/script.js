// Mise en cache des données de l'API
let cachedWorks = null;

// -------------- Galerie --------------

//---- Récupère les projets depuis l'API (format JSON)
const fetchWorks = async () => {
  // Vérifie si les données sont en déjà en cache
  if (cachedWorks) {
    return cachedWorks;
  }
  // Effectue une requête à l'API si les données ne sont pas en cache
  const response = await fetch("http://localhost:5678/api/works");
  cachedWorks = await response.json();
  return cachedWorks;
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
const renderGallery = async (works) => {
  // Récupère l'élément du DOM qui accueillera les projets
  const gallery = document.querySelector(".gallery");
  // Réinitialise le contenu HTML existant de la galerie
  gallery.innerHTML = "";
  // Crée et ajoute chaque projet à la galerie
  works.forEach((project) => {
    const figure = createFigure(project);
    gallery.appendChild(figure);
  });
};

// -------------- Filters --------------

// Récupère l'élément du DOM qui accueillera les filtres
const filters = document.querySelector(".filters");

//---- Crée un bouton de filtre
const createFilterButton = (category) => {
  const filterButton = document.createElement("button");
  filterButton.classList.add("filter-button");
  filterButton.textContent = category;

  // Ajout d'un écouteur d'événements pour chaque bouton créé
  filterButton.addEventListener("click", () => {
    const selectedCategory = filterButton.textContent;
    // Si la catégorie est "Tous", affiche tous les projets
    if (selectedCategory === "Tous") {
      renderGallery(cachedWorks);
    } else {
      // Filtre les projets selon la catégorie sélectionnée
      const filteredProject = cachedWorks.filter((project) => {
        return selectedCategory === project.category.name;
      });
      renderGallery(filteredProject);
    }
  });

  return filterButton;
};

//---- Ajoute les boutons de filtres
const renderCategories = async (works) => {
  // Crée un ensemble de catégories uniques à partir des projets récupérés
  const categories = new Set(works.map((project) => project.category.name));
  // Réinitialise les filtres
  filters.innerHTML = "";
  // Crée et ajoute le bouton "Tous"
  const allButton = createFilterButton("Tous");
  filters.appendChild(allButton);
  // Crée et ajoute un bouton de filtre pour chaque catégorie
  categories.forEach((category) => {
    const filterButton = createFilterButton(category);
    filters.appendChild(filterButton);
  });
};

// ---- Fonction principale
const initGalleryApp = async () => {
  const works = await fetchWorks();
  renderGallery(works);
  renderCategories(works);
};

initGalleryApp();

// ====================
// TABLE DES MATIÈRES
// ====================
// 1. Données & API
// 2. Galerie
// 3. Filtres
// 4. Mode Édition
// 5. Modale Principale
// 6. Modale Galerie
// 7. Ajout de projet

// ============= DONNÉES & API =============

// Mise en cache des données de l'API
let cachedWorks = null;

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

// ============= Galerie =============

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

// ============= Filtres =============

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
      const filteredProjects = cachedWorks.filter((project) => {
        return selectedCategory === project.category.name;
      });
      renderGallery(filteredProjects);
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

// ============= Mode Edition =============

// Vérifie si un token est présent dans le localStorage
const token = sessionStorage.getItem("token");
// Récupère la valeur du paramètre "edit" dans l'URL
const urlParams = new URLSearchParams(window.location.search);
const editMode = urlParams.get("edit");

//  Active le mode édition si il y a un token et que "edit=true"
if (token && editMode) {
  // Crée la bannière du mode édition
  const body = document.querySelector("body");
  const editModeBanner = document.createElement("div");
  editModeBanner.classList.add("edit-mode-banner");
  editModeBanner.innerHTML =
    ' <i class="icon fa-regular fa-pen-to-square"></i><p>mode édition</p>';
  body.insertBefore(editModeBanner, body.firstChild);

  // Crée le bouton du mode édition
  const titleContainer = document.getElementById("title-container");
  titleContainer.style.margin = "80px 0";
  const editButton = document.createElement("a");

  editButton.href = "edit.html#modal1";
  editButton.classList.add("edit-btn");
  editButton.innerHTML =
    ' <i class="icon fa-regular fa-pen-to-square"></i><p>modifier</p>';
  titleContainer.appendChild(editButton);
  // Ajoute un écouteur de clic pour ouvrir la modale
  editButton.addEventListener("click", (e) => {
    e.preventDefault();
    // Vérifie si l'élément cliqué est un enfant de <a>
    const linkElement = e.target.closest("a");
    openModal(linkElement);
  });

  // Masque la section des les filtres
  filters.style.display = "none";
}

// ============= Modale Principale =============

// Sélecteur des éléments pouvant recevoir le focus dans la modale
const focusableSelector = "button, a, input, select, textarea";

// Variables globales pour la gestion de la modale et du focus
let modal = null;
let focusables = [];
let previouslyFocusedElement = null;

//---- Gère les touches "Escape" pour fermer et "Tab" pour naviguer dans la modale
const handleKeyDown = (e) => {
  if (e.key === "Escape" || e.key === "Esc") {
    closeModal(e);
  }
  if (e.key === "Tab") {
    focusInModal(e);
  }
};

//---- Empêche la propagation de l'événement lors d'un clic à l'intérieur de la modale
const stopPropagation = (e) => {
  e.stopPropagation();
};

//---- Charge la modal à partir d'une URL
const loadModal = async (url) => {
  const target = "#" + url.split("#")[1];
  // vérifie si la modal est déjà présente dans le DOM
  const existingModal = document.querySelector(target);
  if (existingModal !== null) {
    return existingModal;
  }
  // Récupère le contenu de l'url
  const html = await fetch(url).then((res) => res.text());
  // Récupère le contenu a afficher dans la modale
  const element = document
    .createRange()
    .createContextualFragment(html)
    .querySelector(target);
  if (element === null) {
    throw `L'élément ${target} n'a pas été trouvé dans la page`;
  }
  // Insère la modale dans le body
  document.body.append(element);
  return element;
};

//--- Crée un tableau des éléments focusables visibles
const updateFocusableElements = () => {
  focusables = Array.from(modal.querySelectorAll(focusableSelector)).filter(
    (element) => {
      const style = window.getComputedStyle(element);
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        !element.disabled &&
        !element.closest(".modal-hidden")
      );
    }
  );
};

//---- Ouvre la fenêtre modale ciblée et initialise la gestion du focus et des événements
const openModal = async (e) => {
  // Récupère l'ID de la modale depuis le lien cliqué
  const target = e.getAttribute("href");
  modal = await loadModal(target);
  // Initialise la galerie des projets dans la modale (vue miniature + suppression)
  await initModalGallery();
  // Active le bouton "Ajouter un projet" pour changer de page
  await initAddProjectModal();
  // Sauvegarde l'élément actuellement focusé sur la page
  previouslyFocusedElement = document.querySelector(":focus");
  // Affiche la modale et place le focus sur le premier élément interactif
  modal.classList.remove("modal-hidden");
  modal.setAttribute("aria-modal", "true");
  modal.removeAttribute("aria-hidden");
  // Initialise le tableau des éléments focusables visibles
  updateFocusableElements();
  focusables[0].focus();
  // Active les contrôles clavier : Escape pour fermer, Tab pour naviguer dans la modale
  modal.addEventListener("click", closeModal);
  modal.querySelector(".js-modal-close").addEventListener("click", closeModal);
  modal
    .querySelector(".js-modal-stop")
    .addEventListener("click", stopPropagation);
  window.addEventListener("keydown", handleKeyDown);
};

//---- Ferme la modale, restaure le focus initial et nettoie les événements
const closeModal = (e) => {
  e.preventDefault();
  if (modal === null) return;

  // Affiche toujours la page galerie à la réouverture
  setTimeout(() => {
    showGalleryPage();
  }, 800);

  // Restaure le focus sur l'élément actif avant l'ouverture de la modale
  if (previouslyFocusedElement !== null) {
    previouslyFocusedElement.focus();
  }
  // Attendre que l'animation de fermeture se termine avant de masquer la modale
  const hideModalAnimation = function () {
    modal.classList.add("modal-hidden");
    modal.removeEventListener("animationend", hideModalAnimation);
    modal = null;
  };
  modal.addEventListener("animationend", hideModalAnimation);
  // Masque la fenetre modale et supprime les écouteurs d'événements
  modal.removeAttribute("aria-modal");
  modal.setAttribute("aria-hidden", "true");
  modal.removeEventListener("click", closeModal);
  modal
    .querySelector(".js-modal-close")
    .removeEventListener("click", closeModal);
  modal
    .querySelector(".js-modal-stop")
    .removeEventListener("click", stopPropagation);
  window.removeEventListener("keydown", handleKeyDown);
};

//---- Empêche le focus de sortir de la modale avec Tab ou Shift+Tab
const focusInModal = (e) => {
  // Détermine l'index de l'élément qui a le focus
  let index = focusables.findIndex((f) => f === modal.querySelector(":focus"));

  if (e.shiftKey === true) {
    index--;
  } else {
    index++;
  }
  if (index >= focusables.length) {
    index = 0;
  }
  if (index < 0) {
    index = focusables.length - 1;
  }
  focusables[index].focus();
  e.preventDefault();
};

// ============= Modale Galerie =============

//---- Crée un élément <figure> représentant un projet dans la modale
const createModalFigure = (project) => {
  const figure = document.createElement("figure");
  // Crée l'image avec un texte alternatif
  const img = document.createElement("img");
  img.src = project.imageUrl;
  img.alt = project.title;
  // Crée la légende (titre) du projet
  const deleteProject = document.createElement("div");
  deleteProject.classList.add("delete-project");
  deleteProject.innerHTML =
    '<button class="delete-project-btn" aria-label="Supprimer le projet">' +
    '<i class="fa-solid fa-trash-can"></i>' +
    "</button>";
  // Insère l'image dans la figure
  figure.appendChild(img);
  figure.appendChild(deleteProject);
  return figure;
};

//---- Création de la galerie de projets
const renderModalGallery = async (works) => {
  // Récupère l'élément du DOM qui accueillera les projets
  const modalGallery = document.querySelector(".modal-gallery");
  // Réinitialise le contenu HTML existant de la galerie
  modalGallery.innerHTML = "";
  // Crée et ajoute chaque projet à la galerie
  works.forEach((project) => {
    const figure = createModalFigure(project);
    modalGallery.appendChild(figure);
  });
};

//---- Initialise l'affichage de la galerie
const initModalGallery = async () => {
  const works = await fetchWorks();
  await renderModalGallery(works);
};

// ============= Modale Ajout de projet =============

//---- Change la page visible dans la modale

const showGalleryPage = () => {
  const backToGallery = document.querySelector(".back-to-gallery");
  const galleryPage = document.getElementById("modal-gallery-page");
  const addProjectPage = document.getElementById("modal-add-project-page");
  // Affiche la galerie, masque la page ajout de projet
  galleryPage.classList.remove("modal-hidden");
  backToGallery.classList.add("modal-hidden");
  addProjectPage.classList.add("modal-hidden");
  // Actualise la liste des éléments focusables
};

const showAddProjectPage = () => {
  const backToGallery = document.querySelector(".back-to-gallery");
  const galleryPage = document.getElementById("modal-gallery-page");
  const addProjectPage = document.getElementById("modal-add-project-page");
  // Affiche la page ajout de projet, masque la galerie
  galleryPage.classList.add("modal-hidden");
  backToGallery.classList.remove("modal-hidden");
  addProjectPage.classList.remove("modal-hidden");
  // Actualise la liste des éléments focusables
};

const changeModalPage = () => {
  const backToGallery = document.querySelector(".back-to-gallery");
  const goToAddProjectBtn = document.querySelector(".add-project");
  // Ouvre la modale de la galerie
  backToGallery.addEventListener("click", (e) => {
    e.preventDefault();
    showGalleryPage();
    updateFocusableElements();
  });

  // Ouvre la modale d'ajout de projet
  goToAddProjectBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showAddProjectPage();
    updateFocusableElements();
  });
};

//---- Ajoute les categories dans l'input select
const categorySelectInput = async () => {
  const selectInput = document.getElementById("category-selection");
  const works = await fetchWorks();
  // Crée un ensemble de catégories uniques à partir des projets récupérés
  const categories = new Set(works.map((project) => project.category.name));
  // Crée et ajoute une option de selection pour chaque catégorie
  categories.forEach((category) => {
    const categoryOption = document.createElement("option");
    categoryOption.value = category;
    categoryOption.textContent = category;
    selectInput.appendChild(categoryOption);
  });
};

//---- Initialise la drop zone pour l'ajout de photo
const initDropZone = () => {
  const dropContainer = document.getElementById("drop-container");
  const fileInput = document.getElementById("add-photo");
  // Vérifie l'entrée et sortie de la drop zone
  let dragCounter = 0;

  dropContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  dropContainer.addEventListener("dragenter", (e) => {
    dragCounter++;
    if (dragCounter === 1) {
      dropContainer.classList.add("drag-active");
    }
  });

  dropContainer.addEventListener("dragleave", () => {
    dragCounter--;
    if (dragCounter === 0) {
      dropContainer.classList.remove("drag-active");
    }
  });

  dropContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropContainer.classList.remove("drag-active");
    const file = e.dataTransfer.files[0];
    fileInput.files = e.dataTransfer.files;
    //---- Ajoute la preview de l'input file
    displayImagePreview(file);
  });
};
//---- Initialise le bouton d'ajout de photo
const initAddPhotoBtn = () => {
  const addPhotoInput = document.getElementById("add-photo");
  const addPhotoBtn = document.querySelector(".add-photo-btn");
  const dropContainer = document.getElementById("drop-container");
  dropContainer.addEventListener("click", (e) => {
    addPhotoInput.click();
  });
  addPhotoBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    addPhotoInput.click();
  });
};

//---- Affiche la mignature de la photo à envoyer
const displayImagePreview = (file) => {
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dropContainer = document.getElementById("drop-container");
      const preview = document.createElement("img");
      // e.target.result est une Data URL
      preview.src = e.target.result;
      preview.classList.add("photo-preview");
      preview.alt = "Preview de la photo téléchargée.";
      preview.style.display = "block";
      dropContainer.appendChild(preview);
    };
    // Lecture du fichier image
    reader.readAsDataURL(file);
  }
};

//---- Initialise le preview de l'image du projet chargé
const initPhotoPreviewListener = () => {
  const fileInput = document.getElementById("add-photo");
  fileInput.addEventListener("change", (e) => {
    displayImagePreview(e.target.files[0]);
  });
};

//---- Initialise le bouton d'ajout de projet
const checkFormInputs = () => {
  const form = document.getElementById("add-project-form");
  const addBtn = document.getElementById("addBtn");
  // Crée un tableau de tous les champs requis
  const requiredInputs = Array.from(
    form.querySelectorAll("input[required], select[required]")
  );
  // Vérifie que tous les champs requis sont remplis et active le bouton
  const updateAddBtn = () => {
    let allFilled = true;
    requiredInputs.forEach((input) => {
      if (input.value === "") {
        allFilled = false;
      }
      if (allFilled) {
        addBtn.disabled = false;
        updateFocusableElements();
      } else {
        addBtn.disabled = true;
      }
    });
  };
  // Surveille les changements dans les champs
  requiredInputs.forEach((input) => {
    input.addEventListener("input", updateAddBtn);
    input.addEventListener("change", updateAddBtn);
  });
  // Vérifie l'état initial des champs requis
  updateAddBtn();
};

//---- Initialise et affiche la modale d'ajout de projet
const initAddProjectModal = async () => {
  changeModalPage();
  await categorySelectInput();
  initDropZone();
  initAddPhotoBtn();
  initPhotoPreviewListener();
  checkFormInputs();
};

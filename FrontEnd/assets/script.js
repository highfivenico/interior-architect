// ====================
// TABLE DES MATIÈRES
// ====================
// 1. Données & API
// 2. Galerie
// 3. Filtres
// 4. Mode Édition
// 5. Modale Principale
// 6. Modale Galerie
// 7. Modale de message
// 8. Ajout de projet

// ============= DONNÉES & API =============

// Mise en cache des données de l'API
let cachedProjects = null;

//---- Récupère les projets depuis l'API (format JSON)
const fetchprojects = async () => {
  // Vérifie si les données sont en déjà en cache
  if (cachedProjects) {
    return cachedProjects;
  }
  // Effectue une requête à l'API si les données ne sont pas en cache
  const response = await fetch("http://localhost:5678/api/works");
  cachedProjects = await response.json();
  return cachedProjects;
};

// ============= Galerie =============

// Récupère l'élément du DOM qui accueillera les projets
const gallery = document.querySelector(".gallery");

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
const renderGallery = async (projects) => {
  // Réinitialise le contenu HTML existant de la galerie
  gallery.innerHTML = "";
  // Crée et ajoute chaque projet à la galerie
  projects.forEach((project) => {
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
  filterButton.addEventListener("click", (e) => {
    const selectedCategory = filterButton.textContent;

    //Supprime la classe filter-button-active de tous les boutons
    document.querySelectorAll(".filter-button").forEach((filterBtn) => {
      filterBtn.classList.remove("filter-button-active");
    });
    //Ajoute la classe filter-button-active sur le bouton selectionné
    filterButton.classList.add("filter-button-active");

    // Si la catégorie est "Tous", affiche tous les projets
    if (selectedCategory === "Tous") {
      renderGallery(cachedProjects);
    } else {
      // Filtre les projets selon la catégorie sélectionnée
      const filteredProjects = cachedProjects.filter((project) => {
        return selectedCategory === project.category.name;
      });
      renderGallery(filteredProjects);
    }
  });

  return filterButton;
};

//---- Ajoute les boutons de filtres
const renderCategories = async (projects) => {
  // Crée un ensemble de catégories uniques à partir des projets récupérés
  const categories = new Set(projects.map((project) => project.category.name));
  // Réinitialise les filtres
  filters.innerHTML = "";
  // Crée et ajoute le bouton "Tous"
  const allButton = createFilterButton("Tous");
  allButton.classList.add("filter-button-active");
  filters.appendChild(allButton);
  // Crée et ajoute un bouton de filtre pour chaque catégorie
  categories.forEach((category) => {
    const filterButton = createFilterButton(category);
    filters.appendChild(filterButton);
  });
};

// ---- Fonction principale
const initGalleryApp = async () => {
  const projects = await fetchprojects();
  renderGallery(projects);
  renderCategories(projects);
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

  // Change le bouton login en bouton logout
  const loginButton = document.getElementById("login-logout-btn");
  loginButton.textContent = "logout";

  const logout = (e) => {
    e.preventDefault();
    // Supprime le token du sessionStorage
    sessionStorage.removeItem("token");
    // Redirige vers la page de connexion
    window.location.href = "index.html";
  };
  // Initialise le bouton logout
  loginButton.addEventListener("click", logout);

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
  // Restaure le focus sur l'élément actif avant l'ouverture de la modale
  if (previouslyFocusedElement !== null) {
    previouslyFocusedElement.focus();
  }
  // Attendre que l'animation de fermeture se termine avant de masquer la modale
  const hideModalAnimation = () => {
    modal.classList.add("modal-hidden");
    modal.removeEventListener("animationend", hideModalAnimation);
    // Affiche toujours la page galerie à la réouverture
    showGalleryPage();
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
  // Vide le formulaire et l'image preview
  const addProjectForm = document.getElementById("add-project-form");
  if (addProjectForm) {
    addProjectForm.reset();
    clearImagePreview();
  }
  // nettoie les événements du formulaire
  removeFormEventListener();
};

//---- Empêche le focus de sortir de la modale avec Tab ou Shift+Tab
const focusInModal = (e) => {
  e.preventDefault();
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
};

// ============= Modale Galerie =============

//---- Crée un élément <figure> représentant un projet dans la modale
const createModalFigure = (project) => {
  const figure = document.createElement("figure");
  // Crée l'image avec un texte alternatif
  const img = document.createElement("img");
  img.src = project.imageUrl;
  img.alt = project.title;
  // Crée le bouton de suppression du projet
  const deleteProject = document.createElement("div");
  deleteProject.classList.add("delete-project");
  deleteProject.innerHTML =
    '<button class="delete-project-btn" aria-label="Supprimer le projet">' +
    '<i class="fa-solid fa-trash-can"></i>' +
    "</button>";
  deleteProject.addEventListener("click", (e) => {
    e.preventDefault();
    if (
      confirm(`Voulez-vous vraiment supprimer le travail : ${project.title}?`)
    ) {
      deleteProjectFromAPI(project.id);
    }
  });
  // Insère l'image dans la figure
  figure.appendChild(img);
  figure.appendChild(deleteProject);
  return figure;
};

//---- Suppression du projet sélectionné et actualisation de la galerie
const deleteProjectFromAPI = (id) => {
  fetch(`http://localhost:5678/api/works/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  }).then((response) => {
    if (response.ok) {
      cachedProjects = cachedProjects.filter((project) => project.id !== id);
      initModalGallery();
      initGalleryApp();
    }
  });
};

//---- Création de la galerie de projets
const renderModalGallery = async (projects) => {
  // Récupère l'élément du DOM qui accueillera les projets
  const modalGallery = document.querySelector(".modal-gallery");
  // Réinitialise le contenu HTML existant de la galerie
  modalGallery.innerHTML = "";
  // Crée et ajoute chaque projet à la galerie
  projects.forEach((project) => {
    const figure = createModalFigure(project);
    modalGallery.appendChild(figure);
  });
};

//---- Initialise l'affichage de la galerie
const initModalGallery = async () => {
  const projects = await fetchprojects();
  await renderModalGallery(projects);
};

// ============= Modale Message =============

//---- Ouvre la modale de message pour afficher des notifications
const showMessageModal = (message) => {
  const messageModale = document.querySelector(".message-modal");
  const messageModaleText = document.querySelector(".message-modal-wrapper p");
  messageModale.style.display = "block";
  messageModaleText.textContent = message;
  // Active les contrôles pour fermer la modale
  messageModale.addEventListener("click", closeMessageModale);
  messageModale
    .querySelector(".message-modale-close")
    .addEventListener("click", closeMessageModale);
  messageModale.addEventListener("click", stopPropagation);
  // Ferme la modale de message avec un appui clavier
  window.addEventListener("keydown", closeMessageModale);
  // Ferme la modale après 3 secondes
  setTimeout(() => {
    closeMessageModale();
  }, 3000);
};

//---- Ferme la modale de message
const closeMessageModale = (e) => {
  const messageModale = document.querySelector(".message-modal");
  messageModale.style.display = "none";
};

// ============= Modale Ajout de projet =============

//---- Change la page visible dans la modale
// Affiche la galerie, masque la page ajout de projet
const showGalleryPage = () => {
  const galleryPage = document.getElementById("modal-gallery-page");
  const backToGalleryBtn = document.querySelector(".back-to-gallery");
  const addProjectPage = document.getElementById("modal-add-project-page");
  galleryPage.classList.remove("modal-hidden");
  backToGalleryBtn.classList.add("modal-hidden");
  addProjectPage.classList.add("modal-hidden");
};
// Affiche la page ajout de projet, masque la galerie
const showAddProjectPage = () => {
  const galleryPage = document.getElementById("modal-gallery-page");
  const backToGalleryBtn = document.querySelector(".back-to-gallery");
  const addProjectPage = document.getElementById("modal-add-project-page");
  galleryPage.classList.add("modal-hidden");
  backToGalleryBtn.classList.remove("modal-hidden");
  addProjectPage.classList.remove("modal-hidden");
};
// Initialise le bouton retour à la galerie
const backToGallery = (e) => {
  e.preventDefault();
  showGalleryPage();
  updateFocusableElements();
};
// Initialise le bouton pour aller à la création de projet
const goToAddProject = (e) => {
  e.preventDefault();
  showAddProjectPage();
  updateFocusableElements();
};
// Initialise les boutons de navigation
const initModalNavigation = () => {
  const backToGalleryBtn = document.querySelector(".back-to-gallery");
  const goToAddProjectBtn = document.querySelector(".add-project");
  backToGalleryBtn.addEventListener("click", backToGallery);
  goToAddProjectBtn.addEventListener("click", goToAddProject);
};

//---- Ajoute les categories dans l'input select
const categorySelectInput = async () => {
  const selectInput = document.getElementById("category-selection");
  // Vide les catégories existantes et crée l'option de consigne
  selectInput.innerHTML = ` <option
                disabled
                selected
                hidden
                label=""
              ></option>`;
  // Crée un tableau de catégories uniques à partir des projets récupérés
  const projects = await fetchprojects();
  const categories = projects.filter(
    (project, index, array) =>
      index === array.findIndex((u) => u.id === project.categoryId)
  );
  // Crée et ajoute une option de selection pour chaque catégorie
  categories.forEach((category) => {
    const categoryOption = document.createElement("option");
    categoryOption.value = category.category.id;
    categoryOption.textContent = category.category.name;
    selectInput.appendChild(categoryOption);
  });
};

//---- Initialise la drop zone pour l'ajout de photo
// Initialise le compteur
let dragCounter = 0;

// Vérifie l'entrée et sortie de la drop zone
const onDragOver = (e) => {
  e.preventDefault();
};

const onDragEnter = () => {
  const dropContainer = document.getElementById("drop-container");
  dragCounter++;
  if (dragCounter === 1) {
    dropContainer.classList.add("drag-active");
  }
};

const onDragLeave = () => {
  const dropContainer = document.getElementById("drop-container");
  dragCounter--;
  if (dragCounter === 0) {
    dropContainer.classList.remove("drag-active");
  }
};

const onDrop = (e) => {
  const dropContainer = document.getElementById("drop-container");
  const fileInput = document.getElementById("add-photo");
  e.preventDefault();
  e.stopPropagation();
  dragCounter = 0;
  dropContainer.classList.remove("drag-active");
  const file = e.dataTransfer.files[0];
  // Taille maximale de l'image limitée à 4Mo
  const maxSize = 4 * 1024 * 1024;
  if (file && file.size > maxSize) {
    showMessageModal("L'image dépasse la taille maximale de 4 Mo.");
    e.target.value = "";
  } else {
    fileInput.files = e.dataTransfer.files;
    //---- Ajoute la preview de l'input file
    displayImagePreview(file);
    // Met à jour le champ input
    checkFormInputs();
  }
};

// Ajoute les écouteurs drag et drop
const initDropZone = () => {
  const dropContainer = document.getElementById("drop-container");
  dropContainer.addEventListener("dragover", onDragOver);
  dropContainer.addEventListener("dragenter", onDragEnter);
  dropContainer.addEventListener("dragleave", onDragLeave);
  dropContainer.addEventListener("drop", onDrop);
};

//---- Initialise le bouton d'ajout de photo
const photoBtn = (e) => {
  const fileInput = document.getElementById("add-photo");
  e.preventDefault();
  e.stopPropagation();
  fileInput.click();
};

const dropContainerClick = (e) => {
  const fileInput = document.getElementById("add-photo");
  e.stopPropagation();
  fileInput.click();
};

// Initialise le click sur le bouton et la drop zone
const initAddPhotoBtn = () => {
  const addPhotoBtn = document.querySelector(".add-photo-btn");
  const dropContainer = document.getElementById("drop-container");
  addPhotoBtn.addEventListener("click", photoBtn);
  dropContainer.addEventListener("click", dropContainerClick);
};

//---- Affiche la mignature de la photo à envoyer
const displayImagePreview = (file) => {
  const dropContainerInfo = document.querySelector(".drop-container-infos");
  const dropContainer = document.getElementById("drop-container");
  clearImagePreview();
  // Crée la mignature
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.createElement("img");
      // e.target.result est une Data URL
      preview.src = e.target.result;
      preview.classList.add("photo-preview");
      preview.alt = "Preview de la photo à téléchargée.";
      preview.style.display = "block";
      dropContainer.appendChild(preview);
    };
    // Lecture du fichier image
    reader.readAsDataURL(file);
    dropContainerInfo.style.visibility = "hidden";
  }
};

//---- Supprime la preview s'il y en a une
const clearImagePreview = () => {
  const existingPreview = document.querySelector(".photo-preview");
  const dropContainerInfo = document.querySelector(".drop-container-infos");
  if (existingPreview) {
    existingPreview.remove();
    dropContainerInfo.style.visibility = "visible";
  }
};

//---- Initialise le preview de l'image du projet chargé
const photoChange = (e) => {
  const file = e.target.files[0];
  const maxSize = 4 * 1024 * 1024;
  if (file && file.size > maxSize) {
    showMessageModal("L'image dépasse la taille maximale de 4 Mo.");
    e.target.value = "";
  } else {
    displayImagePreview(file);
  }
};
const initPhotoPreviewListener = () => {
  const fileInput = document.getElementById("add-photo");
  fileInput.addEventListener("change", photoChange);
};

//---- Initialise le bouton d'ajout de projet
// Vérifie que tous les champs requis sont remplis
const updateAddBtn = () => {
  const addBtn = document.getElementById("addBtn");
  const form = document.getElementById("add-project-form");
  const allFilled = form.checkValidity();
  if (allFilled) {
    addBtn.disabled = false;
    updateFocusableElements();
  } else {
    addBtn.disabled = true;
  }
};
//---- Active le bouton
const checkFormInputs = () => {
  const form = document.getElementById("add-project-form");
  // Surveille les changements dans les champs
  form.addEventListener("input", updateAddBtn);
  form.addEventListener("change", updateAddBtn);
  // Vérifie l'état initial des champs requis
  updateAddBtn();
};

//---- Envoyer un nouveau projet à l'API
const formSubmit = (e) => {
  const form = document.getElementById("add-project-form");
  e.preventDefault();
  // Récupérer les données du formulaire
  const formData = new FormData(form);
  // Envoyer la requête POST
  addProjectFromAPI(formData);
};
//---- Initialise l'écouteur de submit
const initAddProjectSubmitBtn = () => {
  const form = document.getElementById("add-project-form");
  form.addEventListener("submit", formSubmit);
};

//---- Création de la requête POST pour la création de projet
const addProjectFromAPI = (formData) => {
  fetch("http://localhost:5678/api/works", {
    method: "POST",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        showMessageModal(
          "Une erreur s'est produite lors de l'ajout du projet."
        );
        return Promise.reject();
      }
    })
    .then((data) => {
      refresh(data);
    })
    .catch((error) => {
      console.error("Erreur lors de l'ajout du projet :", error);
    });
};

//---- Vide les champs du formulaire et actualise les galeries de projets
const refresh = (data) => {
  const form = document.getElementById("add-project-form");
  form.reset();
  clearImagePreview();
  showMessageModal(`Vous venez d'ajouter "${data.title}" dans vos projets.`);
  cachedProjects = null;
  initModalGallery();
  initGalleryApp();
  updateAddBtn();
};

//---- Supprime les écouteurs d'évenement du formulaire lors de la fermeture de la modale
const removeFormEventListener = () => {
  const backToGalleryBtn = document.querySelector(".back-to-gallery");
  const goToAddProjectBtn = document.querySelector(".add-project");
  const dropContainer = document.getElementById("drop-container");
  const fileInput = document.getElementById("add-photo");
  const addPhotoBtn = document.querySelector(".add-photo-btn");
  const form = document.getElementById("add-project-form");
  // Supprime les écouteurs des boutons de navigation
  backToGalleryBtn.removeEventListener("click", backToGallery);
  goToAddProjectBtn.removeEventListener("click", goToAddProject);
  // Nettoye les écouteurs drag et drop présents
  dropContainer.removeEventListener("dragover", onDragOver);
  dropContainer.removeEventListener("dragenter", onDragEnter);
  dropContainer.removeEventListener("dragleave", onDragLeave);
  dropContainer.removeEventListener("drop", onDrop);
  // Supprime l'écouteur d'image du projet chargé
  fileInput.removeEventListener("change", photoChange);
  // Supprime les écouteur sur le bouton et la drop zone
  addPhotoBtn.removeEventListener("click", photoBtn);
  dropContainer.removeEventListener("click", dropContainerClick);
  // Supprime les écouteurs de changements dans les champs
  form.removeEventListener("input", updateAddBtn);
  form.removeEventListener("change", updateAddBtn);
  // Supprime l'écouteur de submit
  form.removeEventListener("submit", formSubmit);
};

//---- Initialise et affiche la modale d'ajout de projet
const initAddProjectModal = async () => {
  await categorySelectInput();
  initModalNavigation();
  initDropZone();
  initAddPhotoBtn();
  initPhotoPreviewListener();
  checkFormInputs();
  initAddProjectSubmitBtn();
};

// -------------- Login Page --------------

// Récupère l'élément du DOM du formulaire et des champs
const loginForm = document.querySelector(".login-container > form");
const email = document.getElementById("email");
const password = document.getElementById("password");
const loginMessage = document.getElementById("login-message");

//---- Fonction pour afficher les messages
const displayMessage = (message, color) => {
  loginMessage.textContent = message;
  loginMessage.style.color = color;
  loginMessage.style.display = "block";
};

//---- Fonction pour envoyer une requête de connexion à l'API et traiter la réponse
const getToken = async (login) => {
  const response = await fetch("http://localhost:5678/api/users/login", {
    method: "POST",
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
    },
    // Converti l'objet en JSON pour l'envoyer à l'API
    body: JSON.stringify(login),
  });
  // Converti la réponse de l'API en objet javascript
  const token = await response.json();
  // Vérifie la réponse de l'API et redirige l'utilisateur ou l'informe d'une erreur d'authentification
  if (token.token) {
    // Affiche le message de validation de la connexion
    displayMessage("Connexion réussie !", "rgb(76, 175, 80)");
    // Enregistre le token dans le sessionStorage
    sessionStorage.setItem("token", token.token);
    // Redirige vers la page principale en mode "Edition"
    setTimeout(() => {
      window.location.href = "index.html?edit=true";
    }, 1000);
  } else {
    // Affiche le message d'erreur
    displayMessage(
      "Identifiants incorrects. Veuillez réessayer.",
      "rgb(244, 67, 54)"
    );
  }
};

//---- Fonction pour afficher l'erreur sur un champ
const showError = (input) => {
  // Affiche le message d'erreur
  displayMessage("Veuillez renseigner tous les champs.", "rgb(244, 67, 54)");
  // Ajoute la classe d'erreur pour déclencher l'animation
  input.classList.add("error");
  // Retirer la classe 'error' après l'animation
  input.addEventListener("animationend", () => {
    input.classList.remove("error");
  });
};

//---- Ajout d'un écouteur d'événements au formulaire
loginForm.addEventListener("submit", async (e) => {
  // Empêche de rechargement de la page lors de l'envoi
  e.preventDefault();
  const login = {
    email: email.value,
    password: password.value,
  };
  // Affiche une erreur si l'email est vide
  if (!email.value) {
    showError(email);
  }
  // Affiche une erreur si le mot de passe est vide
  if (!password.value) {
    showError(password);
  }
  // Envoie la requête si tous les champs sont remplis
  if (email.value && password.value) {
    // Appel la fonction d'envoi de la requête à l'API et traitement de la réponse
    getToken(login);
    // réinitialise les champs des identifiants de connexion
    setTimeout(() => {
      email.value = "";
      password.value = "";
    }, 1000);
  }
});

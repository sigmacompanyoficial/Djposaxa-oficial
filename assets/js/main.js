let currentTranslations = {};

const commonTranslations = {
    ca: {
        onboarding_title: "Benvingut a la família!",
        onboarding_subtitle: "Abans de començar, ens agradaria conèixer-te una mica millor.",
        onboarding_genre: "Quin és el teu estil musical preferit?",
        onboarding_discovery: "Com has conegut a DJ Posaxa?",
        onboarding_submit: "Completar Registre",
        auth_modal_title: "Inicia Sessió",
        auth_google_prompt: "Fes servir el teu compte de Google per accedir de forma ràpida i segura.",
        auth_google_btn: "Continua amb Google",
        login_button: "Inicia Sessió"
    },
    es: {
        onboarding_title: "¡Bienvenido a la familia!",
        onboarding_subtitle: "Antes de empezar, nos gustaría conocerte un poco mejor.",
        onboarding_genre: "¿Cuál es tu estilo musical favorito?",
        onboarding_discovery: "¿Cómo conociste a DJ Posaxa?",
        onboarding_submit: "Completar Registro",
        auth_modal_title: "Iniciar Sesión",
        auth_google_prompt: "Usa tu cuenta de Google para acceder de forma rápida y segura.",
        auth_google_btn: "Continúa con Google",
        login_button: "Iniciar Sesión"
    },
    en: {
        onboarding_title: "Welcome to the family!",
        onboarding_subtitle: "Before we start, we'd like to get to know you a bit better.",
        onboarding_genre: "What is your favorite music genre?",
        onboarding_discovery: "How did you hear about DJ Posaxa?",
        onboarding_submit: "Complete Registration",
        auth_modal_title: "Sign In",
        auth_google_prompt: "Use your Google account for quick and secure access.",
        auth_google_btn: "Continue with Google",
        login_button: "Sign In"
    },
    fr: {
        onboarding_title: "Bienvenue dans la famille !",
        onboarding_subtitle: "Avant de commencer, nous aimerions mieux vous connaître.",
        onboarding_genre: "Quel est votre style musical préféré ?",
        onboarding_discovery: "Comment avez-vous connu DJ Posaxa ?",
        onboarding_submit: "Terminer l'inscription",
        auth_modal_title: "Se connecter",
        auth_google_prompt: "Utilisez votre compte Google pour un accès rapide et sécurisé.",
        auth_google_btn: "Continuer avec Google",
        login_button: "Se connecter"
    },
    de: {
        onboarding_title: "Willkommen in der Familie!",
        onboarding_subtitle: "Bevor wir beginnen, möchten wir Sie etwas besser kennenlernen.",
        onboarding_genre: "Was ist Ihr Lieblingsmusikstil?",
        onboarding_discovery: "Wie haben Sie von DJ Posaxa erfahren?",
        onboarding_submit: "Registrierung abschließen",
        auth_modal_title: "Anmelden",
        auth_google_prompt: "Verwenden Sie Ihr Google-Konto für einen schnellen und sicheren Zugriff.",
        auth_google_btn: "Weiter mit Google",
        login_button: "Anmelden"
    }
};

function getLanguage() {
  const savedLang = localStorage.getItem('language');
  if (savedLang && currentTranslations[savedLang]) {
    return savedLang;
  }
  const browserLang = navigator.language.slice(0, 2);
  if (currentTranslations[browserLang]) {
    return browserLang;
  }
  return 'ca'; // Default language
}

function setLanguage(lang) {
  if (!currentTranslations[lang]) return;
  
  document.documentElement.lang = lang;
  const translation = currentTranslations[lang];
  
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (translation[key]) {
      if (el.tagName === 'META') {
        el.content = translation[key];
      } else {
        el.innerHTML = translation[key];
      }
    }
  });
}

window.changeLanguage = function(lang) {
    localStorage.setItem('language', lang);
    // Recarreguem les traduccions i apliquem l'idioma a l'instant
    if (window.pageTranslations) {
        currentTranslations = window.pageTranslations;
        setLanguage(lang);
    }
};

window.translateAll = function() {
    setLanguage(getLanguage());
};

function getTheme() {
    return localStorage.getItem('theme') || 'dark'; // Default to dark
}

function applyTheme() {
    const theme = getTheme();
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

window.toggleTheme = function(theme) {
    localStorage.setItem('theme', theme);
    updateFirebasePreference('theme', theme);
    applyTheme();
}

function getFontSize() {
    return localStorage.getItem('fontSize') || 'normal'; // Default to normal
}

function applyFontSize() {
    const size = getFontSize();
    const html = document.documentElement;
    html.classList.remove('font-size-small', 'font-size-normal', 'font-size-large');
    if (size === 'small' || size === 'large') {
        html.classList.add(`font-size-${size}`);
    }
}

window.changeFontSize = function(size) {
    if (['small', 'normal', 'large'].includes(size)) {
        localStorage.setItem('fontSize', size);
        updateFirebasePreference('fontSize', size);
        applyFontSize();
    }
}


async function initializePage(translations, specialLogic = null) {
    // Merge common translations
    for (const lang in translations) {
        if (commonTranslations[lang]) {
            translations[lang] = { ...translations[lang], ...commonTranslations[lang] };
        }
    }
    currentTranslations = translations;

    // Injectar el modal d'autenticació
    await injectAuthModal();

    // Set year
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Apply theme
    applyTheme();

    // Apply font size
    applyFontSize();

    // Set language
    const savedLang = getLanguage();
    setLanguage(savedLang);

    // Run page-specific logic if it exists
    if (specialLogic) {
        specialLogic();
    }
}

/**
 * Actualitza una preferència específica a Firebase si l'usuari està autenticat.
 * @param {string} key - La clau de la preferència (p. ex., 'language', 'theme').
 * @param {string} value - El nou valor de la preferència.
 */
function updateFirebasePreference(key, value) {
    // Aquesta funció depèn que Firebase estigui inicialitzat a la finestra.
    if (window.auth && window.database && window.ref && window.update && window.auth.currentUser) {
        const { auth, database, ref, update } = window; // Utilitzem les funcions exposades
        const user = auth.currentUser;
        update(ref(database, `users/${user.uid}/preferences`), { [key]: value }).catch(console.error);
    }
}

/**
 * Actualitza una preferència específica a Firebase si l'usuari està autenticat.
 * @param {string} key - La clau de la preferència (p. ex., 'language', 'theme').
 * @param {string} value - El nou valor de la preferència.
 */
window.updateFirebasePreference = function(key, value) {
    if (window.auth && window.database && window.ref && window.update && window.auth.currentUser) {
        const { auth, database, ref, update } = window;
        const user = auth.currentUser;
        update(ref(database, `users/${user.uid}/preferences`), { [key]: value }).catch(console.error);
    }
}
/**
 * Sincronitza les preferències de l'usuari (tema, idioma, etc.) amb Firebase Realtime Database.
 * @param {object} auth - Instància d'autenticació de Firebase.
 * @param {object} database - Instància de la base de dades de Firebase.
 * @param {function} get - Funció 'get' de Firebase Database.
 * @param {function} ref - Funció 'ref' de Firebase Database.
 * @param {function} update - Funció 'update' de Firebase Database.
 */
window.syncPreferencesWithFirebase = function(auth, database, get, ref, update) {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = ref(database, `users/${user.uid}`);

    // Actualitzem la data de l'últim inici de sessió immediatament
    update(userRef, { lastLogin: new Date().toISOString() }).catch(console.error);

    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const prefs = userData.preferences || {};

            // L'usuari té preferències guardades, les carreguem.
            console.log('Preferències carregades des de Firebase:', prefs);

            // Gestió de Rols
            const userRole = userData.role || 'cliente';
            const adminLinkContainer = document.getElementById('admin-link-container');
            const authContainer = document.getElementById('auth-container');

            // Actualitza la icona de perfil i l'enllaç d'admin
            const photoURL = user.photoURL || 'Fotos/default-profile.png'; // Imatge per defecte

            if (userRole === 'administrador') {
                if (authContainer) authContainer.innerHTML = `<a class="nav-link" href="admin.html" aria-label="Perfil"><img src="${photoURL}" alt="Perfil" style="width: 28px; height: 28px; border-radius: 50%;"></a>`;
                if (adminLinkContainer) adminLinkContainer.innerHTML = `<a class="nav-link" href="admin.html">Admin Panel</a>`;
            } else {
                if (authContainer) authContainer.innerHTML = `<a class="nav-link" href="perfil.html" aria-label="Perfil"><img src="${photoURL}" alt="Perfil" style="width: 28px; height: 28px; border-radius: 50%;"></a>`;
                if (adminLinkContainer) adminLinkContainer.innerHTML = ''; // Buidem el contenidor si no és admin
            }

            if (adminLinkContainer) {
            }

            if (prefs.theme) localStorage.setItem('theme', prefs.theme);
            if (prefs.fontSize) localStorage.setItem('fontSize', prefs.fontSize);
            // Donem prioritat al valor de Firebase. Si no existeix, mantenim el local o 'false'.
            if (prefs.djPosaxaFollowVerified) {
                localStorage.setItem('djPosaxaFollowVerified', prefs.djPosaxaFollowVerified);
            }

            // Apliquem la configuració carregada
            applyTheme();
            applyFontSize();
            setLanguage(getLanguage());
        }
    });
};

window.handleLoggedOutState = function() {
    const authContainer = document.getElementById('auth-container');
    if (authContainer) {
        authContainer.innerHTML = `<button id="login-button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#authModal" data-translate="login_button">Inicia Sessió</button>`;
        if (window.translateAll) window.translateAll();
    }
};

async function injectAuthModal() {
    // Evita injectar el modal si ja existeix
    if (document.getElementById('authModal')) return;
    
    try {
        const response = await fetch('auth-modal.html'); // Usar ruta relativa
        if (!response.ok) {
            throw new Error(`No s'ha pogut carregar auth-modal.html: ${response.statusText}`);
        }
        const modalHtml = await response.text();
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    } catch (error) {
        console.error("Error injectant el modal d'autenticació:", error);
    }
}

let authListenersSetup = false;

function setupAuthModalListeners(auth, database, ref, get, update, firebaseAuth) {
    if (authListenersSetup) return; // Evitar duplicar listeners

    const { GoogleAuthProvider, signInWithPopup } = firebaseAuth;

    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    const googleSigninBtn = document.getElementById('google-signin-btn');
    const authFeedback = document.getElementById('auth-feedback');
    
    const loginSection = document.getElementById('auth-login-section');
    const onboardingSection = document.getElementById('auth-onboarding-section');
    const onboardingForm = document.getElementById('onboarding-form');

    function showFeedback(element, message, isError = true) {
        element.textContent = message;
        element.className = `alert ${isError ? 'alert-danger' : 'alert-success'}`;
        element.style.display = 'block';
    }

    // Reset modal state when closed
    document.getElementById('authModal').addEventListener('hidden.bs.modal', () => {
        authFeedback.style.display = 'none';
        loginSection.style.display = 'block';
        onboardingSection.style.display = 'none';
        onboardingForm.reset();
    });

    // Inici de sessió amb Google
    googleSigninBtn.addEventListener('click', () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                const user = result.user;
                const userRef = ref(database, 'users/' + user.uid);
                get(userRef).then((snapshot) => {
                    if (!snapshot.exists() || !snapshot.val().onboardingCompleted) {
                        // New user or incomplete onboarding -> Show questions
                        loginSection.style.display = 'none';
                        onboardingSection.style.display = 'block';
                    } else {
                        // Existing user -> Sync and close
                        window.syncPreferencesWithFirebase(auth, database, get, ref, update);
                        authModal.hide();
                    }
                });
            }).catch((error) => {
                showFeedback(authFeedback, `Error amb Google: ${error.message}`);
            });
    });

    // Handle Onboarding Submit
    onboardingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;

        const genre = document.getElementById('ob-genre').value;
        const discovery = document.getElementById('ob-discovery').value;

        const userData = {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            favoriteGenre: genre,
            discoverySource: discovery,
            onboardingCompleted: true,
            role: 'cliente', // Default role
            lastLogin: new Date().toISOString()
        };

        // Update user data
        update(ref(database, 'users/' + user.uid), userData)
            .then(() => {
                window.syncPreferencesWithFirebase(auth, database, get, ref, update);
                authModal.hide();
            })
            .catch((error) => {
                console.error("Error saving onboarding data:", error);
                showFeedback(authFeedback, "Error en desar les dades. Intenta-ho de nou.");
            });
    });

    authListenersSetup = true;
}


/**
 * Exposa les funcions de Firebase a l'objecte window perquè siguin accessibles globalment
 * @param {object} auth - Instància d'autenticació de Firebase.
 * @param {object} database - Instància de la base de dades de Firebase.
 * @param {function} ref - Funció 'ref' de Firebase Database.
 * @param {function} update - Funció 'update' de Firebase Database.
 * @param {function} get - Funció 'get' de Firebase Database.
 * @param {object} firebaseAuth - Objecte amb funcions d'autenticació.
 */
window.exposeFirebase = function(auth, database, ref, update, get, firebaseAuth) {
    window.auth = auth;
    window.database = database;
    window.ref = ref;
    window.update = update;
    window.get = get;
    window.firebaseAuth = firebaseAuth;
};

/**
 * Funció principal d'inicialització que s'assegura que tot es carrega en ordre.
 * Aquesta funció és cridada des dels fitxers HTML després que Firebase s'hagi inicialitzat.
 */
window.initAuth = async function() {
    // 1. Injecta el modal d'autenticació i espera que estigui al DOM.
    await injectAuthModal();

    // 2. Ara que el modal existeix, configura els seus listeners.
    // Aquest codi només s'executa si Firebase s'ha carregat correctament (perquè window.auth existirà).
    if (window.auth && window.firebaseAuth) {
        setupAuthModalListeners(window.auth, window.database, window.ref, window.get, window.update, window.firebaseAuth);
    }
};
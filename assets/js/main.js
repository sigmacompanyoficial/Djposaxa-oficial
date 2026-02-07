// Check for file protocol which blocks modules
if (window.location.protocol === 'file:') {
    alert("⚠️ AVÍS: Estàs obrint la web directament des de l'arxiu (file://). Això bloqueja la connexió amb Firebase i altres funcions. \n\nSi us plau, utilitza un servidor local (com 'Live Server' a VS Code) o puja la web a un servidor (GitHub Pages, Vercel, etc.) per veure-la correctament.");
    console.warn("Running from file:// protocol. Modules and CORS will likely fail.");
}

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

window.getLanguage = function () {
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

window.setLanguage = function (lang) {
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

window.changeLanguage = function (lang) {
    localStorage.setItem('language', lang);
    if (window.updateFirebasePreference) window.updateFirebasePreference('language', lang);
    // Recarreguem les traduccions i apliquem l'idioma a l'instant
    if (window.pageTranslations) {
        currentTranslations = window.pageTranslations;
        setLanguage(lang);
    }
};

window.translateAll = function () {
    window.setLanguage(window.getLanguage());
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

window.toggleTheme = function (theme) {
    localStorage.setItem('theme', theme);
    window.updateFirebasePreference('theme', theme);
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

window.changeFontSize = function (size) {
    if (['small', 'normal', 'large'].includes(size)) {
        localStorage.setItem('fontSize', size);
        window.updateFirebasePreference('fontSize', size);
        applyFontSize();
    }
}

window.applyAnimations = function () {
    const animationsEnabled = localStorage.getItem('animations') !== 'false';
    if (!animationsEnabled) {
        document.body.classList.add('no-animations');
        if (!document.getElementById('no-animations-style')) {
            const style = document.createElement('style');
            style.id = 'no-animations-style';
            style.textContent = '.no-animations *, .no-animations *::before, .no-animations *::after { animation: none !important; transition: none !important; }';
            document.head.appendChild(style);
        }
    } else {
        document.body.classList.remove('no-animations');
        const style = document.getElementById('no-animations-style');
        if (style) style.remove();
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

    // Apply animations
    window.applyAnimations();

    // Set language
    const savedLang = window.getLanguage();
    window.setLanguage(savedLang);

    // Run page-specific logic if it exists
    if (specialLogic) {
        specialLogic();
    }
}

window.updateFirebasePreference = function (key, value) {
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
window.syncPreferencesWithFirebase = function (auth, database, get, ref, update) {
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
            const photoURL = user.photoURL || 'Fotos/images.png'; // Imatge per defecte

            if (userRole === 'administrador' || userRole === 'admin') {
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
            window.applyAnimations();
            window.setLanguage(window.getLanguage());
        }
    });
};

window.handleLoggedOutState = function () {
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

    if (!firebaseAuth || !firebaseAuth.GoogleAuthProvider) return;
    const { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } = firebaseAuth;

    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    const googleSigninBtn = document.getElementById('google-signin-btn');

    // Forms
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const onboardingForm = document.getElementById('onboarding-form');

    // Sections for visibility toggle
    const authTabs = document.getElementById('authTabs');
    const authTabContent = document.getElementById('authTabContent');
    const onboardingSection = document.getElementById('auth-onboarding-section');

    // Feedbacks
    const loginFeedback = document.getElementById('auth-feedback-login');
    const registerFeedback = document.getElementById('auth-feedback-register');

    function showFeedback(element, message, isError = true) {
        if (!element) return;
        element.textContent = message;
        element.className = `alert ${isError ? 'alert-danger' : 'alert-success'}`;
        element.classList.remove('d-none');
        element.style.display = 'block';
    }

    function hideFeedback() {
        if (loginFeedback) loginFeedback.classList.add('d-none');
        if (registerFeedback) registerFeedback.classList.add('d-none');
    }

    function showOnboarding() {
        if (authTabs) authTabs.style.display = 'none';
        if (authTabContent) {
            // Hide tab panes by manipulating bootstrap classes or manually hiding
            // Simplest way for this specific modal structure:
            authTabContent.style.display = 'none';
        }
        if (onboardingSection) {
            onboardingSection.classList.remove('d-none');
            onboardingSection.style.display = 'block';
        }
    }

    function resetModalState() {
        if (authTabs) authTabs.style.display = 'flex';
        if (authTabContent) authTabContent.style.display = 'block';
        if (onboardingSection) {
            onboardingSection.classList.add('d-none');
            onboardingSection.style.display = 'none';
        }

        // Reset to first tab
        const loginTab = document.getElementById('login-tab');
        if (loginTab) {
            const tab = new bootstrap.Tab(loginTab);
            tab.show();
        }

        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
        if (onboardingForm) onboardingForm.reset();
        hideFeedback();
    }

    // Reset modal state when closed
    document.getElementById('authModal').addEventListener('hidden.bs.modal', resetModalState);

    function getErrorMessage(code) {
        switch (code) {
            case 'auth/invalid-email': return 'El correu electrònic no és vàlid.';
            case 'auth/user-disabled': return 'Aquest usuari ha estat inhabilitat.';
            case 'auth/user-not-found': return 'No s\'ha trobat cap usuari amb aquest correu.';
            case 'auth/wrong-password': return 'Contrasenya incorrecta.';
            case 'auth/email-already-in-use': return 'Aquest correu ja està registrat.';
            case 'auth/weak-password': return 'La contrasenya ha de tenir almenys 6 caràcters.';
            default: return code;
        }
    }

    function checkUserAndProceed(user, isNewRegistration = false) {
        const userRef = ref(database, 'users/' + user.uid);
        get(userRef).then((snapshot) => {
            const val = snapshot.val();
            // If new registration OR user data missing/incomplete -> show onboarding
            if (isNewRegistration || !snapshot.exists() || !val || !val.onboardingCompleted) {
                showOnboarding();
            } else {
                // Everything OK
                window.syncPreferencesWithFirebase(auth, database, get, ref, update);
                authModal.hide();
            }
        });
    }

    // --- Login Handler ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            hideFeedback();

            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    checkUserAndProceed(userCredential.user);
                })
                .catch((error) => {
                    showFeedback(loginFeedback, "Error: " + getErrorMessage(error.code));
                });
        });
    }

    // --- Register Handler ---
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            hideFeedback();

            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    // Update Display Name
                    updateProfile(user, { displayName: name })
                        .then(() => {
                            checkUserAndProceed(user, true); // true = isNewUser
                        });
                })
                .catch((error) => {
                    showFeedback(registerFeedback, "Error: " + getErrorMessage(error.code));
                });
        });
    }

    // Inici de sessió amb Google
    if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', () => {
            const provider = new GoogleAuthProvider();
            signInWithPopup(auth, provider)
                .then((result) => {
                    checkUserAndProceed(result.user);
                }).catch((error) => {
                    if (loginFeedback) showFeedback(loginFeedback, `Error amb Google: ${error.message}`);
                });
        });
    }

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
window.exposeFirebase = function (auth, database, ref, update, get, firebaseAuth) {
    window.auth = auth;
    window.database = database;
    window.ref = ref;
    window.update = update;
    window.get = get;

    // Merge or set firebaseAuth
    if (firebaseAuth) {
        if (!window.firebaseAuth) window.firebaseAuth = {};
        Object.assign(window.firebaseAuth, firebaseAuth);
    }

    console.log('Firebase exposed to window');
};

/**
 * Funció principal d'inicialització que s'assegura que tot es carrega en ordre.
 * Aquesta funció és cridada des dels fitxers HTML després que Firebase s'hagi inicialitzat.
 */
window.initAuth = async function () {
    // 1. Injecta el modal d'autenticació i espera que estigui al DOM.
    await injectAuthModal();

    // 2. Ara que el modal existeix, configura els seus listeners.
    // Aquest codi només s'executa si Firebase s'ha carregat correctament (perquè window.auth existirà).
    if (window.auth && window.firebaseAuth) {
        setupAuthModalListeners(window.auth, window.database, window.ref, window.get, window.update, window.firebaseAuth);
    }
};
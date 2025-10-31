let currentTranslations = {};

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
    // updateFirebasePreference('language', lang); // Eliminat per evitar desar l'idioma a Firebase
    // Recarreguem les traduccions i apliquem l'idioma a l'instant
    if (window.pageTranslations) {
        initializePage(window.pageTranslations);
    }
}

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


function initializePage(translations, specialLogic = null) {
    currentTranslations = translations;
    
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
    if (window.auth && window.database && window.auth.currentUser) {
        const { auth, database, ref, update } = window;
        const user = auth.currentUser;
        const preferenceRef = ref(database, `users/${user.uid}/preferences/${key}`);
        update(ref(database, `users/${user.uid}/preferences`), { [key]: value });
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

    get(userRef).then((snapshot) => {
        if (snapshot.exists()) {
            const userData = snapshot.val();
            const prefs = userData.preferences || {};

            // L'usuari té preferències guardades, les carreguem.
            console.log('Preferències carregades des de Firebase:', prefs);
            // if (prefs.language) localStorage.setItem('language', prefs.language); // Eliminat per no carregar l'idioma des de Firebase

            // Gestió de Rols
            const userRole = userData.role || 'cliente';
            const adminLinkContainer = document.getElementById('admin-link-container');
            const authContainer = document.getElementById('auth-container');

            // Actualitza la icona de perfil i l'enllaç d'admin
            if (userRole === 'administrador') {
                if (authContainer) authContainer.innerHTML = `<a class="nav-link" href="admin.html" aria-label="Perfil"><img src="${user.photoURL}" alt="Perfil" style="width: 28px; height: 28px; border-radius: 50%;"></a>`;
                if (adminLinkContainer) adminLinkContainer.innerHTML = `<a class="nav-link" href="admin.html">Admin Panel</a>`;
            } else {
                if (authContainer) authContainer.innerHTML = `<a class="nav-link" href="perfil.html" aria-label="Perfil"><img src="${user.photoURL}" alt="Perfil" style="width: 28px; height: 28px; border-radius: 50%;"></a>`;
                if (adminLinkContainer) adminLinkContainer.innerHTML = ''; // Buidem el contenidor si no és admin
            }

            if (adminLinkContainer) {
            }

            if (prefs.theme) localStorage.setItem('theme', prefs.theme);
            if (prefs.fontSize) localStorage.setItem('fontSize', prefs.fontSize);
            if (prefs.djPosaxaFollowVerified) localStorage.setItem('djPosaxaFollowVerified', prefs.djPosaxaFollowVerified);

            // Apliquem la configuració carregada
            applyTheme();
            applyFontSize();
            setLanguage(getLanguage());
        } else {
            // L'usuari no té preferències, guardem les actuals del localStorage.
            console.log('Primer inici de sessió o sense preferències. Desant configuració actual a Firebase.');
            const currentPrefs = {
                // language: localStorage.getItem('language') || 'ca', // Eliminat per no desar l'idioma a Firebase
                theme: localStorage.getItem('theme') || 'dark',
                fontSize: localStorage.getItem('fontSize') || 'normal',
                djPosaxaFollowVerified: localStorage.getItem('djPosaxaFollowVerified') || 'false'
            };
            update(ref(database, `users/${user.uid}/preferences`), currentPrefs);
        }
    });
};

// Exposa les funcions de Firebase a l'objecte window perquè siguin accessibles globalment
window.exposeFirebase = function(auth, database, ref, update, get) {
    window.auth = auth;
    window.database = database;
    window.ref = ref;
    window.update = update;
    window.get = get;
};
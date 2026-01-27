// Importa i inicialitza Firebase
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAfNLKv-jNyyAaVrYSbwPnJKyNClDiF94Y",
    authDomain: "dj-posaxa-web.firebaseapp.com",
    databaseURL: "https://dj-posaxa-web-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "dj-posaxa-web",
    storageBucket: "dj-posaxa-web.appspot.com",
    messagingSenderId: "647042791526",
    appId: "1:647042791526:web:3b870e05ab0ed34cbd95a7",
    measurementId: "G-C8R4Z4TLE1"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Gestiona les notificacions en segon pla
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/Fotos/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
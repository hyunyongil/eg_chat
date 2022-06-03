importScripts('https://www.gstatic.com/firebasejs/7.24.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.24.0/firebase-messaging.js');
firebase.initializeApp({
    apiKey: "AIzaSyB38_phb3gMvvMmx78ctz8zpVlyZK_30W8",
    authDomain: "eggdome-a5abd.firebaseapp.com",
   //  databaseURL: "from firebase config",
    projectId: "eggdome-a5abd",
    storageBucket: "eggdome-a5abd.appspot.com",
    messagingSenderId: "311676243005",
    appId: "1:311676243005:web:632f197d56c78fd70a6e54",
    measurementId: "G-H6LWB9F1YL"
});

const messaging = firebase.messaging();


self.addEventListener('push', function(event) {
  const payload = event.data.json();
  const title = payload.data.title;
  const options = {
      body: payload.data.body,
      icon: 'https://cdn2.domeggook.com/china/delivery/60705ec37807460705ec378076/down/20220324/623c7b8a96d21.jpg',
      data: payload.data.click_action_chrome
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  const pushData = event.notification.data;
  
  var chatId = '';
  var chatUrl = '';
  if (pushData.startsWith('sendbird/')) {
    chatId = pushData.replace('sendbird/', '');
    chatUrl = 'https://chatadmin.eggdome.com/'+chatId;
  } else {
    chatUrl = event.notification.data;
  }

  console.log(event.notification);
  event.notification.close();
  event.waitUntil(
      clients.openWindow(chatUrl)
  );
});


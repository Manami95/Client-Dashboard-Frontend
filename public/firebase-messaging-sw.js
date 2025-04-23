// This is the service worker file for Firebase Cloud Messaging
// It should be placed in the public folder

importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js")

// Initialize the Firebase app in the service worker
const firebaseApp = firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY,
  authDomain: self.FIREBASE_AUTH_DOMAIN,
  projectId: self.FIREBASE_PROJECT_ID,
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID,
  appId: self.FIREBASE_APP_ID,
})

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload)

  // Customize notification here
  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/images/heepl-logo.png",
    badge: "/images/badge-icon.png",
    tag: payload.data?.tag || "default",
    data: payload.data,
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event)

  event.notification.close()

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // If we have a matching client, focus it
        for (const client of clientList) {
          if (client.url.includes("/dashboard") && "focus" in client) {
            return client.focus()
          }
        }
        // If no matching client, open a new window
        if (clients.openWindow) {
          return clients.openWindow("/dashboard")
        }
      }),
  )
})

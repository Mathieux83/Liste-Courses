import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

// Précache des ressources statiques
precacheAndRoute(self.__WB_MANIFEST)

// Cache pour les images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
      }),
    ],
  }),
)

// Cache pour les données API
registerRoute(
  ({ url }) => url.pathname.startsWith('/api'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 24 heures
      }),
    ],
  }),
)

// Cache pour les fichiers JS et CSS
registerRoute(
  ({ request }) =>
    request.destination === 'script' ||
    request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  }),
)

// Gérer les notifications push
self.addEventListener('push', (event) => {
  const data = event.data.json()
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Gérer le clic sur une notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    )
  }
})

// Gérer la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-listes') {
    event.waitUntil(syncListes())
  }
})

// Fonction pour synchroniser les listes
async function syncListes() {
  const cache = await caches.open('api-cache')
  const requests = await cache.keys()
  
  for (const request of requests) {
    if (request.url.includes('/api/listes')) {
      try {
        await fetch(request)
      } catch (error) {
        console.error('Erreur de synchronisation:', error)
      }
    }
  }
}

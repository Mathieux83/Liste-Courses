import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { store, persistor } from './store'
import { SocketProvider } from './contexts/SocketContext'
import App from './App.jsx'
import { PersistGate } from 'redux-persist/integration/react'
import './styles/index.css'
import './styles/components.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <BrowserRouter>
          <SocketProvider>
            <App />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </SocketProvider>
        </BrowserRouter>
      </PersistGate>
    </Provider>
  </React.StrictMode>
)
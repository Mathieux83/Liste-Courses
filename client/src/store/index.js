import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { authReducer } from './slices/authSlice';
import { uiReducer } from './slices/uiSlice';
import { deliveryReducer } from './slices/deliverySlice';

const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  delivery: deliveryReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'],
  version: 1,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER,
          'delivery/setSelectedStore'
        ],
      },
    }),
});

export const persistor = persistStore(store);
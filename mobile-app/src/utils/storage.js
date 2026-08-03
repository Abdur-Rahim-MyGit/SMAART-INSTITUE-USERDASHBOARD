import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function getItem(key) {
  if (Platform.OS === 'web') {
    try {
      return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setItem(key, val) {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, val);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return;
  }
  return await SecureStore.setItemAsync(key, val);
}

export async function deleteItem(key) {
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return;
  }
  return await SecureStore.deleteItemAsync(key);
}

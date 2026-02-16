

import JSEncrypt from 'jsencrypt';

/**
 * Chiffre un message avec une clé publique RSA
 * @param {string} message - Le message à chiffrer (JSON stringifié)
 * @param {string} publicKey - La clé publique RSA au format PEM
 * @returns {string|false} - Le message chiffré en base64 ou false si erreur
 */
export const encryptMessage = (message, publicKey) => {
  try {
    if (!message || !publicKey) {
      console.error('❌ Message ou clé publique manquant');
      return false;
    }

    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    const encrypted = encrypt.encrypt(message);
    
    if (!encrypted) {
      console.error('❌ Échec du chiffrement');
      return false;
    }
    
    return encrypted;
  } catch (error) {
    console.error('❌ Erreur de chiffrement:', error);
    return false;
  }
};

/**
 * Déchiffre un message avec une clé privée RSA
 * @param {string} encryptedMessage - Le message chiffré en base64
 * @param {string} privateKey - La clé privée RSA au format PEM
 * @returns {string|false} - Le message déchiffré ou false si erreur
 */
export const decryptMessage = (encryptedMessage, privateKey) => {
  try {
    if (!encryptedMessage || !privateKey) {
      console.error('❌ Message chiffré ou clé privée manquant');
      return false;
    }

    const decrypt = new JSEncrypt();
    decrypt.setPrivateKey(privateKey);
    const decrypted = decrypt.decrypt(encryptedMessage);
    
    if (!decrypted) {
      console.error('❌ Échec du déchiffrement');
      return false;
    }
    
    return decrypted;
  } catch (error) {
    console.error('❌ Erreur de déchiffrement:', error);
    return false;
  }
};

/**
 * Génère un UUID v4
 * @returns {string} - UUID au format standard
 */
export const generateUUID = () => {
  // Vérifier si crypto.randomUUID est disponible
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback pour les anciens navigateurs
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
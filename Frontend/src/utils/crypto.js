import * as openpgp from 'openpgp';

/**
 * Chiffre un message avec une clé publique PGP
 * @param {string} message - Le message à chiffrer (JSON stringifié)
 * @param {string} publicKeyArmored - La clé publique PGP au format ASCII
 * @returns {Promise<string|false>} - Le message chiffré ou false si erreur
 */
export const encryptMessage = async (message, publicKeyArmored) => {
  try {
    if (!message || !publicKeyArmored) {
      console.error('❌ Message ou clé publique manquant');
      return false;
    }

    // Lire la clé publique
    const publicKey = await openpgp.readKey({ armoredKey: publicKeyArmored });

    // Créer le message
    const messageObj = await openpgp.createMessage({ text: message });

    // Chiffrer
    const encrypted = await openpgp.encrypt({
      message: messageObj,
      encryptionKeys: publicKey,
    });

    return encrypted;
  } catch (error) {
    console.error('❌ Erreur de chiffrement:', error);
    return false;
  }
};

/**
 * Déchiffre un message avec une clé privée PGP
 * @param {string} encryptedMessage - Le message chiffré
 * @param {string} privateKeyArmored - La clé privée PGP au format ASCII
 * @returns {Promise<string|false>} - Le message déchiffré ou false si erreur
 */
export const decryptMessage = async (encryptedMessage, privateKeyArmored) => {
  try {
    if (!encryptedMessage || !privateKeyArmored) {
      console.error('❌ Message chiffré ou clé privée manquant');
      return false;
    }

    // Lire la clé privée (sans passphrase)
    const privateKey = await openpgp.readPrivateKey({ 
      armoredKey: privateKeyArmored 
    });

    // Lire le message chiffré
    const message = await openpgp.readMessage({
      armoredMessage: encryptedMessage,
    });

    // Déchiffrer
    const { data: decrypted } = await openpgp.decrypt({
      message,
      decryptionKeys: privateKey,
    });

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
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};
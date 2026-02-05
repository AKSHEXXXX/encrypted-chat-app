import CryptoJS from 'crypto-js';

/**
 * Simple symmetric encryption using the server's SECRET_KEY (demo only).
 * In production, use ECDH for real E2E key exchange.
 */
class ClientEncryptionManager {
  constructor(secretKey) {
    this.secretKey = secretKey;
  }

  encrypt(plaintext) {
    try {
      return CryptoJS.AES.encrypt(plaintext, this.secretKey).toString();
    } catch (e) {
      console.error('Encryption error:', e);
      throw new Error('Failed to encrypt message');
    }
  }

  decrypt(ciphertext) {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, this.secretKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      console.error('Decryption error:', e);
      throw new Error('Failed to decrypt message');
    }
  }
}

export default ClientEncryptionManager;

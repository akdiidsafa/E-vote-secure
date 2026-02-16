// import * as openpgp from 'openpgp';
// import apiClient from '../api/apiClient';
// import { API_ENDPOINTS } from '@/utils/constants';

// class EncryptionService {
//   constructor() {
//     this.coPublicKey = null;
//     this.dePublicKey = null;
//   }

//   async initialize() {
//     try {
//       const [coResponse, deResponse] = await Promise.all([
//         apiClient.get(API_ENDPOINTS.KEYS.CO_PUBLIC),
//         apiClient.get(API_ENDPOINTS.KEYS.DE_PUBLIC),
//       ]);

//       this.coPublicKey = await openpgp.readKey({ armoredKey: coResponse.data.publicKey });
//       this.dePublicKey = await openpgp.readKey({ armoredKey: deResponse.data.publicKey });

//       return true;
//     } catch (error) {
//       console.error('Failed to initialize encryption keys:', error);
//       throw new Error('Impossible de récupérer les clés de chiffrement');
//     }
//   }

//   async encryptIdentity(identityData) {
//     if (!this.coPublicKey) {
//       await this.initialize();
//     }

//     const message = await openpgp.createMessage({ text: JSON.stringify(identityData) });
//     const encrypted = await openpgp.encrypt({
//       message,
//       encryptionKeys: this.coPublicKey,
//     });

//     return encrypted;
//   }

//   async encryptBallot(ballotData) {
//     if (!this.dePublicKey) {
//       await this.initialize();
//     }

//     const message = await openpgp.createMessage({ text: JSON.stringify(ballotData) });
//     const encrypted = await openpgp.encrypt({
//       message,
//       encryptionKeys: this.dePublicKey,
//     });

//     return encrypted;
//   }

//   async createVotePackage(voterData, candidateId, electionId) {
//     const uniqueId = this.generateUniqueId();

//     const identityPayload = {
//       voter_id: voterData.id,
//       voter_name: voterData.name,
//       voter_email: voterData.email,
//       election_id: electionId,
//       timestamp: new Date().toISOString(),
//       unique_id: uniqueId,
//     };

//     const ballotPayload = {
//       candidate_id: candidateId,
//       election_id: electionId,
//       timestamp: new Date().toISOString(),
//       unique_id: uniqueId,
//     };

//     const [m1_identity, m2_ballot] = await Promise.all([
//       this.encryptIdentity(identityPayload),
//       this.encryptBallot(ballotPayload),
//     ]);

//     return {
//       m1_identity,
//       m2_ballot,
//       unique_id: uniqueId,
//       election_id: electionId,
//     };
//   }

//   generateUniqueId() {
//     return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
//   }

//   async decryptMessage(encryptedMessage, privateKeyArmored, passphrase = '') {
//     try {
//       const privateKey = await openpgp.decryptKey({
//         privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
//         passphrase,
//       });

//       const message = await openpgp.readMessage({
//         armoredMessage: encryptedMessage,
//       });

//       const { data: decrypted } = await openpgp.decrypt({
//         message,
//         decryptionKeys: privateKey,
//       });

//       return JSON.parse(decrypted);
//     } catch (error) {
//       console.error('Decryption failed:', error);
//       throw new Error('Échec du déchiffrement');
//     }
//   }
// }

// export default new EncryptionService();
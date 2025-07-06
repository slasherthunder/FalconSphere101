// lib/addAIData.js
import { collection, addDoc } from 'firebase/firestore';
import { db } from './src/app/components/firebase';

/**
 * Adds a document to the "AI Data" collection in Firestore.
 * @param {Object} data - The object you want to store.
 * @returns {Promise<string>} The ID of the new document.
 */
export async function addToAIData(data) {
  try {
    console.log('Data type:', typeof data);
    console.log('Data:', data);
    

    const docRef = await addDoc(collection(db, 'AI_Data'), data);
    console.log('Document written with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.log("WHATTTT")
    console.error('Error adding document: ', e);
    throw e;
  }
}

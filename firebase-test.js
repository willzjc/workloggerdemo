require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

console.log('Testing Firebase connection with these environment variables:');
console.log(`Project ID: ${process.env.REACT_APP_FIREBASE_PROJECT_ID}`);
console.log(`Auth Domain: ${process.env.REACT_APP_FIREBASE_AUTH_DOMAIN}`);
console.log(`Storage Bucket: ${process.env.REACT_APP_FIREBASE_STORAGE_BUCKET}`);

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

async function testFirebaseConnection() {
  try {
    // Initialize Firebase
    console.log('Initializing Firebase app...');
    const app = initializeApp(firebaseConfig);
    
    // Initialize Firestore
    console.log('Connecting to Firestore...');
    const db = getFirestore(app);
    
    // Test the connection by attempting to access a collection
    console.log('Attempting to query a collection...');
    const collectionRef = collection(db, 'workLogs');
    const snapshot = await getDocs(collectionRef);
    
    console.log('Successfully connected to Firestore!');
    console.log(`Retrieved ${snapshot.size} documents`);
    snapshot.forEach(doc => {
      console.log(`Document ID: ${doc.id}`);
    });
    
    return true;
  } catch (error) {
    console.error('Error with Firebase:', error);
    return false;
  }
}

// Execute the test
testFirebaseConnection();

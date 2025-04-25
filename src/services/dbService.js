import { initializeApp } from 'firebase/app';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    deleteDoc, 
    updateDoc, 
    doc, 
    onSnapshot, 
    query, 
    where, 
    orderBy,
    enableNetwork,
    disableNetwork,
    Timestamp
} from 'firebase/firestore';
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged as onFirebaseAuthChange
} from "firebase/auth";

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const logsCollection = collection(db, 'worklogs');

// --- Auth Functions ---

export const signInWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
};

export const signOutUser = () => {
    return signOut(auth);
};

export const onAuthStateChanged = (callback) => {
    return onFirebaseAuthChange(auth, callback);
};

// --- Firestore Functions ---

// Function to add a log
export const addLog = async (logData) => {
    const timeToStore = typeof logData.time === 'string' 
        ? Timestamp.fromDate(new Date(logData.time)) 
        : logData.time;

    return await addDoc(logsCollection, {
        ...logData,
        time: timeToStore,
        duration: Number(logData.duration)
    });
};

// Function to delete a log
export const deleteLog = async (id) => {
    const logDoc = doc(db, 'worklogs', id);
    return await deleteDoc(logDoc);
};

// Function to update a log
export const updateLog = async (id, updatedData) => {
    const logDoc = doc(db, 'worklogs', id);
    const timeToStore = typeof updatedData.time === 'string' 
        ? Timestamp.fromDate(new Date(updatedData.time)) 
        : updatedData.time;
        
    return await updateDoc(logDoc, {
        ...updatedData,
        time: timeToStore,
        duration: Number(updatedData.duration)
    });
};

// Function to subscribe to all logs (ordered by time descending)
export const subscribeToLogs = (callback, onError) => {
    const q = query(logsCollection, orderBy('time', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            time: doc.data().time?.toDate ? doc.data().time.toDate().toISOString() : new Date().toISOString() 
        }));
        callback(logs);
    }, onError);
};

// Function to get today's logs
export const getTodayLogs = (callback, onError) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const startTimestamp = Timestamp.fromDate(today);
    const endTimestamp = Timestamp.fromDate(tomorrow);

    const q = query(
        logsCollection, 
        where('time', '>=', startTimestamp), 
        where('time', '<', endTimestamp),
        orderBy('time', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
        const todayLogs = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data(),
            time: doc.data().time?.toDate ? doc.data().time.toDate().toISOString() : new Date().toISOString() 
        }));
        callback(todayLogs);
    }, onError);
};

// Function to handle Firebase network connection status
export const handleFirebaseConnectionStatus = async (enable) => {
    try {
        if (enable) {
            await enableNetwork(db);
            console.log("Firebase network enabled.");
        } else {
            await disableNetwork(db);
            console.log("Firebase network disabled.");
        }
    } catch (error) {
        console.error("Error changing Firebase network status:", error);
        throw error;
    }
};

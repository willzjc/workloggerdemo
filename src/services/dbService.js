import { db } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  orderBy,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';

const COLLECTION_NAME = 'workLogs';

// Convert JS Date to Firestore Timestamp and vice versa
const dateToTimestamp = (date) => Timestamp.fromDate(new Date(date));
const timestampToDate = (timestamp) => timestamp.toDate();

// Get all logs
export const getAllLogs = async () => {
  try {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTION_NAME), orderBy('time', 'desc'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      time: timestampToDate(doc.data().time).toISOString()
    }));
  } catch (error) {
    console.error("Error getting logs: ", error);
    throw error;
  }
};

// Handle Firebase connection status
export const handleFirebaseConnectionStatus = async (online = true) => {
  try {
    if (online) {
      await enableNetwork(db);
      console.log('Firebase network connection enabled');
    } else {
      await disableNetwork(db);
      console.log('Firebase network connection disabled');
    }
  } catch (error) {
    console.error('Firebase network status change error:', error);
  }
};

// Get today's logs
export const getTodayLogs = (callback, errorCallback = null) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const q = query(
      collection(db, COLLECTION_NAME),
      where('time', '>=', dateToTimestamp(startOfDay)),
      where('time', '<=', dateToTimestamp(endOfDay)),
      orderBy('time', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (querySnapshot) => {
        const logs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: timestampToDate(doc.data().time).toISOString()
        }));
        callback(logs);
      },
      (error) => {
        console.error("Error in today's logs subscription:", error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error("Error creating today's logs subscription:", error);
    if (errorCallback) {
      errorCallback(error);
    }
    // Return a dummy unsubscribe function in case of error
    return () => {};
  }
};

// Add a new log
export const addLog = async (logData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...logData,
      time: dateToTimestamp(logData.time)
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding log: ", error);
    throw error;
  }
};

// Update an existing log
export const updateLog = async (id, logData) => {
  try {
    const logRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(logRef, {
      ...logData,
      time: dateToTimestamp(logData.time)
    });
    return id;
  } catch (error) {
    console.error("Error updating log: ", error);
    throw error;
  }
};

// Delete a log
export const deleteLog = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    return id;
  } catch (error) {
    console.error("Error deleting log: ", error);
    throw error;
  }
};

// Listen for all logs in real time
export const subscribeToLogs = (callback, errorCallback = null) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      orderBy('time', 'desc')
    );
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          time: timestampToDate(doc.data().time).toISOString()
        }));
        callback(logs);
      },
      (error) => {
        console.error("Error in logs subscription:", error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error("Error creating subscription:", error);
    if (errorCallback) {
      errorCallback(error);
    }
    // Return a dummy unsubscribe function in case of error
    return () => {};
  }
};

import { useState, useEffect } from 'react';
import { db } from '../libs/firebase';
import { collection, onSnapshot, query, orderBy, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

export const useCollection = (collectionName, orderField = 'createdAt') => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let mounted = true;
        const q = query(collection(db, collectionName), orderBy(orderField, 'desc'));

        // 1. Timeout Fallback: If DB doesn't respond in 3s (e.g. Billing Block), stop loading
        const timeoutId = setTimeout(() => {
            if (mounted && loading) {
                console.warn(`Firestore timeout for ${collectionName}`);
                setLoading(false);
                // Optional: valid empty data is better than hanging
            }
        }, 3000);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!mounted) return;
            const results = [];
            snapshot.docs.forEach(doc => {
                results.push({ ...doc.data(), id: doc.id });
            });
            setData(results);
            setLoading(false);
            clearTimeout(timeoutId);
        }, (err) => {
            if (!mounted) return;
            console.error(err);
            setError(err.message);
            setLoading(false);
        });

        return () => {
            mounted = false;
            unsubscribe();
            clearTimeout(timeoutId);
        };
    }, [collectionName, orderField]);

    return { data, loading, error };
};

// Actions
export const addDocument = async (collectionName, data) => {
    try {
        const ref = collection(db, collectionName);
        await addDoc(ref, { ...data, createdAt: serverTimestamp() });
        return { success: true };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
};

export const updateDocument = async (collectionName, id, data) => {
    try {
        const ref = doc(db, collectionName, id);
        await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
        return { success: true };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
};

export const deleteDocument = async (collectionName, id) => {
    try {
        const ref = doc(db, collectionName, id);
        await deleteDoc(ref);
        return { success: true };
    } catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
};

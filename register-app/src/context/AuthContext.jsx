import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, getApp, deleteApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { auth, db } from '../libs/firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null); // Includes role
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                setUser(currentUser);

                // Timeout promise (4s) to prevent hanging if DB is not created/billed
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("DB_TIMEOUT")), 4000)
                );

                try {
                    // Fetch role from Firestore with Timeout
                    const userDocPromise = getDoc(doc(db, "users", currentUser.uid));
                    // Race: whichever finishes first wins. if DB hangs, timeout wins.
                    const userDoc = await Promise.race([userDocPromise, timeout]);

                    if (userDoc.exists()) {
                        setUserData(userDoc.data());
                    } else {
                        // Auto-recover: Create document if missing
                        const email = currentUser.email || '';
                        const username = email ? email.split('@')[0] : (currentUser.phoneNumber || 'user');
                        const initialRole = username.toLowerCase().includes('fabricio') ? 'admin' : 'registrar';

                        const newUserData = {
                            username: username,
                            role: initialRole,
                            createdAt: new Date()
                        };

                        await setDoc(doc(db, "users", currentUser.uid), newUserData);
                        setUserData(newUserData);
                    }
                } catch (error) {
                    console.error("Auth/DB Error:", error);
                    // CRITICAL FALLBACK: If DB fails or times out, allow access so app doesn't freeze
                    const email = currentUser.email || '';
                    const isLikelyAdmin = email.toLowerCase().includes('fabricio');
                    setUserData({ role: isLikelyAdmin ? 'admin' : 'registrar', error: true });
                }
            } else {
                setUser(null);
                setUserData(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const signup = async (email, password, username) => {
        // Signup implementation if needed, though we moved to Admin-only creation
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", res.user.uid), {
            username: username,
            role: 'registrar',
            createdAt: new Date()
        });
        return res;
    };

    // Function for Admin to create users without logging out
    const createUser = async (username, password, role) => {
        const secondaryApp = initializeApp(getApp().options, "Secondary");
        const secondaryAuth = getAuth(secondaryApp);
        const email = `${username.toLowerCase().replace(/\s+/g, '')}@sales.app`;

        try {
            const res = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            await setDoc(doc(db, "users", res.user.uid), {
                username: username,
                role: role,
                createdAt: new Date()
            });
            await signOut(secondaryAuth);
            await deleteApp(secondaryApp);
            return res;
        } catch (error) {
            try { await deleteApp(secondaryApp); } catch (e) { }
            throw error;
        }
    };

    const logout = () => {
        return signOut(auth);
    };

    const value = {
        user,
        userData,
        loading,
        login,
        signup,
        createUser,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

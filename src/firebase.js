import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, remove, update } from 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAzF7JP2UC79JZdFkzAUItGH_vcAxHNC2M",
    authDomain: "listinha-4e5d2.firebaseapp.com",
    projectId: "listinha-4e5d2",
    storageBucket: "listinha-4e5d2.firebasestorage.app",
    messagingSenderId: "115162057060",
    appId: "1:115162057060:web:901e61cbcc2f1b076d1271",
    measurementId: "G-75FHWT93SM"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);

// Obtenha uma referência para o banco de dados
const database = getDatabase(app);

export { database, ref, push, onValue, remove, update };



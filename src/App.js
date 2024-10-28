import './App.css';

import React, { useEffect, useState, useCallback } from 'react';
import { openDB } from 'idb';

function App() {
    const [characters, setCharacters] = useState([]);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
  
    // Configura IndexedDB
    const initializeDB = async () => {
      return openDB('RickAndMortyDB', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('characters')) {
            db.createObjectStore('characters', { keyPath: 'id' });
          }
        },
      });
    };
  
    // Guardar personajes en IndexedDB
    const saveCharactersToDB = useCallback(async (characters) => {
      const db = await initializeDB();
      const tx = db.transaction('characters', 'readwrite');
      const store = tx.objectStore('characters');
      characters.forEach((character) => {
        store.put(character);
      });
      await tx.done;
    },[]);
  
    // Obtener personajes de IndexedDB
    const getCharactersFromDB = useCallback(async () => {
      const db = await initializeDB();
      const tx = db.transaction('characters', 'readonly');
      const store = tx.objectStore('characters');
      return store.getAll();
    },[]);
  
    useEffect(() => {
      const apiURL = 'https://rickandmortyapi.com/api/character';
  
      const fetchCharacters = async () => {
        const storedCharacters = await getCharactersFromDB();
  
        if (storedCharacters.length > 0) {
          setCharacters(storedCharacters);
        } else {
          try {
            const response = await fetch(apiURL);
            const data = await response.json();
            const firstTenCharacters = data.results.slice(0, 10);
  
            setCharacters(firstTenCharacters);
            await saveCharactersToDB(firstTenCharacters); // Guardar en IndexedDB
          } catch (error) {
            console.error('Error al obtener los personajes:', error);
          }
        }
      };
  
      fetchCharacters();
  
      const handleBeforeInstallPrompt = (event) => {
        event.preventDefault();
        setDeferredPrompt(event);
      };
  
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }, [getCharactersFromDB, saveCharactersToDB]);
  
    const handleInstallClick = (install) => {
      if (install && deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('El usuario aceptó la instalación');
          } else {
            console.log('El usuario rechazó la instalación');
          }
          setDeferredPrompt(null);
        });
      }
      setIsModalOpen(false);
    };
  
    return (
      <>
        <div className="container mt-5">
          <h1 className="text-center mb-4">Rick and Morty Characters</h1>
          <div className="row">
            {characters.map(character => (
              <div className="col-md-4 mb-4" key={character.id}>
                <div className="card">
                  <img
                    src={character.image}
                    className="card-img-top"
                    alt={character.name}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{character.name}</h5>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
  
        {deferredPrompt && (
          <div className="install-button max-w-md mx-auto mt-6 text-center">
            <button onClick={() => setIsModalOpen(true)} className="bg-green-500 text-white px-4 py-2 rounded-md shadow-sm hover:bg-green-600">
              Instalar PWA
            </button>
          </div>
        )}
  
        {isModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h2>¿Quieres instalar la aplicación?</h2>
              <button onClick={() => handleInstallClick(true)}>Instalar app</button>
              <button onClick={() => handleInstallClick(false)}>Cerrar</button>
            </div>
          </div>
        )}
      </>
    );
  
}

export default App;
////





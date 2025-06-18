import sqlite3 from 'sqlite3'
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Chemin vers la base de données
const dbPath = join(__dirname, '../../database.sqlite')

// Créer la connexion à la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur lors de la connexion à la base de données:', err.message)
  } else {
    console.log('✅ Connexion à SQLite établie')
  }
})

// Initialiser la base de données
export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Table des utilisateurs
      db.run(`
        CREATE TABLE IF NOT EXISTS utilisateurs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nom TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          dateCreation DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Erreur lors de la création de la table utilisateurs:', err)
          reject(err)
        }
      })

      // Table des listes
      db.run(`
        CREATE TABLE IF NOT EXISTS listes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nom TEXT NOT NULL,
          articles TEXT NOT NULL,
          utilisateurId INTEGER NOT NULL,
          dateCreation DATETIME DEFAULT CURRENT_TIMESTAMP,
          dateModification DATETIME DEFAULT CURRENT_TIMESTAMP,
          estPrincipale BOOLEAN DEFAULT 0,
          FOREIGN KEY (utilisateurId) REFERENCES utilisateurs (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Erreur lors de la création de la table listes:', err)
          reject(err)
        }
      })

      // Table des tokens de partage
      db.run(`
        CREATE TABLE IF NOT EXISTS tokens_partage (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          token TEXT UNIQUE NOT NULL,
          listeId INTEGER NOT NULL,
          dateCreation DATETIME DEFAULT CURRENT_TIMESTAMP,
          dateExpiration DATETIME,
          FOREIGN KEY (listeId) REFERENCES listes (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Erreur lors de la création de la table tokens_partage:', err)
          reject(err)
        } else {
          resolve()
        }
      })
    })
  })
}

// Modèle Liste
export const Liste = {
  // Créer ou mettre à jour la liste principale
  async sauvegarderPrincipale(nom, articles, utilisateurId) {
    return new Promise((resolve, reject) => {
      const articlesJson = JSON.stringify(articles)
      
      // Vérifier si une liste principale existe pour cet utilisateur
      db.get(
        'SELECT id FROM listes WHERE estPrincipale = 1 AND utilisateurId = ?',
        [utilisateurId],
        (err, row) => {
          if (err) {
            reject(err)
            return
          }
          
          if (row) {
            // Mettre à jour la liste existante
            db.run(
              'UPDATE listes SET nom = ?, articles = ?, dateModification = CURRENT_TIMESTAMP WHERE id = ?',
              [nom, articlesJson, row.id],
              function(err) {
                if (err) {
                  reject(err)
                } else {
                  resolve({ id: row.id, nom, articles })
                }
              }
            )
          } else {            // Créer une nouvelle liste principale
            db.run(
              'INSERT INTO listes (nom, articles, utilisateurId, estPrincipale) VALUES (?, ?, ?, 1)',
              [nom, articlesJson, utilisateurId],
              function(err) {
                if (err) {
                  reject(err)
                } else {
                  resolve({ id: this.lastID, nom, articles })
                }
              }
            )
          }
        }
      )
    })
  },

  // Obtenir la liste principale
  async obtenirPrincipale() {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM listes WHERE estPrincipale = 1',
        (err, row) => {
          if (err) {
            reject(err)
          } else if (row) {
            resolve({
              id: row.id,
              nom: row.nom,
              articles: JSON.parse(row.articles),
              dateCreation: row.dateCreation,
              dateModification: row.dateModification
            })
          } else {
            resolve(null)
          }
        }
      )
    })
  },
  // Obtenir une liste par ID
  async obtenirParId(id, utilisateurId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM listes WHERE id = ? AND utilisateurId = ?',
        [id, utilisateurId],
        (err, row) => {
          if (err) {
            reject(err)
          } else if (row) {
            resolve({
              id: row.id,
              nom: row.nom,
              articles: JSON.parse(row.articles),
              utilisateurId: row.utilisateurId,
              dateCreation: row.dateCreation,
              dateModification: row.dateModification,
              estPrincipale: Boolean(row.estPrincipale)
            })
          } else {
            resolve(null)
          }
        }
      )
    })
  },

  // Récupérer toutes les listes d'un utilisateur
  async getListesUtilisateur(utilisateurId) {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM listes WHERE utilisateurId = ? ORDER BY dateModification DESC',
        [utilisateurId],
        (err, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows.map(row => ({
              id: row.id,
              nom: row.nom,
              articles: JSON.parse(row.articles),
              utilisateurId: row.utilisateurId,
              dateCreation: row.dateCreation,
              dateModification: row.dateModification,
              estPrincipale: Boolean(row.estPrincipale)
            })))
          }
        }
      )
    })
  },

  // Créer une nouvelle liste
  async creerListe(nom, articles, utilisateurId) {
    return new Promise((resolve, reject) => {
      const articlesJson = JSON.stringify(articles)
      db.run(
        'INSERT INTO listes (nom, articles, utilisateurId, estPrincipale) VALUES (?, ?, ?, 0)',
        [nom, articlesJson, utilisateurId],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve({
              id: this.lastID,
              nom,
              articles,
              utilisateurId,
              estPrincipale: false,
              dateCreation: new Date().toISOString(),
              dateModification: new Date().toISOString()
            })
          }
        }
      )
    })
  },

  // Mettre à jour une liste
  async mettreAJourListe(id, nom, articles, utilisateurId) {
    return new Promise((resolve, reject) => {
      const articlesJson = JSON.stringify(articles)
      db.run(
        'UPDATE listes SET nom = ?, articles = ?, dateModification = CURRENT_TIMESTAMP WHERE id = ? AND utilisateurId = ?',
        [nom, articlesJson, id, utilisateurId],
        function(err) {
          if (err) {
            reject(err)
          } else {
            if (this.changes === 0) {
              reject(new Error('Liste non trouvée ou non autorisée'))
            } else {
              resolve({
                id,
                nom,
                articles,
                utilisateurId,
                dateModification: new Date().toISOString()
              })
            }
          }
        }
      )
    })
  },

  // Supprimer une liste
  async supprimerListe(id, utilisateurId) {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM listes WHERE id = ? AND utilisateurId = ? AND estPrincipale = 0',
        [id, utilisateurId],
        function(err) {
          if (err) {
            reject(err)
          } else {
            if (this.changes === 0) {
              reject(new Error('Liste non trouvée, non autorisée ou liste principale'))
            } else {
              resolve({ id })
            }
          }
        }
      )
    })
  },

  // Créer un token de partage
  async creerTokenPartage(listeId) {
    return new Promise((resolve, reject) => {
      // Générer un token unique
      const token = Buffer.from(JSON.stringify({
        listeId,
        timestamp: Date.now(),
        random: Math.random()
      })).toString('base64url')
      
      // Date d'expiration (30 jours)
      const dateExpiration = new Date()
      dateExpiration.setDate(dateExpiration.getDate() + 30)
      
      db.run(
        'INSERT INTO tokens_partage (token, listeId, dateExpiration) VALUES (?, ?, ?)',
        [token, listeId, dateExpiration.toISOString()],
        function(err) {
          if (err) {
            reject(err)
          } else {
            resolve(token)
          }
        }
      )
    })
  },

  // Obtenir une liste via un token de partage
  async obtenirParToken(token) {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT l.*, t.dateExpiration 
        FROM listes l 
        JOIN tokens_partage t ON l.id = t.listeId 
        WHERE t.token = ? AND (t.dateExpiration IS NULL OR t.dateExpiration > CURRENT_TIMESTAMP)
      `, [token], (err, row) => {
        if (err) {
          reject(err)
        } else if (row) {
          resolve({
            id: row.id,
            nom: row.nom,
            articles: JSON.parse(row.articles),
            dateCreation: row.dateCreation,
            dateModification: row.dateModification,
            readonly: true
          })
        } else {
          resolve(null)
        }
      })
    })
  }
}

// Fermer la connexion lors de l'arrêt
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Erreur lors de la fermeture de la base de données:', err.message)
    } else {
      console.log('🔐 Connexion à la base de données fermée')
    }
  })
})

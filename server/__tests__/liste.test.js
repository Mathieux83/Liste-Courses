import { Liste } from '../src/models/Liste.js';
import { jest } from '@jest/globals';

describe('Liste Model', () => {
  beforeEach(() => {
    // Setup de la base de données de test
  });

  afterEach(() => {
    // Nettoyage de la base de données de test
  });

  test('creerListe devrait créer une nouvelle liste', async () => {
    const nom = 'Ma liste de test';
    const articles = [{ id: 1, nom: 'Article 1', quantite: 1 }];
    const utilisateurId = 1;

    const liste = await Liste.creerListe(nom, articles, utilisateurId);

    expect(liste).toBeDefined();
    expect(liste.nom).toBe(nom);
    expect(liste.articles).toEqual(articles);
    expect(liste.utilisateurId).toBe(utilisateurId);
  });
});

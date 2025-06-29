import { TokenResetPassword } from '../models/User.js';

export default async function verifTokenReset(req, res, next) {
   const { token } = req.params;

   // Vérifier si le token existe et n'est pas expiré
   const tokenDoc = await TokenResetPassword.findOne({ token });
   if (!tokenDoc || tokenDoc.dateExpiration < new Date()) {
       return res.status(400).json({ error: 'Token invalide ou expiré' });
   } try {

        const tokenReset = await TokenResetPassword.findOne({
            token,
            dateExpiration: { $gt: new Date() }
        }).populate('email');
        

        if (!tokenReset || !tokenReset.email) {
            return res.status(401).json({ message: 'Token de réinitialisation invalide ou expiré' });
        }

        req.user = tokenReset.email; // On place l'utilisateur associé au token dans req pour les handlers suivants
        req.tokenReset = tokenReset; // On place le token de réinitialisation dans req
        next();
    } catch (error) {
        console.error('Erreur lors de la vérification du token de réinitialisation:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}

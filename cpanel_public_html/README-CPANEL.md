# Déploiement cPanel (public_html)

Ce dépôt contient tout ce qu'il faut pour pousser la landing Bloc Mood sur cPanel sans embarquer les fichiers Node. Le dossier **`cpanel_public_html/`** est régénéré à partir du code source et contient uniquement les fichiers texte indispensables.

## Étapes rapides
1. Générer le paquet de déploiement (texte uniquement) :
   ```bash
   python tools/package_cpanel.py
   ```
2. Uploader le **contenu** de `cpanel_public_html/` dans `public_html` (pas le dossier lui-même). Le paquet généré contient :
   - `index.html`
   - `api/subscribe.php`
   - `data/.htaccess`
   - `.htaccess` racine
   - `README-CPANEL.md`

## Images (manuel)
- Compresser/resize manuellement **en conservant exactement les mêmes noms de fichiers** :
  - `mood-crowd.jpg`, `mood-rooftop.jpg`, `mood-crew.jpg` → largeur recommandée 1920px, qualité ~75, JPEG progressif (ex. Squoosh).
  - `blocmood-logo.png` → idéalement 512x512 si disponible.
  - `blocmood-logo-menu.png`, `blocmood-favicon.png` peuvent être réutilisées telles quelles ou optimisées si besoin.
- Uploader ces images optimisées dans `public_html` (racine) pour remplacer les originaux.

## Permissions et vérifications
- Le dossier `data/` doit être accessible en écriture par PHP (généralement `755` ou `775` selon l’hébergeur).
- Le fichier `data/.htaccess` bloque l’accès direct aux données et ne doit pas être supprimé. Aucun `subscribers.json` ne doit être committé ou uploadé.
- Après upload, vérifier que l’API répond en JSON : `https://blocmood.ma/api/subscribe.php` (méthode POST) et que les en-têtes HTTPS/redirection fonctionnent via `.htaccess`.

## Notes
- `cpanel_public_html/assets/` est ignoré dans Git pour éviter d’y embarquer des binaires. Ajoutez manuellement les images optimisées côté hébergeur si besoin.
- Les fichiers Node (`server.js`, `package.json`, `node_modules`, etc.) sont exclus du paquet et ne doivent pas être envoyés sur cPanel.

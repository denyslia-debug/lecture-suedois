# Svenska Läsaren — mise en ligne et installation

Ce dossier est une application web installable (PWA), prête à être publiée telle quelle sur un site statique.

## 1. Mettre en ligne sur GitHub Pages

1. Sur github.com, créez un nouveau dépôt (par exemple `lasning`), public.
2. Envoyez le **contenu** du dossier `pwa/` à la racine du dépôt (`index.html`, `sw.js`, `manifest.webmanifest`, `icons/`, `data/`…) :
   - soit avec « Add file » → « Upload files » (glissez tout le contenu, y compris les dossiers) ;
   - soit en ligne de commande : `git init`, `git add .`, `git commit -m "Première version"`, `git branch -M main`, `git remote add origin https://github.com/VOTRE-NOM/lasning.git`, `git push -u origin main`.
3. Dans le dépôt : **Settings → Pages → Build and deployment** : Source « Deploy from a branch », branche `main`, dossier `/ (root)`, puis **Save**.
4. Après une à deux minutes, l'adresse s'affiche : `https://VOTRE-NOM.github.io/lasning/`.

Mise à jour : remplacez les fichiers puis, dans `sw.js`, changez le nom de version (`lecture-v1` → `lecture-v2`) pour que les téléphones récupèrent la nouvelle version.

## 2. Installer sur le téléphone

- **iPhone / iPad** : ouvrez l'adresse dans **Safari**, touchez le bouton **Partager**, puis **« Sur l'écran d'accueil »** et **Ajouter**.
- **Android** : ouvrez l'adresse dans **Chrome** ou **Samsung Internet**, ouvrez le menu (⋮ ou ☰), puis **« Installer l'application »** (ou « Ajouter à l'écran d'accueil »).

L'icône « Läsning » apparaît alors sur l'écran d'accueil ; l'application s'ouvre en plein écran et fonctionne hors ligne après une première visite.

## 3. À savoir

- **Données locales** : dans cette version, les mots enregistrés, les réglages et la progression sont stockés uniquement sur l'appareil (dans le navigateur). Ils ne se synchronisent pas entre appareils et disparaissent si l'on efface les données du site ou désinstalle l'application.
- **Voix suédoises** : la lecture à voix haute utilise les voix installées sur le téléphone. Si aucune voix suédoise n'est proposée, ajoutez-en une dans les réglages du téléphone (iPhone : Réglages → Accessibilité → Contenu énoncé → Voix → Svenska ; Android : Paramètres → Synthèse vocale → installer les données vocales suédoises).
- Les polices proviennent de Google Fonts ; hors ligne avant le premier chargement complet, des polices système les remplacent.

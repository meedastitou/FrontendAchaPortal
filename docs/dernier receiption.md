 Nouveau fichier créé

  - core/services/x3.service.ts - Service pour appeler l'API X3

  Fichiers modifiés

  comparaison-dashboard.component.ts:
  - Import du X3Service
  - Ajout des signaux derniereReception, derniereReceptionLoading, derniereReceptionError
  - Méthode loadDerniereReception() appelée au clic sur un article

  comparaison-dashboard.component.html:
  - Section "Dernière réception (Sage X3)" dans le modal avec:
    - Fournisseur (nom + code)
    - Prix + devise
    - Date de réception

  comparaison-dashboard.component.scss:
  - Styles pour la section de réception X3 (fond jaune/orange)

  Fonctionnement

  Quand vous cliquez sur un article dans la comparaison:
  1. Le modal s'ouvre
  2. L'API /api/x3/receptions/derniere/{code_article} est appelée
  3. La dernière réception est affichée en haut du modal (fond jaune)

  Si l'article n'a pas de réception dans X3, un message "Aucune réception trouvée dans X3" s'affiche.

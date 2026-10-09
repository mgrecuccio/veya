import { Injectable, computed, signal } from '@angular/core';
import { ITALIAN_TRANSLATIONS } from './italian-translations';

export type SupportedLanguage = 'en' | 'fr' | 'it';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
}

const STORAGE_KEY = 'veya.preferredLanguage';

export const FRENCH_TRANSLATIONS: Readonly<Record<string, string>> = {
  'Getting things ready…': 'Préparation en cours…',
  'Unable to connect': 'Connexion impossible',
  'Veya is temporarily unavailable. Check your connection and try again.':
    'Veya est temporairement indisponible. Vérifiez votre connexion et réessayez.',
  'Try again': 'Réessayer',
  'Go back': 'Retour',
  'Retry': 'Réessayer',
  'Cancel': 'Annuler',
  'Save': 'Enregistrer',
  'Remove': 'Supprimer',
  'Change': 'Modifier',
  'Accept': 'Accepter',
  'Reject': 'Refuser',
  'Decline': 'Refuser',
  'Close': 'Fermer',
  'Show': 'Afficher',
  'Hide': 'Masquer',
  'Active': 'Actif',
  'Available': 'Disponible',
  'Unavailable': 'Indisponible',
  'Sending': 'Envoi…',
  'Opening...': 'Ouverture…',

  'Welcome back': 'Bon retour',
  'Log in to pick up where your plans left off.':
    'Connectez-vous pour reprendre là où vous vous étiez arrêté.',
  'Phone number': 'Numéro de téléphone',
  'Phone number is required.': 'Le numéro de téléphone est requis.',
  'Enter a valid phone number (for example, +32468009911).':
    'Saisissez un numéro de téléphone valide (par exemple, +32468009911).',
  'Please enter a valid phone number (for example, +32468009911).':
    'Veuillez saisir un numéro de téléphone valide (par exemple, +32468009911).',
  'Password': 'Mot de passe',
  'Enter your password': 'Saisissez votre mot de passe',
  'Password is required.': 'Le mot de passe est requis.',
  'Password must be at least 8 characters.':
    'Le mot de passe doit contenir au moins 8 caractères.',
  'Invalid phone number or password.': 'Numéro de téléphone ou mot de passe incorrect.',
  'Forgot password?': 'Mot de passe oublié ?',
  'Logging in...': 'Connexion…',
  'Log In': 'Se connecter',
  'Don’t have an account?': 'Vous n’avez pas de compte ?',
  'Sign up': 'Créer un compte',
  'Country calling code': 'Indicatif téléphonique du pays',

  'Reconnect with your friends,': 'Retrouvez vos amis,',
  "when you're both free!": 'quand vous êtes tous les deux disponibles !',
  'Join Veya and make plans in the moment!':
    'Rejoignez Veya et organisez des moments spontanés !',
  'Connect with friends': 'Retrouvez vos amis',
  'Invite and chat with trusted contacts.':
    'Invitez des contacts de confiance et échangez avec eux.',
  'Meet up spontaneously': 'Retrouvez-vous spontanément',
  'Find the best time to reconnect.': 'Trouvez le bon moment pour vous retrouver.',
  'Get started': 'Commencer',
  'Already have an account?': 'Vous avez déjà un compte ?',
  'Log in': 'Se connecter',

  'Reset your password': 'Réinitialiser votre mot de passe',
  'Enter your phone number to request a verification code.':
    'Saisissez votre numéro de téléphone pour demander un code de vérification.',
  'Check your phone': 'Consultez votre téléphone',
  'Verification code': 'Code de vérification',
  'Verification code is required.': 'Le code de vérification est requis.',
  'New password': 'Nouveau mot de passe',
  'Enter your new password': 'Saisissez votre nouveau mot de passe',
  'Use a different number': 'Utiliser un autre numéro',
  'Back to login': 'Retour à la connexion',
  'If an account exists for this phone number, we sent a verification code.':
    'Si un compte existe pour ce numéro, nous avons envoyé un code de vérification.',
  'We could not verify this code. Request a new one.':
    'Nous n’avons pas pu vérifier ce code. Demandez-en un nouveau.',
  'Your password has been reset. Log in with your new password.':
    'Votre mot de passe a été réinitialisé. Connectez-vous avec votre nouveau mot de passe.',

  'Create your account': 'Créez votre compte',
  'Start planning spontaneous moments with the people you care about.':
    'Commencez à organiser des moments spontanés avec les personnes qui comptent pour vous.',
  'Name': 'Nom',
  'Your name': 'Votre nom',
  'Name is required.': 'Le nom est requis.',
  'An account with this phone number already exists.':
    'Un compte existe déjà avec ce numéro de téléphone.',
  'Create a password': 'Créez un mot de passe',
  'Confirm password': 'Confirmer le mot de passe',
  'Repeat your password': 'Répétez votre mot de passe',
  'Please confirm your password.': 'Veuillez confirmer votre mot de passe.',
  'Passwords do not match.': 'Les mots de passe ne correspondent pas.',
  'Creating account...': 'Création du compte…',
  'Create account': 'Créer un compte',

  'Verify your phone': 'Vérifiez votre téléphone',
  'Enter the code sent to the phone number you registered.':
    'Saisissez le code envoyé au numéro de téléphone enregistré.',
  'Correct phone number': 'Corriger le numéro de téléphone',
  'Enter a valid phone number.': 'Saisissez un numéro de téléphone valide.',
  'Enter the verification code.': 'Saisissez le code de vérification.',
  "Didn't receive a code?": 'Vous n’avez pas reçu de code ?',
  'Entered the wrong number?': 'Vous avez saisi le mauvais numéro ?',
  'Change phone number': 'Modifier le numéro de téléphone',
  'Sending...': 'Envoi…',
  'Resend code': 'Renvoyer le code',
  'Invalid code. Please try again.': 'Code incorrect. Veuillez réessayer.',
  'A new verification code has been sent.': 'Un nouveau code de vérification a été envoyé.',
  'Your phone number was updated. A new verification code has been sent.':
    'Votre numéro de téléphone a été mis à jour. Un nouveau code de vérification a été envoyé.',
  'We couldn’t update your phone number. Please try again.':
    'Nous n’avons pas pu mettre à jour votre numéro de téléphone. Veuillez réessayer.',
  'Phone number verified and updated.': 'Numéro de téléphone vérifié et mis à jour.',

  'Availability': 'Disponibilité',
  'Reload availability': 'Recharger les disponibilités',
  'Try fetching your rhythm and temporary changes again.':
    'Essayez à nouveau de charger votre rythme et vos changements temporaires.',
  'Your rhythm': 'Votre rythme',
  'Let people catch you at the right moment.': 'Laissez les autres vous joindre au bon moment.',
  'Set your usual rhythm, then adjust when life shifts. You stay in control of what you share.':
    'Définissez votre rythme habituel, puis adaptez-le lorsque votre quotidien change. Vous gardez le contrôle de ce que vous partagez.',
  'This week': 'Cette semaine',
  'A simple view of how your week looks once everything is taken into account.':
    'Une vue simple de votre semaine, tous les éléments pris en compte.',
  'Nothing shared here yet — your week is currently quiet.':
    'Rien n’est encore partagé ici. Votre semaine est calme pour le moment.',
  'Weekly routine': 'Routine hebdomadaire',
  'Your usual moments to reconnect. Think of this as your default rhythm.':
    'Vos moments habituels pour reprendre contact. Considérez-les comme votre rythme par défaut.',
  'Your routine': 'Votre routine',
  'Add a regular time': 'Ajouter un créneau régulier',
  'Add regular time': 'Ajouter un créneau régulier',
  'For example: Tuesday evenings for a quick chat.':
    'Par exemple : le mardi soir pour une courte discussion.',
  'Day': 'Jour',
  'From': 'De',
  'To': 'À',
  'How you prefer to connect': 'Votre moyen de communication préféré',
  'Chat': 'Discussion',
  'Call': 'Appel',
  'Add time': 'Ajouter le créneau',
  'Save changes': 'Enregistrer les modifications',
  'Saving…': 'Enregistrement…',
  'Save change': 'Enregistrer le changement',
  'Show fewer adjustments': 'Afficher moins de changements',
  'Accepting…': 'Acceptation…',
  'Unblocking…': 'Déblocage…',
  'Unblock': 'Débloquer',
  'Turned off': 'Désactivé',
  'No rhythm yet': 'Aucun rythme pour le moment',
  'Start small — even one regular moment can make reconnecting easier.':
    'Commencez simplement. Un seul moment régulier peut déjà faciliter les retrouvailles.',
  'Adjust for real life': 'Adaptez-vous au quotidien',
  'Temporary changes that sit on top of your routine. Close a moment, or open one — whatever fits your day.':
    'Des changements temporaires qui s’ajoutent à votre routine. Fermez ou ouvrez un créneau selon votre journée.',
  'Temporary change': 'Changement temporaire',
  'Adjust a moment': 'Adapter un créneau',
  'Close off time, or make space for something spontaneous.':
    'Bloquez du temps ou faites de la place pour un moment spontané.',
  'Add another exception to adjust this.': 'Ajoutez une autre exception pour l’adapter.',
  'No adjustments right now': 'Aucun changement pour le moment',
  'Your routine is being shared just as it is.': 'Votre routine est partagée telle quelle.',
  'Open settings': 'Ouvrir les réglages',
  'Settings preview': 'Aperçu des réglages',
  'Add temporary change': 'Ajouter un changement temporaire',
  'We couldn’t load your availability right now. Please try again.':
    'Nous n’avons pas pu charger vos disponibilités. Veuillez réessayer.',
  'Start time must be before end time.': 'L’heure de début doit précéder l’heure de fin.',
  'Rule added.': 'Créneau ajouté.',
  'Rule updated.': 'Créneau mis à jour.',
  'We couldn’t save that rule right now.': 'Nous n’avons pas pu enregistrer ce créneau.',
  'Rule deleted.': 'Créneau supprimé.',
  'We couldn’t delete that rule right now.': 'Nous n’avons pas pu supprimer ce créneau.',
  'Start date must be now or in the future.':
    'La date de début doit être actuelle ou future.',
  'Start date must be before end date.': 'La date de début doit précéder la date de fin.',
  'Exception added': 'Exception ajoutée',
  'We couldn’t save that exception right now.':
    'Nous n’avons pas pu enregistrer cette exception.',
  'Today': 'Aujourd’hui',
  'Tomorrow': 'Demain',
  'Later this week': 'Plus tard cette semaine',

  'Your circle': 'Votre cercle',
  'Reload contacts': 'Recharger les contacts',
  'Try fetching your circle and invitations again.':
    'Essayez à nouveau de charger votre cercle et vos invitations.',
  'Private circle': 'Cercle privé',
  'Trusted people you’d like to reconnect with.':
    'Les personnes de confiance avec lesquelles vous souhaitez reprendre contact.',
  'Contacts': 'Contacts',
  'Pending': 'En attente',
  'Blocked': 'Bloqués',
  'Invite someone': 'Inviter quelqu’un',
  'Add a trusted person you’d love to hear from more often.':
    'Ajoutez une personne de confiance dont vous aimeriez avoir plus souvent des nouvelles.',
  'New invitation': 'Nouvelle invitation',
  'Invite a contact': 'Inviter un contact',
  'Choose a phone contact or enter their number.':
    'Choisissez un contact du téléphone ou saisissez son numéro.',
  'Choose from contacts': 'Choisir dans les contacts',
  'Opening contacts…': 'Ouverture des contacts…',
  'Nickname': 'Surnom',
  '(optional)': '(facultatif)',
  'How you know them': 'Comment vous les connaissez',
  'Send invitation': 'Envoyer l’invitation',
  'Pending invitations': 'Invitations en attente',
  'A few people are waiting to join your trusted circle.':
    'Quelques personnes attendent de rejoindre votre cercle de confiance.',
  'No pending invitations right now': 'Aucune invitation en attente',
  'Your circle is feeling settled. Invite someone new whenever the moment feels right.':
    'Votre cercle prend forme. Invitez une nouvelle personne lorsque le moment vous convient.',
  'Accepted contacts': 'Contacts acceptés',
  'People already in your private circle.': 'Les personnes déjà présentes dans votre cercle privé.',
  'Favorite': 'Favori',
  'Your accepted circle is still taking shape': 'Votre cercle accepté prend encore forme',
  'You’ve got invitations in motion. Once accepted, your trusted people will appear here.':
    'Des invitations sont en cours. Une fois acceptées, vos contacts de confiance apparaîtront ici.',
  'Blocked contacts': 'Contacts bloqués',
  'People you have paused contact with.': 'Les personnes avec lesquelles vous avez suspendu le contact.',
  'Your circle starts small.': 'Votre cercle commence petit.',
  'Invite someone you’d love to hear from more often. Veya works best with people you already know and trust.':
    'Invitez une personne dont vous aimeriez avoir plus souvent des nouvelles. Veya fonctionne mieux avec les personnes que vous connaissez déjà et en qui vous avez confiance.',
  'Invite your first contact': 'Inviter votre premier contact',
  'Edit nickname': 'Modifier le surnom',
  'Remove contact': 'Supprimer le contact',
  'Block contact': 'Bloquer le contact',
  'Choose a phone number': 'Choisir un numéro de téléphone',
  'Choose someone from device contacts': 'Choisir une personne dans les contacts du téléphone',
  'Open contact controls': 'Ouvrir les actions du contact',
  'We couldn’t load your circle right now. Please try again.':
    'Nous n’avons pas pu charger votre cercle. Veuillez réessayer.',
  'Your contacts are unavailable. Enter the phone number instead.':
    'Vos contacts sont indisponibles. Saisissez plutôt le numéro de téléphone.',
  'We couldn’t open your contacts. Enter the phone number instead.':
    'Nous n’avons pas pu ouvrir vos contacts. Saisissez plutôt le numéro de téléphone.',
  'Invitation sent.': 'Invitation envoyée.',
  'That person isn’t on Veya yet.': 'Cette personne n’utilise pas encore Veya.',
  'We couldn’t send that invitation right now.': 'Nous n’avons pas pu envoyer cette invitation.',
  'That contact has no phone number. Enter one manually instead.':
    'Ce contact n’a pas de numéro de téléphone. Saisissez-en un manuellement.',
  'Pending invitation': 'Invitation en attente',
  'Invitation accepted.': 'Invitation acceptée.',
  'We couldn’t accept that invitation right now.': 'Nous n’avons pas pu accepter cette invitation.',
  'Invitation rejected.': 'Invitation refusée.',
  'We couldn’t reject that invitation right now.': 'Nous n’avons pas pu refuser cette invitation.',
  'Contact unblocked.': 'Contact débloqué.',
  'We couldn’t unblock that contact right now.': 'Nous n’avons pas pu débloquer ce contact.',
  'Added to favorites.': 'Ajouté aux favoris.',
  'Removed from favorites.': 'Retiré des favoris.',
  'We couldn’t update that contact right now.': 'Nous n’avons pas pu mettre à jour ce contact.',
  'Contact removed.': 'Contact supprimé.',
  'We couldn’t remove that contact right now.': 'Nous n’avons pas pu supprimer ce contact.',
  'Contact blocked.': 'Contact bloqué.',
  'We couldn’t block that contact right now.': 'Nous n’avons pas pu bloquer ce contact.',
  'Contact nickname updated.': 'Surnom du contact mis à jour.',
  'Trusted contact': 'Contact de confiance',
  'Blocked contact': 'Contact bloqué',

  'Home': 'Accueil',
  'Home unavailable': 'Accueil indisponible',
  'Reload dashboard': 'Recharger l’accueil',
  'Try fetching your contacts and availability again.':
    'Essayez à nouveau de charger vos contacts et vos disponibilités.',
  'Readiness dashboard': 'Vue d’ensemble',
  'Free now': 'Disponible maintenant',
  "You're free now": 'Vous êtes disponible maintenant',
  "We'll look for available contacts": 'Nous rechercherons des contacts disponibles',
  'Let friends know you’re available right now':
    'Indiquez à vos amis que vous êtes disponible maintenant',
  'On now': 'Activé',
  'Turn on': 'Activer',
  'Today’s availability': 'Disponibilités du jour',
  'Windows still open for reconnecting today.':
    'Créneaux encore disponibles aujourd’hui pour reprendre contact.',
  'No availability later today': 'Aucune disponibilité plus tard aujourd’hui',
  'Use Free now when you are open to reconnecting, or add temporary or recurring availability when you want to plan ahead.':
    'Utilisez Disponible maintenant lorsque vous souhaitez reprendre contact, ou ajoutez une disponibilité temporaire ou récurrente pour planifier.',
  'Contacts snapshot': 'Aperçu des contacts',
  'Your trusted circle is starting to take shape.': 'Votre cercle de confiance commence à prendre forme.',
  'Received invitations': 'Invitations reçues',
  'Open Contacts': 'Ouvrir les contacts',
  'Manage trusted people, invitations, and future favorites.':
    'Gérez vos contacts de confiance, vos invitations et vos futurs favoris.',
  'We couldn’t load your dashboard right now. Please try again.':
    'Nous n’avons pas pu charger votre accueil. Veuillez réessayer.',
  'Today’s availability could not be loaded right now.':
    'Les disponibilités du jour n’ont pas pu être chargées.',
  'You’re ready for spontaneous reconnects.': 'Vous êtes prêt pour des retrouvailles spontanées.',
  'Your trusted circle is in place, so you can go visible whenever the moment feels right.':
    'Votre cercle de confiance est prêt. Vous pouvez vous rendre disponible lorsque le moment vous convient.',
  'You’re almost ready to reconnect spontaneously.':
    'Vous êtes presque prêt pour des retrouvailles spontanées.',
  'A small setup step is still missing, but you’re very close to making spontaneous moments easier.':
    'Il ne manque qu’une petite étape de configuration pour faciliter les moments spontanés.',
  'Let’s get Veya ready.': 'Préparons Veya.',
  'A little setup now will help you reconnect naturally when time lines up with your friends.':
    'Quelques réglages maintenant vous aideront à reprendre contact naturellement lorsque vos disponibilités coïncident.',

  'Matches': 'Connexions',
  'Ready to reconnect': 'Prêt à reprendre contact',
  'Your matches': 'Vos connexions',
  'Accepted matches will appear here when your availability lines up.':
    'Les connexions acceptées apparaîtront ici lorsque vos disponibilités coïncident.',
  'Match requests': 'Demandes de connexion',
  'People who want to reconnect with you.': 'Les personnes qui souhaitent reprendre contact avec vous.',
  'Loading match requests...': 'Chargement des demandes de connexion…',
  'No match requests are waiting right now.': 'Aucune demande de connexion en attente.',
  'Suggested matches': 'Connexions suggérées',
  'Suggested people are based on backend-computed availability overlap.':
    'Les suggestions reposent sur vos disponibilités communes.',
  'Loading match suggestions...': 'Chargement des suggestions…',
  'No suggestions are available right now.': 'Aucune suggestion n’est disponible pour le moment.',
  'Propose': 'Proposer',
  'Accepted matches': 'Connexions acceptées',
  'Matches appear here after both people agree to reconnect.':
    'Les connexions apparaissent ici lorsque les deux personnes acceptent de reprendre contact.',
  'Loading accepted matches...': 'Chargement des connexions acceptées…',
  'Accepted matches will appear here after both required consents exist.':
    'Les connexions acceptées apparaîtront ici lorsque les deux personnes auront donné leur accord.',
  'Accepted match': 'Connexion acceptée',
  'Channel': 'Canal',
  'Open WhatsApp': 'Ouvrir WhatsApp',
  'Close match detail': 'Fermer le détail de la connexion',
  'Match details': 'Détails de la connexion',
  'Decline match request': 'Refuser la demande de connexion',
  'Accept match request': 'Accepter la demande de connexion',
  'We could not load match requests right now. Please try again.':
    'Nous n’avons pas pu charger les demandes de connexion. Veuillez réessayer.',
  'We could not load match suggestions right now. Please try again.':
    'Nous n’avons pas pu charger les suggestions. Veuillez réessayer.',
  'We could not load your accepted matches right now. Please try again.':
    'Nous n’avons pas pu charger vos connexions acceptées. Veuillez réessayer.',
  'Proposal sent.': 'Proposition envoyée.',
  'WhatsApp is not available for this match right now.':
    'WhatsApp n’est pas disponible pour cette connexion pour le moment.',
  'We could not open WhatsApp for this match right now.':
    'Nous n’avons pas pu ouvrir WhatsApp pour cette connexion.',
  'The contact link did not open.': 'Le lien de contact ne s’est pas ouvert.',
  'We could not open WhatsApp. Make sure it is installed and try again.':
    'Nous n’avons pas pu ouvrir WhatsApp. Vérifiez que l’application est installée et réessayez.',
  'Suggested match': 'Connexion suggérée',
  'Match request': 'Demande de connexion',
  'Proposal accepted.': 'Proposition acceptée.',
  'Proposal declined.': 'Proposition refusée.',
  'You already have a proposal for this suggestion.':
    'Vous avez déjà envoyé une proposition pour cette suggestion.',
  'This suggestion is no longer available.': 'Cette suggestion n’est plus disponible.',
  'We could not send this proposal right now.': 'Nous n’avons pas pu envoyer cette proposition.',
  'This proposal is no longer available.': 'Cette proposition n’est plus disponible.',
  'We could not accept this proposal right now.': 'Nous n’avons pas pu accepter cette proposition.',
  'We could not decline this proposal right now.': 'Nous n’avons pas pu refuser cette proposition.',

  'Your settings': 'Vos réglages',
  'Reload settings': 'Recharger les réglages',
  'Try fetching your profile and matching preferences again.':
    'Essayez à nouveau de charger votre profil et vos préférences.',
  'Account': 'Compte',
  'Profile': 'Profil',
  'Display name': 'Nom affiché',
  'Display name is required.': 'Le nom affiché est requis.',
  'Timezone': 'Fuseau horaire',
  'Timezone is required.': 'Le fuseau horaire est requis.',
  'Saving profile...': 'Enregistrement du profil…',
  'Save profile': 'Enregistrer le profil',
  'Language': 'Langue',
  'Choose the language used by Veya.': 'Choisissez la langue utilisée par Veya.',
  'English': 'Anglais',
  'French': 'Français',
  'Language saved.': 'Langue enregistrée.',
  'We couldn’t save your language right now.':
    'Nous n’avons pas pu enregistrer votre langue pour le moment.',
  'Preferences': 'Préférences',
  'Chat matching': 'Connexions par discussion',
  'Call matching': 'Connexions par appel',
  'Chat matching on': 'Connexions par discussion activées',
  'Chat matching off': 'Connexions par discussion désactivées',
  'Call matching on': 'Connexions par appel activées',
  'Call matching off': 'Connexions par appel désactivées',
  'Quiet hours start': 'Début des heures calmes',
  'Quiet hours end': 'Fin des heures calmes',
  'Push notifications': 'Notifications push',
  'Suggestion notifications': 'Notifications de suggestion',
  'Saving preferences...': 'Enregistrement des préférences…',
  'Save preferences': 'Enregistrer les préférences',
  'Security': 'Sécurité',
  'Manage your account password.': 'Gérez le mot de passe de votre compte.',
  'Change password': 'Modifier le mot de passe',
  'Update your credentials and sign in again.':
    'Mettez à jour vos identifiants, puis reconnectez-vous.',
  'Delete account': 'Supprimer le compte',
  'Permanently remove your account and all associated data.':
    'Supprimez définitivement votre compte et toutes les données associées.',
  'Deleting account...': 'Suppression du compte…',
  'Delete my account': 'Supprimer mon compte',
  'Logging out...': 'Déconnexion…',
  'Logout': 'Se déconnecter',
  'Delete account?': 'Supprimer le compte ?',
  'This permanently deletes your account and all associated data. This action cannot be undone.':
    'Cette action supprime définitivement votre compte et toutes les données associées. Elle est irréversible.',
  'Close delete account confirmation': 'Fermer la confirmation de suppression du compte',
  'You’ll need to sign in again after changing it.':
    'Vous devrez vous reconnecter après l’avoir modifié.',
  'Close change password dialog': 'Fermer la fenêtre de modification du mot de passe',
  'Current password': 'Mot de passe actuel',
  'Current password is required.': 'Le mot de passe actuel est requis.',
  'Please confirm your new password.': 'Veuillez confirmer votre nouveau mot de passe.',
  'Changing password...': 'Modification du mot de passe…',
  'You can change your phone number once per day. Please try again later.':
    'Vous pouvez modifier votre numéro de téléphone une fois par jour. Veuillez réessayer plus tard.',
  'We couldn’t load your settings right now. Please try again.':
    'Nous n’avons pas pu charger vos réglages. Veuillez réessayer.',
  'Profile saved.': 'Profil enregistré.',
  'We couldn’t save your profile right now.': 'Nous n’avons pas pu enregistrer votre profil.',
  'Preferences saved.': 'Préférences enregistrées.',
  'We couldn’t save your preferences right now.':
    'Nous n’avons pas pu enregistrer vos préférences.',
  'We couldn’t change your password right now.':
    'Nous n’avons pas pu modifier votre mot de passe.',
  'We couldn’t delete your account right now. Please try again.':
    'Nous n’avons pas pu supprimer votre compte. Veuillez réessayer.',
  'Enable notifications': 'Activer les notifications',
  'Notifications are disabled for Veya. You can enable them in your device settings.':
    'Les notifications sont désactivées pour Veya. Vous pouvez les activer dans les réglages de votre appareil.',
  'Open Settings': 'Ouvrir les réglages',

  'Unable to reach the server. Please try again.':
    'Impossible de joindre le service. Veuillez réessayer.',
  'Your session has expired. Please log in again.':
    'Votre session a expiré. Veuillez vous reconnecter.',
  'Please wait a few minutes before requesting another code.':
    'Veuillez patienter quelques minutes avant de demander un autre code.',
  'Something went wrong. Please try again.': 'Une erreur est survenue. Veuillez réessayer.',
  'Code expired. Request a new one.': 'Le code a expiré. Demandez-en un nouveau.',
  'Phone number is already verified.': 'Le numéro de téléphone est déjà vérifié.',
  'The verification request was invalid. Please try again.':
    'La demande de vérification n’était pas valide. Veuillez réessayer.',
  'Your account could not be found. Please log in again.':
    'Votre compte est introuvable. Veuillez vous reconnecter.',
  'Verification is temporarily unavailable. Please try again later.':
    'La vérification est temporairement indisponible. Veuillez réessayer plus tard.',
  'Your current password is incorrect.': 'Votre mot de passe actuel est incorrect.',
  'Check the information you entered and try again.':
    'Vérifiez les informations saisies et réessayez.',
  'The verification code is invalid.': 'Le code de vérification est incorrect.',
  'The verification code has expired. Request a new one.':
    'Le code de vérification a expiré. Demandez-en un nouveau.',
  'Too many attempts. Try again later.': 'Trop de tentatives. Réessayez plus tard.',

  'Monday': 'Lundi',
  'Tuesday': 'Mardi',
  'Wednesday': 'Mercredi',
  'Thursday': 'Jeudi',
  'Friday': 'Vendredi',
  'Saturday': 'Samedi',
  'Sunday': 'Dimanche',
  'recently': 'récemment',
  'today': 'aujourd’hui',
  'yesterday': 'hier',
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly currentLanguage = signal<SupportedLanguage>(this.detectInitialLanguage());

  readonly language = this.currentLanguage.asReadonly();
  readonly locale = computed(() => {
    const language = this.currentLanguage();
    return language === 'fr' ? 'fr-BE' : language === 'it' ? 'it-IT' : 'en-GB';
  });
  readonly options: readonly LanguageOption[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'it', label: 'Italiano' },
  ];

  constructor() {
    this.applyDocumentLanguage(this.currentLanguage());
  }

  setLanguage(language: SupportedLanguage): void {
    if (!this.isSupportedLanguage(language)) {
      return;
    }

    this.currentLanguage.set(language);
    this.applyDocumentLanguage(language);

    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, language);
    } catch {
      // Language selection still works for the current session.
    }
  }

  translate(value: string): string {
    if (this.currentLanguage() === 'en') {
      return value;
    }

    const translations = this.currentLanguage() === 'fr'
      ? FRENCH_TRANSLATIONS
      : ITALIAN_TRANSLATIONS;
    const exact = translations[value];
    if (exact) {
      return exact;
    }

    const patterns = this.currentLanguage() === 'fr'
      ? this.frenchPatterns()
      : this.italianPatterns();

    for (const [pattern, formatter] of patterns) {
      const match = value.match(pattern);
      if (match) {
        return formatter(match);
      }
    }

    return value;
  }

  translateRendered(value: string): string {
    const leading = value.match(/^\s*/)?.[0] ?? '';
    const trailing = value.match(/\s*$/)?.[0] ?? '';
    const normalized = value.replace(/\s+/g, ' ').trim();

    if (!normalized) {
      return value;
    }

    return `${leading}${this.translate(normalized)}${trailing}`;
  }

  isSupportedLanguage(value: unknown): value is SupportedLanguage {
    return value === 'en' || value === 'fr' || value === 'it';
  }

  private detectInitialLanguage(): SupportedLanguage {
    try {
      const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (this.isSupportedLanguage(stored)) {
        return stored;
      }
    } catch {
      // Fall back to the device language.
    }

    const deviceLanguage = globalThis.navigator?.language?.toLowerCase() ?? '';
    if (deviceLanguage.startsWith('fr')) {
      return 'fr';
    }
    return deviceLanguage.startsWith('it') ? 'it' : 'en';
  }

  private applyDocumentLanguage(language: SupportedLanguage): void {
    globalThis.document?.documentElement?.setAttribute('lang', language);
  }

  private frenchPatterns(): Array<[RegExp, (match: RegExpMatchArray) => string]> {
    return [
      [/^Hi, (.+)$/, (match) => `Bonjour, ${match[1]}`],
      [/^Invited (.+)$/, (match) => `Invité(e) ${match[1]}`],
      [/^Added (.+)$/, (match) => `Ajouté(e) ${match[1]}`],
      [/^(\d+) days ago$/, (match) => `il y a ${match[1]} jours`],
      [/^Version (.+)$/, (match) => `Version ${match[1]}`],
      [/^Show all (\d+) adjustments$/, (match) => `Afficher les ${match[1]} changements`],
      [/^(.+) You can still update your display name and timezone\.$/, (match) =>
        `${this.translate(match[1])} Vous pouvez toujours modifier votre nom affiché et votre fuseau horaire.`],
      [/^(.+) · ACTIVE$/, (match) => `${match[1]} · ACTIF`],
    ];
  }

  private italianPatterns(): Array<[RegExp, (match: RegExpMatchArray) => string]> {
    return [
      [/^Hi, (.+)$/, (match) => `Ciao, ${match[1]}`],
      [/^Invited (.+)$/, (match) => `Invitato/a ${match[1]}`],
      [/^Added (.+)$/, (match) => `Aggiunto/a ${match[1]}`],
      [/^(\d+) days ago$/, (match) => `${match[1]} giorni fa`],
      [/^Version (.+)$/, (match) => `Versione ${match[1]}`],
      [/^Show all (\d+) adjustments$/, (match) => `Mostra tutte le ${match[1]} modifiche`],
      [/^(.+) You can still update your display name and timezone\.$/, (match) =>
        `${this.translate(match[1])} Puoi comunque modificare il nome visualizzato e il fuso orario.`],
      [/^(.+) · ACTIVE$/, (match) => `${match[1]} · ATTIVO`],
    ];
  }
}

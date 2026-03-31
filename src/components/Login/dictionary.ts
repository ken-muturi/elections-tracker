import { PartialTranslation } from "@/types";

export const dictionary: Record<string, PartialTranslation[]> = {
  error: [
    { body: { language: 'en', text: 'Error' } },
    { body: { language: 'fr', text: 'Erreur' } },
    { body: { language: 'es', text: 'Error' } },
    { body: { language: 'ar', text: 'خطأ' } },
  ],
  loginSuccessful: [
    { body: { language: 'en', text: 'Login Successful' } },
    { body: { language: 'fr', text: 'Connexion réussie' } },
    { body: { language: 'es', text: 'Inicio de sesión exitoso' } },
    { body: { language: 'ar', text: 'تسجيل الدخول بنجاح' } },
    { body: { language: 'ny', text: 'Lowani bwino' } }
  ],
  loginSuccessfulDesc: [
    { body: { language: 'en', text: 'You have successfully logged in' } },
    { body: { language: 'fr', text: 'Vous vous êtes connecté avec succès' } },
    { body: { language: 'es', text: 'Has iniciado sesión con éxito' } },
    { body: { language: 'ar', text: 'لقد قمت بتسجيل الدخول بنجاح' } },
    { body: { language: 'ny', text: 'Mwapanga bwino' } }
  ],
  password: [
    { body: { language: 'en', text: 'Password' } },
    { body: { language: 'fr', text: 'Mot de passe' } },
    { body: { language: 'es', text: 'Contraseña' } },
    { body: { language: 'ar', text: 'كلمة المرور' } },
    { body: { language: 'ny', text: 'Chinsinsi' } }
  ],
  loginFailed: [
    { body: { language: 'en', text: 'Login Failed' } },
    { body: { language: 'fr', text: 'Échec de la connexion' } },
    { body: { language: 'es', text: 'Error de inicio de sesión' } },
    { body: { language: 'ar', text: 'فشل تسجيل الدخول' } },
    { body: { language: 'ny', text: 'Lowani kwachitika' } }
  ],
  tryAgain: [
    { body: { language: 'en', text: 'Please try again' } },
    { body: { language: 'fr', text: 'Veuillez réessayer' } },
    { body: { language: 'es', text: 'Por favor, inténtelo de nuevo' } },
    { body: { language: 'ar', text: 'يرجى المحاولة مرة أخرى' } },
  ],
  emailAddress: [
    { body: { language: 'en', text: 'Email Address' } },
    { body: { language: 'fr', text: 'Adresse e-mail' } },
    { body: { language: 'es', text: 'Dirección de correo electrónico' } },
    { body: { language: 'ar', text: 'عنوان البريد الإلكتروني' } },
    { body: { language: "ny", text: "Imelo" } }
  ],
  submit: [
    { body: { language: 'en', text: 'Submit' } },
    { body: { language: 'fr', text: 'Soumettre' } },
    { body: { language: 'es', text: 'Enviar' } },
    { body: { language: 'ar', text: 'خضع' } },
    { body: { language: 'ny', text: 'Tumizani' } }
  ],
  errorDesc: [
    {
      body: {
        language: 'en',
        text: 'There was an error processing your request',
      },
    },
    {
      body: {
        language: 'fr',
        text: "Une erreur s'est produite lors du traitement de votre demande",
      },
    },
    {
      body: {
        language: 'es',
        text: 'Se produjo un error al procesar su solicitud',
      },
    },
    { body: { language: 'ar', text: 'حدث خطأ أثناء معالجة طلبك' } },
    { body: { language: 'ny', text: 'Pali cholakwika pakupanga pempho lanu' } }
  ],
  login: [
    { body: { language: 'en', text: 'Login' } },
    { body: { language: 'fr', text: 'Connexion' } },
    { body: { language: 'es', text: 'Iniciar sesión' } },
    { body: { language: 'ar', text: 'تسجيل الدخول' } },
    { body: { language: 'ny', text: 'Lowani' } }
  ],
  accountDoesNotExist: [
    { body: { language: 'en', text: 'The account your are trying to validate does not exists.' } },
    { body: { language: 'fr', text: 'Le compte que vous essayez de valider n\'existe pas.' } },
    { body: { language: 'es', text: 'La cuenta que intenta validar no existe.' } },
    { body: { language: 'ar', text: 'الحساب الذي تحاول التحقق من صحته غير موجود.' } },
    { body: { language: 'ny', text: 'Akaunti yomwe mukuyesera kutsimikizira sipezeka.' } }
  ],
  accountVerificationSuccess: [
    { body: { language: 'en', text: 'Account verification successful. You will be redirected to the respective portal.' } },
    { body: { language: 'fr', text: 'La vérification du compte a réussi. Vous serez redirigé vers le portail respectif.' } },
    { body: { language: 'es', text: 'Verificación de cuenta exitosa. Serás redirigido al portal respectivo.' } },
    { body: { language: 'ar', text: 'تم التحقق من الحساب بنجاح. سيتم توجيهك إلى البوابة المعنية.' } },
    { body: { language: 'ny', text: 'Kutsimikizika kwa akaunti kwathandiza. Mudzachotsedwa ku portal yofanana.' } }
  ],
  connectionFailed: [
    { body: { language: 'en', text: 'Could not establish connection to the server.' } },
    { body: { language: 'fr', text: 'Impossible d\'établir une connexion avec le serveur.' } },
    { body: { language: 'es', text: 'No se pudo establecer conexión con el servidor.' } },
    { body: { language: 'ar', text: 'تعذر إنشاء اتصال بالخادم.' } },
    { body: { language: 'ny', text: 'Sitingathe kulumikizana ndi seva.' } }
  ],
  pleasetryAgain: [
    { body: { language: 'en', text: 'Please try again.' } },
    { body: { language: 'fr', text: 'Veuillez réessayer.' } },
    { body: { language: 'es', text: 'Por favor, inténtelo de nuevo.' } },
    { body: { language: 'ar', text: 'يرجى المحاولة مرة أخرى.' } },
    { body: { language: 'ny', text: 'Chonde yesani kachiwiri.' } }
  ],

  email: [
    { body: { language: 'en', text: 'Email' } },
    { body: { language: 'fr', text: 'Email' } },
    { body: { language: 'es', text: 'Correo electrónico' } },
    { body: { language: 'ar', text: 'البريد الإلكتروني' } },
    { body: { language: 'ny', text: 'Imelo' } }
  ],
  phone: [
    { body: { language: 'en', text: 'Phone' } },
    { body: { language: 'fr', text: 'Téléphone' } },
    { body: { language: 'es', text: 'Teléfono' } },
    { body: { language: 'ar', text: 'هاتف' } },
    { body: { language: 'ny', text: 'Foni' } }
  ],
};

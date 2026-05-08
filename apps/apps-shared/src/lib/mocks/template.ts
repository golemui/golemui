import { defineForm } from '@golemui/core';
import { Example } from './types';

const form = defineForm({
  states: {
    limitReached: '$form.repeaters.users?.length === 5',
    hasSubregionSelect: `!!$form.selects.subregion`,
    hasSubregionRadiogroup: `!!$form.radiogroups.subregion`,
  },
  form: [
    {
      uid: '',
      kind: 'display',
      type: 'heading',
      props: {
        text: 'KITCHEN SINK',
        level: 3,
      },
    },
    {
      uid: '',
      kind: 'input',
      type: 'textinput',
      path: 'textinput',
    },
    {
      uid: '',
      kind: 'action',
      type: 'button',
      label: 'Create',
      props: {
        icon: 'save',
        iconPosition: 'right',
      },
      on: {
        click: 'submit',
      },
    },
  ],
});

const data = {
  listName: 'Development Team',
  currency: 1000000,
  dropdowns: {
    defaultListRenderer: 0,
    disabledList: 0,
    customItemRenderer: 'one',
  },
  lists: {
    defaultListRenderer: 0,
    disabledList: 0,
    customItemRenderer: 'one',
  },
  selects: {
    greeting: 'bye',
    wrongGreeting: 'aaaaaa',
    greetingIndex: 2,
  },
  radiogroups: {
    greeting: 'bye',
    wrongGreeting: 'aaaaaa',
    greetingIndex: 2,
  },
  repeaters: {
    users: [
      {
        firstName: 'Alice',
        lastName: 'Johnson',
      },
      {
        firstName: '',
        lastName: 'Smith',
      },
      {
        firstName: 'Charlie',
      },
      {
        firstName: 'Diana',
        lastName: 'Rodriguez',
      },
    ],
  },
};

/**
 * i18next Resource Bundle
 */
const resources = {
  en: {
    translation: {
      languageLabel: 'Language',
      passwordLabel: 'Password',
      ageLabel: 'Age',
      acceptTermsLabel: 'I accept the terms and conditions',
      usernameLabel: 'Username',
      usernamePlaceholder: 'e.g. ada-lovelace',
      usernameHint: 'Pick something memorable.',
      welcomeHeading: 'Sign up for an account',
      birthdateLabel: 'Date of birth',
      priceLabel: 'Price',
      priceHint: 'Amount in your local currency.',
      addItemLabel: 'Add item',
      removeItemLabel: 'Remove',
      itemsLabel: 'Shopping list',
      itemNameLabel: 'Item name',
      validators: {
        passwordRequired: 'Please enter your password',
        passwordMinLength: 'Password must be at least 8 characters',
        passwordMaxLength: 'Password cannot exceed 20 characters',
        passwordPattern: 'Password must contain both letters and numbers',
        passwordInvalid: 'Password must be plain text',
        ageInvalid: 'Please enter a valid number',
        ageMinimum: 'You must be at least 18 years old',
        ageMaximum: 'Age cannot exceed 120',
        termsRequired: 'You must accept the terms and conditions to continue',
        termsInvalid: 'Terms acceptance must be a valid boolean value',
        usernameRequired: 'A username is required',
      },
    },
  },
  es: {
    translation: {
      languageLabel: 'Idioma',
      passwordLabel: 'Contraseña',
      ageLabel: 'Edad',
      acceptTermsLabel: 'Acepto los términos y condiciones',
      usernameLabel: 'Nombre de usuario',
      usernamePlaceholder: 'ej. ada-lovelace',
      usernameHint: 'Elige algo memorable.',
      welcomeHeading: 'Crea una cuenta',
      birthdateLabel: 'Fecha de nacimiento',
      priceLabel: 'Precio',
      priceHint: 'Importe en tu moneda local.',
      addItemLabel: 'Añadir elemento',
      removeItemLabel: 'Quitar',
      itemsLabel: 'Lista de la compra',
      itemNameLabel: 'Nombre del artículo',
      validators: {
        passwordRequired: 'Introduzca su contraseña',
        passwordMinLength: 'La contraseña debe tener al menos 8 caracteres',
        passwordMaxLength: 'La contraseña no puede superar los 20 caracteres',
        passwordPattern: 'La contraseña debe contener letras y números',
        passwordInvalid: 'La contraseña debe ser texto plano',
        ageInvalid: 'Introduzca un número válido',
        ageMinimum: 'Debe tener al menos 18 años',
        ageMaximum: 'La edad no puede superar los 120',
        termsRequired: 'Debe aceptar los términos y condiciones para continuar',
        termsInvalid: 'La aceptación de los términos debe ser un valor válido',
        usernameRequired: 'Es necesario un nombre de usuario',
      },
    },
  },
  fr: {
    translation: {
      languageLabel: 'Langue',
      passwordLabel: 'Mot de passe',
      ageLabel: 'Âge',
      acceptTermsLabel: "J'accepte les termes et conditions",
      usernameLabel: "Nom d'utilisateur",
      usernamePlaceholder: 'ex. ada-lovelace',
      usernameHint: 'Choisissez un nom mémorable.',
      welcomeHeading: 'Créer un compte',
      birthdateLabel: 'Date de naissance',
      priceLabel: 'Prix',
      priceHint: 'Montant dans votre monnaie locale.',
      addItemLabel: 'Ajouter un élément',
      removeItemLabel: 'Retirer',
      itemsLabel: 'Liste de courses',
      itemNameLabel: "Nom de l'article",
      validators: {
        passwordRequired: 'Veuillez saisir votre mot de passe',
        passwordMinLength: 'Le mot de passe doit comporter au moins 8 caractères',
        passwordMaxLength: 'Le mot de passe ne peut dépasser 20 caractères',
        passwordPattern: 'Le mot de passe doit contenir des lettres et des chiffres',
        passwordInvalid: 'Le mot de passe doit être du texte brut',
        ageInvalid: 'Veuillez saisir un nombre valide',
        ageMinimum: 'Vous devez avoir au moins 18 ans',
        ageMaximum: "L'âge ne peut dépasser 120",
        termsRequired: 'Vous devez accepter les termes et conditions pour continuer',
        termsInvalid: "L'acceptation des termes doit être une valeur valide",
        usernameRequired: "Un nom d'utilisateur est requis",
      },
    },
  },
  ar: {
    translation: {
      languageLabel: 'اللغة',
      usernameLabel: 'اسم المستخدم',
      usernamePlaceholder: 'مثلاً ada-lovelace',
      usernameHint: 'اختر اسماً يسهل تذكره.',
      welcomeHeading: 'إنشاء حساب جديد',
      birthdateLabel: 'تاريخ الميلاد',
      priceLabel: 'السعر',
      priceHint: 'المبلغ بعملتك المحلية.',
      validators: {
        usernameRequired: 'اسم المستخدم مطلوب',
      },
    },
  },
  he: {
    translation: {
      languageLabel: 'שפה',
      usernameLabel: 'שם משתמש',
      usernamePlaceholder: 'לדוגמה ada-lovelace',
      usernameHint: 'בחרו שם שקל לזכור.',
      welcomeHeading: 'יצירת חשבון חדש',
      birthdateLabel: 'תאריך לידה',
      priceLabel: 'מחיר',
      priceHint: 'סכום במטבע המקומי שלכם.',
      validators: {
        usernameRequired: 'נדרש שם משתמש',
      },
    },
  },
  fa: {
    translation: {
      languageLabel: 'زبان',
      usernameLabel: 'نام کاربری',
      usernamePlaceholder: 'مثلاً ada-lovelace',
      usernameHint: 'نامی به‌یادماندنی انتخاب کنید.',
      welcomeHeading: 'ساخت حساب کاربری',
      birthdateLabel: 'تاریخ تولد',
      priceLabel: 'قیمت',
      priceHint: 'مبلغ به واحد پول محلی شما.',
      validators: {
        usernameRequired: 'نام کاربری الزامی است',
      },
      rtl: {
        username: 'نام کاربری',
        password: 'رمز عبور',
      },
    },
  },
};

export const template: Example = {
  data,
  form,
  resources,
};

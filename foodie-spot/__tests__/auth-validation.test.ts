/**
 * Tests unitaires — Validation des formulaires Auth
 * Vérifie les règles de validation email/mot de passe.
 */

// Fonctions de validation extraites (logique pure)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Veuillez entrer votre email';
  if (!EMAIL_REGEX.test(email.trim())) return 'Email invalide';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password) return 'Veuillez entrer votre mot de passe';
  if (password.length < 6) return 'Mot de passe trop court (minimum 6 caractères)';
  return null;
}

function validateRegister(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.firstName.trim()) errors.firstName = 'Veuillez entrer votre prénom';
  if (!data.lastName.trim()) errors.lastName = 'Veuillez entrer votre nom';
  const emailErr = validateEmail(data.email);
  if (emailErr) errors.email = emailErr;
  const pwErr = validatePassword(data.password);
  if (pwErr) errors.password = pwErr;
  if (data.password !== data.confirmPassword) errors.confirmPassword = 'Les mots de passe ne correspondent pas';
  return errors;
}

describe('validateEmail', () => {
  it('accepte les emails valides', () => {
    expect(validateEmail('test@example.com')).toBeNull();
    expect(validateEmail('user.name+tag@domain.co.uk')).toBeNull();
    expect(validateEmail('etudiant@estiam.com')).toBeNull();
  });

  it('rejette un email vide', () => {
    expect(validateEmail('')).not.toBeNull();
    expect(validateEmail('   ')).not.toBeNull();
  });

  it('rejette les emails sans @', () => {
    expect(validateEmail('testexample.com')).not.toBeNull();
    expect(validateEmail('test')).not.toBeNull();
  });

  it('rejette les emails sans domaine', () => {
    expect(validateEmail('test@')).not.toBeNull();
    expect(validateEmail('@domain.com')).not.toBeNull();
  });

  it('rejette les emails avec extension manquante', () => {
    expect(validateEmail('test@domain')).not.toBeNull();
  });
});

describe('validatePassword', () => {
  it('accepte un mot de passe de 6 caractères ou plus', () => {
    expect(validatePassword('123456')).toBeNull();
    expect(validatePassword('motdepasse')).toBeNull();
    expect(validatePassword('Tr0ub4dor&3')).toBeNull();
  });

  it('rejette un mot de passe vide', () => {
    expect(validatePassword('')).not.toBeNull();
  });

  it('rejette un mot de passe trop court', () => {
    expect(validatePassword('abc')).not.toBeNull();
    expect(validatePassword('12345')).not.toBeNull();
  });

  it('accepte exactement 6 caractères', () => {
    expect(validatePassword('abcdef')).toBeNull();
  });
});

describe('validateRegister', () => {
  const VALID_DATA = {
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  };

  it('ne retourne pas d\'erreurs pour des données valides', () => {
    const errors = validateRegister(VALID_DATA);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('détecte les mots de passe différents', () => {
    const errors = validateRegister({ ...VALID_DATA, confirmPassword: 'autremdp' });
    expect(errors.confirmPassword).toBeDefined();
  });

  it('détecte le prénom manquant', () => {
    const errors = validateRegister({ ...VALID_DATA, firstName: '' });
    expect(errors.firstName).toBeDefined();
  });

  it('détecte le nom manquant', () => {
    const errors = validateRegister({ ...VALID_DATA, lastName: '' });
    expect(errors.lastName).toBeDefined();
  });

  it('détecte les erreurs multiples simultanément', () => {
    const errors = validateRegister({
      firstName: '',
      lastName: '',
      email: 'invalid',
      password: '123',
      confirmPassword: 'abc',
    });
    expect(Object.keys(errors).length).toBeGreaterThan(2);
  });
});

export interface PasswordPolicy {
  passwordMinLength?: number;
  passwordMaxLength?: number;
  passwordRequireUppercase?: boolean;
  passwordRequireLowercase?: boolean;
  passwordRequireNumbers?: boolean;
  passwordRequireSymbols?: boolean;
}

/**
 * Valida una contraseña basándose en las políticas de la empresa.
 * Retorna un array de strings con los errores. Si está vacío, la contraseña es válida.
 */
export function validatePassword(password: string, policy: PasswordPolicy | null): string[] {
  const errors: string[] = [];

  const minLength = policy?.passwordMinLength ?? 6;
  const maxLength = policy?.passwordMaxLength ?? 128;
  const requireUppercase = policy?.passwordRequireUppercase ?? false;
  const requireLowercase = policy?.passwordRequireLowercase ?? false;
  const requireNumbers = policy?.passwordRequireNumbers ?? false;
  const requireSymbols = policy?.passwordRequireSymbols ?? false;

  if (password.length < minLength) {
    errors.push(`La contraseña debe tener al menos ${minLength} caracteres.`);
  }

  if (password.length > maxLength) {
    errors.push(`La contraseña no puede exceder los ${maxLength} caracteres.`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("La contraseña debe incluir al menos una letra mayúscula.");
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push("La contraseña debe incluir al menos una letra minúscula.");
  }

  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push("La contraseña debe incluir al menos un número.");
  }

  // Comprueba caracteres especiales estándar
  if (requireSymbols && !/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\;'/~`]/.test(password)) {
    errors.push("La contraseña debe incluir al menos un carácter especial (ej: ! @ # $ % & *).");
  }

  return errors;
}

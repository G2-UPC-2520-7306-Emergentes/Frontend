export class User {
  // --- Campos Personales (Cliente/Usuario) ---
  // No requerimos 'id' ni 'dni' para el REGISTRO inicial, pero los incluimos si son necesarios posteriormente.
  // Usamos el tipado CamelCase para seguir las convenciones de TypeScript.

  id: string; // Para usar después del registro (ej. al actualizar o consultar)
  firstName: string; // Corresponde a 'First Name'
  lastName: string;  // Corresponde a 'Last Name'
  email: string;     // Corresponde a 'Email'
  password: string;  // Corresponde a 'Password'
  confirmPassword: string; // Necesario para la validación en el frontend

  // --- Campos de Empresa ---
  companyName: string;   // Corresponde a 'Company Name'
  taxId: string;         // Corresponde a 'Tax ID'
  companyOption: 'join' | 'create'; // Corresponde al radio group

  // --- Campos de Rol ---
  requestedRole: string; // Corresponde a 'Requested Role'

  // NOTA: Los campos de dirección/país/teléfono de tu estructura de Client no están en el formulario de registro,
  // por lo que no los incluyo para mantener la fidelidad a tu HTML, pero puedes añadirlos si los necesitas:
  // telefono: string;
  // direccion: string;
  // pais: string;
  // ciudad: string;

  /**
   * Constructor que inicializa todos los campos.
   * La interfaz Partial<User> permite crear un objeto con solo algunos campos al inicio.
   */
  constructor(user: Partial<User> = {}) {
    this.id = user.id || '';
    this.firstName = user.firstName || '';
    this.lastName = user.lastName || '';
    this.email = user.email || '';
    this.password = user.password || '';
    this.confirmPassword = user.confirmPassword || '';

    this.companyName = user.companyName || '';
    this.taxId = user.taxId || '';
    this.companyOption = user.companyOption || 'join'; // Valor por defecto

    this.requestedRole = user.requestedRole || '';
  }
}

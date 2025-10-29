export class User {

  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;

  // --- Campos de Empresa ---
  companyName: string;
  taxId: string;
  companyOption: 'join' | 'create';

  // --- Campos de Rol ---
  requestedRole: string;



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
    this.phoneNumber = user.phoneNumber || ''; // ✨ INICIALIZACIÓN AGREGADA

    this.companyName = user.companyName || '';
    this.taxId = user.taxId || '';
    this.companyOption = user.companyOption || 'join'; // Valor por defecto

    this.requestedRole = user.requestedRole || '';
  }
}

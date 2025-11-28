

export class Registro{

  // Propiedades definidas por tus datos
  enterpriseId: string;
  email: string;
  password: string;

  /**
   * Constructor que inicializa la entidad.
   * Asigna valores por defecto de cadena vacía ('') si los datos no se proporcionan.
   * @param data Objeto con datos parciales para inicializar la credencial.
   */
  constructor(data: {
    enterpriseId?: string,
    email?: string,
    password?: string
  }) {
    // Asignación de valores usando '||' para establecer un valor por defecto
    this.enterpriseId = data.enterpriseId || '';
    this.email = data.email || '';
    this.password = data.password || '';
  }

}

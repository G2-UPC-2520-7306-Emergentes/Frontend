export class Step {
  // Propiedades de la Entidad Step
  id: string; // ID único del paso (Generado por el backend)
  lotId: string; // 🚨 ID del lote al que pertenece este paso
  userId: string; // 🚨 ID del usuario/productor que registra el paso

  stepType: string; // Tipo de actividad (ej: Siembra, Cosecha, Procesamiento)

  // Datos de Tiempo y Ubicación
  stepDate: string; // Fecha del paso (ej: '2025-10-07')
  stepTime: string; // Hora del paso (ej: '14:30')

  // Usaremos un único campo para la ubicación manual por ahora
  location: string; // Ubicación (ej: "Av. La Molina 123, Lima")

  // Trazabilidad y Seguridad
  observations: string; // Notas adicionales
  hash: string; // 🚨 Hash de la transacción (vacío al inicio, se llena al registrar en blockchain/BD)

  constructor(step: {
    // Campos requeridos del formulario/componente
    lotId: string,
    userId: string,
    stepType: string,
    stepDate: string,
    stepTime: string,
    location: string,
    observations?: string,

    // Campos generados o vacíos inicialmente (opcionales en la entrada)
    id?: string,
    hash?: string
  }) {
    // Asignación de valores
    this.id = step.id || '';
    this.lotId = step.lotId;
    this.userId = step.userId;
    this.stepType = step.stepType;
    this.stepDate = step.stepDate;
    this.stepTime = step.stepTime;
    this.location = step.location;
    this.observations = step.observations || '';

    // 🚨 El hash comienza vacío, se calculará o asignará por el backend
    this.hash = step.hash || '';
  }
}

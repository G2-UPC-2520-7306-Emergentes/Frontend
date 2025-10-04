export class Batch {
  // Propiedades del Lote
  id: string;
  lotName: string;
  farmName: string;
  variety: string;
  harvestDate: string;
  createdDate: string;
  state: string;
  imageUrl: string;

  constructor(batch: {
    // Los siguientes son opcionales en el objeto de entrada (data), pero la clase siempre los tendrá.
    id?: string,
    harvestDate?: string,
    createdDate?: string,
    state?: string,
    imageUrl?: string
    lotName?: string,
    farmName?: string,
    variety?: string,
  }) {
    // 💡 Asignación de valores, utilizando el operador OR (||) para proporcionar un valor por defecto ('').
    this.id = batch.id || '';
    this.lotName = batch.lotName || '';
    this.farmName = batch.farmName || '';
    this.variety = batch.variety || '';

    this.harvestDate = batch.harvestDate || '';
    this.createdDate = batch.createdDate || new Date().toISOString(); // Usa la fecha/hora actual por defecto
    this.state = batch.state || 'Draft'; // El estado por defecto puede ser 'Draft' o 'Active'
    this.imageUrl = batch.imageUrl || '';
  }

}

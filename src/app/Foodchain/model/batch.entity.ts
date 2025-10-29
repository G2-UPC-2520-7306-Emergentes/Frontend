export class Batch {

  id: string;
  lotName: string;
  farmName: string;
  variety: string;
  harvestDate: string;
  createdDate: string;
  state: string;
  imageUrl: string;
  producer_id: string;

  constructor(batch: {

    id?: string,
    harvestDate?: string,
    createdDate?: string,
    state?: string,
    imageUrl?: string
    lotName?: string,
    farmName?: string,
    variety?: string,
    producer_id?: string,
  }) {

    this.id = batch.id || '';
    this.lotName = batch.lotName || '';
    this.farmName = batch.farmName || '';
    this.variety = batch.variety || '';

    this.harvestDate = batch.harvestDate || '';
    this.createdDate = batch.createdDate || new Date().toISOString();
    this.state = batch.state || 'Draft';
    this.imageUrl = batch.imageUrl || '';
    this.producer_id = batch.producer_id || '';
  }

}

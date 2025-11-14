export class Step {

  id: string;
  lotId: string;
  userId: string;

  stepType: string;


  stepDate: string;
  stepTime: string;


  location: string;


  observations: string;
  hash: string;

  status: string;
  digitalSignature: string;

  constructor(step: {

    lotId: string,
    userId: string,
    stepType: string,
    stepDate: string,
    stepTime: string,
    location: string,
    observations?: string,


    id?: string,
    hash?: string,
    status?: string,
    digitalSignature?: string
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

    this.status = step.status || 'pending';
    this.hash = step.hash || '';
    this.digitalSignature = step.digitalSignature || '';
  }
}

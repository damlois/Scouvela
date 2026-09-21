export class ActorInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActorInputError';
  }
}

export class SourceNotApprovedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceNotApprovedError';
  }
}

export class SourceUnreachableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceUnreachableError';
  }
}

export class SourceStructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SourceStructureError';
  }
}

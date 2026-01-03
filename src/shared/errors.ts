type MintyErrorOptions = {
  cause?: unknown;
  code?: string;
};

export class MintyError extends Error {
  override cause?: unknown;
  code?: string;

  constructor(message: string, opts: MintyErrorOptions = {}) {
    super(message);
    this.name = "MintyError";
    this.cause = opts.cause;
    this.code = opts.code;
  }
}

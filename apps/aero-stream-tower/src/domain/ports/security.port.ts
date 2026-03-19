export interface OriginContext {
  token: string;
}

export interface SecurityPort {
  validateOrigin(origin: string): Promise<OriginContext | null>;
}
import { SecurityPort, OriginContext } from '../../domain/ports/security.port';

export class InMemorySecurityAdapter implements SecurityPort {
  private readonly dictionary: Map<string, OriginContext>;

  constructor(config: Record<string, OriginContext>) {
    this.dictionary = new Map(Object.entries(config));
  }

  async validateOrigin(origin: string): Promise<OriginContext | null> {
    return this.dictionary.get(origin) || null;
  }
}

import type { OriginContext, SecurityPort } from '@/domain';
import { Logger } from '@/utils';

export class InMemorySecurityAdapter implements SecurityPort {
  private readonly logger = new Logger('InMemorySecurityAdapter');
  private readonly dictionary: Map<string, OriginContext>;

  constructor(config: Record<string, OriginContext>) {
    this.dictionary = new Map(Object.entries(config));
    this.logger.info('Initialized with origins', { count: this.dictionary.size });
  }

  validateOrigin(origin: string): Promise<OriginContext | null> {
    const context = this.dictionary.get(origin) ?? null;
    this.logger.debug('Validating origin', { origin, isValid: !!context });
    return Promise.resolve(context);
  }
}

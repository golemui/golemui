import { pipe } from './pipe';
import { toCapitalizedWords } from './string';

export const toLabel = (path: string): string => {
  if (path === '') {
    return '';
  }
  return pipe(path.split('.').pop() as string, toCapitalizedWords);
};

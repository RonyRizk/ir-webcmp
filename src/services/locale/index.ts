/**
 * Barrel for the locale layer. Import concrete modules (`./locale.controller`,
 * `./locale.service`) from inside this folder — going through the barrel here
 * would cycle, since the barrel re-exports the controller.
 */
export * from './types';
export * from './screen-tables';
export * from './locale.service';
export * from './locale.controller';
export * from './language-sync';
export * from './locale-scope';
export * from './t';

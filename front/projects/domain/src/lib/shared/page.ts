/** Page de résultats renvoyée par les listes paginées de l'API. */
export interface Page<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

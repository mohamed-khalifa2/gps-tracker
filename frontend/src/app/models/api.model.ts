export interface APIModel<T> {
  success: boolean;
  count: number;
  data: T[];
}

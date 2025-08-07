export type Timer = ReturnType<typeof setTimeout>;

export interface AsyncResult<T> {
  data: T;
  error?: Error;
  loading: boolean;
}

export type AsyncFunction<T> = (...args: any[]) => Promise<T>;

export type DateOrString = Date | string;

export const isDate = (value: DateOrString): value is Date => {
  return value instanceof Date;
};

export const toDate = (value: DateOrString): Date => {
  if (isDate(value)) return value;
  return new Date(value);
};
declare global {
  function route(
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params?: Record<string, any>,
    absolute?: boolean
  ): string;
}

export {};

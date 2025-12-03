export const filterEmptyFields = <T extends Record<string, any>>(
  obj: T,
  skipKeys: (keyof T)[] = []
): Partial<T> =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([key, value]) => skipKeys.includes(key as keyof T) || Boolean(value)
    )
  ) as Partial<T>;

export const addParamsToUrl = (
  url: string,
  params?: Record<string, any>
): string => {
  if (!params) {
    return url;
  }
  const urlParams = new URLSearchParams();
  Object.keys(filterEmptyFields(params)).forEach((key) =>
    urlParams.append(key, params[key])
  );
  return `${url}?${urlParams.toString()}`;
};

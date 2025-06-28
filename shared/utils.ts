export const verifySingleString = (
  array1: string,
  array2: string[],
  count = 0,
): string => {
  return array2.includes(`${array1}${count > 0 ? count + 1 : ''}`)
    ? verifySingleString(array1, array2, count + 1)
    : `${array1}${count > 0 ? count + 1 : ''}`;
};

export const isObjectEmpty = (obj) => {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] !== 'function' && isEmpty(obj[key])) {
        return true;
      }
    }
  }
  return false;
};

export const isEmpty = (value) => {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return true;
  }
  if (Array.isArray(value) && value.length === 0) {
    return true;
  }
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return true;
  }
  return false;
};

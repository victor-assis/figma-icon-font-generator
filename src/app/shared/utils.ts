export const verifySingleString = (
  array1: string,
  array2: string[],
  count = 0,
): string => {
  return array2.includes(`${array1}${count > 0 ? count + 1 : ''}`)
    ? verifySingleString(array1, array2, count + 1)
    : `${array1}${count > 0 ? count + 1 : ''}`;
};

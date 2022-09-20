import { DOMParser } from 'xmldom';
import { IIconInformation } from './typings';

export const generateVetores = async (
  fontSvgText: File,
  callback: Function,
): Promise<void> => {
  const doc = new DOMParser().parseFromString(
    await fontSvgText.text(),
    'text/xml',
  ).documentElement;
  const fontSpec = doc.getElementsByTagName('font')[0];
  const defaultCharWidth = fontSpec.getAttribute('horiz-adv-x');
  const fontFace = doc.getElementsByTagName('font-face')[0];
  const defaultCharHeight: string = fontFace.getAttribute('units-per-em');
  const defaultCharAscent = fontFace.getAttribute('ascent');
  const glyphs = doc.getElementsByTagName('glyph');
  const translateOffset: string = defaultCharAscent;
  const charMap = {};

  let dataOnGlyphs: IIconInformation[] = [];

  for (let i = 0; i < glyphs.length; i++) {
    const glyph = glyphs[i];

    if (!glyph) continue;

    let iconCode = glyph.getAttribute('unicode');
    const pathData: string = glyph.getAttribute('d');
    const customWidthMatch: string = glyph.getAttribute('horiz-adv-x');
    const contentWidth: string = customWidthMatch || defaultCharWidth;

    const duplicateIcons = dataOnGlyphs.find(
      (char) => char.pathData === pathData,
    );
    const humanReadable = iconCode.codePointAt(1);

    if (!iconCode) continue;

    if (iconCode.indexOf('&#') !== -1) {
      iconCode = iconCode.replace('&#x', '');
    } else if (!humanReadable) {
      iconCode = iconCode.codePointAt(0).toString(16);
    }

    if (!iconCode.length || !pathData || pathData.length < 10) continue;

    const useCharacterName =
      charMap[iconCode] || glyph.getAttribute('glyph-name') || iconCode;

    if (duplicateIcons) {
      const liga = humanReadable
        ? [duplicateIcons.liga, iconCode]
        : [duplicateIcons.liga];
      const code = !humanReadable
        ? [duplicateIcons.code, `u${iconCode as string}`]
        : [duplicateIcons.code];

      duplicateIcons.liga = liga.filter((val) => val).join(',');
      duplicateIcons.code = code.filter((val) => val).join(',');
      continue;
    }

    const charInfo: IIconInformation = {
      code: `u${iconCode as string}`,
      name: useCharacterName,
      ref: useCharacterName || iconCode,
      pathData,
      figmaName: '',
      liga: '',
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${contentWidth} ${defaultCharHeight}">
        <g transform="scale(1,-1) translate(0 -${translateOffset})">
          <path d="${pathData}"/>
        </g></svg>`,
    };
    dataOnGlyphs = dataOnGlyphs.concat(charInfo);
  }

  return callback(
    dataOnGlyphs.map((val: IIconInformation) => {
      if (val.name) {
        val.figmaName = val.name;
      }
      if (val.code) {
        val.figmaName = `${val.code}-${val.figmaName}`;
      }
      if (val.liga) {
        val.figmaName = `${val.figmaName}--${val.liga}`;
      }
      return val;
    }),
  );
};

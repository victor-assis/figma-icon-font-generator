import JSZip from 'jszip';
import svg2ttf from 'svg2ttf';
import ttf2eot from 'ttf2eot';
import cheerio from 'cheerio';
import ttf2woff from 'ttf2woff';
import ttf2woff2 from 'ttf2woff2';
import { saveAs } from 'file-saver';
import { PassThrough } from 'stream';
import { StringDecoder } from 'string_decoder';
import {
  SVGIcons2SVGFontStream,
  SVGIcons2SVGFontStreamOptions,
} from 'svgicons2svgfont';
import { verifySingleString } from './utils';
import { commitFileAndOpenPR } from './github';
import {
  IFontFormats,
  IFormGithub,
  IGeneratedFont,
  IJsonType,
  ISerializedSVG,
} from './typings';

export const generateFonts = (
  files: ISerializedSVG[],
  optons: SVGIcons2SVGFontStreamOptions & { version: string },
  hasLigatura: boolean,
  download?: boolean,
  callback?: (result: IGeneratedFont | Error) => void,
  gitHubData?: IFormGithub,
): void => {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      callback?.(new Error('No SVG files provided'));
      return;
    }
    const fontStream = new SVGIcons2SVGFontStream(optons);
    const decoder = new StringDecoder('utf8');
    const parts: string[] = [];
    const urls: IFontFormats = {};

    const json = iconConfigs(files, hasLigatura);
    const { iconStreams, _zip } = iconsStrems(json, download);

    fontStream.on('data', (chunk) => {
      parts.push(decoder.write(chunk));
    });

    fontStream.on('finish', () => {
      const svgFont = parts.join('');
      const symbolSvg = createSvgSymbol(files);

      if (window?.URL?.createObjectURL) {
        urls.svg = window.URL.createObjectURL(
          new Blob(parts, { type: 'image/svg+xml' }),
        );
      }

      // ttf
      const ttfFont = svg2ttf(svgFont).buffer;
      if (window?.URL?.createObjectURL) {
        urls.ttf = window.URL.createObjectURL(
          new Blob([ttfFont], { type: 'application/octet-stream' }),
        );
      }

      // eot
      const eotFontBuffer = ttf2eot(ttfFont);
      if (window?.URL?.createObjectURL) {
        urls.eot = window.URL.createObjectURL(
          new Blob([eotFontBuffer], { type: 'application/octet-stream' }),
        );
      }

      // woff
      const woffFontBuffer = ttf2woff(new Uint8Array(ttfFont.buffer));
      if (window?.URL?.createObjectURL) {
        urls.woff = window.URL.createObjectURL(
          new Blob([woffFontBuffer], { type: 'application/octet-stream' }),
        );
      }

      // woff2
      const ttfFontBuffer = new Uint8Array(ttfFont);
      // Convert Uint8Array to Node.js Buffer
      const nodeBuffer = Buffer.from(ttfFontBuffer.buffer);
      const woff2Buffer = ttf2woff2(nodeBuffer);
      const woff2Font = new Uint8Array(woff2Buffer.length);

      for (let i = 0; i < woff2Buffer.length; i++) {
        woff2Font[i] = woff2Buffer[i];
      }

      if (window?.URL?.createObjectURL) {
        urls.woff2 = window.URL.createObjectURL(
          new Blob([woff2Font], { type: 'application/octet-stream' }),
        );
      }

      const generatedFont: IGeneratedFont = { urls, optons, json };

      if (download) {
        _zip.file(`${optons.fontName}.json`, JSON.stringify(json));
        _zip.file(`${optons.fontName}.svg`, svgFont);
        _zip.file(`${optons.fontName}.ttf`, ttfFont);
        _zip.file(`${optons.fontName}.eot`, eotFontBuffer);
        _zip.file(`${optons.fontName}.woff`, woffFontBuffer);
        _zip.file(`${optons.fontName}.woff2`, woff2Font);
        _zip.file(`${optons.fontName}-defs.svg`, symbolSvg);

        void _zip.generateAsync({ type: 'blob' }).then((content) => {
          saveAs(content, `${optons.fontName}-${optons.version}.zip`);
          callback(generatedFont);
        });
      }
      if (gitHubData) {
        commitFileAndOpenPR(
          [
            { name: `${optons.fontName}.json`, content: JSON.stringify(json) },
            { name: `${optons.fontName}.svg`, content: svgFont },
            { name: `${optons.fontName}.ttf`, content: ttfFont },
            { name: `${optons.fontName}.eot`, content: eotFontBuffer },
            { name: `${optons.fontName}.woff`, content: woffFontBuffer },
            { name: `${optons.fontName}.woff2`, content: woff2Font },
            { name: `${optons.fontName}-defs.svg`, content: symbolSvg },
          ],
          gitHubData,
        );
      }

      if (callback && !download) {
        callback(generatedFont);
      }
    });

    iconStreams.forEach((iconStream) => {
      if (iconStream) {
        fontStream.write.bind(fontStream)(iconStream);
      } else {
        console.error('Icon stream is undefined');
      }
    });
    fontStream.end();
  } catch (e) {
    callback(e);
  }
};

export const iconConfigs = (files: ISerializedSVG[], hasLigatura: boolean) => {
  let json: IJsonType[] = [];
  let namesControl: string[] = [];
  let ligasControl: string[] = [];
  let unicodesExisting: string[] = [];

  files.forEach((file: ISerializedSVG) => {
    let matches: string[];

    const blob = new Blob([file.svg], { type: 'image/svg+xml' });
    const svg = new File([blob], `${file.name}.svg`, {
      type: 'image/svg+xml',
    });

    if (!svg.name.includes('--')) {
      matches = svg.name.match(
        /^(?:((?:u[0-9a-f]{4,6},?)+)-)?(.+)\.svg$/i,
      ) as string[];
    } else {
      matches = svg.name.match(
        /^(?:((?:u[0-9a-f]{4,6},?)+)-)?(?:(.+)--)?(.+)\.svg$/i,
      ) as string[];
    }

    const matcheName = verifySingleString(matches[2], namesControl);
    namesControl = [...namesControl, matcheName];

    const ligature = hasLigatura
      ? matches?.[3]
        ? matches[3].split(',')
        : [matcheName.replace(/ /g, '-')]
      : [];

    ligature.forEach((liga, index) => {
      const repeatLiga = verifySingleString(liga, ligasControl);

      if (repeatLiga !== liga) {
        ligature[index] = repeatLiga;
      }
    });

    ligasControl = [...ligasControl, ...ligature];

    if (matches?.[1]) {
      matches[1].split(',').filter((element) => {
        if (unicodesExisting.includes(element)) {
          throw new Error(`Duplicate unicode - ${element}`);
        }
      });

      unicodesExisting = [...unicodesExisting, ...matches[1].split(',')];
    }

    json.push({
      id: file.id,
      svg: file.svg,
      svgFile: svg,
      name: matches?.[2] ? matcheName : file.name,
      ligature,
      unicode: matches?.[1] ? matches[1].split(',') : '',
    });
  });

  json = json.map((icon) => {
    if (!icon.unicode) {
      for (let i = 0; i < json.length; i++) {
        const curCodepoint = `u${(parseInt('e900', 16) + i).toString(16)}`;
        if (!unicodesExisting.includes(curCodepoint)) {
          unicodesExisting.push(curCodepoint);
          icon.unicode = [curCodepoint];
          break;
        }
        continue;
      }

      return icon;
    }

    return icon;
  });

  return json;
};

export const iconsStrems = (json: IJsonType[], download?: boolean) => {
  const _zip = new JSZip();

  const iconStreams = json.map((icon: IJsonType) => {
    const iconStream: PassThrough & {
      metadata?: { unicode: string[]; name: string };
    } = new PassThrough();

    const reader = new FileReader();

    if (download) {
      const svgs = _zip.folder('svg');
      svgs?.file(`${icon.name}.svg`, icon.svgFile);
    }

    reader.onload = (e) => {
      iconStream.write(e.target?.result);
      iconStream.end();
    };
    reader.readAsText(icon.svgFile);

    const unicode = Array.isArray(icon.unicode)
      ? icon.unicode.map((curCodepoint) =>
        String.fromCharCode(parseInt(curCodepoint.replace('u', '0x'), 16)),
      )
      : [String.fromCharCode(parseInt(icon.unicode.replace('u', '0x')))];

    iconStream.metadata = {
      unicode: [...unicode, ...icon.ligature],
      name: icon.name,
    };

    return iconStream;
  });

  return {
    iconStreams,
    _zip,
  };
};

const createSvgSymbol = (files: ISerializedSVG[]): string => {
  const $ = cheerio.load(
    '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0" style="display:none;"></svg>',
    { xmlMode: true },
  );
  files.forEach((file: ISerializedSVG) => {
    const svgNode = $(file.svg);
    const symbolNode = $('<symbol></symbol>');
    symbolNode.attr('viewBox', svgNode.attr('viewBox'));
    symbolNode.attr('id', file.name);
    symbolNode.append(svgNode.html());
    $('svg').append(symbolNode);
  });

  return $.html('svg');
};

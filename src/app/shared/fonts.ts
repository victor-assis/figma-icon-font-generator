import SVGIcons2SVGFontStream from 'svgicons2svgfont';
import svg2ttf from 'svg2ttf';
import ttf2eot from 'ttf2eot';
import ttf2woff from 'ttf2woff';
import ttf2woff2 from 'ttf2woff2';
import cheerio from 'cheerio';
import JSZip from 'jszip';

import { StringDecoder } from 'string_decoder';
import { PassThrough } from 'stream';
import { saveAs } from 'file-saver';
import {
  IFontFormats,
  IGeneratedFont,
  IJsonType,
  ISerializedSVG,
} from './typings';
import { verifySingleString } from './utils';

export const generateFonts = (
  files: ISerializedSVG[],
  optons: SVGIcons2SVGFontStream.SvgIcons2FontOptions & { version: string },
  hasLigatura: boolean,
  download?: boolean,
  callback?: Function,
): void => {
  try {
    const _zip = new JSZip();
    const json: IJsonType[] = [];
    const fontStream = new SVGIcons2SVGFontStream(optons);
    const decoder = new StringDecoder('utf8');
    const parts: string[] = [];
    const urls: IFontFormats = {};
    let namesControl: string[] = [];
    let ligasControl: string[] = [];

    const iconStreams = files.map((file: ISerializedSVG, index: number) => {
      let matches: string[];

      const blob = new Blob([file.svg], { type: 'image/svg+xml' });
      const svg = new File([blob], `${file.name}.svg`, {
        type: 'image/svg+xml',
      });
      const iconStream: PassThrough & {
        metadata?: { unicode: string[]; name: string };
      } = new PassThrough();
      const reader = new FileReader();
      const curCodepoint =
        index <= 999 ? `ue${`000${index}`.substr(-3)}` : `ue${index++}`;

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

      const unicode = matches?.[1]
        ? matches[1].split(',').map((match) => {
            match = match.substr(1);
            return match
              .split('u')
              .map((code) => String.fromCodePoint(parseInt(code, 16)))
              .join('');
          })
        : [String.fromCharCode(parseInt(curCodepoint, 16))];

      if (download) {
        const svgs = _zip.folder('svg');
        svgs?.file(`${matches?.[2] ? matcheName : file.name}.svg`, svg);
      }

      reader.onload = (e) => {
        iconStream.write(e.target?.result);
        iconStream.end();
      };
      reader.readAsText(svg);

      iconStream.metadata = {
        unicode: [...unicode, ...ligature],
        name: matches?.[2] ? matcheName : file.name,
      };

      json.push({
        svg: file.svg,
        name: matches?.[2] ? matcheName : file.name,
        ligature,
        unicode: matches?.[1] ? matches[1].split(',') : curCodepoint,
      });

      return iconStream;
    });

    fontStream.on('data', (chunk) => {
      parts.push(decoder.write(chunk));
    });

    fontStream.on('finish', () => {
      let generatedFont: IGeneratedFont;
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
      const eotFont = ttf2eot(ttfFont).buffer;
      if (window?.URL?.createObjectURL) {
        urls.eot = window.URL.createObjectURL(
          new Blob([eotFont], { type: 'application/octet-stream' }),
        );
      }

      // woff
      const woffFont = ttf2woff(new Uint8Array(ttfFont.buffer)).buffer;
      if (window?.URL?.createObjectURL) {
        urls.woff = window.URL.createObjectURL(
          new Blob([woffFont], { type: 'application/octet-stream' }),
        );
      }

      // woff2
      const ttfFontBuffer = new Uint8Array(ttfFont);
      let buf = Buffer.alloc(ttfFontBuffer.length);
      ttfFontBuffer.forEach((val, index) => buf.writeUInt8(val, index));

      buf = ttf2woff2(buf);
      const woff2Font = new Uint8Array(buf.length);

      for (let i = 0; i < buf.length; i++) {
        woff2Font[i] = buf.readUInt8(i);
      }

      if (window?.URL?.createObjectURL) {
        urls.woff2 = window.URL.createObjectURL(
          new Blob([woff2Font], { type: 'application/octet-stream' }),
        );
      }

      if (download) {
        _zip.file(`${optons.fontName}.json`, JSON.stringify(json));
        _zip.file(`${optons.fontName}.svg`, svgFont);
        _zip.file(`${optons.fontName}.ttf`, ttfFont);
        _zip.file(`${optons.fontName}.eot`, eotFont);
        _zip.file(`${optons.fontName}.woff`, woffFont);
        _zip.file(`${optons.fontName}.woff2`, woff2Font);
        _zip.file(`${optons.fontName}-defs.svg`, symbolSvg);

        void _zip.generateAsync({ type: 'blob' }).then((content) => {
          saveAs(content, `${optons.fontName}-${optons.version}.zip`);
          callback(generatedFont);
        });
      }

      if (callback && !download) {
        generatedFont = { urls, optons, json };
        callback(generatedFont);
      }
    });

    iconStreams.forEach(fontStream.write.bind(fontStream));
    fontStream.end();
  } catch {
    callback();
  }
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

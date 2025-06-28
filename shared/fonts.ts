import svg2ttf from 'svg2ttf';
import ttf2eot from 'ttf2eot';
import ttf2woff from 'ttf2woff';
import ttf2woff2 from 'ttf2woff2';
import { saveAs } from 'file-saver';
import { StringDecoder } from 'string_decoder';
import {
  SVGIcons2SVGFontStream,
  SVGIcons2SVGFontStreamOptions,
} from 'svgicons2svgfont';
import { commitFileAndOpenPR } from './github';
import {
  IFontFormats,
  IFormGithub,
  IGeneratedFont,
  ISerializedSVG,
} from './typings';
import { iconConfigs, iconsStrems, createSvgSymbol } from './fontHelpers';

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


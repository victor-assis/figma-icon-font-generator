import SVGIcons2SVGFontStream from 'svgicons2svgfont';
import svg2ttf from 'svg2ttf';
import ttf2eot from 'ttf2eot';
import ttf2woff from 'ttf2woff';
import ttf2woff2 from 'ttf2woff2';
import cheerio from 'cheerio';

import { StringDecoder } from 'string_decoder';
import { PassThrough } from "stream";
import { saveAs } from 'file-saver';
import { JsonType } from './typings'

const JSZip = require('jszip');

export const generateFonts = (
    files: any[],
    optons: SVGIcons2SVGFontStream.SvgIcons2FontOptions & { version: string }, 
    hasLigatura: boolean, 
    download?: boolean,
    callback?: Function
  ) => {
  const _zip = new JSZip();

  if (download) {
    var svgs = _zip.folder("svg");
  }

  let json: JsonType[] = [];

  const iconStreams = files.map((file: any, index: number) => {  
    const blob = new Blob([file.svg], {type: 'image/svg+xml'});
    const svg = new File([blob], `${file.name}.svg`, {type: 'image/svg+xml'});

    const iconStream = new PassThrough();
    const reader = new FileReader();
    let matches: string[];

    const curCodepoint =
      index <= 999 ? `0xE${('000' + index).substr(-3)}` : `0xE${index++}`;

    if (!svg.name.includes('--')) {
      matches = svg.name.match(/^(?:((?:u[0-9a-f]{4,6},?)+)-)?(.+)\.svg$/i);
    } else {
      matches = svg.name.match(
        /^(?:((?:u[0-9a-f]{4,6},?)+)-)?(?:(.+)--)?(.+)\.svg$/i
      );
    }
    const ligature = hasLigatura ? matches && matches[3] ? matches[3].split(',') : [matches[2].replace(/ /g, '-')] : [];
    const unicode = matches && matches[1] ? matches[1].split(',').map((match) => {
      match = match.substr(1);
      return match
        .split('u')
        .map((code) => String.fromCodePoint(parseInt(code, 16)))
        .join('');
    }) : [String.fromCharCode(parseInt(curCodepoint, 16))];
  
    if (download) {
      svgs.file(`${matches && matches[2] ? matches[2] : file.name}.svg`, svg);
    }

    reader.onload = (e) => {
      iconStream.write(e.target.result);
      iconStream.end();
    };
    reader.readAsText(svg);

    iconStream['metadata'] = {
      unicode: [...unicode, ...ligature],
      name: matches && matches[2] ? matches[2] : file.name,
    };

    json.push({
      svg: file.svg,
      name: matches && matches[2] ? matches[2] : file.name,
      ligature: ligature,
      unicode: matches && matches[1] ? matches[1].split(',') : curCodepoint
    });

    return iconStream;
  });
  
  const fontStream = new SVGIcons2SVGFontStream(optons);
  const decoder = new StringDecoder('utf8');

  let parts = [];
  let urls: {};

  fontStream.on('data', (chunk) => {
    parts.push(decoder.write(chunk));
  });
  fontStream.on('finish', () => {
    if(window && window.URL && window.URL.createObjectURL) {
      urls = { ...urls, ...{ svg: window.URL.createObjectURL(new Blob(parts, {type: 'image/svg+xml'})) }};
    }

    const svgFont = parts.join('');

    // ttf  
    let ttfFont = svg2ttf(svgFont).buffer;
    if(window && window.URL && window.URL.createObjectURL) {
      urls = { ...urls, ...{ ttf: window.URL.createObjectURL( new Blob([ttfFont], {type: 'application/octet-stream'})) }};
    }

    //eot
    let eotFont = ttf2eot(ttfFont).buffer;
    if(window && window.URL && window.URL.createObjectURL) {
      urls = { ...urls, ...{ eot: window.URL.createObjectURL( new Blob([eotFont], {type: 'application/octet-stream'})) }};
    }

    // woff
    const woffFont = ttf2woff(new Uint8Array(ttfFont.buffer)).buffer;
    if(window && window.URL && window.URL.createObjectURL) {
      urls = { ...urls, ...{ woff: window.URL.createObjectURL( new Blob([woffFont], {type: 'application/octet-stream'})) }};
    }

    //woff2
    const ttfFontBuffer = new Uint8Array(ttfFont);
    let buf = new Buffer(ttfFontBuffer.length);
    ttfFontBuffer.forEach((val, index) => buf.writeUInt8(val, index));
    
    buf = ttf2woff2(buf);
    const woff2Font = new Uint8Array(buf.length);

    for(let i = 0; i <  buf.length; i++) {
      woff2Font[i] = buf.readUInt8(i);
    }
    if(window && window.URL && window.URL.createObjectURL) {
      urls = { ...urls, ...{ woff2: window.URL.createObjectURL( new Blob([woff2Font], {type: 'application/octet-stream'})) }};
    }

    //symbol
    const symbolSvg = createSvgSymbol(files);

    if (callback) {
      callback({urls, optons, json})
    }

    if (download) {
      _zip.file(`${optons.fontName}.json`, JSON.stringify(json));
      _zip.file(`${optons.fontName}.svg`, svgFont);
      _zip.file(`${optons.fontName}.ttf`, ttfFont);
      _zip.file(`${optons.fontName}.eot`, eotFont);
      _zip.file(`${optons.fontName}.woff`, woffFont);
      _zip.file(`${optons.fontName}.woff2`, woff2Font);
      _zip.file(`${optons.fontName}-defs.svg`, symbolSvg);

      _zip.generateAsync({type:"blob"}).then((content) => {
        saveAs(content, `${optons.fontName}-${optons.version}.zip`);
      });
    }
  });

  iconStreams.forEach(fontStream.write.bind(fontStream));
  fontStream.end();
};

const createSvgSymbol = (files: any[]) => {
  const $ = cheerio.load('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="0" height="0" style="display:none;"></svg>', { xmlMode: true });
  files.map((file) => {
    const svgNode = $(file.svg);
    const symbolNode = $("<symbol></symbol>");
    symbolNode.attr("viewBox", svgNode.attr("viewBox"));
    symbolNode.attr("id", `${file.name}`);
    symbolNode.append(svgNode.html());
    $('svg').append(symbolNode);
  });

  return $.html("svg");
};
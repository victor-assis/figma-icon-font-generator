import JSZip from 'jszip';
import { load } from 'cheerio';
import { PassThrough } from 'stream';
import { verifySingleString } from './utils';
import { IJsonType, ISerializedSVG } from './typings';

export const iconConfigs = (files: ISerializedSVG[], hasLigatura: boolean) => {
  let json: IJsonType[] = [];
  let namesControl: string[] = [];
  let ligasControl: string[] = [];
  let unicodesExisting: string[] = [];

  files.forEach((file: ISerializedSVG) => {
    let matches: string[] | null;

    const blob = new Blob([file.svg], { type: 'image/svg+xml' });
    const svg = new File([blob], `${file.name}.svg`, {
      type: 'image/svg+xml',
    });

    if (!svg.name.includes('--')) {
      matches = svg.name.match(
        /^(?:((?:u[0-9a-f]{4,6},?)+)-)?(.+)\.svg$/i,
      );
    } else {
      matches = svg.name.match(
        /^(?:((?:u[0-9a-f]{4,6},?)+)-)?(?:(.+)--)?(.+)\.svg$/i,
      );
    }

    const matcheName = verifySingleString(
      (matches && matches[2]) || file.name,
      namesControl,
    );
    namesControl = [...namesControl, matcheName];

    const ligatureFromName = matches && matches[3] ? matches[3].split(',') : undefined;
    const storedLigature = file.ligature
      ? Array.isArray(file.ligature)
        ? file.ligature
        : [file.ligature]
      : undefined;
    const ligature = hasLigatura
      ? ligatureFromName ?? storedLigature ?? [matcheName.replace(/ /g, '-')]
      : [];

    ligature.forEach((liga, index) => {
      const repeatLiga = verifySingleString(liga, ligasControl);

      if (repeatLiga !== liga) {
        ligature[index] = repeatLiga;
      }
    });

    ligasControl = [...ligasControl, ...ligature];

    const unicodeFromName = matches && matches[1] ? matches[1].split(',') : undefined;
    const storedUnicode = file.unicode
      ? Array.isArray(file.unicode)
        ? file.unicode
        : [file.unicode]
      : undefined;
    const unicode = unicodeFromName ?? storedUnicode;

    if (unicode) {
      unicode.filter((element) => {
        if (unicodesExisting.includes(element)) {
          throw new Error(`Duplicate unicode - ${element}`);
        }
      });

      unicodesExisting = [...unicodesExisting, ...unicode];
    }

    json.push({
      id: file.id,
      svg: file.svg,
      svgFile: svg,
      name: matches && matches[2] ? matcheName : file.name,
      ligature,
      unicode: unicode ?? '',
      tags: file.tags,
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

export const createSvgSymbol = (files: ISerializedSVG[]): string => {
  const $ = load(
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

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

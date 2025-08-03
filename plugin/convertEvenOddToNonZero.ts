import SvgPath from 'svgpath';
import { parseSVG } from 'svg-path-parser';
import SVGPathEditor from 'svg-path-reverse';
import { DOMParser, XMLSerializer } from 'xmldom';

const SvgPathWithReverse = SvgPath as unknown as {
  prototype: {
    reverse: (this: SvgPath) => SvgPath;
  };
};

SvgPathWithReverse.prototype.reverse = function (this: SvgPath) {
  const reversed = SVGPathEditor.reverse(this.toString());
  return SvgPath.from(reversed);
};

export const convertEvenOddToNonZero = (
  svgInput: string | Document,
): string | Document => {
  const doc =
    typeof svgInput === 'string'
      ? new DOMParser().parseFromString(svgInput, 'image/svg+xml')
      : svgInput;

  const paths = Array.from(doc.getElementsByTagName('path'));

  for (const path of paths) {
    const fillRule = path.getAttribute('fill-rule');
    if (fillRule === 'evenodd') {
      const d = path.getAttribute('d') ?? '';

      const subpaths = d.match(/M[^M]*/g) ?? [];
      // Parse subpaths to ensure valid path data
      subpaths.forEach((sp) => parseSVG(sp));

      const [contour, ...holes] = subpaths;
      const reversedHoles = holes.map((sp) => SvgPath(sp).reverse().toString());
      const newD = [contour, ...reversedHoles].join(' ');

      path.setAttribute('d', newD);
      path.setAttribute('fill-rule', 'nonzero');
    }
  }

  return typeof svgInput === 'string'
    ? new XMLSerializer().serializeToString(doc)
    : doc;
};

export default convertEvenOddToNonZero;

import SvgPath from 'svgpath';
import SVGPathEditor from 'svg-path-reverse';

const SvgPathWithReverse = SvgPath as unknown as {
  prototype: {
    reverse: (this: SvgPath) => SvgPath;
  };
};

SvgPathWithReverse.prototype.reverse = function (this: SvgPath): SvgPath {
  const reversed = SVGPathEditor.reverse(this.toString());
  return SvgPath.from(reversed);
};

export const invertFillRule = (svg: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const paths = Array.from(doc.getElementsByTagName('path'));
  for (const path of paths) {
    const d = path.getAttribute('d') ?? '';
    path.setAttribute(
      'd',
      (
        SvgPath(d) as unknown as SvgPath & {
          reverse: () => SvgPath;
        }
      )
        .reverse()
        .toString(),
    );
  }
  return new XMLSerializer().serializeToString(doc);
};

export default invertFillRule;

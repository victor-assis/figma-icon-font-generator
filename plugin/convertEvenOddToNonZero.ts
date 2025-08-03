import SvgPath from 'svgpath';
import { parseSVG } from 'svg-path-parser';
import SVGPathEditor from 'svg-path-reverse';
import { DOMParser, XMLSerializer } from 'xmldom';

interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface PathInfo {
  d: string;
  bbox: BBox;
  orientation: number;
}

const bboxArea = (bbox: BBox): number =>
  (bbox.maxX - bbox.minX) * (bbox.maxY - bbox.minY);

const bboxContains = (outer: BBox, inner: BBox): boolean =>
  inner.minX >= outer.minX &&
  inner.maxX <= outer.maxX &&
  inner.minY >= outer.minY &&
  inner.maxY <= outer.maxY;

const getPathInfo = (d: string): PathInfo => {
  const points: Array<{ x: number; y: number }> = [];
  let startX = 0;
  let startY = 0;
  SvgPath(d)
    .abs()
    .unarc()
    .iterate((segment) => {
      const code = segment[0];
      if (code === 'M') {
        startX = segment[1];
        startY = segment[2];
        points.push({ x: startX, y: startY });
      } else if (code === 'Z') {
        points.push({ x: startX, y: startY });
      } else {
        const x = segment[segment.length - 2];
        const y = segment[segment.length - 1];
        points.push({ x, y });
      }
    });

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  let area = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    area += p1.x * p2.y - p2.x * p1.y;
  }

  return {
    d,
    bbox: { minX, minY, maxX, maxY },
    orientation: area >= 0 ? 1 : -1,
  };
};

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

      const infos = subpaths.map((sp) => getPathInfo(sp));

      const parents = infos.map(() => -1);
      for (let i = 0; i < infos.length; i++) {
        for (let j = 0; j < infos.length; j++) {
          if (i === j) continue;
          if (bboxContains(infos[j].bbox, infos[i].bbox)) {
            const currentParent = parents[i];
            if (
              currentParent === -1 ||
              bboxArea(infos[j].bbox) < bboxArea(infos[currentParent].bbox)
            ) {
              parents[i] = j;
            }
          }
        }
      }

      const newSubpaths = infos.map((info, i) => {
        const parentIndex = parents[i];
        if (parentIndex !== -1) {
          const parent = infos[parentIndex];
          if (info.orientation === parent.orientation) {
            return SvgPath(info.d).reverse().toString();
          }
        }
        return info.d;
      });

      path.setAttribute('d', newSubpaths.join(' '));
      path.setAttribute('fill-rule', 'nonzero');
    }
  }

  return typeof svgInput === 'string'
    ? new XMLSerializer().serializeToString(doc)
    : doc;
};

export default convertEvenOddToNonZero;

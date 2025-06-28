import {
  IFormConfig,
  IFormGithub,
  IIconInformation,
  ISerializedSVG,
} from '../shared/typings';

export const getSelectedNodes = (): SceneNode[] => {
  return figma.currentPage.selection
    .map((node) => {
      try {
        const vector =
          'findChildren' in node
            ? (node as unknown as ChildrenMixin).findChildren((child) => {
                return child.name.includes('ue') || child.name.includes('--');
              })
            : [];
        return vector.length ? vector : node;
      } catch {
        return node;
      }
    })
    .flat();
};

export const serialize = async (node: SceneNode): Promise<ISerializedSVG> => {
  let svg = '';
  try {
    const res = await node.exportAsync({ format: 'SVG' });
    svg = String.fromCharCode.apply(null, Array.from(res));
  } catch (err) {
    console.error(err);
  }

  return {
    name: node.name,
    id: node.id,
    svg,
  };
};

export const getSerializedSelection = async (
  selection: readonly SceneNode[],
): Promise<ISerializedSVG[]> => await Promise.all(selection.map(serialize));

export const sendSerializedSelection = async (
  selection: readonly SceneNode[],
  type: string,
  hasLigatura?: boolean,
  fontsConfig?: IFormConfig,
  githubData?: IFormGithub,
): Promise<void> => {
  const svgs = await getSerializedSelection(selection);

  figma.ui.postMessage({
    type,
    files: svgs,
    fontsConfig,
    hasLigatura,
    githubData,
  });
};

export const createIconNode = async (
  vectors: IIconInformation[],
): Promise<void> => {
  let frameIconsNodeId: string | undefined;
  let frameIconsNode: FrameNode | null = null;
  let frameSelectorsNodeId: string | undefined;
  let frameSelectorsNode: FrameNode | null = null;

  const gap = 10;
  const columns = 10;
  const componentWidth = 65;
  const componentHeight = 65;
  const margin = 50;

  let x = margin;
  let y = margin;

  for (const [index, icon] of vectors.entries()) {
    if (!frameIconsNodeId || (await figma.getNodeByIdAsync(frameIconsNodeId)) === null) {
      const frame: FrameNode = figma.createFrame();
      frame.visible = false;
      figma.currentPage.appendChild(frame);
      frame.x = figma.viewport.center.x - 420;
      frame.y = figma.viewport.center.y;
      const frameSelectors: FrameNode = frame.clone();
      frameIconsNodeId = frame.id;
      frameIconsNode = (await figma.getNodeByIdAsync(frameIconsNodeId)) as FrameNode;
      frameSelectorsNodeId = frameSelectors.id;
      frameSelectorsNode = (await figma.getNodeByIdAsync(frameSelectorsNodeId)) as FrameNode;

      const fills = JSON.parse(JSON.stringify(frameSelectorsNode!.fills)) as Paint[];
      if (fills[0]) {
        fills[0] = { ...fills[0], opacity: 0 } as Paint;
      }
      frameSelectorsNode!.fills = fills;
    } else {
      frameIconsNode = (await figma.getNodeByIdAsync(frameIconsNodeId)) as FrameNode;
      frameSelectorsNode = (await figma.getNodeByIdAsync(frameSelectorsNodeId!)) as FrameNode;
    }

    frameIconsNode!.visible = true;
    frameSelectorsNode!.visible = true;

    const frame: FrameNode = figma.createFrame();
    const glyph = figma.createNodeFromSvg(icon.svg);
    const labelName: TextNode = figma.createText();

    frame.resize(componentWidth, componentHeight);

    glyph.resize(20, 20);
    glyph.name = icon.name ?? 'icon';
    const vectorNode = glyph.findChild((node: SceneNode) => Boolean(node));
    if (vectorNode) {
      vectorNode.name = icon.figmaName ?? 'vector';
    }
    glyph.clipsContent = false;

    frame.x = x;
    frame.y = y;

    labelName.name = 'name';
    labelName.fontName = { family: 'Open Sans', style: 'Regular' };
    labelName.textAlignHorizontal = 'CENTER';
    labelName.fontSize = 6;

    const labelCode = labelName.clone();
    const labelLiga = labelName.clone();

    labelName.characters = `Name: ${icon.name}`;
    labelCode.name = 'code';
    labelCode.characters = `Unicodes: ${icon.code}`;
    labelLiga.name = 'liga';
    labelLiga.characters = `Ligatures: ${icon.liga}`;

    glyph.x = frame.width / 2 - glyph.width / 2;
    glyph.y = 10;

    frame.appendChild(labelName);
    frame.appendChild(labelCode);
    frame.appendChild(labelLiga);
    frame.appendChild(glyph);

    labelName.x = frame.width / 2 - labelName.width / 2;
    labelName.y = 35;
    labelCode.x = frame.width / 2 - labelCode.width / 2;
    labelCode.y = labelName.y + 10;
    labelLiga.x = frame.width / 2 - labelLiga.width / 2;
    labelLiga.y = labelCode.y + 10;

    const group2 = figma.group([labelName, labelCode, labelLiga], figma.currentPage);
    const group = figma.group([glyph], figma.currentPage);
    group.name = 'figma group';
    group2.name = 'Icons Selectors';
    frame.remove();
    frameIconsNode!.appendChild(glyph);
    frameSelectorsNode!.appendChild(group2);

    x = x + componentWidth + gap;
    if (x > (componentWidth + gap) * columns + margin - gap) {
      y = y + componentHeight + gap;
      x = margin;
    }
    frameIconsNode!.resize(840, y + componentHeight + gap + margin);
    frameSelectorsNode!.resize(840, y + componentHeight + gap + margin);

    if (index === vectors.length - 1) {
      figma.ui.postMessage({ type: 'notifyLoading' });
    }
  }
};

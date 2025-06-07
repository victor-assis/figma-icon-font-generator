import { IIconInformation, ISerializedSVG } from '../app/shared/typings';

figma.showUI(__html__, {
  width: 460,
  height: 550,
});

figma.ui.onmessage = (msg) => {
  const settings = {
    OnLoad: () => {
      if (figma.currentPage.selection.length > 0) {
        sendSelectedNode();
      }
    },
    SerializeSvgs: () => {
      const nodes = figma.currentPage.selection
        .map((node) => {
          try {
            const vector = (node as any)?.findChildren((child) => {
              return child.name.includes('ue') || child.name.includes('--');
            });
            return vector.length ? vector : node;
          } catch {
            return node;
          }
        })
        .flat();
      void sendSerializedSelection(
        nodes,
        'downloadFonts',
        msg.hasLigatura,
        msg.fontsConfig,
      );
    },
    CommitGithub: () => {
      const nodes = figma.currentPage.selection
        .map((node) => {
          try {
            const vector = (node as any)?.findChildren((child) => {
              return child.name.includes('ue') || child.name.includes('--');
            });
            return vector.length ? vector : node;
          } catch {
            return node;
          }
        })
        .flat();

      void sendSerializedSelection(
        nodes,
        'commitGithub',
        msg.hasLigatura,
        msg.fontsConfig,
        msg.githubData,
      );
    },
    setSvgs: async () => {
      const nodes = figma.currentPage.selection;
      void sendSerializedSelection(
        nodes,
        'setSvgs',
        msg.hasLigatura,
        msg.fontsConfig,
      );
    },
    changeIconName: () => {
      msg.iconsConfig.forEach((el) => {
        const node = figma.getNodeById(el.id);

        if (node.name !== el.name) {
          node.name = el.name;
        }
      });
    },
    setFontConfig: () => {
      figma.root.setSharedPluginData(
        'font_icon_generator',
        'form',
        JSON.stringify(msg.fontsConfig),
      );
    },
    getFontConfig: () => {
      try {
        const form = figma.root.getSharedPluginData(
          'font_icon_generator',
          'form',
        );
        figma.ui.postMessage({
          type: 'setRootFontConfg',
          files: form
            ? JSON.parse(form)
            : {
                fontName: 'font-generator',
                fontHeight: '1024',
                version: '1.0',
              },
        });
      } catch (e) {
        console.log('Error reading tokens', e);
      }
      return null;
    },
    setGithubData: async () => {
      await figma.clientStorage.setAsync(
        'font_icon_generator',
        JSON.stringify(msg.githubData),
      );
    },
    getGithubData: async () => {
      try {
        const github = await figma.clientStorage.getAsync(
          'font_icon_generator',
        );
        figma.ui.postMessage({
          type: 'setClientGithubData',
          files: JSON.parse(github),
        });
      } catch (e) {
        console.log('Error reading tokens', e);
      }
      return null;
    },
    createFigmaVetors: async () => {
      try {
        await figma.loadFontAsync({ family: 'Open Sans', style: 'Regular' });
      } catch (e) {
        figma.notify(e as string);
      }

      createIconNode(msg.vectors);
    },
  };

  settings[msg.type]();
};

figma.on('selectionchange', () => sendSelectedNode());

const sendSelectedNode = () => {
  const nodes = figma.currentPage.selection
    .map((node) => {
      try {
        const vector = (node as any)?.findChildren((child) => {
          return child.name.includes('ue') || child.name.includes('--');
        });
        return vector.length ? vector : node;
      } catch {
        return node;
      }
    })
    .flat();

  void sendSerializedSelection(nodes, 'setSvgs', true);

  figma.ui.postMessage({
    type: 'notifySelected',
    files: nodes,
  });
};

const serialize = async (node: SceneNode): Promise<ISerializedSVG> => {
  const svg: any = await node
    .exportAsync({ format: 'SVG' })
    .then((res: any) => String.fromCharCode.apply(null, res))
    .catch((err) => console.error(err));

  return {
    name: node.name,
    id: node.id,
    svg,
  };
};

const getSerializedSelection = async (
  selection: readonly SceneNode[],
): Promise<ISerializedSVG[]> => await Promise.all(selection.map(serialize));

const sendSerializedSelection = async (
  selection: readonly SceneNode[],
  type: string,
  hasLigatura,
  fontsConfig?,
  githubData?,
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

const createIconNode = (vectors: IIconInformation[]): void => {
  let frameIconsNodeId;
  let frameIconsNode;
  let frameSelectorsNodeId;
  let frameSelectorsNode;

  const gap = 10;
  const columns = 10;
  const componentWidth = 65;
  const componentHeight = 65;
  const margin = 50;

  let x = 0 + margin;
  let y = 0 + margin;
  let completedIcons = 0;

  vectors.forEach((icon: IIconInformation, index: number) => {
    if (figma.getNodeById(frameIconsNodeId) == null) {
      const frame: FrameNode = figma.createFrame();
      frame.visible = false;
      figma.currentPage.appendChild(frame);
      frame.x = figma.viewport.center.x - 420;
      frame.y = figma.viewport.center.y;
      const frameSelectors: FrameNode = frame.clone();
      frameIconsNodeId = frame.id;
      frameIconsNode = figma.getNodeById(frameIconsNodeId);
      frameSelectorsNodeId = frameSelectors.id;
      frameSelectorsNode = figma.getNodeById(frameSelectorsNodeId);

      const fills = JSON.parse(JSON.stringify(frameSelectorsNode.fills));
      fills[0].opacity = 0;
      frameSelectorsNode.fills = fills;
    } else {
      frameIconsNode = figma.getNodeById(frameIconsNodeId);
      frameSelectorsNode = figma.getNodeById(frameSelectorsNodeId);
    }

    frameIconsNode.visible = true;
    frameSelectorsNode.visible = true;

    const frame: FrameNode = figma.createFrame();
    const glyph = figma.createNodeFromSvg(icon.svg);
    const labelName: TextNode = figma.createText();

    frame.resize(componentWidth, componentHeight);

    glyph.resize(20, 20);
    glyph.name = icon.name ?? 'icon';
    glyph.findChild((node: SceneNode) => Boolean(node)).name =
      icon.figmaName ?? 'vector';
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

    const group2 = figma.group(
      [labelName, labelCode, labelLiga],
      figma.currentPage,
    );
    const group = figma.group([glyph], figma.currentPage);
    group.name = 'figma group';
    group2.name = 'Icons Selectors';
    frame.remove();
    frameIconsNode.appendChild(glyph);
    frameSelectorsNode.appendChild(group2);

    x = x + componentWidth + gap;
    if (x > (componentWidth + gap) * columns + margin - gap) {
      y = y + componentHeight + gap;
      x = 0 + margin;
    }
    frameIconsNode.resize(840, y + componentHeight + gap + margin);
    frameSelectorsNode.resize(840, y + componentHeight + gap + margin);
    completedIcons = completedIcons + 1;

    if (index === vectors.length - 1) {
      figma.ui.postMessage({ type: 'notifyLoading' });
    }
  });
};

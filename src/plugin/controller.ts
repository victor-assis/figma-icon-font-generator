import { IconInformation } from "../app/shared/typings";

interface ISerializedSVG {
  name: string
  svg: string
}

figma.showUI(__html__, {
  width: 350,
  height: 500
});

figma.ui.onmessage = (msg) => {
  const settings = {
    SerializeSvgs: () => {
      const nodes = figma.currentPage.selection;
      sendSerializedSelection(nodes, 'downloadFonts', msg.hasLigatura, msg.fontsConfig);
    },
    setSvgs: async () => {
      const nodes = figma.currentPage.selection;
      sendSerializedSelection(nodes, 'setSvgs', msg.hasLigatura, msg.fontsConfig);
    },
    setFontConfig: () => {
      figma.root.setSharedPluginData('font_icon_generator', 'form', JSON.stringify(msg.fontsConfig));
    },
    getFontConfig: () => {
      try {
        const form = figma.root.getSharedPluginData('font_icon_generator', 'form');
        figma.ui.postMessage({
          type: 'setRootFontConfg',
          files: form ? JSON.parse(form) : {fontName: 'font-generator', fontHeight: '1024', version: '1.0'}
        });
      } catch (e) {
        console.log('Error reading tokens', e);
      }
      return null;
    },
    createFigmaVetors: async () => {
      try {
        await figma.loadFontAsync({family: "Open Sans", style: "Regular"});
      } catch(e) {
        figma.notify(e);
      }

      let frameContainerNodeId;
      let frameContainerNode ;
      let frameSelectorsNodeId;
      let frameSelectorsNode ;

      const gap = 10;
      const columns = 10;
      const componentWidth = 65;
      const componentHeight = 65;
      const margin = 50;

      let x = 0 + margin;
      let y = 0 + margin;
      let completedIcons = 0;

      msg.vectors.forEach((icon: IconInformation) => {
        if (figma.getNodeById(frameContainerNodeId) == null) {
          const frame: FrameNode = figma.createFrame();
          frame.visible = false;
          figma.currentPage.appendChild(frame);
          frame.x = figma.viewport.center.x - 420;
          frame.y = figma.viewport.center.y;
          const frameSelectors: FrameNode = frame.clone();
          frameContainerNodeId = frame.id;
          frameContainerNode = figma.getNodeById(frameContainerNodeId);
          frameSelectorsNodeId = frameSelectors.id;
          frameSelectorsNode = figma.getNodeById(frameSelectorsNodeId);

          const fills = JSON.parse(JSON.stringify(frameSelectorsNode.fills));
          fills[0].opacity = 0;
          frameSelectorsNode.fills = fills;
        } else {
          frameContainerNode = figma.getNodeById(frameContainerNodeId)
          frameSelectorsNode = figma.getNodeById(frameSelectorsNodeId);
        }

        frameContainerNode.visible = true;
        frameSelectorsNode.visible = true;

        const frame: FrameNode = figma.createFrame();
        const glyph = figma.createNodeFromSvg(icon.svg);
        const labelName: TextNode = figma.createText();

        frame.resize(componentWidth, componentHeight);
        
        glyph.resize(20, 20);
        glyph.name = icon.figmaName;
        glyph.clipsContent = false;

        frame.x = x;
        frame.y = y;

        labelName.name = "name";
        labelName.fontName = { family: "Open Sans", style: "Regular"};
        labelName.textAlignHorizontal = "CENTER";
        labelName.fontSize = 6;

        const labelCode = labelName.clone();
        const labelLiga = labelName.clone();

        labelName.characters = `Name: ${icon.name}`;
        labelCode.name = 'code';
        labelCode.characters = `Unicodes: ${icon.code}`;
        labelLiga.name = 'liga';
        labelLiga.characters = `Ligatures: ${icon.liga}`;

        glyph.x = (frame.width / 2) - (glyph.width / 2);
        glyph.y = 10;

        frame.appendChild(labelName);
        frame.appendChild(labelCode);
        frame.appendChild(labelLiga);
        frame.appendChild(glyph);

        labelName.x = (frame.width / 2) - (labelName.width / 2);
        labelName.y = 35;
        labelCode.x = (frame.width / 2) - (labelCode.width / 2);
        labelCode.y = labelName.y + 10;
        labelLiga.x = (frame.width / 2) - (labelLiga.width / 2);
        labelLiga.y = labelCode.y + 10;

        const group2 = figma.group([labelName, labelCode, labelLiga], figma.currentPage)
        const group = figma.group([glyph], figma.currentPage);
        group.name = 'figma group';
        group2.name = 'Icons Selectors'
        frame.remove();
        frameContainerNode.appendChild(glyph);
        frameSelectorsNode.appendChild(group2);

        x = x + componentWidth + gap;
        if (x > ((componentWidth + gap) * columns) + margin - gap) {
          y = y + componentHeight + gap;
          x = 0 + margin;
        }
        frameContainerNode.resize(840, y + componentHeight + gap + margin);
        frameSelectorsNode.resize(840, y + componentHeight + gap + margin);
        completedIcons = completedIcons + 1;
      })
    },
  };

  settings[msg.type]();
};

figma.on('selectionchange', () => {
  const nodes = figma.currentPage.selection;
  sendSerializedSelection(nodes, 'setSvgs', true);
})

const serialize = async (node: SceneNode): Promise<ISerializedSVG> => {
  const svg = await node.exportAsync({format: 'SVG'})
    .then(res => String.fromCharCode.apply(null, res))
    .catch(err => console.error(err));

  return {
    name: node.name,
    svg
  }
}

const getSerializedSelection = (selection: readonly SceneNode[]) =>
  Promise.all(selection.map(serialize))

const sendSerializedSelection = async (selection: readonly SceneNode[], type: string, hasLigatura, fontsConfig?) => {
  const svgs = await getSerializedSelection(selection);
      
  figma.ui.postMessage({
    type: type,
    files: svgs,
    fontsConfig,
    hasLigatura
  });
}

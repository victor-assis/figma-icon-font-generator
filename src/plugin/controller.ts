interface ISerializedSVG {
  name: string
  svg: string
}

figma.showUI(__html__, {
  width: 350,
  height: 480
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

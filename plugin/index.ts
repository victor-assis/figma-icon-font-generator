import {
  IIconInformation,
  IFormConfig,
  IFormGithub,
} from '../shared/typings';
import {
  createIconNode,
  getSelectedNodes,
  sendSerializedSelection,
} from './utils';

interface IIconConfig {
  id: string;
  name: string;
}

interface PluginMessage {
  type: string;
  hasLigatura?: boolean;
  fontsConfig?: IFormConfig;
  githubData?: IFormGithub;
  iconsConfig?: IIconConfig[];
  vectors?: IIconInformation[];
}

figma.showUI(__html__, {
  width: 460,
  height: 550,
});

figma.ui.onmessage = (msg: PluginMessage) => {
  const settings: Record<string, () => void | Promise<void>> = {
    OnLoad: () => {
      if (figma.currentPage.selection.length > 0) {
        sendSelectedNode();
      }
    },
    SerializeSvgs: () => {
      const nodes = getSelectedNodes();
      void sendSerializedSelection(
        nodes,
        'downloadFonts',
        msg.hasLigatura,
        msg.fontsConfig,
      );
    },
    CommitGithub: () => {
      const nodes = getSelectedNodes();
      void sendSerializedSelection(
        nodes,
        'commitGithub',
        msg.hasLigatura,
        msg.fontsConfig,
        msg.githubData,
      );
    },
    setSvgs: async () => {
      const nodes = getSelectedNodes();
      void sendSerializedSelection(
        nodes,
        'setSvgs',
        msg.hasLigatura,
        msg.fontsConfig,
      );
    },
    changeIconName: async () => {
      if (msg.iconsConfig) {
        for (const el of msg.iconsConfig) {
          const node = (await figma.getNodeByIdAsync(el.id)) as SceneNode | null;

          if (node && node.name !== el.name) {
            node.name = el.name;
          }
        }
      }
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
    },
    createFigmaVetors: async () => {
      try {
        await figma.loadFontAsync({ family: 'Open Sans', style: 'Regular' });
      } catch (e) {
        figma.notify(e as string);
      }

      if (msg.vectors) {
        await createIconNode(msg.vectors);
      }
    },
  };

  const action = settings[msg.type as keyof typeof settings];
  if (action) {
    action();
  }
};

figma.on('selectionchange', () => sendSelectedNode());

const sendSelectedNode = () => {
  const nodes = getSelectedNodes();

  void sendSerializedSelection(nodes, 'setSvgs', true);

  figma.ui.postMessage({
    type: 'notifySelected',
    files: nodes,
  });
};


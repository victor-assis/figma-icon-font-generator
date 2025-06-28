import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import CheckIcon from '@mui/icons-material/Check';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import LoadingButton from '@mui/lab/LoadingButton';
import GitHubIcon from '@mui/icons-material/GitHub';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import React, {
  useState,
  useEffect,
  SyntheticEvent,
  useMemo,
  ReactElement,
} from 'react';
import { isObjectEmpty } from '../../shared/utils';
import { generateFonts } from '../../shared/fonts';
import PreviewIcon from './PreviewIcon/PreviewIcon';
import { generateVetores } from '../../shared/vetors';
import FormFontConfig from './FormFontConfig/FormFontConfig';
import './App.scss';
import GithubIntegration from './githubIntegration/githubIntegration';
import {
  IFormConfig,
  IFormGithub,
  IGeneratedFont,
} from '../../shared/typings';

import TabPanel from './TabPanel/TabPanel';

const App = (): ReactElement => {
  const [tabValue, setTabValue] = useState(0);
  const [icons, setIcons] = useState([]);
  const [fontsConfig, setFontConfig] = useState<IFormConfig>({
    fontName: 'font-generator',
    fontHeight: '1024',
    version: '1.0',
  });
  const [githubData, setGithubData] = useState<IFormGithub>();
  const [fontsFiles, setFontsFiles] = useState<IGeneratedFont>();
  const [hasLigatura, setHasLigatura] = useState(true);
  const [nodes, setNodes] = useState<SceneNode[]>();
  const [loadingUpload, setLoadingUpload] = React.useState(false);
  const [loadingGenerate, setLoadingGenerate] = React.useState(false);
  const [openSnack, setOpenSnack] = React.useState(false);
  const [errors, setErrors] = React.useState('');

  const onSubmit = (): void => {
    setLoadingGenerate(true);

    parent.postMessage(
      { pluginMessage: { type: 'SerializeSvgs', fontsConfig, hasLigatura } },
      '*',
    );
  };

  const commitFiles = (): void => {
    setLoadingGenerate(true);

    parent.postMessage(
      {
        pluginMessage: {
          type: 'CommitGithub',
          fontsConfig,
          hasLigatura,
          githubData,
        },
      },
      '*',
    );
  };

  const handleChange = (event: SyntheticEvent, newValue: number): void => {
    if (event) {
      setTabValue(newValue);
    }
  };

  const setConfig = (config): void => {
    setFontConfig(config);
  };

  const setGithub = (data): void => {
    setGithubData(data);
  };

  const callback = (config): void => {
    if (config.name !== 'Error') {
      setFontsFiles(config);
      setIcons(config.json);

      return;
    }

    setErrors(config.message);
    setOpenSnack(true);
  };

  const inputFileUpload = (files): void => {
    if (files && files.length > 0) {
      setLoadingUpload(true);

      void generateVetores(files[0], (vectors) => {
        parent.postMessage(
          { pluginMessage: { type: 'createFigmaVetors', vectors } },
          '*',
        );
      });
    } else {
      setErrors('No SVG file selected');
      setOpenSnack(true);
    }
  };

  useEffect(() => {
    parent.postMessage({ pluginMessage: { type: 'OnLoad' } }, '*');
    parent.postMessage(
      { pluginMessage: { type: 'setSvgs', fontsConfig } },
      '*',
    );
    parent.postMessage({ pluginMessage: { type: 'getFontConfig' } }, '*');
    parent.postMessage({ pluginMessage: { type: 'getGithubData' } }, '*');
    window.onmessage = (event) => {
      if (!event.data.pluginMessage) {
        return;
      }

      const {
        type,
        files,
        fontsConfig: msgFontsConfig,
        hasLigatura: msgHasLigatura,
        githubData,
      } = event.data.pluginMessage;

      const events = {
        downloadFonts: () => {
          if (!files || files.length === 0) {
            setErrors('No icons selected');
            setOpenSnack(true);
            setLoadingGenerate(false);
            return;
          }

          generateFonts(
            files,
            msgFontsConfig ?? fontsConfig,
            msgHasLigatura ?? hasLigatura,
            true,
            (generatedFont) => {
              parent.postMessage(
                { pluginMessage: { type: 'setFontConfig', fontsConfig: msgFontsConfig ?? fontsConfig } },
                '*',
              );
              parent.postMessage(
                { pluginMessage: { type: 'setGithubData', githubData } },
                '*',
              );
              parent.postMessage(
                {
                  pluginMessage: {
                    type: 'changeIconName',
                    iconsConfig: generatedFont.json.map((v) => ({
                      id: v.id,
                      name:
                        `${v.unicode.join(',')}-${v.name}` +
                        (v.ligature && v.ligature.join(',') !== v.name
                          ? `--${v.ligature.join(',')}`
                          : ''),
                    })),
                  },
                },
                '*',
              );
              setLoadingGenerate(false);
            },
          );
        },
        commitGithub: () => {
          if (!files || files.length === 0) {
            setErrors('No icons selected');
            setOpenSnack(true);
            setLoadingGenerate(false);
            return;
          }

          generateFonts(
            files,
            msgFontsConfig ?? fontsConfig,
            msgHasLigatura ?? hasLigatura,
            false,
            (generatedFont) => {
              parent.postMessage(
                { pluginMessage: { type: 'setFontConfig', fontsConfig: msgFontsConfig ?? fontsConfig } },
                '*',
              );
              parent.postMessage(
                { pluginMessage: { type: 'setGithubData', githubData } },
                '*',
              );
              parent.postMessage(
                {
                  pluginMessage: {
                    type: 'changeIconName',
                    iconsConfig: generatedFont.json.map((v) => ({
                      id: v.id,
                      name:
                        `${v.unicode.join(',')}-${v.name}` +
                        (v.ligature && v.ligature.join(',') !== v.name
                          ? `--${v.ligature.join(',')}`
                          : ''),
                    })),
                  },
                },
                '*',
              );
              setLoadingGenerate(false);
            },
            githubData,
          );
        },
        setSvgs: () => {
          if (files && files.length > 0) {
            generateFonts(
              files,
              msgFontsConfig ?? fontsConfig,
              msgHasLigatura ?? hasLigatura,
              false,
              callback,
            );
            return;
          }
          setIcons(files || []);
        },
        setRootFontConfg: () => {
          setFontConfig(files);
        },
        setClientGithubData: () => {
          setGithubData(files);
        },
        notifySelected: () => {
          setNodes(files);
        },
        notifyLoading: () => {
          setLoadingUpload(false);
        },
      };

      if (type) {
        events[type]();
      }
    };
  }, []);

  const memoPreviewIcon = useMemo(
    () =>
      fontsFiles && (
        <PreviewIcon fontsFiles={fontsFiles} ligatura={hasLigatura} />
      ),
    [fontsFiles, hasLigatura],
  );

  return (
    <div className="figma-font">
      <Box sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleChange} variant="fullWidth">
          <Tab
            label="Preview"
            id="app-tab-0"
            aria-controls="app-tabpanel-0"
            icon={<AutoAwesomeIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: '45px', border: 'none' }}
          />
          <Tab
            label="Config"
            id="app-tab-1"
            aria-controls="app-tabpanel-1"
            icon={<SettingsIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: '45px', border: 'none' }}
          />
          <Tab
            label="GitHub"
            id="app-tab-2"
            aria-controls="app-tabpanel-2"
            icon={<GitHubIcon fontSize="small" />}
            iconPosition="start"
            sx={{ minHeight: '45px', border: 'none' }}
          />
        </Tabs>
        <Divider />
        <TabPanel value={tabValue} index={0}>
          {!nodes || nodes.length === 0 ? (
            <Alert severity="warning">No selected icon found!</Alert>
          ) : (
            <>
              <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
                {`selected ${nodes.length} vector${
                  nodes.length > 1 ? 's' : ''
                }`}
              </Alert>
              {memoPreviewIcon}
            </>
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {fontsConfig && (
            <FormFontConfig
              onChange={setConfig}
              form={fontsConfig}
              onLigatureChange={setHasLigatura}
            />
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <GithubIntegration onChange={setGithub} form={githubData} />
        </TabPanel>
      </Box>

      <div className="figma-font__buttons">
        <LoadingButton
          variant="outlined"
          className="figma-font__button"
          component="label"
          color="secondary"
          size="small"
          loading={loadingUpload}
        >
          Upload Font SVG
          <input
            type="file"
            accept=".svg"
            hidden
            onChange={(e) => inputFileUpload(e.target.files)}
          />
        </LoadingButton>

        <LoadingButton
          variant="outlined"
          className="figma-font__button"
          onClick={onSubmit}
          disabled={icons?.length === 0}
          size="small"
          loading={loadingGenerate}
        >
          Generate Font
        </LoadingButton>

        <LoadingButton
          variant="outlined"
          className="figma-font__button"
          onClick={commitFiles}
          disabled={
            icons?.length === 0 ||
            isObjectEmpty((githubData ?? {}) as Record<string, unknown>)
          }
          color="success"
          size="small"
          loading={loadingGenerate}
        >
          commit on github
        </LoadingButton>
      </div>
      <Snackbar
        open={openSnack}
        autoHideDuration={4000}
        onClose={() => setOpenSnack(false)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
      >
        <Alert
          severity="warning"
          action={
            <React.Fragment>
              <Button
                color="inherit"
                size="small"
                onClick={() => setOpenSnack(false)}
              >
                ok
              </Button>

              <IconButton
                onClick={() => setOpenSnack(false)}
                aria-label="close"
                color="inherit"
                sx={{ p: 0.5 }}
              >
                <CloseIcon />
              </IconButton>
            </React.Fragment>
          }
        >
          {errors}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default App;

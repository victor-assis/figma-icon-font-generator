import React, {
  useState,
  useEffect,
  SyntheticEvent,
  useMemo,
  ReactElement,
} from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import SettingsIcon from '@mui/icons-material/Settings';
import CheckIcon from '@mui/icons-material/Check';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Divider from '@mui/material/Divider';
import PreviewIcon from './PreviewIcon/PreviewIcon';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';;
import CloseIcon from '@mui/icons-material/Close';

import { generateFonts } from '../shared/fonts';
import { IFormConfig, IGeneratedFont, ITabPanelProps } from '../shared/typings';
import { generateVetores } from '../shared/vetors';

import './App.scss';
import FormFontConfig from './FormFontConfig/FormFontConfig';

const TabPanel = (props: ITabPanelProps): ReactElement => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`app-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 1 }}>{children}</Box>}
    </div>
  );
};

const App = (): ReactElement => {
  const [tabValue, setTabValue] = useState(0);
  const [icons, setIcons] = useState([]);
  const [fontsConfig, setFontConfig] = useState<IFormConfig>();
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

  const handleChange = (event: SyntheticEvent, newValue: number): void => {
    event && setTabValue(newValue);
  };

  const setConfig = (config): void => {
    setFontConfig(config);
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
    if (files) {
      setLoadingUpload(true);
    }

    void generateVetores(files[0], (vectors) => {
      parent.postMessage(
        { pluginMessage: { type: 'createFigmaVetors', vectors } },
        '*',
      );
    });
  };

  useEffect(() => {
    parent.postMessage(
      { pluginMessage: { type: 'setSvgs', fontsConfig } },
      '*',
    );
    parent.postMessage({ pluginMessage: { type: 'getFontConfig' } }, '*');
    window.onmessage = (event) => {
      if (!event.data.pluginMessage) {
        return;
      }

      const { type, files, fontsConfig, hasLigatura } =
        event.data?.pluginMessage;

      const events = {
        downloadFonts: () => {
          generateFonts(files, fontsConfig, hasLigatura, true, (generatedFont) => {
            parent.postMessage(
              { pluginMessage: { type: 'setFontConfig', fontsConfig } },
              '*',
            );
            parent.postMessage(
              { pluginMessage: { 
                type: 'changeIconName',
                iconsConfig: generatedFont.json.map(v => ({ 
                  id: v.id,
                  name: (`${v.unicode.join(',')}-${v.name}`) + (v.ligature && v.ligature.join(',') !== v.name ? `--${v.ligature.join(',')}` : '')
                })) }
              },
              '*',
            );
            setLoadingGenerate(false);
          });
        },
        setSvgs: () => {
          if (files.length) {
            generateFonts(files, fontsConfig, hasLigatura, false, callback);
            return;
          }
          setIcons(files);
        },
        setRootFontConfg: () => {
          setFontConfig(files);
        },
        notifySelected: () => {
          setNodes(files);
        },
        notifyLoading: () => {
          setLoadingUpload(false);
        },
      };

      type && events[type]();
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
            label="Font Config"
            id="app-tab-1"
            aria-controls="app-tabpanel-1"
            icon={<SettingsIcon fontSize="small" />}
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
      </Box>

      <div className="figma-font__button">
        <LoadingButton
          variant="outlined"
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
          disabled={icons.length === 0}
          size="small"
          loading={loadingGenerate}
        >
          Generate Font
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
              <Button color="inherit" size="small" onClick={() => setOpenSnack(false)}>
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
        >{errors}</Alert>
      </Snackbar>

    </div>
  );
};

export default App;

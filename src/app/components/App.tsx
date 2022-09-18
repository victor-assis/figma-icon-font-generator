import React, { useState, useEffect, SyntheticEvent, useMemo } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

import { generateFonts } from '../shared/fonts';
import { TabPanelProps } from '../shared/typings';
import { generateVetores } from '../shared/vetors';

import './App.scss';
import FormFontConfig from './FormFontConfig/FormFontConfig';
import PreviewIcon from './PreviewIcon/PreviewIcon';

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`app-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 1 }}>{children}</Box>
      )}
    </div>
  );
}

const App = ({}) => {
  const [tabValue, setTabValue] = useState(0);
  const [icons, setIcons] = useState([]);
  const [fontsConfig, setfontConfig] = useState();
  const [fontsFiles, setFontsFiles] = useState();
  const [hasLigatura, setHasLigatura] = useState(true);

  const onSubmit = () => {
    parent.postMessage({pluginMessage: {type: 'SerializeSvgs', fontsConfig, hasLigatura}}, '*');
  };

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    event && setTabValue(newValue);
  };

  const setConfig = (config) => {
    setfontConfig(config);
  }

  const callback = (config) =>{
    setFontsFiles(config)
    setIcons(config.json);
  }

  const inputFileUpload = (files) => {
    generateVetores(files[0], (vectors) => parent.postMessage({pluginMessage: {type: 'createFigmaVetors', vectors}}, '*'));
  }

  useEffect(() => {
    parent.postMessage({pluginMessage: {type: 'setSvgs', fontsConfig}}, '*');
    parent.postMessage({pluginMessage: {type: 'getFontConfig'}}, '*');
    window.onmessage = (event) => {
      if (!event.data.pluginMessage) { return; }

      const { type, files, fontsConfig, hasLigatura } = event.data?.pluginMessage;

      const events = {
        downloadFonts: () => {
          generateFonts(files, fontsConfig, hasLigatura, true);
          parent.postMessage({pluginMessage: {type: 'setFontConfig', fontsConfig}}, '*');
        },
        setSvgs: () => {
          if (files.length) {
            generateFonts(files, fontsConfig, true, false, callback);
            return;
          }
          setIcons(files);
        },
        setRootFontConfg: () => {
          setfontConfig(files);
        },
      };
    
      type && events[type]();
    };
  }, []);

  const memoPreviewIcon = useMemo(() => <PreviewIcon fontsFiles={fontsFiles} ligatura={hasLigatura}/>, [fontsFiles, hasLigatura]);

  return (
    <div className="figma-font">
      <h2  className="figma-font__title">Figma Icon Font Generator</h2>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ display: 'inline-block', borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleChange}>
            <Tab label="Preview" id="app-tab-0" aria-controls="app-tabpanel-0"/>
            <Tab label="Font Config" id="app-tab-1" aria-controls="app-tabpanel-1" />
          </Tabs>        
        </Box>
        <TabPanel value={tabValue} index={0}>
          {!Boolean(icons.length) ? (
            <Alert severity="warning">
              <AlertTitle>Select an icon</AlertTitle>
              No selected icon found!
            </Alert>
          ) : memoPreviewIcon}

          <Button
            variant="outlined"
            component="label"
            color="secondary"
            size="small"
            sx={{' margin-top': '16px' }}
          >
            Upload Font SVG
            <input
              type="file"
              accept=".svg"
              hidden
              onChange={(e) => inputFileUpload(e.target.files)}
            />
          </Button>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <FormFontConfig onChange={setConfig} form={fontsConfig} />
        </TabPanel>
      </Box>

      <div className="figma-font__button">
        <FormControlLabel control={
          <Switch checked={hasLigatura} onChange={(e) => setHasLigatura(e.target.checked)} />
        } label="Ligadura" />
      
        <Button
          variant="outlined"
          className="figma-font__button"
          onClick={onSubmit}
          disabled={!Boolean(icons.length)}
        >
          Generate Font
        </Button>
      </div>
    </div>
  );
};

export default App;

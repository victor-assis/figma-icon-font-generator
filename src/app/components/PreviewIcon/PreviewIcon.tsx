import React, { Fragment } from 'react';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';

import './PreviewIcon.scss';
import { JsonType } from '../../shared/typings';

let style: HTMLStyleElement;

const PreviewIcon = ({ fontsFiles, ligatura }) => {
  if (!style) {
    const head = document.head || document.getElementsByTagName('head')[0];
    style = document.createElement('style');
    head.appendChild(style);
  }

  if (fontsFiles && fontsFiles.urls) {
    style.innerHTML = '\n\
      @font-face {\n\
        font-family: "preview";\n\
        src: url("'+fontsFiles.urls.eot+'");\n\
        src: url("'+fontsFiles.urls.eot+'") format("embedded-opentype"),\n\
             url("'+fontsFiles.urls.ttf+'") format("truetype"),\n\
             url("'+fontsFiles.urls.woff+'") format("woff"),\n\
             url("'+fontsFiles.urls.woff2+'") format("woff2"),\n\
             url("'+fontsFiles.urls.svg+'") format("svg");\n\
        font-weight: normal;\n\
        font-style: normal;\n\
      }\n\
    ';
  }

  const iconSelect = (file: JsonType) => (
    <>
    {ligatura && <>Ligatures: {file?.ligature?.toString()}<br /></>}
    Unicode: {file?.unicode?.toString()}
    </>
  );

  return (
    <>
    <List sx={{ width: '100%' }}>
      {(fontsFiles && fontsFiles.json) && fontsFiles.json.map((file: JsonType, index: number) =>
      <Fragment key={index}>
        <ListItem alignItems="flex-start">
          <ListItemAvatar>
            <i className="icon-preview">{file.ligature[0] ? file.ligature[0] : file.unicode[0]}</i>
          </ListItemAvatar>
          <ListItemText
            primary={file.name}
            secondary={iconSelect(file)}
          />
        </ListItem>
        <Divider variant="inset" component="li" />
      </Fragment>
      )}
    </List>
    </>
  );
};

export default PreviewIcon;
import List from '@mui/material/List';
import Card from '@mui/material/Card';
import ListItem from '@mui/material/ListItem';
import React, { Fragment, ReactElement } from 'react';
import ListItemText from '@mui/material/ListItemText';
import './PreviewIcon.scss';
import { IGeneratedFont, IJsonType } from '../../../shared/typings';

let style: HTMLStyleElement;

const PreviewIcon = ({
  fontsFiles,
  ligatura,
}: {
  fontsFiles: IGeneratedFont;
  ligatura: boolean;
}): ReactElement => {
  if (!style) {
    const head = document.head || document.getElementsByTagName('head')[0];
    style = document.createElement('style');
    head.appendChild(style);
  }

  console.log(fontsFiles);

  if (fontsFiles?.urls) {
    style.innerHTML = `\n\
      @font-face {\n\
        font-family: "preview";\n\
        src: url("${fontsFiles.urls.eot}");\n\
        src: url("${fontsFiles.urls.eot}") format("embedded-opentype"),\n\
             url("${fontsFiles.urls.ttf}") format("truetype"),\n\
             url("${fontsFiles.urls.woff}") format("woff"),\n\
             url("${fontsFiles.urls.woff2}") format("woff2"),\n\
             url("${fontsFiles.urls.svg}") format("svg");\n\
        font-weight: normal;\n\
        font-style: normal;\n\
        -webkit-font-smoothing: antialiased;\n\
      }\n\
    `;
  }

  const iconSelect = (file: IJsonType): ReactElement => (
    <>
      {ligatura && (
        <>
          <span>{`Ligatures: ${file?.ligature?.toString()}`}</span>
          <br />
        </>
      )}
      <span>{`Unicode: ${file?.unicode?.toString()}`}</span>
    </>
  );

  return (
    <>
      <List
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
        }}
      >
        {fontsFiles?.json?.map((file: IJsonType, index: number) => (
          <Fragment key={index}>
            <Card sx={{ display: 'flex' }}>
              <ListItem
                alignItems="center"
                sx={{ display: 'block', textAlign: 'center' }}
              >
                <i className="icon-preview">
                  {file.ligature?.[0] ? file.ligature[0] : file.unicode[0]}
                </i>
                <ListItemText
                  primary={file.name}
                  secondary={iconSelect(file)}
                  sx={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  className="icon-info"
                />
              </ListItem>
            </Card>
          </Fragment>
        ))}
      </List>
    </>
  );
};

export default PreviewIcon;

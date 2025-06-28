import List from '@mui/material/List';
import Card from '@mui/material/Card';
import ListItem from '@mui/material/ListItem';
import { Fragment, ReactElement } from 'react';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import ListItemText from '@mui/material/ListItemText';
import './PreviewIcon.scss';
import { IGeneratedFont, IJsonType } from '../../../shared/typings';

let style: HTMLStyleElement;

const PreviewIcon = ({
  fontsFiles,
  ligatura,
  onChange,
}: {
  fontsFiles: IGeneratedFont;
  ligatura: boolean;
  onChange: (id: string, data: Partial<IJsonType>) => void;
}): ReactElement => {
  if (!style) {
    const head = document.head || document.getElementsByTagName('head')[0];
    style = document.createElement('style');
    head.appendChild(style);
  }

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
    <Stack spacing={1} sx={{ mt: 1 }}>
      {ligatura && (
        <TextField
          label="Ligature"
          variant="outlined"
          size="small"
          value={Array.isArray(file.ligature) ? file.ligature.join(',') : file.ligature ?? ''}
          onChange={(e) =>
            onChange(file.id, { ligature: e.target.value.split(',') })
          }
        />
      )}
      <TextField
        label="Unicode"
        variant="outlined"
        size="small"
        value={Array.isArray(file.unicode) ? file.unicode.join(',') : file.unicode ?? ''}
        onChange={(e) =>
          onChange(file.id, { unicode: e.target.value.split(',') })
        }
      />
      <TextField
        label="Tags"
        variant="outlined"
        size="small"
        value={file.tags?.join(',') ?? ''}
        onChange={(e) =>
          onChange(file.id, {
            tags: e.target.value
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean),
          })
        }
      />
    </Stack>
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
            <Card sx={{ display: 'flex', flexDirection: 'column', p: 1, minWidth: 150 }}>
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
                  sx={{ textOverflow: 'ellipsis', whiteSpace: 'normal' }}
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

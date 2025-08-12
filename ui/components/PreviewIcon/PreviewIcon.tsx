import Card from '@mui/material/Card';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import ListItemText from '@mui/material/ListItemText';
import { Fragment, ReactElement, useState } from 'react';
import './PreviewIcon.scss';
import { IGeneratedFont, IJsonType } from '../../../shared/typings';

let style: HTMLStyleElement;

const PreviewIcon = ({
  fontsFiles,
  ligatura,
  onChange,
  onInvert,
}: {
  fontsFiles: IGeneratedFont;
  ligatura: boolean;
  onChange: (id: string, data: Partial<IJsonType>) => void;
  onInvert: (id: string) => void;
}): ReactElement => {
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});
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
        value={tagInputs[file.id] ?? file.tags?.join(',') ?? ''}
        onChange={(e) => {
          setTagInputs((prev) => ({ ...prev, [file.id]: e.target.value }));
        }}
        onBlur={() => {
          onChange(file.id, {
            tags:
              (tagInputs[file.id] ?? file.tags?.join(',') ?? '')
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
          });
        }}
      />
      <Button
        variant="outlined"
        size="small"
        onClick={() => onInvert(file.id)}
      >
        Invert Fill
      </Button>
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
                {file.ligature?.[0] && (
                  <span className="ligature-example">{file.ligature[0]}</span>
                )}
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

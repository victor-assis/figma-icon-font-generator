import Checkbox from '@mui/material/Checkbox';
import { ReactElement, useState } from 'react';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import { IFormConfig } from '../../../shared/typings';
import './FormFontConfig.scss';

const FormFontConfig = ({
  onChange,
  onLigatureChange,
  form,
}: {
  onChange: (config: Partial<IFormConfig>) => void;
  onLigatureChange: (checked: boolean) => void;
  form: IFormConfig;
}): ReactElement => {
  const [fontName, setfontName] = useState(form.fontName);
  const [fontHeight, setfontHeight] = useState(form.fontHeight);
  const [fontStyle, setFontStyle] = useState(form.fontStyle);
  const [fontWeight, setFontWeight] = useState(form.fontWeight);
  const [fixedWidth, setFixedWidth] = useState(form.fixedWidth ?? false);
  const [centerHorizontally, setCenterHorizontally] = useState(
    form.centerHorizontally ?? false,
  );
  const [ligature, setLigature] = useState(true);
  const [centerVertically, setCenterVertically] = useState(
    form.centerVertically ?? false,
  );
  const [normalize, setNormalize] = useState(form.normalize ?? false);
  const [preserveAspectRatio, setPreserveAspectRatio] = useState(
    form.preserveAspectRatio ?? false,
  );
  const [version, setVersion] = useState(form.version);

  const onChangeEnt = (event: Partial<IFormConfig>): void => {
    onChange({
      ...{
        fontName,
        fontHeight,
        fontStyle,
        fontWeight,
        fixedWidth,
        centerHorizontally,
        centerVertically,
        normalize,
        preserveAspectRatio,
        version,
      },
      ...event,
    });
  };

  return (
    <form className="figma-form-config">
      <div className="figma-form-config__columns">
        <TextField
          variant="outlined"
          label="Font Name"
          onChange={(e) => {
            setfontName(e.target.value);
            onChangeEnt({ fontName: e.target.value });
          }}
          value={fontName}
        />

        <TextField
          variant="outlined"
          label="Font Weight"
          onChange={(e) => {
            setfontHeight(e.target.value);
            onChangeEnt({ fontHeight: e.target.value });
          }}
          value={fontHeight}
        />
        <TextField
          variant="outlined"
          label="Font Style"
          onChange={(e) => {
            setFontStyle(e.target.value);
            onChangeEnt({ fontStyle: e.target.value });
          }}
          value={fontStyle}
        />
        <TextField
          variant="outlined"
          label="Font Weight"
          onChange={(e) => {
            setFontWeight(e.target.value);
            onChangeEnt({ fontWeight: e.target.value });
          }}
          value={fontWeight}
        />
      </div>

      <FormControlLabel
        control={
          <Checkbox
            onChange={(e) => {
              setLigature(e.target.checked);
              onLigatureChange(e.target.checked);
            }}
            checked={ligature}
          />
        }
        label="Ligature"
        labelPlacement="end"
      />

      <FormControlLabel
        control={
          <Checkbox
            onChange={(e) => {
              setFixedWidth(e.target.checked);
              onChangeEnt({ fixedWidth: e.target.checked });
            }}
            checked={fixedWidth}
          />
        }
        label="fixedWidth"
      />

      <FormControlLabel
        control={
          <Checkbox
            onChange={(e) => {
              setCenterHorizontally(e.target.checked);
              onChangeEnt({ centerHorizontally: e.target.checked });
            }}
            checked={centerHorizontally}
          />
        }
        label="centerHorizontally"
      />

      <FormControlLabel
        control={
          <Checkbox
            onChange={(e) => {
              setCenterVertically(e.target.checked);
              onChangeEnt({ centerVertically: e.target.checked });
            }}
            checked={centerVertically}
          />
        }
        label="centerVertically"
      />

      <FormControlLabel
        control={
          <Checkbox
            onChange={(e) => {
              setNormalize(e.target.checked);
              onChangeEnt({ normalize: e.target.checked });
            }}
            checked={normalize}
          />
        }
        label="normalize"
      />

      <FormControlLabel
        control={
          <Checkbox
            onChange={(e) => {
              setPreserveAspectRatio(e.target.checked);
              onChangeEnt({ preserveAspectRatio: e.target.checked });
            }}
            checked={preserveAspectRatio}
          />
        }
        label="preserveAspectRatio"
      />

      <TextField
        variant="outlined"
        label="Version"
        onChange={(e) => {
          setVersion(e.target.value);
          onChangeEnt({ version: e.target.value });
        }}
        value={version}
      />
    </form>
  );
};

export default FormFontConfig;

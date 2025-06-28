import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import './githubIntegration.scss';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import React, { ReactElement, useState } from 'react';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IFormGithub } from '../../../shared/typings';

const GithubIntegration = ({
  onChange,
  form,
}: {
  onChange: (form: IFormGithub) => void;
  form: IFormGithub;
}): ReactElement => {
  const [githubToken, setGithubToken] = useState(form?.githubToken ?? '');
  const [owner, setOwner] = useState(form?.owner ?? '');
  const [repo, setRepo] = useState(form?.repo ?? '');
  const [branch, setBranch] = useState(form?.branch ?? '');
  const [filePath, setFilePath] = useState(form?.filePath ?? '');
  const [commitMessage, setCommitMessage] = useState(form?.commitMessage ?? '');
  const [pullRequestTitle, setPullRequestTitle] = useState(
    form?.pullRequestTitle ?? '',
  );
  const [mainBranch, setMainBranch] = useState(form?.mainBranch ?? '');

  const [showPassword, setShowPassword] = React.useState(false);
  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
  };

  const onChangeEnt = (event: Partial<IFormGithub>): void => {
    onChange({
      ...{
        githubToken,
        owner,
        repo,
        branch,
        filePath,
        commitMessage,
        pullRequestTitle,
        mainBranch,
      },
      ...event,
    });
  };

  return (
    <form className="figma-form-config">
      <FormControl variant="outlined">
        <InputLabel htmlFor="outlined-adornment-password">Token</InputLabel>
        <OutlinedInput
          id="outlined-adornment-password"
          label="Token"
          onChange={(e) => {
            setGithubToken(e.target.value);
            onChangeEnt({ githubToken: e.target.value });
          }}
          value={githubToken}
          type={showPassword ? 'text' : 'password'}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle token visibility"
                onClick={handleClickShowPassword}
                onMouseDown={handleMouseDownPassword}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
        />
        <FormHelperText id="outlined-adornment-password">
          For more information access:{' '}
          <Link
            href="https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens"
            target="_blank"
          >
            Github token
          </Link>
        </FormHelperText>
      </FormControl>

      <TextField
        variant="outlined"
        label="Owner"
        onChange={(e) => {
          setOwner(e.target.value);
          onChangeEnt({ owner: e.target.value });
        }}
        value={owner}
      />
      <TextField
        variant="outlined"
        label="Repo"
        onChange={(e) => {
          setRepo(e.target.value);
          onChangeEnt({ repo: e.target.value });
        }}
        value={repo}
      />
      <TextField
        variant="outlined"
        label="Branch"
        onChange={(e) => {
          setBranch(e.target.value);
          onChangeEnt({ branch: e.target.value });
        }}
        value={branch}
      />
      <TextField
        variant="outlined"
        label="Files Path"
        helperText="Exemple: src/app/assets"
        onChange={(e) => {
          setFilePath(e.target.value);
          onChangeEnt({ filePath: e.target.value });
        }}
        value={filePath}
      />
      <TextField
        variant="outlined"
        label="Commit Message"
        onChange={(e) => {
          setCommitMessage(e.target.value);
          onChangeEnt({ commitMessage: e.target.value });
        }}
        value={commitMessage}
      />
      <TextField
        variant="outlined"
        label="PR Title"
        onChange={(e) => {
          setPullRequestTitle(e.target.value);
          onChangeEnt({ pullRequestTitle: e.target.value });
        }}
        value={pullRequestTitle}
      />
      <TextField
        variant="outlined"
        label="Main Branch"
        onChange={(e) => {
          setMainBranch(e.target.value);
          onChangeEnt({ mainBranch: e.target.value });
        }}
        value={mainBranch}
      />
    </form>
  );
};

export default GithubIntegration;

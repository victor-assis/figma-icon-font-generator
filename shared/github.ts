import { IFormGithub, IGitFile } from './typings';

export const fileToBase64 = (file: Uint8Array | string | ArrayBuffer) => {
  if (file instanceof Uint8Array) {
    return Buffer.from(file).toString('base64');
  }

  return file;
};

export const commitFileAndOpenPR = async (
  files: IGitFile[],
  githubData: IFormGithub,
) => {
  const {
    githubToken,
    owner,
    repo,
    branch,
    filePath,
    commitMessage,
    pullRequestTitle,
    mainBranch,
  } = githubData;
  let branchSHA;

  try {
    const checkBranchResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: 'GET',
        headers: {
          Authorization: `token ${githubToken}`,
        },
      },
    );

    if (checkBranchResponse.status === 404) {
      const checkMainBranch = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${mainBranch}`,
        {
          method: 'GET',
          headers: {
            Authorization: `token ${githubToken}`,
          },
        },
      );

      const shaMainBranch = (await checkMainBranch.json()).object.sha;

      const newBranch = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/git/refs`,
        {
          method: 'POST',
          headers: {
            Authorization: `token ${githubToken}`,
          },
          body: JSON.stringify({
            ref: `refs/heads/${branch}`,
            sha: shaMainBranch,
          }),
        },
      );

      branchSHA = (await newBranch.json()).object.sha;
    } else {
      branchSHA = (await checkBranchResponse.json()).object.sha;
    }

    const changes = await Promise.all(
      files.map(async (file) => {
        const blob = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/git/blobs`,
          {
            method: 'POST',
            headers: {
              Authorization: `token ${githubToken}`,
            },
            body: JSON.stringify({
              content: fileToBase64(file.content),
            }),
          },
        );

        return {
          path: `${filePath}/${file.name}`,
          mode: '100644',
          type: 'blob',
          sha: (await blob.json()).sha,
        };
      }),
    );

    const getBaseTree = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}`,
      {
        method: 'GET',
        headers: {
          Authorization: `token ${githubToken}`,
        },
      },
    );

    const createTree = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${githubToken}`,
        },
        body: JSON.stringify({
          base_tree: (await getBaseTree.json()).sha,
          tree: changes,
        }),
      },
    );

    const createCommit = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/commits`,
      {
        method: 'POST',
        headers: {
          Authorization: `token ${githubToken}`,
        },
        body: JSON.stringify({
          message: commitMessage,
          parents: [branchSHA],
          tree: (await createTree.json()).sha,
        }),
      },
    );

    const updateBranch = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `token ${githubToken}`,
        },
        body: JSON.stringify({
          sha: (await createCommit.json()).sha,
        }),
      },
    );

    if (updateBranch.status !== 200) {
      console.error(
        'Erro ao criar o arquivo:',
        (await createTree.json()).message,
      );
      return;
    }

    await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      headers: {
        Authorization: `token ${githubToken}`,
      },
      body: JSON.stringify({
        title: pullRequestTitle,
        head: branch,
        base: mainBranch,
      }),
    });

    console.log('Arquivo comitado e PR aberta com sucesso.');
  } catch (error) {
    console.error('Erro ao comitar arquivo e abrir PR:', error);
  }
};

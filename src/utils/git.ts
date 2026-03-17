import simpleGit, { type SimpleGit } from "simple-git";
import fs from "fs-extra";

export function getGit(cwd?: string): SimpleGit {
  return simpleGit(cwd);
}

export async function isGitRepo(dir: string): Promise<boolean> {
  try {
    const git = getGit(dir);
    return await git.checkIsRepo();
  } catch {
    return false;
  }
}

export async function initRepo(
  dir: string,
  remote?: string,
): Promise<void> {
  const git = getGit(dir);
  await git.init();
  if (remote) {
    await git.addRemote("origin", remote);
  }
}

export async function cloneRepo(
  url: string,
  dir: string,
): Promise<void> {
  await fs.ensureDir(dir);
  const git = simpleGit();
  await git.clone(url, dir);
}

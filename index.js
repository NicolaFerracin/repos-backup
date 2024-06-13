const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sanitize = require("sanitize-filename");
require("dotenv").config();

const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
const DOWNLOAD_FOLDER = process.env.DOWNLOAD_FOLDER ?? `${__dirname}/repos`;
const ignoredRepos = process.env.IGNORED_REPOS
  ? process.env.IGNORED_REPOS.split(",")
  : [];

const getRepos = async () => {
  const response = await axios.get(`https://api.github.com/user/repos`, {
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
    },
    params: {
      visibility: "all", // This parameter ensures that both public and private repos are retrieved
      affiliation: "owner",
    },
  });
  return response.data.map((repo) => repo.clone_url);
};

const cloneRepos = async (repos) => {
  repos.forEach((repo) => {
    const repoName = sanitize(repo.split("/").pop().replace(".git", ""));
    const repoPath = path.join(DOWNLOAD_FOLDER, repoName);

    if (ignoredRepos.includes(repoName)) {
      console.log(`Repo ${repoName} is ignored`);
      return;
    }

    if (!fs.existsSync(repoPath)) {
      try {
        execSync(`git clone ${repo} "${repoPath}"`, { stdio: "inherit" });
      } catch (error) {
        console.error(`Failed to clone ${repo}: ${error.message}`);
      }
    } else {
      console.log(`Repo ${repoName} already exists`);
    }
  });
};

const run = async () => {
  if (!fs.existsSync(DOWNLOAD_FOLDER)) {
    fs.mkdirSync(DOWNLOAD_FOLDER);
  }

  const repos = await getRepos();
  cloneRepos(repos).catch((error) => console.error(error));
};

run();

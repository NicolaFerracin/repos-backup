const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const sanitize = require("sanitize-filename");
require("dotenv").config();

const GITHUB_TOKEN = process.env.GITHUB_ACCESS_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
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
    const repoUrl = `https://${GITHUB_USERNAME}:${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/${repoName}.git`;
    const repoPath = path.join(DOWNLOAD_FOLDER, repoName);

    if (ignoredRepos.includes(repoName)) {
      console.log(`Repo ${repoName} is ignored`);
      return;
    }

    if (!fs.existsSync(repoPath)) {
      try {
        execSync(`git clone ${repoUrl} "${repoPath}"`, { stdio: "inherit" });
      } catch (error) {
        console.error(`Failed to clone ${repo}: ${error.message}`);
      }
    } else {
      console.log(`Repo ${repoName} already exists`);
    }
  });
};

const cleanUpNodeModules = (repos) => {
  fs.readdir(DOWNLOAD_FOLDER, (err, repos) => {
    if (err) {
      console.error("Error reading the download folder:", err);
      return;
    }

    repos.forEach((repo) => {
      const repoPath = path.join(DOWNLOAD_FOLDER, repo);
      const nodeModulesPath = path.join(repoPath, "node_modules");

      // Check if the node_modules folder exists
      if (fs.existsSync(nodeModulesPath)) {
        // Delete the node_modules folder
        fs.rm(nodeModulesPath, { recursive: true, force: true }, (err) => {
          if (err) {
            console.error(`Failed to delete node_modules in ${repo}:`, err);
          } else {
            console.log(`Deleted node_modules in ${repo}`);
          }
        });
      } else {
        console.log(`No node_modules folder in ${repo}`);
      }
    });
  });
};

const run = async () => {
  if (!fs.existsSync(DOWNLOAD_FOLDER)) {
    fs.mkdirSync(DOWNLOAD_FOLDER);
  }

  const repos = await getRepos();
  cloneRepos(repos).catch((error) => console.error(error));
  cleanUpNodeModules(repos);
};

run();

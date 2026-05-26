#!/usr/bin/env node

const { spawn } = require("node:child_process");
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return {};
  }

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((env, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return env;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        return env;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, "");

      if (key) {
        env[key] = value;
      }

      return env;
    }, {});
}

const [hostEnvName, separator, ...expoArgs] = process.argv.slice(2);

if (!hostEnvName || separator !== "--") {
  console.error(
    "Usage: node scripts/expo-start-with-env.cjs <HOST_ENV_NAME> -- <expo start args>",
  );
  process.exit(1);
}

const envFromFile = parseEnvFile(resolve(process.cwd(), ".env"));
const host =
  process.env[hostEnvName] || envFromFile[hostEnvName] || envFromFile.EXPO_PACKAGER_HOST;

if (!host) {
  console.error(
    `Missing ${hostEnvName} in the shell environment or mobile/.env file.`,
  );
  process.exit(1);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, ["expo", "start", ...expoArgs], {
  env: {
    ...process.env,
    ...envFromFile,
    REACT_NATIVE_PACKAGER_HOSTNAME: host,
  },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});

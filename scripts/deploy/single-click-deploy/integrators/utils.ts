import path from "path";
import fs from "fs";
import { writeFile } from "fs/promises";

import { ChainId, ChainSlug } from "../../../../src";
import { ChainConfig, ChainConfigs } from "../../../constants";

const configFilePath = path.join(__dirname, `/../../../../`);
const enumFolderPath = path.join(__dirname, `/../../../../src/enums/`);

export const updateConfig = async (
  chainSlug: ChainSlug,
  chainConfig: ChainConfig
) => {
  const addressesPath = configFilePath + "chainConfig.json";
  const outputExists = fs.existsSync(addressesPath);
  let configs: ChainConfigs = {};

  if (outputExists) {
    const configsString = fs.readFileSync(addressesPath, "utf-8");
    configs = JSON.parse(configsString);
  }

  configs[chainSlug] = chainConfig;
  fs.writeFileSync(addressesPath, JSON.stringify(configs, null, 2) + "\n");
};

export const buildEnvFile = async (
  rpc: string,
  ownerAddress: string,
  pk: string
) => {
  const envPath = configFilePath + ".env";
  const envExists = fs.existsSync(envPath);

  let configsString = "";
  if (envExists) {
    configsString = fs.readFileSync(envPath, "utf-8");
  } else {
    const envPath = configFilePath + ".env.example";
    configsString = fs.readFileSync(envPath, "utf-8");
  }

  if (!configsString.includes("SOCKET_OWNER_ADDRESS") || !envExists) {
    configsString += `\nSOCKET_OWNER_ADDRESS="${ownerAddress}"`;
  }

  if (
    (!configsString.includes("SOCKET_SIGNER_KEY") || !envExists) &&
    pk &&
    pk.length
  ) {
    configsString += `\nSOCKET_SIGNER_KEY="${pk}"`;
  }

  configsString += `\nNEW_RPC="${rpc}"\n`;
  await writeFile(".env", configsString);
  console.log("Created env");
};

export const updateSDK = async (
  chainName: string,
  chainId: number,
  isMainnet: boolean
) => {
  if (!fs.existsSync(enumFolderPath)) {
    throw new Error(`Folder not found! ${enumFolderPath}`);
  }

  const filteredChain = Object.values(ChainId).filter((c) => c == chainId);
  if (filteredChain.length > 0) {
    console.log("Chain already added!");
    return;
  }

  await updateFile(
    "hardhatChainName.ts",
    `,\n  ${chainName.toUpperCase()} = "${chainName.toLowerCase()}",\n}\n`,
    ",\n}"
  );
  await updateFile(
    "chainId.ts",
    `,\n  ${chainName.toUpperCase()} = ${chainId},\n}\n`,
    ",\n}"
  );
  await updateFile(
    "chainSlug.ts",
    `,\n  ${chainName.toUpperCase()} = ChainId.${chainName.toUpperCase()},\n}\n`,
    ",\n}"
  );
  await updateFile(
    "chainSlugToKey.ts",
    `,\n  [ChainSlug.${chainName.toUpperCase()}]: HardhatChainName.${chainName.toUpperCase()},\n};\n`,
    ",\n};"
  );
  await updateFile(
    "chainSlugToId.ts",
    `,\n  [ChainSlug.${chainName.toUpperCase()}]: ChainId.${chainName.toUpperCase()},\n};\n`,
    ",\n};"
  );
  await updateFile(
    "hardhatChainNameToSlug.ts",
    `,\n  [HardhatChainName.${chainName.toUpperCase()}]: ChainSlug.${chainName.toUpperCase()},\n};\n`,
    ",\n};"
  );
  await updateFile(
    "chainSlugToHardhatChainName.ts",
    `,\n  [ChainSlug.${chainName.toUpperCase()}]: HardhatChainName.${chainName.toUpperCase()},\n};\n`,
    ",\n};"
  );

  if (isMainnet) {
    await updateFile(
      "mainnetIds.ts",
      `,\n  ChainSlug.${chainName.toUpperCase()},\n];\n`,
      ",\n];"
    );
  } else
    await updateFile(
      "testnetIds.ts",
      `,\n  ChainSlug.${chainName.toUpperCase()},\n];\n`,
      ",\n];"
    );
};

const updateFile = async (fileName, newChainDetails, replaceWith) => {
  const filePath = enumFolderPath + fileName;
  const outputExists = fs.existsSync(filePath);
  if (!outputExists) throw new Error(`${fileName} enum not found! ${filePath}`);

  const verificationDetailsString = fs.readFileSync(filePath, "utf-8");

  // replace last bracket with new line
  const verificationDetails = verificationDetailsString
    .trimEnd()
    .replace(replaceWith, newChainDetails);

  fs.writeFileSync(filePath, verificationDetails);
};

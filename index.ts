import dotenv from "dotenv";

dotenv.config();

import {
  Connection,
  PublicKey,
  clusterApiUrl,
  type GetProgramAccountsConfig,
} from "@solana/web3.js";
import * as borsh from "borsh";

interface ApplicationAccount {
  bump: number;
  pre_req_ts: boolean;
  pre_req_rs: boolean;
  github: string;
}

const ApplicationAccountSchema = {
  struct: {
    bump: "u8",
    pre_req_ts: "bool",
    pre_req_rs: "bool",
    github: "string",
  },
};

const rpcUrl = clusterApiUrl("devnet");
const programIdString = process.env.PROGRAM_ID;

const connection = new Connection(rpcUrl, "confirmed");

if (!programIdString) {
  throw new Error("PROGRAM_ID is not set");
}

let programId = new PublicKey(programIdString);

let config: GetProgramAccountsConfig = {
  dataSlice: {
    offset: 0,
    length: 0,
  },
};

let accounts = await connection.getProgramAccounts(programId, config);
const accountKeys = accounts.map((account) => account.pubkey);

console.log("Found", accountKeys.length, "accounts");

// Process each account
for (const key of accountKeys) {
  try {
    const info = await connection.getAccountInfo(key);
    if (info && info.data) {
      // Skip the discriminator (first 8 bytes)
      const dataWithoutDiscriminator = info.data.slice(8);

      // Deserialize using Borsh
      const deserializedData = borsh.deserialize(
        ApplicationAccountSchema,
        dataWithoutDiscriminator
      ) as ApplicationAccount;

      console.log("\nAccount:", key.toString());
      console.log("Deserialized data:", {
        bump: deserializedData.bump,
        pre_req_ts: deserializedData.pre_req_ts,
        pre_req_rs: deserializedData.pre_req_rs,
        github: deserializedData.github,
      });
    }
  } catch (error) {
    console.error("Error deserializing account", key.toString(), ":", error);
  }
}

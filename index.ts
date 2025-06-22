import dotenv from "dotenv";

dotenv.config();

import {
  Connection,
  PublicKey,
  clusterApiUrl,
  type GetProgramAccountsConfig,
} from "@solana/web3.js";
import * as borsh from "borsh";
import * as fs from "fs";
import * as path from "path";

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

// ApplicationAccount discriminator from IDL.json
const APPLICATION_ACCOUNT_DISCRIMINATOR = [222, 181, 17, 200, 212, 149, 64, 88];

// Size constraints for student accounts
// 8 bytes (discriminator) + 1 byte (bump) + 1 byte (bool) + 1 byte (bool) + 4 bytes (string length) + N bytes (github)
const MIN_STUDENT_ACCOUNT_SIZE = 8 + 1 + 1 + 1 + 4 + 1; // Minimum 1 char for GitHub
const MAX_STUDENT_ACCOUNT_SIZE = 8 + 1 + 1 + 1 + 4 + 50; // Maximum 50 chars for GitHub

// Parse command line arguments
const args = process.argv.slice(2);
const filterType = args[0] || "all";

console.log("🔍 Filter type:", filterType);
console.log(
  "Available filters: all, initialized, ts_only, rust_only, completed"
);

const rpcUrl = clusterApiUrl("devnet");
const programIdString = process.env.PROGRAM_ID;

const connection = new Connection(rpcUrl, "confirmed");

if (!programIdString) {
  throw new Error("PROGRAM_ID is not set");
}

let programId = new PublicKey(programIdString);

// Replace the config section with:
let config: GetProgramAccountsConfig = {
  dataSlice: {
    offset: 0,
    length: 0,
  },
  // No filters - we'll filter client-side
};

console.log(
  `🔍 Fetching accounts with size between ${MIN_STUDENT_ACCOUNT_SIZE} and ${MAX_STUDENT_ACCOUNT_SIZE} bytes...`
);

let accounts = await connection.getProgramAccounts(programId, config);
const accountKeys = accounts.map((account) => account.pubkey);

console.log(`Found ${accountKeys.length} accounts (pre-filtered by size)`);

// Helper function to check if account is an ApplicationAccount
function isApplicationAccount(data: Buffer): boolean {
  if (data.length < 8) return false;

  const discriminator = Array.from(data.slice(0, 8));
  return discriminator.every(
    (byte, index) => byte === APPLICATION_ACCOUNT_DISCRIMINATOR[index]
  );
}

const allAccountData: Array<{
  accountAddress: string;
  bump: number;
  pre_req_ts: boolean;
  pre_req_rs: boolean;
  github: string;
}> = [];

const filteredAccountData: Array<{
  accountAddress: string;
  bump: number;
  pre_req_ts: boolean;
  pre_req_rs: boolean;
  github: string;
}> = [];

let studentAccountsFound = 0;
let nonStudentAccountsSkipped = 0;

// Process each account
for (const key of accountKeys) {
  try {
    const info = await connection.getAccountInfo(key);
    if (info && info.data) {
      // Step 1: Check if it's actually a student account
      if (!isApplicationAccount(info.data)) {
        console.log(
          `⏭️  Skipping non-student account: ${key.toString()} (wrong discriminator)`
        );
        nonStudentAccountsSkipped++;
        continue;
      }

      // Step 2: Safe to deserialize since we confirmed it's a student account
      const dataWithoutDiscriminator = info.data.slice(8);

      const deserializedData = borsh.deserialize(
        ApplicationAccountSchema,
        dataWithoutDiscriminator
      ) as ApplicationAccount;

      const accountData = {
        accountAddress: key.toString(),
        bump: deserializedData.bump,
        pre_req_ts: deserializedData.pre_req_ts,
        pre_req_rs: deserializedData.pre_req_rs,
        github: deserializedData.github,
      };

      allAccountData.push(accountData);
      studentAccountsFound++;

      // Apply filter based on command line argument
      let shouldInclude = false;
      switch (filterType) {
        case "all":
          shouldInclude = true;
          break;
        case "initialized":
          shouldInclude =
            !deserializedData.pre_req_ts && !deserializedData.pre_req_rs;
          break;
        case "ts_only":
          shouldInclude =
            deserializedData.pre_req_ts && !deserializedData.pre_req_rs;
          break;
        case "rust_only":
          shouldInclude =
            !deserializedData.pre_req_ts && deserializedData.pre_req_rs;
          break;
        case "completed":
          shouldInclude =
            deserializedData.pre_req_ts && deserializedData.pre_req_rs;
          break;
        default:
          console.error(
            "❌ Invalid filter type. Use: all, initialized, ts_only, rust_only, completed"
          );
          process.exit(1);
      }

      if (shouldInclude) {
        filteredAccountData.push(accountData);
      }

      console.log(`\n✅ Student Account: ${key.toString()}`);
      console.log("Status:", {
        initialized:
          !deserializedData.pre_req_ts && !deserializedData.pre_req_rs
            ? "✅"
            : "❌",
        ts_completed: deserializedData.pre_req_ts ? "✅" : "❌",
        rust_completed: deserializedData.pre_req_rs ? "✅" : "❌",
        github: deserializedData.github,
      });
    }
  } catch (error) {
    console.error(`❌ Error processing account ${key.toString()}:`, error);
  }
}

const outputDir = "./output";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

// Save filtered data
const jsonFilename = `accounts_${filterType}_${timestamp}.json`;
const jsonPath = path.join(outputDir, jsonFilename);
fs.writeFileSync(jsonPath, JSON.stringify(filteredAccountData, null, 2));

// Also save all student data for reference
const allJsonFilename = `accounts_all_students_${timestamp}.json`;
const allJsonPath = path.join(outputDir, allJsonFilename);
fs.writeFileSync(allJsonPath, JSON.stringify(allAccountData, null, 2));

console.log(`\n📊 Summary:`);
console.log(` Total accounts fetched (size filtered): ${accountKeys.length}`);
console.log(` Student accounts found: ${studentAccountsFound}`);
console.log(` Non-student accounts skipped: ${nonStudentAccountsSkipped}`);
console.log(
  ` Filtered accounts (${filterType}): ${filteredAccountData.length}`
);
console.log(`\n💾 Files saved:`);
console.log(` Filtered data: ${jsonPath}`);
console.log(` All student data: ${allJsonPath}`);

// Show breakdown
const initialized = allAccountData.filter(
  (a) => !a.pre_req_ts && !a.pre_req_rs
).length;
const tsOnly = allAccountData.filter(
  (a) => a.pre_req_ts && !a.pre_req_rs
).length;
const rustOnly = allAccountData.filter(
  (a) => !a.pre_req_ts && a.pre_req_rs
).length;
const completed = allAccountData.filter(
  (a) => a.pre_req_ts && a.pre_req_rs
).length;

console.log(`\n📈 Student Account Breakdown:`);
console.log(` Just initialized: ${initialized}`);
console.log(` TS only: ${tsOnly}`);
console.log(` Rust only: ${rustOnly}`);
console.log(` Completed both: ${completed}`);

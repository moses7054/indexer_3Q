import dotenv from "dotenv";
dotenv.config();

import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

interface AccountData {
  accountAddress: string;
  bump: number;
  pre_req_ts: boolean;
  pre_req_rs: boolean;
  github: string;
}

const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

async function writeToSheet(data: AccountData[]) {
  const sheets = google.sheets({ version: "v4", auth });

  const spreadsheetId = process.env.SPREADSHEET_ID;
  const range = `Sheet1!A1`; // CAUTION: Update the range to not loose data
  const valueInputOption = "USER_ENTERED";

  const request = {
    spreadsheetId,
    range,
    valueInputOption,
    requestBody: {
      values: data.map((item) => [
        item.accountAddress,
        item.bump,
        item.pre_req_ts ? "Yes" : "No",
        item.pre_req_rs ? "Yes" : "No",
        item.github,
      ]),
    },
  };

  try {
    const response = await sheets.spreadsheets.values.update(request);
    console.log(
      `Updated ${response.data.updatedCells} cells in the spreadsheet`
    );
    return response;
  } catch (error) {
    console.error("Error updating spreadsheet:", error);
    throw error;
  }
}

async function uploadLatestData() {
  try {
    // Find the latest JSON file in the output directory
    const outputDir = "./output";
    if (!fs.existsSync(outputDir)) {
      throw new Error(
        "Output directory does not exist. Run index.ts first to generate data."
      );
    }

    const files = fs
      .readdirSync(outputDir)
      .filter((file) => file.endsWith(".json"))
      .sort()
      .reverse(); // Get the most recent file first

    if (files.length === 0) {
      throw new Error(
        "No JSON files found in output directory. Run index.ts first to generate data."
      );
    }

    const latestFile = files[0];
    const filePath = path.join(outputDir, latestFile);

    console.log(`Reading data from: ${filePath}`);

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const accountData: AccountData[] = JSON.parse(fileContent);

    console.log(`Found ${accountData.length} accounts to upload`);

    // Upload to Google Sheets
    await writeToSheet(accountData);

    console.log("Data successfully uploaded to Google Sheets!");
  } catch (error) {
    console.error("Error uploading data:", error);
    process.exit(1);
  }
}

// Run the upload if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  uploadLatestData();
}

export { writeToSheet, uploadLatestData };
// CAUTION: Update the range to not loose data

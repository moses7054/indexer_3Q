# Solana Account Indexer & Google Sheets Uploader

This project fetches account data from a Solana program and uploads it to Google Sheets.
This text was generated using a llm.

## What it does

1. **`index.ts`** - Fetches all accounts from a Solana program and saves them to a JSON file
2. **`upload-to-sheets.ts`** - Uploads the latest JSON data to Google Sheets

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env` file with:

```env
PROGRAM_ID="your_solana_program_id"
GOOGLE_APPLICATION_CREDENTIALS="./google.json"
SPREADSHEET_ID="your_google_sheet_id"
```

### 3. Get Google Sheets credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sheets API
4. Create a Service Account
5. Download the JSON key file and save it as `google.json`
6. Share your Google Sheet with the service account email (found in `google.json`)

## How to use

### Step 1: Fetch account data

```bash
npx ts-node index.ts
```

This will:

- Connect to Solana devnet
- Fetch all accounts from your program
- Save data to `./output/accounts_YYYY-MM-DD-HH-MM-SS.json`

### Step 2: Upload to Google Sheets

```bash
npx ts-node upload-to-sheets.ts
```

This will:

- Find the latest JSON file in `./output/`
- Upload the data to your Google Sheet
- Format the data in columns: Address, Bump, TypeScript, Rust, GitHub

## Data Structure

Each account contains:

- `accountAddress` - Solana wallet address
- `bump` - Bump seed number
- `pre_req_ts` - TypeScript prerequisite (Yes/No)
- `pre_req_rs` - Rust prerequisite (Yes/No)
- `github` - GitHub handle

## Troubleshooting

### Permission denied error?

1. Open your Google Sheet
2. Click "Share" button
3. Add the service account email (from `google.json`) with "Editor" permissions
4. Try again

### No data found?

- Check your `PROGRAM_ID` in `.env`
- Make sure the program has accounts on devnet
- Verify your Solana connection

## Files

- `index.ts` - Main script to fetch Solana accounts
- `upload-to-sheets.ts` - Script to upload data to Google Sheets
- `google.json` - Google service account credentials
- `.env` - Environment variables
- `./output/` - Directory where JSON files are saved

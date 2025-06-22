# Solana Account Indexer & Google Sheets Uploader

This project fetches account data from a Solana program and uploads it to Google Sheets.
Generated using llm.

## What it does

1. **`index.ts`** - Fetches student accounts from a Solana program with filtering options and saves them to JSON files
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

#### Get all student accounts (default):

```bash
npx ts-node index.ts
# or
npx ts-node index.ts all
```

#### Get only initialized accounts (no submissions yet):

```bash
npx ts-node index.ts initialized
```

#### Get only TypeScript completed accounts:

```bash
npx ts-node index.ts ts_only
```

#### Get only Rust completed accounts:

```bash
npx ts-node index.ts rust_only
```

#### Get only completed accounts (both TS and Rust):

```bash
npx ts-node index.ts completed
```

This will:

- Connect to Solana devnet
- Fetch all account addresses from your program using `getProgramAccounts`
- Filter out non-student accounts (NFTs, collections, etc.)
- Process accounts in batches of 90 using `getMultipleAccountsInfo` for efficiency
- Save filtered data to `./output/accounts_[filter_type]_[timestamp].json`
- Save all student data to `./output/accounts_all_students_[timestamp].json`

### Step 2: Upload to Google Sheets

```bash
npx ts-node upload-to-sheets.ts
```

This will:

- Find the latest JSON file in `./output/`
- Upload the data to your Google Sheet
- Format the data in columns: Address, Bump, TypeScript, Rust, GitHub

## CLI Filter Options

| Command                            | Description                                          |
| ---------------------------------- | ---------------------------------------------------- |
| `npx ts-node index.ts`             | Get all student accounts                             |
| `npx ts-node index.ts all`         | Get all student accounts                             |
| `npx ts-node index.ts initialized` | Only accounts that just initialized (no submissions) |
| `npx ts-node index.ts ts_only`     | Only accounts with TypeScript completed              |
| `npx ts-node index.ts rust_only`   | Only accounts with Rust completed                    |
| `npx ts-node index.ts completed`   | Only accounts with both TS and Rust completed        |

## Data Structure

Each student account contains:

- `accountAddress` - Solana wallet address
- `bump` - Bump seed number
- `pre_req_ts` - TypeScript prerequisite (true/false)
- `pre_req_rs` - Rust prerequisite (true/false)
- `github` - GitHub handle

## Features

### 🔍 Smart Filtering

- **Two-step fetching**: First gets account addresses, then fetches full data in batches
- **Discriminator checking**: Ensures only student accounts are processed
- **CLI filtering**: Filter by completion status

### ⚡ Performance Optimized

- **Batch processing**: Processes accounts in groups of 90 using `getMultipleAccountsInfo`
- **Efficient RPC calls**: Reduces network overhead by fetching multiple accounts at once
- **Smart skipping**: Skips non-student accounts (NFTs, collections, authorities)
- **Progress tracking**: Shows batch progress for large datasets

### 📊 Detailed Statistics

- Total accounts found
- Student accounts vs non-student accounts
- Breakdown by completion status
- Progress tracking for large datasets

## Output Files

The script creates two files:

1. **Filtered data**: `accounts_[filter_type]_[timestamp].json`

   - Contains only the accounts matching your filter criteria

2. **All student data**: `accounts_all_students_[timestamp].json`
   - Contains all student accounts regardless of completion status
   - Useful for reference and analysis

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

### Deserialization errors?

- The script now automatically filters out non-student accounts
- Only student accounts are processed, preventing deserialization errors

## Files

- `index.ts` - Main script to fetch and filter Solana student accounts
- `upload-to-sheets.ts` - Script to upload data to Google Sheets
- `IDL.json` - Anchor program interface definition
- `google.json` - Google service account credentials
- `.env` - Environment variables
- `./output/` - Directory where JSON files are saved

## Example Output

```
🔍 Filter type: completed
Available filters: all, initialized, ts_only, rust_only, completed
Found 150 accounts

🔄 Processing batch 1/2 (90 accounts)
⏭️  Skipping non-student account: F7B23Mq3BENBP82RpUSDJcBQi4tArz8gyNdZqWFKaNTm (wrong discriminator)
✅ Student Account: FaKHPzKKQpELqRUMPqjqpSpAKtjzLcjVjeCVhR4ZYgg1
Status: { initialized: '❌', ts_completed: '✅', rust_completed: '✅', github: 'alice' }

🔄 Processing batch 2/2 (60 accounts)
✅ Student Account: AnotherStudentAccount...
Status: { initialized: '❌', ts_completed: '✅', rust_completed: '✅', github: 'bob' }

📊 Summary:
 Total accounts fetched (size filtered): 150
 Student accounts found: 45
 Non-student accounts skipped: 105
 Filtered accounts (completed): 23

📈 Student Account Breakdown:
 Just initialized: 12
 TS only: 8
 Rust only: 2
 Completed both: 23
```

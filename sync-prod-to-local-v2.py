#!/usr/bin/env python3
"""
Sync production D1 database to local database - Version 2
Execute table by table to avoid size limits
"""

import subprocess
import json
import sys

DB_NAME = "review-spheres-v1-production"

# Tables in dependency order
TABLES = [
    "users",
    "advertiser_profiles",
    "influencer_profiles", 
    "campaigns",
    "applications",
    "reviews",
    "points",
    "notifications",
    "settlements",
    "withdrawal_requests",
    "password_reset_tokens",
    "system_settings",
]

def run_wrangler_command(command, remote=True):
    """Execute wrangler d1 command and return JSON output"""
    location = "--remote" if remote else "--local"
    cmd = f'npx wrangler d1 execute {DB_NAME} {location} --command="{command}" --json'
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        output = result.stdout
        
        start_idx = output.find('[')
        if start_idx == -1:
            return None
            
        json_str = output[start_idx:]
        data = json.loads(json_str)
        
        if data and len(data) > 0 and 'results' in data[0]:
            return data[0]['results']
        return []
    except Exception as e:
        print(f"Error: {e}")
        return None

def escape_sql_value(value):
    """Escape value for SQL INSERT"""
    if value is None:
        return "NULL"
    elif isinstance(value, (int, float)):
        return str(value)
    else:
        return "'" + str(value).replace("'", "''") + "'"

def sync_table(table):
    """Sync a single table from production to local"""
    print(f"\n📋 Syncing table: {table}")
    
    # Get data from production
    rows = run_wrangler_command(f"SELECT * FROM {table}", remote=True)
    
    if rows is None:
        print(f"  ⚠️  Failed to fetch data")
        return False
    
    row_count = len(rows)
    print(f"  📊 Found {row_count} rows")
    
    if row_count == 0:
        # Just delete local data
        result = run_wrangler_command(f"DELETE FROM {table}", remote=False)
        print(f"  ✅ Cleared local table")
        return True
    
    # Delete existing data
    run_wrangler_command(f"DELETE FROM {table}", remote=False)
    print(f"  🗑️  Cleared local table")
    
    # Insert row by row
    columns = list(rows[0].keys())
    success_count = 0
    
    for row in rows:
        values = [escape_sql_value(row.get(col)) for col in columns]
        sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join(values)})"
        
        result = run_wrangler_command(sql, remote=False)
        if result is not None:
            success_count += 1
    
    print(f"  ✅ Inserted {success_count}/{row_count} rows")
    return success_count == row_count

def main():
    print("=" * 60)
    print("Syncing Production DB to Local DB (Table by Table)")
    print("=" * 60)
    
    failed_tables = []
    
    for table in TABLES:
        success = sync_table(table)
        if not success:
            failed_tables.append(table)
    
    print(f"\n{'=' * 60}")
    if failed_tables:
        print(f"❌ Failed tables: {', '.join(failed_tables)}")
        return 1
    else:
        print("✅ All tables synced successfully!")
        return 0

if __name__ == "__main__":
    sys.exit(main())

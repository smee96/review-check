#!/usr/bin/env python3
"""
Sync production D1 database to local database
"""

import subprocess
import json
import sys

DB_NAME = "review-spheres-v1-production"

# Tables in dependency order (to respect foreign keys)
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
        # Parse JSON from output
        output = result.stdout
        
        # Find JSON array in output
        start_idx = output.find('[')
        if start_idx == -1:
            return None
            
        json_str = output[start_idx:]
        data = json.loads(json_str)
        
        if data and len(data) > 0 and 'results' in data[0]:
            return data[0]['results']
        return []
    except Exception as e:
        print(f"Error executing command: {e}")
        return None

def escape_sql_value(value):
    """Escape value for SQL INSERT"""
    if value is None:
        return "NULL"
    elif isinstance(value, (int, float)):
        return str(value)
    else:
        # Escape single quotes
        return "'" + str(value).replace("'", "''") + "'"

def generate_insert_sql(table, rows):
    """Generate INSERT statements for table"""
    if not rows:
        return []
    
    inserts = []
    columns = list(rows[0].keys())
    
    for row in rows:
        values = [escape_sql_value(row.get(col)) for col in columns]
        sql = f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({', '.join(values)});"
        inserts.append(sql)
    
    return inserts

def main():
    print("=" * 60)
    print("Syncing Production DB to Local DB")
    print("=" * 60)
    
    sql_file = "prod-to-local-sync.sql"
    
    with open(sql_file, 'w') as f:
        f.write(f"-- Production DB Sync Script\n")
        f.write(f"-- Generated automatically\n\n")
        
        # Disable foreign keys temporarily
        f.write("PRAGMA foreign_keys = OFF;\n\n")
        
        for table in TABLES:
            print(f"\nProcessing table: {table}")
            
            # Get data from production
            rows = run_wrangler_command(f"SELECT * FROM {table}", remote=True)
            
            if rows is None:
                print(f"  ⚠️  Failed to fetch data from {table}")
                continue
            
            row_count = len(rows)
            print(f"  📊 Found {row_count} rows")
            
            if row_count == 0:
                f.write(f"-- Table {table}: No data\n")
                f.write(f"DELETE FROM {table};\n\n")
                continue
            
            # Generate SQL
            f.write(f"-- Table {table}: {row_count} rows\n")
            f.write(f"DELETE FROM {table};\n")
            
            inserts = generate_insert_sql(table, rows)
            for insert in inserts:
                f.write(insert + "\n")
            
            f.write("\n")
            print(f"  ✅ Generated {len(inserts)} INSERT statements")
        
        # Re-enable foreign keys
        f.write("PRAGMA foreign_keys = ON;\n")
    
    print(f"\n{'=' * 60}")
    print(f"SQL dump created: {sql_file}")
    print(f"{'=' * 60}")
    
    # Apply to local database
    print("\nApplying to local database...")
    cmd = f"npx wrangler d1 execute {DB_NAME} --local --file={sql_file}"
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Successfully synced to local database!")
    else:
        print("❌ Failed to apply to local database")
        print(result.stderr)
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

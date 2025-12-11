#!/bin/bash
# 
# 자동 백업 스크립트
# 매일 실행하여 DB를 안전하게 백업
#

set -e

BACKUP_DIR="/home/user/webapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

echo "================================"
echo "DB 자동 백업 시작"
echo "================================"
echo "시간: $(date)"
echo "백업 파일: $BACKUP_FILE"
echo ""

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# D1 Export (로컬)
echo "[1/3] DB Export 중..."
cd /home/user/webapp
npx wrangler d1 export review-spheres-v1-production --remote --output="$BACKUP_FILE" 2>&1 || {
    echo "❌ 백업 실패"
    exit 1
}

# 파일 크기 확인
FILESIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")
echo "✓ 백업 완료: $(numfmt --to=iec-i --suffix=B $FILESIZE 2>/dev/null || echo $FILESIZE bytes)"

# 오래된 백업 삭제 (30일 이상)
echo "[2/3] 오래된 백업 정리..."
find "$BACKUP_DIR" -name "db_backup_*.sql" -mtime +30 -delete 2>/dev/null || true
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | wc -l)
echo "✓ 현재 백업 개수: $BACKUP_COUNT"

# Time Travel 북마크 저장
echo "[3/3] Time Travel 북마크 저장..."
npx wrangler d1 time-travel info review-spheres-v1-production > "$BACKUP_DIR/bookmark_$DATE.txt" 2>&1
echo "✓ 북마크 저장 완료"

echo ""
echo "================================"
echo "✅ 백업 완료!"
echo "================================"
echo "백업 파일: $BACKUP_FILE"
echo "복구 방법:"
echo "  npx wrangler d1 execute review-spheres-v1-production --remote --file=$BACKUP_FILE"

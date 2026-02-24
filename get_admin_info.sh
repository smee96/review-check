#!/bin/bash

# 관리자 로그인 (admin1@test.com / Admin123!)
TOKEN=$(curl -s -X POST https://reviews-sphere.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin1@test.com","password":"Admin123!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ 로그인 실패"
  exit 1
fi

echo "✅ 관리자 토큰 획득 성공"
echo ""

# 테스트 지원 데이터 생성
echo "📊 테스트 지원 데이터 생성 중..."
RESULT=$(curl -s -X POST https://reviews-sphere.com/api/admin/seed-applications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "$RESULT" | python3 -m json.tool 2>/dev/null || echo "$RESULT"

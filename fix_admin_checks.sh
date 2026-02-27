#!/bin/bash
# campaigns.ts에서 admin 체크를 admin || 본사로 변경

sed -i "s/user\.role !== 'admin'/user.role !== 'admin' \&\& user.role !== '본사'/g" src/routes/campaigns.ts
sed -i "s/user\.role === 'admin'/\(user.role === 'admin' || user.role === '본사'\)/g" src/routes/campaigns.ts

echo "Fixed admin checks in campaigns.ts"

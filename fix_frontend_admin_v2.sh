#!/bin/bash

# this.user.role === 'admin' 패턴 수정
sed -i "s/this\.user\.role === 'admin'/(this.user.role === 'admin' || this.user.role === '본사')/g" public/static/js/app.js

# app.user.role === 'admin' 패턴 수정
sed -i "s/app\.user\.role === 'admin'/(app.user.role === 'admin' || app.user.role === '본사')/g" public/static/js/app.js

# u.role === 'admin' 패턴 수정 (users.filter에서)
sed -i "s/u\.role === 'admin'/(u.role === 'admin' || u.role === '본사')/g" public/static/js/app.js

echo "Fixed admin checks in app.js (v2)"

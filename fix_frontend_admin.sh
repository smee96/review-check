#!/bin/bash
# app.js에서 admin 체크를 admin || 본사로 변경

# role === 'admin' -> (role === 'admin' || role === '본사')
sed -i "s/role === 'admin'/\(role === 'admin' || role === '본사'\)/g" public/static/js/app.js

# user.role === 'admin' -> (user.role === 'admin' || user.role === '본사')
sed -i "s/user\.role === 'admin'/\(user.role === 'admin' || user.role === '본사'\)/g" public/static/js/app.js

# this.user.role === 'admin' -> (this.user.role === 'admin' || this.user.role === '본사')
sed -i "s/this\.user\.role === 'admin'/\(this.user.role === 'admin' || this.user.role === '본사'\)/g" public/static/js/app.js

# app.user.role === 'admin' -> (app.user.role === 'admin' || app.user.role === '본사')
sed -i "s/app\.user\.role === 'admin'/\(app.user.role === 'admin' || app.user.role === '본사'\)/g" public/static/js/app.js

# u.role === 'admin' -> (u.role === 'admin' || u.role === '본사')
sed -i "s/u\.role === 'admin'/\(u.role === 'admin' || u.role === '본사'\)/g" public/static/js/app.js

echo "Fixed admin checks in app.js"

const Database = require('better-sqlite3');
const db = new Database('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/c0836a4b433e5225f63194b5c64a00b393c237ae4a66e3ebecd51beafcfe319e.sqlite');

// 캠페인 13, 14, 16, 17, 18에 테스트 인플루언서 지원 추가
const campaigns = [
  { id: 13, influencers: [17,18,19,20,21,22,23,24,25,26,27,28], approved: 5 },
  { id: 14, influencers: [17,18,19,20,21,22,23,24,25,26,29], approved: 4 },
  { id: 16, influencers: [17,18,19,20,21,22,23,24,25,26,27,28,30], approved: 6 },
  { id: 17, influencers: [17,18,19,20,21,22,23,24,25,26,29], approved: 4 },
  { id: 18, influencers: [17,18,19,20,21,22,23,24,25,26,27,28], approved: 5 }
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO applications (campaign_id, user_id, status, review_url, applied_at) 
  VALUES (?, (SELECT id FROM users WHERE email = ?), ?, NULL, datetime('now', ?))
`);

campaigns.forEach(campaign => {
  campaign.influencers.forEach((num, idx) => {
    const email = `influencer${num}@test.com`;
    const status = idx < campaign.approved ? 'approved' : 'pending';
    const daysAgo = `-${7 - idx} days`;
    
    try {
      insert.run(campaign.id, email, status, daysAgo);
      console.log(`✓ 캠페인 ${campaign.id}에 ${email} 지원 추가 (${status})`);
    } catch (err) {
      console.error(`✗ 실패: 캠페인 ${campaign.id}, ${email}:`, err.message);
    }
  });
});

// 결과 확인
const result = db.prepare(`
  SELECT c.id, c.title, COUNT(a.id) as applications
  FROM campaigns c
  LEFT JOIN applications a ON c.id = a.campaign_id
  WHERE c.id IN (13, 14, 16, 17, 18)
  GROUP BY c.id
`).all();

console.log('\n📊 캠페인별 지원자 수:');
result.forEach(r => {
  console.log(`  캠페인 ${r.id} (${r.title}): ${r.applications}명`);
});

db.close();

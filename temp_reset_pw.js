// Temporary password reset using production API
// Step 1: Create a new temp account with the desired password
// Step 2: Copy the hash from DB
// Step 3: Update target user with that hash

const targetEmail = 'smee96@naver.com';
const newPassword = 'jua090716!';

console.log('Target user:', targetEmail);
console.log('New password:', newPassword);
console.log('\nSteps:');
console.log('1. Create temp user with this password');
console.log('2. Get hash from temp user');
console.log('3. Update target user with the hash');
console.log('4. Delete temp user');

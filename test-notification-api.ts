

const BASE_URL = 'http://localhost:5000/api';
let studentToken = '';
let adminToken = '';
let notificationId = '';

async function runTests() {
  console.log('\n--- Starting Notification API Tests ---\n');

  try {
    // 1. Login as Admin
    console.log('1. Logging in as Admin...');
    const adminRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@eraasoft.com', password: 'password123' })
    });
    const adminData = await adminRes.json() as any;
    if (!adminData.success) throw new Error('Admin login failed');
    adminToken = adminData.token;
    console.log('✅ Admin login successful');

    // 2. Login as Student
    console.log('\n2. Logging in as Student...');
    const studentRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student1@example.com', password: 'password123' })
    });
    const studentData = await studentRes.json() as any;
    if (!studentData.success) {
      console.log('Student not found, registering...');
      const regRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: 'Test Student', email: 'student1@example.com', password: 'password123' })
      });
      const regData = await regRes.json() as any;
      if (!regData.success) throw new Error('Student registration failed');
      studentToken = regData.token;
    } else {
      studentToken = studentData.token;
    }
    console.log('✅ Student login successful');

    // 3. Admin Broadcasts a Notification
    console.log('\n3. Admin broadcasting a notification...');
    const broadcastRes = await fetch(`${BASE_URL}/admin/notifications/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'System Update',
        message: 'The platform will undergo maintenance tonight.',
        type: 'SYSTEM',
        priority: 'HIGH',
        action_url: '/updates'
      })
    });
    const broadcastData = await broadcastRes.json() as any;
    if (!broadcastData.success) throw new Error(broadcastData.message);
    console.log('✅ Notification broadcasted successfully');

    // 4. Student gets unread count
    console.log('\n4. Student checking unread count...');
    const countRes = await fetch(`${BASE_URL}/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const countData = await countRes.json() as any;
    if (!countData.success) throw new Error(countData.message);
    console.log(`✅ Unread count retrieved: ${countData.unread_count}`);

    // 5. Student gets paginated notifications
    console.log('\n5. Student fetching notifications list...');
    const listRes = await fetch(`${BASE_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const listData = await listRes.json() as any;
    if (!listData.success) throw new Error(listData.message);
    console.log(`✅ Notifications retrieved. Count: ${listData.data.length}`);
    if (listData.data.length > 0) {
      notificationId = listData.data[0].id;
    }

    // 6. Student marks notification as read
    if (notificationId) {
      console.log(`\n6. Marking notification ${notificationId} as read...`);
      const readRes = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      const readData = await readRes.json() as any;
      if (!readData.success) throw new Error(readData.message);
      console.log('✅ Notification marked as read');
    }

    // 7. Student marks all as read
    console.log('\n7. Marking all notifications as read...');
    const readAllRes = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    const readAllData = await readAllRes.json() as any;
    if (!readAllData.success) throw new Error(readAllData.message);
    console.log('✅ All notifications marked as read');

    // 8. Delete notification
    if (notificationId) {
      console.log(`\n8. Deleting notification ${notificationId}...`);
      const delRes = await fetch(`${BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });
      const delData = await delRes.json() as any;
      if (!delData.success) throw new Error(delData.message);
      console.log('✅ Notification deleted');
    }

    console.log('\n🎉 All Notification API Tests Passed Successfully!\n');

  } catch (error: any) {
    console.error(`\n❌ Test Failed: ${error.message}\n`);
  }
}

runTests();

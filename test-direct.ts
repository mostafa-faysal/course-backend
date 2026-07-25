import { PrismaClient, NotificationType, NotificationPriority } from '@prisma/client';
import { NotificationService } from './src/services/notification.service';
import { NotificationHelper } from './src/helpers/notification.helper';

const prisma = new PrismaClient();

async function runTests() {
  console.log('\n--- Starting Phase 17 Notifications System Verification ---\n');

  try {
    // 1. Setup User
    const user = await prisma.user.create({
      data: { full_name: 'Notify Tester', email: `notify_${Date.now()}@test.com`, password_hash: 'hash', role: 'STUDENT', status: 'ACTIVE' },
    });
    console.log('Setup complete.\n');

    // 2. Test Broadcast & Create Notification
    console.log('[Test 1] Create & Broadcast Notifications');
    await NotificationService.broadcastNotification(user.id, {
      title: 'Global System Update',
      message: 'System will go down for maintenance.',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.HIGH
    });

    await NotificationHelper.sendAccountCreated(user.id);
    
    // Create an expired notification
    await prisma.notification.create({
      data: {
        user_id: user.id,
        title: 'Expired Offer',
        message: 'This offer is no longer valid.',
        type: NotificationType.SYSTEM,
        expires_at: new Date(Date.now() - 100000) // in the past
      }
    });

    const unreadCount1 = await NotificationService.getUnreadCount(user.id);
    console.log('Unread Count should be 2 (1 broadcast, 1 account, expired excluded):', unreadCount1 === 2 ? '✅ PASS' : `❌ FAIL (got ${unreadCount1})`);

    // 3. Test Get Paginated excluding expired
    console.log('\n[Test 2] Get Paginated (exclude expired)');
    const listResult = await NotificationService.getUserNotifications(user.id, 1, 10);
    console.log('Listed items count:', listResult.data.length === 2 ? '✅ PASS' : `❌ FAIL (got ${listResult.data.length})`);

    // 4. Test Auto-read on Details
    console.log('\n[Test 3] Auto-read on Fetch Details');
    const firstNotif = listResult.data[0];
    const detailsResult = await NotificationService.getAndMarkAsRead(user.id, firstNotif.id);
    console.log('Details fetched:', detailsResult.success ? '✅ PASS' : '❌ FAIL');
    console.log('Unread count decreased:', detailsResult.unread_count === 1 ? '✅ PASS' : `❌ FAIL (got ${detailsResult.unread_count})`);

    // 5. Test accessing expired notification
    console.log('\n[Test 4] Cannot access expired notification');
    const expiredNotif = await prisma.notification.findFirst({ where: { title: 'Expired Offer', user_id: user.id } });
    try {
      await NotificationService.getAndMarkAsRead(user.id, expiredNotif!.id);
      console.log('Access Expired: ❌ FAIL (Did not throw)');
    } catch(err: any) {
      console.log('Access Expired:', err.message.includes('expired') ? '✅ PASS' : '❌ FAIL');
    }

    // 6. Test Mark All As Read
    console.log('\n[Test 5] Mark All As Read');
    const markAllResult = await NotificationService.markAllAsRead(user.id);
    console.log('Mark All As Read Status:', markAllResult.unread_count === 0 ? '✅ PASS' : '❌ FAIL');

    // 7. Test Delete
    console.log('\n[Test 6] Delete Notification');
    await NotificationService.deleteNotification(user.id, firstNotif.id);
    const listResultAfterDelete = await NotificationService.getUserNotifications(user.id, 1, 10);
    console.log('Listed items after delete:', listResultAfterDelete.data.length === 1 ? '✅ PASS' : `❌ FAIL (got ${listResultAfterDelete.data.length})`);

    console.log('\n--- Phase 17 Runtime Verification Complete ---\n');
  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();

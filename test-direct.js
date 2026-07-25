"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const admin_service_1 = require("./src/services/admin.service");
const auth_service_1 = require("./src/services/auth.service");
const prisma = new client_1.PrismaClient();
async function runTests() {
    console.log('\n--- Starting Phase 16.2 Service Verification ---\n');
    try {
        // 1. Setup Admins and Targets
        const adminUser = await prisma.user.create({
            data: { full_name: 'Admin Tester', email: `admin_${Date.now()}@test.com`, password_hash: 'hash', role: 'ADMIN', status: 'ACTIVE' },
        });
        const studentUser = await prisma.user.create({
            data: { full_name: 'Student Tester', email: `student_${Date.now()}@test.com`, password_hash: 'hash', role: 'STUDENT', status: 'ACTIVE' },
        });
        console.log('Setup complete.\n');
        // 2. Test Admin Reset Password
        console.log('[Test 1] Admin Reset Password');
        const resetResult = await admin_service_1.AdminService.resetUserPassword(adminUser.id, studentUser.id);
        console.log('Password Reset Status:', resetResult.temporary_password ? '✅ PASS' : '❌ FAIL');
        // Verify Audit Log
        const resetAudit = await prisma.userActionHistory.findFirst({ where: { user_id: studentUser.id, action: 'RESET_PASSWORD' } });
        console.log('Audit Log created?', resetAudit ? '✅ PASS' : '❌ FAIL');
        // 3. Test Admin Reset Rules
        console.log('\n[Test 2] Admin Reset Rules');
        try {
            await admin_service_1.AdminService.resetUserPassword(adminUser.id, adminUser.id);
            console.log('Reset Self Status: ❌ FAIL (Did not throw)');
        }
        catch (err) {
            console.log('Reset Self Status:', err.message.includes('Forbidden') ? '✅ PASS' : '❌ FAIL');
        }
        // 4. Test User Self Password Change
        console.log('\n[Test 3] User Self Password Change');
        const changeResult = await auth_service_1.AuthService.changePassword(studentUser.id, {
            current_password: resetResult.temporary_password,
            new_password: 'new_secure_password_123'
        });
        console.log('Password Change Status:', changeResult.message === 'Password updated successfully' ? '✅ PASS' : '❌ FAIL');
        // Verify Password Reuse Prevention
        console.log('\n[Test 4] Prevent Password Reuse');
        try {
            await auth_service_1.AuthService.changePassword(studentUser.id, {
                current_password: 'new_secure_password_123',
                new_password: 'new_secure_password_123'
            });
            console.log('Reuse Status: ❌ FAIL (Did not throw)');
        }
        catch (err) {
            console.log('Reuse Status:', err.message.includes('Forbidden') ? '✅ PASS' : '❌ FAIL');
        }
        console.log('\n--- Phase 16.2 Runtime Verification Complete ---\n');
    }
    catch (error) {
        console.error('Test Error:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
runTests();

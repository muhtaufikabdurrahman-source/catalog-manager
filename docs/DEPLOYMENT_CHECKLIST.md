# 🚀 PRODUCTION DEPLOYMENT CHECKLIST - v8 Release

**Checklist lengkap untuk memastikan production deployment berjalan smooth.**

---

## 📋 PRE-DEPLOYMENT PHASE (T-1 hari)

### Code Review & QA
- [ ] **Code Review Complete**
  - [ ] Semua 6 file sudah di-review
  - [ ] No code smell atau style issue
  - [ ] Performance impact: minimal/none
  - [ ] Security check: passed
  - Reviewer: _________________ Date: _______

- [ ] **QA Testing Passed**
  - [ ] All test scenarios completed (TESTING_CHECKLIST.md)
  - [ ] No critical bugs found
  - [ ] Edge cases tested
  - [ ] Performance baseline OK
  - QA Lead: _________________ Date: _______

### Dependencies & Build
- [ ] **Build Successful**
  ```bash
  npx vite build
  # ✅ No errors
  # ✅ dist/ folder created (~500KB+)
  ```

- [ ] **Dependency Check**
  ```bash
  npm list
  # ✅ No missing dependencies
  # ✅ No version conflicts
  ```

- [ ] **Syntax Validation**
  ```bash
  node --check src/main/**/*.js
  # ✅ All files syntax OK
  ```

### Database Backup Strategy
- [ ] **Backup Location Confirmed**
  - [ ] Local backup path: ____________________
  - [ ] Cloud backup path: ____________________
  - [ ] Backup frequency: ____________________
  - [ ] Retention policy: ____________________

- [ ] **Test Restore**
  - [ ] Can restore from local backup: YES / NO
  - [ ] Can restore from cloud backup: YES / NO
  - [ ] Restore time < 5 minutes: YES / NO

### Environment Preparation
- [ ] **Production Server Ready**
  - [ ] Server uptime stable
  - [ ] Disk space available: ______ GB
  - [ ] Memory available: ______ GB
  - [ ] Network connectivity: OK
  - [ ] SSH access verified

- [ ] **Monitoring Setup**
  - [ ] Error logging enabled
  - [ ] Performance monitoring active
  - [ ] Database monitoring active
  - [ ] Disk space alert configured
  - [ ] CPU/Memory alert configured

### Communication Plan
- [ ] **User Notification (if needed)**
  - [ ] Scheduled maintenance window: ________________
  - [ ] Maintenance duration: ______ minutes
  - [ ] User notification sent: Date ________
  - [ ] Support team briefed: YES / NO

- [ ] **Team Communication**
  - [ ] Dev team on standby: YES / NO
  - [ ] DevOps team on standby: YES / NO
  - [ ] Support team briefed: YES / NO
  - [ ] Emergency contact list prepared: YES / NO

---

## 🔄 DEPLOYMENT PHASE (T-0)

### Pre-Deployment Steps (30 min before)
- [ ] **Final Verification**
  ```bash
  # Run all checks one more time
  npx vite build
  node --check src/main/**/*.js
  npm list
  ```
  Result: ✅ All OK

- [ ] **Database Backup**
  ```bash
  # Create backup with timestamp
  cp database.db database.db.backup_$(date +%Y%m%d_%H%M%S)
  # Verify backup size is reasonable
  ls -lh database.db*
  ```
  Backup size: ______ MB
  Backup time: ______ seconds

- [ ] **Notify Stakeholders**
  - [ ] Email sent to team
  - [ ] Slack notification posted
  - [ ] Status page updated (if applicable)

### Deployment Execution
- [ ] **Stop Current Application**
  - [ ] Process killed: `kill -9 <PID>`
  - [ ] Verify shutdown complete: `lsof -i :3000`
  - [ ] Wait 5 seconds
  - Time stopped: ________________

- [ ] **Deploy New Code**
  ```bash
  # Copy new files to production
  cp -r dist/* /var/www/catalog-manager/
  # Or git pull + npm ci + npm run build
  
  # Verify files deployed
  ls -la /var/www/catalog-manager/index.html
  ```
  Deployment method: ☐ Copy ☐ Git ☐ Other: _______
  Files verified: ✅

- [ ] **Start Application**
  ```bash
  npm start
  # Or: npm run start:prod
  # Or: pm2 start app.js
  ```
  Start method: _______
  Start time: ________________

### Monitoring Deployment
- [ ] **Health Check (First 2 minutes)**
  - [ ] App started successfully
  - [ ] No crash/restart loop
  - [ ] Port listening correctly
  - [ ] Database migration completed
  - Time to stable: ______ seconds

- [ ] **Log Verification**
  ```bash
  # Check for errors
  tail -50 logs/app.log | grep -i error
  # Should be empty or only minor warnings
  ```
  Log status: ✅ Clean / ⚠️ Warnings / ❌ Errors

---

## ✅ POST-DEPLOYMENT PHASE (T+1 hour)

### Immediate Validation (5-10 min)
- [ ] **URL Accessibility**
  - [ ] App loads: http://localhost:3000 → OK
  - [ ] No blank page or error
  - [ ] Assets loaded (CSS, JS): YES / NO
  - [ ] Load time: ______ seconds

- [ ] **Core Features Test**
  - [ ] FAQ page accessible: YES / NO
  - [ ] Kaset Stores page accessible: YES / NO
  - [ ] Can add new store: YES / NO
  - [ ] Can edit store (hari+jam): YES / NO
  - [ ] Edit button hover works: YES / NO

- [ ] **Database Verification**
  ```bash
  sqlite3 database.db
  > SELECT COUNT(*) FROM kaset_stores;
  > .schema kaset_stores
  > PRAGMA integrity_check;
  ```
  - [ ] Data count matches pre-deployment: ______ stores
  - [ ] New columns exist: operating_days, url_label
  - [ ] Integrity check: OK
  - Time to verify: ______ seconds

- [ ] **Browser DevTools Check**
  - [ ] Console: No red errors ✅
  - [ ] Console: Warnings only (if any): ✅
  - [ ] Network: All requests 200 OK ✅
  - [ ] Performance: Page load < 3s ✅

### Extended Validation (Next 30 min)
- [ ] **User Workflows**
  - [ ] Add new category FAQ: OK / ISSUE
  - [ ] Edit category description: OK / ISSUE
  - [ ] Upload category icon: OK / ISSUE
  - [ ] Add toko with hari + jam: OK / ISSUE
  - [ ] Edit toko with link label dropdown: OK / ISSUE
  - [ ] View toko list (hari format OK): OK / ISSUE

- [ ] **Data Integrity**
  - [ ] Old data visible: YES / NO
  - [ ] Old stores accessible: YES / NO
  - [ ] Old FAQ categories intact: YES / NO
  - [ ] Can still edit old data: YES / NO

- [ ] **Performance Baseline**
  - [ ] Page load time (FAQ): ______ ms
  - [ ] Page load time (Stores): ______ ms
  - [ ] Database query time: ______ ms
  - [ ] API response time: ______ ms

### Monitoring (Continuous)
- [ ] **Error Monitoring**
  - [ ] Check error logs every 5 min (first 30 min)
  - [ ] No spikes in error rate
  - [ ] No database errors
  - [ ] No network errors
  - Monitoring status: ________________

- [ ] **Performance Monitoring**
  - [ ] CPU usage stable: ______ %
  - [ ] Memory usage stable: ______ MB
  - [ ] Disk space available: ______ GB
  - [ ] No process restarts: YES / NO

- [ ] **User Reports**
  - [ ] Check support channel
  - [ ] Any user-reported issues: YES / NO
  - [ ] Issues documented: ________________

---

## 🆘 ROLLBACK TRIGGERS

**Jika salah satu ini terjadi, IMMEDIATE ROLLBACK:**

### Critical Issues (Rollback Immediately)
- [ ] App crash dan restart loop
- [ ] Database corrupted (integrity check failed)
- [ ] Data loss detected
- [ ] Security vulnerability discovered
- [ ] > 50% of features not working

### Major Issues (Rollback if unresolved in 15 min)
- [ ] Critical feature completely broken
- [ ] > 20% degradation in performance
- [ ] Can't login/authenticate
- [ ] Data persistence failure

### Minor Issues (Monitor, don't rollback)
- [ ] UI styling issue
- [ ] 1-2 features have minor bugs
- [ ] Performance slightly slower
- [ ] Cosmetic issues

---

## 🔙 ROLLBACK PROCEDURE (if needed)

### Immediate Rollback (< 5 minutes)

**Step 1: Stop new app**
```bash
pkill -f "npm start"
# or
pm2 stop app
# or
systemctl stop catalog-manager
```
Time: ______ seconds

**Step 2: Restore database**
```bash
# Use backup from deployment day
cp database.db.backup_20260630_143022 database.db
```
Time: ______ seconds

**Step 3: Rollback code**
```bash
# Option A: Git rollback
git revert HEAD

# Option B: Restore from backup folder
cp -r /backups/v7/dist/* /var/www/catalog-manager/

# Option C: Re-deploy v7 manually
```
Method: ________________
Time: ______ seconds

**Step 4: Restart app**
```bash
npm start
# or
pm2 start app
```
Time: ______ seconds

**Step 5: Verify rollback**
```bash
# Check app running
curl http://localhost:3000

# Check database
sqlite3 database.db "SELECT COUNT(*) FROM kaset_stores;"

# Check no errors
tail -20 logs/app.log
```
Status: ✅ Rolled back successfully

### Post-Rollback
- [ ] Notify stakeholders: Time ________
- [ ] Document what went wrong: ________________
- [ ] Schedule post-mortem: ________________
- [ ] Take corrective action: ________________

---

## 📊 DEPLOYMENT METRICS

Record these during/after deployment:

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| **Startup Time** | ______ s | ______ s | ☐ OK |
| **Page Load (FAQ)** | ______ ms | ______ ms | ☐ OK |
| **Page Load (Stores)** | ______ ms | ______ ms | ☐ OK |
| **CPU Usage** | ______ % | ______ % | ☐ OK |
| **Memory Usage** | ______ MB | ______ MB | ☐ OK |
| **Error Count** | ______ | ______ | ☐ OK |
| **User Active** | ______ | ______ | ☐ OK |

---

## 📝 DEPLOYMENT LOG

**Official Deployment Record**

| Field | Value |
|-------|-------|
| **Deployment Date** | ________________ |
| **Deployment Time** | ________________ |
| **Version Deployed** | v8.0 |
| **Deployed By** | ________________ |
| **Reviewed By** | ________________ |
| **QA Sign-off** | ________________ |

### Timeline
| Event | Time | Status |
|-------|------|--------|
| Backup started | ______ | ☐ Complete |
| App stopped | ______ | ☐ Complete |
| Code deployed | ______ | ☐ Complete |
| App started | ______ | ☐ Complete |
| Health check | ______ | ☐ PASS |
| Feature test | ______ | ☐ PASS |
| DB verified | ______ | ☐ PASS |
| Monitoring started | ______ | ☐ Complete |
| Deployment complete | ______ | ☐ SUCCESS |

### Issues Encountered
```
1. _______________________________________________
   Resolution: _______________________________
   
2. _______________________________________________
   Resolution: _______________________________
```

### Sign-Off

**Deployment Manager**: _________________ Date: _______

**Tech Lead**: _________________ Date: _______

**Approver**: _________________ Date: _______

---

## 📞 ESCALATION CONTACTS

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Deployment Lead | _________________ | _______ | _______ |
| Tech Lead | _________________ | _______ | _______ |
| Database Admin | _________________ | _______ | _______ |
| System Admin | _________________ | _______ | _______ |
| CTO/Manager | _________________ | _______ | _______ |

---

## ✨ POST-DEPLOYMENT FOLLOW-UP

### 24-Hour Monitoring
- [ ] No errors in past 24 hours
- [ ] User feedback positive
- [ ] Performance stable
- [ ] All features working

### 7-Day Check
- [ ] No critical issues reported
- [ ] Database integrity confirmed
- [ ] User adoption rate: ______ %
- [ ] Ready to mark as "stable"

### Lessons Learned (within 48 hours)
- [ ] What went well: ________________
- [ ] What could improve: ________________
- [ ] Action items for next deployment: ________________

---

## 🎉 DEPLOYMENT COMPLETE!

**Status: ✅ LIVE IN PRODUCTION**

If all checkboxes above are checked and deployment is stable, v8 is ready for production use!

Keep this checklist for records and reference.

---

**Happy deployment! 🚀**

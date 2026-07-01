# ⚡ PERFORMANCE & OPTIMIZATION GUIDE - v8

**Dokumentasi untuk memastikan v8 berjalan efficient dan tidak membuat app lebih lambat.**

---

## 📊 PERFORMANCE EXPECTATIONS

### Expected Performance Impact

| Aspek | Ekspektasi | Status |
|-------|-----------|--------|
| **App Startup** | + 0-2% slower | ✅ Minimal |
| **Page Load (FAQ)** | + 0-1% slower | ✅ Minimal |
| **Page Load (Stores)** | + 1-3% slower | ✅ Acceptable |
| **Database Query** | + 0-5% slower | ✅ Acceptable |
| **Memory Usage** | + 5-10 MB | ✅ Acceptable |
| **Bundle Size** | + 2-5 KB | ✅ Minimal |

### Reason for Changes
1. **Additional DB columns** (2 kolom) → minimal impact
2. **New component LinkLabelSelect** → inline, lightweight
3. **Additional JSON parsing** → negligible CPU cost
4. **More CSS rules** → minimal overhead

---

## 🔍 PERFORMANCE BASELINE

### Pre-v8 Baseline (Catat sebelum deploy)

```bash
# FAQ Page Performance
# Navigate to FAQ → check DevTools Network tab
Page Load Time: ______________ ms
JS Parsing: ______________ ms
CSS Parse: ______________ ms
DOM Content Loaded: ______________ ms
Full Load: ______________ ms

# Kaset Stores Performance
# Navigate to Stores → check DevTools Network tab
Page Load Time: ______________ ms
List Rendering: ______________ ms
Form Open: ______________ ms
Database Query: ______________ ms

# Server Metrics
# Monitor resource usage
CPU Usage: ______________ %
Memory Usage: ______________ MB
Disk I/O: ______________ %
```

### Post-v8 Baseline (Check setelah deploy)

Gunakan command yang sama dengan "Pre-v8" dan bandingkan hasil.

---

## 🚀 OPTIMIZATION CHECKLIST

### React Component Optimization
- [ ] **LinkLabelSelect Component**
  - [ ] No unnecessary re-renders
  - [ ] State updates efficient
  - [ ] Memoization applied (if needed)
  - [ ] No memory leaks

  **Quick check:**
  ```javascript
  // Check if memoization needed
  const LinkLabelSelect = React.memo(({value, isCustom, ...}) => {
    // Component code
  });
  ```

- [ ] **formatOperatingDays Helper**
  - [ ] Pure function (no side effects)
  - [ ] Efficient array operations
  - [ ] No unnecessary re-computation
  - [ ] Results cached if needed

  **Quick check:**
  ```javascript
  // Should be pure function
  function formatOperatingDays(days) {
    if (!days || days.length === 0) return '';
    // Simple array map & join - OK
  }
  ```

### CSS Performance
- [ ] **No animation performance issues**
  - [ ] Edit button hover uses CSS transition (not JS)
  - [ ] Transition time reasonable (150-300ms)
  - [ ] No janky animations
  - [ ] GPU acceleration: enabled

  **CSS Check:**
  ```css
  .faq-landing-edit-btn {
    transition: opacity var(--transition-fast);
    /* ✅ Using CSS variable for transition time */
  }
  ```

- [ ] **Grid Layout Efficient**
  - [ ] Using CSS Grid (native)
  - [ ] Not using heavy JS layout
  - [ ] Responsive without forcing reflow
  - [ ] Media queries efficient

### Database Query Performance
- [ ] **No N+1 Queries**
  - [ ] Loading toko list: 1 query (not 1+N)
  - [ ] No nested queries
  - [ ] Proper indexing on new columns

  **SQL Check:**
  ```sql
  -- Should use single SELECT
  SELECT * FROM kaset_stores;
  
  -- NOT multiple queries per row
  -- SELECT * FROM kaset_stores WHERE id = ?;  (looped)
  ```

- [ ] **JSON Parsing Optimized**
  - [ ] parseJsonArray() handles errors
  - [ ] No repeated parsing of same data
  - [ ] caching if large datasets

  **Code Check:**
  ```javascript
  function parseJsonArray(raw) {
    if (!raw) return []; // ✅ Early return
    try {
      const parsed = JSON.parse(raw); // Single parse
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return []; // ✅ Error handling
    }
  }
  ```

---

## 🧪 PERFORMANCE TESTING

### Manual Performance Testing

#### Test 1: FAQ Page Load
```bash
# 1. Open DevTools (F12)
# 2. Go to Performance tab
# 3. Click Record
# 4. Refresh page (Cmd+R or Ctrl+R)
# 5. Wait for page to load completely
# 6. Stop recording
# 7. Check metrics:

Expected:
- First Contentful Paint (FCP): < 1s
- Largest Contentful Paint (LCP): < 2s
- Cumulative Layout Shift (CLS): < 0.1
- Total Load Time: < 3s
```

#### Test 2: Kaset Stores List Performance
```bash
# 1. DevTools → Performance tab
# 2. Navigate to Stores page
# 3. Let list fully load (hover cards, etc)
# 4. Check:

Expected:
- List render time: < 500ms
- Smooth scroll: 60 FPS
- Hover effect: smooth (no jank)
- Form open: < 200ms
```

#### Test 3: Form Input Responsiveness
```bash
# 1. Open Add Store form
# 2. Type in fields (check for lag)
# 3. Click checkboxes (check for lag)
# 4. Open dropdown (check for lag)

Expected:
- Input feels instant (< 100ms response)
- Checkbox toggle: instant
- Dropdown open: < 100ms
- No visible lag or stutter
```

### Automated Performance Testing

#### Lighthouse Report
```bash
# Using Lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view

# Check scores:
# - Performance: > 80
# - Accessibility: > 90
# - Best Practices: > 80
```

#### Bundle Size Analysis
```bash
# Check bundle size impact
npm run build

# Analyze dist/ folder
du -sh dist/

# Expected size increase: < 20KB
```

---

## 📈 MONITORING METRICS

### Server-Side Metrics to Monitor

```javascript
// Add to backend logging
const startTime = Date.now();

// Operation being measured
const result = await kasetStoresRepository.getStoreById(id);

const duration = Date.now() - startTime;
console.log(`Query took: ${duration}ms`);
// Log warning if > 500ms
if (duration > 500) {
  console.warn(`Slow query detected: ${duration}ms`);
}
```

### Client-Side Metrics to Monitor

```javascript
// JavaScript execution time
const startTime = performance.now();

// Operation
formatOperatingDays(days);

const endTime = performance.now();
console.log(`Operation took: ${endTime - startTime}ms`);
```

### Key Metrics Dashboard

Track these metrics daily for first week:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **FAQ Page Load** | < 2s | ______ | ☐ |
| **Stores Page Load** | < 3s | ______ | ☐ |
| **List Render Time** | < 500ms | ______ | ☐ |
| **Form Open Time** | < 200ms | ______ | ☐ |
| **Dropdown Response** | < 100ms | ______ | ☐ |
| **DB Query Time** | < 100ms | ______ | ☐ |
| **Memory Usage** | < 150MB | ______ | ☐ |
| **CPU Usage** | < 30% | ______ | ☐ |
| **Error Rate** | < 0.1% | ______ | ☐ |

---

## 🐛 PERFORMANCE ISSUES & FIXES

### Issue #1: Slow Dropdown Performance

**Symptom**: Dropdown lambat saat di-click  
**Cause**: Re-rendering terlalu banyak  
**Fix**:
```javascript
// Before
function LinkLabelSelect({ value, isCustom, ...props }) {
  return (
    <select onChange={...}>
      {STORE_LINK_LABELS.map((label) => ...)} // Re-maps every render
    </select>
  );
}

// After - Memoize
const LinkLabelSelect = React.memo(({ value, isCustom, ...props }) => {
  return (
    <select onChange={...}>
      {STORE_LINK_LABELS.map((label) => ...)}
    </select>
  );
});
```

### Issue #2: Slow formatOperatingDays

**Symptom**: List rendering lambat dengan banyak stores  
**Cause**: Parsing days setiap render  
**Fix**:
```javascript
// Before
function StoreListItem({ store }) {
  return (
    <span>{formatOperatingDays(store.operatingDays)}</span>
    // Called every render for every store
  );
}

// After - Memoize result
const StoreListItem = React.memo(({ store }) => {
  const days = useMemo(() => formatOperatingDays(store.operatingDays), [store.operatingDays]);
  return <span>{days}</span>;
});
```

### Issue #3: JSON Parsing Overhead

**Symptom**: Database query lambat  
**Cause**: Re-parsing JSON data setiap query  
**Fix**:
```javascript
// Before
function rowToStore(row) {
  return {
    operatingDays: parseJsonArray(row.operating_days), // Parse every time
  };
}

// After - Cache if possible
const cache = new Map();
function parseJsonArrayCached(raw, cacheKey) {
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const result = parseJsonArray(raw);
  cache.set(cacheKey, result);
  return result;
}
```

---

## 🎯 OPTIMIZATION STRATEGY

### Priority 1: Critical (Do Now)
- [ ] Verify no N+1 database queries
- [ ] Memoize LinkLabelSelect if renders > 100x per session
- [ ] Ensure CSS animations use GPU acceleration

### Priority 2: Important (Do This Week)
- [ ] Setup performance monitoring
- [ ] Baseline all metrics
- [ ] Create performance dashboard
- [ ] Document performance requirements

### Priority 3: Nice to Have (Do This Month)
- [ ] Implement caching layer for parsed JSON
- [ ] Optimize bundle size further
- [ ] Add PWA offline support
- [ ] Implement virtual scrolling for large lists

---

## 📋 PERFORMANCE SIGN-OFF CHECKLIST

Before deploying to production:

- [ ] **Baseline Performance Tested**
  - [ ] All metrics within expected range
  - [ ] No significant degradation
  - [ ] Load times acceptable

- [ ] **No Performance Regressions**
  - [ ] FAQ page not slower
  - [ ] Stores list not slower
  - [ ] Form not slower
  - [ ] Database queries efficient

- [ ] **Monitoring Ready**
  - [ ] Metrics being tracked
  - [ ] Alerts configured
  - [ ] Dashboard set up

- [ ] **Code Optimized**
  - [ ] No unnecessary re-renders
  - [ ] Efficient algorithms used
  - [ ] No memory leaks
  - [ ] Bundle size acceptable

---

## 🚀 PRODUCTION MONITORING

### First Week Monitoring
```
Daily:
- Check metrics dashboard
- Review error logs
- Monitor user reports
- Check for slow queries

Weekly:
- Generate performance report
- Compare with baseline
- Identify trends
- Plan optimizations
```

### Success Criteria
- ✅ No performance degradation > 5%
- ✅ No user complaints about slowness
- ✅ All metrics within target range
- ✅ Error rate remains low
- ✅ Memory usage stable

---

## 📊 PERFORMANCE REPORT TEMPLATE

```markdown
# v8 Performance Report

## Metrics
- FAQ Page Load: ______ ms (target: < 2s)
- Stores Page Load: ______ ms (target: < 3s)
- Database Query: ______ ms (target: < 100ms)
- Memory Usage: ______ MB (target: < 150MB)
- CPU Usage: ______ % (target: < 30%)

## Comparison vs v7
- Faster: ________
- Slower: ________
- Same: ________

## Issues Found
1. ________________
   Fix: ________________

2. ________________
   Fix: ________________

## Recommendations
- ________________
- ________________

## Approved By: ________________ Date: ________
```

---

## 🎓 PERFORMANCE BEST PRACTICES

For future development:

1. **Always measure before optimizing**
   - Use DevTools Performance tab
   - Don't guess, measure!

2. **Profile before deploying**
   - Run Lighthouse
   - Check bundle size
   - Monitor memory

3. **Monitor in production**
   - Track real user metrics
   - Set up alerts
   - Review daily

4. **Document performance requirements**
   - Page load time targets
   - Database query targets
   - Memory/CPU limits

5. **Automate performance testing**
   - CI/CD pipeline checks
   - Performance regression detection
   - Automated alerts

---

**Performance is a feature. Keep v8 running smoothly! ⚡**

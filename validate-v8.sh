#!/bin/bash

# Validation Script untuk Rencana Perubahan v8
# Usage: bash validate-v8.sh /path/to/project

PROJECT_DIR="${1:-.}"
PASS=0
FAIL=0

echo "🔍 Validating v8 Implementation..."
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅${NC} File exists: $1"
    ((PASS++))
    return 0
  else
    echo -e "${RED}❌${NC} File missing: $1"
    ((FAIL++))
    return 1
  fi
}

check_content() {
  local file="$1"
  local search="$2"
  local desc="$3"
  
  if grep -q "$search" "$file" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} $desc"
    ((PASS++))
  else
    echo -e "${RED}❌${NC} $desc (not found in $file)"
    ((FAIL++))
  fi
}

# ============ FILE EXISTENCE CHECKS ============
echo "1️⃣  FILE EXISTENCE"
echo "----"
check_file "$PROJECT_DIR/src/shared/constants.json"
check_file "$PROJECT_DIR/src/main/db/schema.js"
check_file "$PROJECT_DIR/src/main/db/kasetStoresRepository.js"
check_file "$PROJECT_DIR/src/renderer/pages/FaqPage.jsx"
check_file "$PROJECT_DIR/src/renderer/pages/KasetStoresPage.jsx"
check_file "$PROJECT_DIR/src/renderer/styles/global.css"
echo ""

# ============ CONSTANTS.JSON CHECKS ============
echo "2️⃣  CONSTANTS.JSON"
echo "----"
if [ -f "$PROJECT_DIR/src/shared/constants.json" ]; then
  check_content "$PROJECT_DIR/src/shared/constants.json" "DAYS_OF_WEEK" "DAYS_OF_WEEK constant exists"
  check_content "$PROJECT_DIR/src/shared/constants.json" "STORE_LINK_LABELS" "STORE_LINK_LABELS constant exists"
  check_content "$PROJECT_DIR/src/shared/constants.json" "\"sen\"" "DAYS_OF_WEEK has 'sen' (Senin)"
  check_content "$PROJECT_DIR/src/shared/constants.json" "Shopee" "STORE_LINK_LABELS has Shopee"
fi
echo ""

# ============ SCHEMA.JS CHECKS ============
echo "3️⃣  SCHEMA.JS"
echo "----"
if [ -f "$PROJECT_DIR/src/main/db/schema.js" ]; then
  check_content "$PROJECT_DIR/src/main/db/schema.js" "operating_days TEXT" "Migrasi v8 adds operating_days"
  check_content "$PROJECT_DIR/src/main/db/schema.js" "url_label TEXT" "Migrasi v8 adds url_label"
  check_content "$PROJECT_DIR/src/main/db/schema.js" "SCHEMA_VERSION: MIGRATIONS.length.*v8" "SCHEMA_VERSION comment updated to v8"
fi
echo ""

# ============ REPOSITORY CHECKS ============
echo "4️⃣  KASET STORES REPOSITORY"
echo "----"
if [ -f "$PROJECT_DIR/src/main/db/kasetStoresRepository.js" ]; then
  check_content "$PROJECT_DIR/src/main/db/kasetStoresRepository.js" "parseJsonArray" "parseJsonArray helper function exists"
  check_content "$PROJECT_DIR/src/main/db/kasetStoresRepository.js" "operatingDays:" "rowToStore includes operatingDays"
  check_content "$PROJECT_DIR/src/main/db/kasetStoresRepository.js" "urlLabel:" "rowToStore includes urlLabel"
  check_content "$PROJECT_DIR/src/main/db/kasetStoresRepository.js" "operating_days.*operating_days" "createStore handles operating_days"
  check_content "$PROJECT_DIR/src/main/db/kasetStoresRepository.js" "url_label" "createStore/updateStore handle url_label"
fi
echo ""

# ============ FAQ PAGE CHECKS ============
echo "5️⃣  FAQ PAGE"
echo "----"
if [ -f "$PROJECT_DIR/src/renderer/pages/FaqPage.jsx" ]; then
  check_content "$PROJECT_DIR/src/renderer/pages/FaqPage.jsx" "faq-landing-edit-btn" "Edit button class exists"
  check_content "$PROJECT_DIR/src/renderer/pages/FaqPage.jsx" "faq-landing-wrap" "Landing wrap div exists"
  check_content "$PROJECT_DIR/src/renderer/pages/FaqPage.jsx" "catch (err)" "Try/catch for icon upload exists"
  check_content "$PROJECT_DIR/src/renderer/pages/FaqPage.jsx" "alert('Gagal mengunggah" "Error alert for icon upload"
fi
echo ""

# ============ KASET STORES PAGE CHECKS ============
echo "6️⃣  KASET STORES PAGE"
echo "----"
if [ -f "$PROJECT_DIR/src/renderer/pages/KasetStoresPage.jsx" ]; then
  check_content "$PROJECT_DIR/src/renderer/pages/KasetStoresPage.jsx" "LinkLabelSelect" "LinkLabelSelect component exists"
  check_content "$PROJECT_DIR/src/renderer/pages/KasetStoresPage.jsx" "formatOperatingDays" "formatOperatingDays helper exists"
  check_content "$PROJECT_DIR/src/renderer/pages/KasetStoresPage.jsx" "operatingDays" "operatingDays state exists"
  check_content "$PROJECT_DIR/src/renderer/pages/KasetStoresPage.jsx" "DAYS_OF_WEEK" "DAYS_OF_WEEK imported"
  check_content "$PROJECT_DIR/src/renderer/pages/KasetStoresPage.jsx" "STORE_LINK_LABELS" "STORE_LINK_LABELS imported"
  check_content "$PROJECT_DIR/src/renderer/pages/KasetStoresPage.jsx" "urlLabel" "urlLabel state exists"
fi
echo ""

# ============ CSS CHECKS ============
echo "7️⃣  GLOBAL CSS"
echo "----"
if [ -f "$PROJECT_DIR/src/renderer/styles/global.css" ]; then
  check_content "$PROJECT_DIR/src/renderer/styles/global.css" ".faq-landing-wrap" "CSS class .faq-landing-wrap exists"
  check_content "$PROJECT_DIR/src/renderer/styles/global.css" ".faq-landing-edit-btn" "CSS class .faq-landing-edit-btn exists"
  check_content "$PROJECT_DIR/src/renderer/styles/global.css" "min-height: 320px" "Card min-height updated to 320px"
  check_content "$PROJECT_DIR/src/renderer/styles/global.css" "max-width: 1400px" "Grid max-width updated to 1400px"
  check_content "$PROJECT_DIR/src/renderer/styles/global.css" "opacity: 0" "Edit button hidden by default (opacity 0)"
fi
echo ""

# ============ SYNTAX CHECKS ============
echo "8️⃣  SYNTAX VALIDATION"
echo "----"

if command -v node &> /dev/null; then
  echo "Running Node.js syntax checks..."
  
  for file in \
    "src/main/db/schema.js" \
    "src/main/db/kasetStoresRepository.js" \
    "src/renderer/pages/FaqPage.jsx" \
    "src/renderer/pages/KasetStoresPage.jsx"
  do
    if [ -f "$PROJECT_DIR/$file" ]; then
      if node --check "$PROJECT_DIR/$file" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} Syntax OK: $file"
        ((PASS++))
      else
        echo -e "${RED}❌${NC} Syntax ERROR: $file"
        ((FAIL++))
      fi
    fi
  done
else
  echo -e "${YELLOW}⚠️${NC} Node.js not found - skipping syntax checks"
fi
echo ""

# ============ FINAL SUMMARY ============
echo "======================================"
echo "SUMMARY"
echo "======================================"
TOTAL=$((PASS + FAIL))
echo -e "${GREEN}✅ Passed: $PASS${NC}"
echo -e "${RED}❌ Failed: $FAIL${NC}"
echo "Total checks: $TOTAL"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL CHECKS PASSED! Ready for integration.${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some checks failed. Please review the errors above.${NC}"
  exit 1
fi

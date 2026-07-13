const fs = require('fs');
const https = require('https');

// ============================================
// GitHub Personal Access Token 설정
// ============================================
// 방법 1: 환경 변수 사용 (권장)
//    Windows PowerShell: $env:GITHUB_TOKEN="your_token_here"
//    Windows CMD: set GITHUB_TOKEN=your_token_here
//    Linux/Mac: export GITHUB_TOKEN="your_token_here"
//
// 방법 2: 아래에 직접 토큰 입력 (보안에 주의 - .gitignore에 추가 필요)
//    const GITHUB_TOKEN = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
//
// 방법 3: .env 파일 사용 (권장)
//    .env 파일에 GITHUB_TOKEN=your_token_here 추가
// ============================================

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; // 여기에 직접 토큰을 넣거나 환경 변수 사용
const REPO_OWNER = 'naon9713';
const REPO_NAME = 'coupang--clone';

if (!GITHUB_TOKEN) {
  console.error('==========================================');
  console.error('GITHUB_TOKEN이 필요합니다.');
  console.error('==========================================');
  console.error('');
  console.error('토큰 설정 방법:');
  console.error('1. 환경 변수: $env:GITHUB_TOKEN="your_token_here"');
  console.error('2. 직접 입력: 이 파일의 GITHUB_TOKEN 변수에 토큰 입력');
  console.error('3. .env 파일: .env 파일에 GITHUB_TOKEN=your_token_here 추가');
  console.error('');
  console.error('GitHub Personal Access Token 생성:');
  console.error('1. GitHub → Settings → Developer settings → Personal access tokens');
  console.error('2. "Generate new token (classic)" 클릭');
  console.error('3. repo 권한 체크 후 생성');
  console.error('==========================================');
  process.exit(1);
}

// todo.md 파일 읽기
let todoContent;
try {
  todoContent = fs.readFileSync('./todo.md', 'utf-8');
  console.log('todo.md 파일 읽기 성공');
  console.log(`파일 크기: ${todoContent.length} bytes`);
} catch (error) {
  console.error('todo.md 파일 읽기 실패:', error.message);
  process.exit(1);
}

// 완료되지 않은 항목 추출
const incompleteItems = [];
const lines = todoContent.split('\n');
let currentPhase = '';
let currentSection = '';

console.log('todo.md 파싱 중...');
console.log(`총 라인 수: ${lines.length}`);

// 첫 10라인 출력 (디버깅)
console.log('--- 첫 10라인 ---');
lines.slice(0, 10).forEach((line, i) => {
  console.log(`${i + 1}: "${line}"`);
});
console.log('---');

lines.forEach((line, index) => {
  // 라인 끝의 \r 제거 (Windows 호환성)
  const cleanLine = line.replace(/\r$/, '');

  // Phase 헤더 추출
  const phaseMatch = cleanLine.match(/^## Phase (\d+): (.+)$/);
  if (phaseMatch) {
    currentPhase = phaseMatch[2];
    currentSection = '';
    console.log(`Phase 발견: ${currentPhase}`);
    return;
  }

  // Section 헤더 추출
  const sectionMatch = cleanLine.match(/^### (\d+\.\d+) (.+)$/);
  if (sectionMatch) {
    currentSection = sectionMatch[2];
    console.log(`  Section 발견: ${currentSection}`);
    return;
  }

  // 완료되지 않은 항목 추출 (- [ ])
  const itemMatch = cleanLine.match(/^- \[ \] (.+)$/);
  if (itemMatch) {
    const itemText = itemMatch[1];
    incompleteItems.push({
      phase: currentPhase,
      section: currentSection,
      title: itemText,
      lineNumber: index + 1
    });
    console.log(`    항목 발견: ${itemText}`);
  }
});

console.log(`총 ${incompleteItems.length}개의 완료되지 않은 항목을 찾았습니다.`);

// GitHub API로 이슈 생성
async function createIssue(issueData) {
  const data = JSON.stringify({
    title: `[${issueData.phase}] ${issueData.title}`,
    body: `## Phase: ${issueData.phase}\n### Section: ${issueData.section}\n\n${issueData.title}\n\n---\n\n*todo.md 라인 ${issueData.lineNumber}에서 자동 생성됨*`,
    labels: ['todo', issueData.phase.toLowerCase().replace(/\s+/g, '-')]
  });

  const options = {
    hostname: 'api.github.com',
    path: `/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
    method: 'POST',
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Node.js'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// 이슈들 생성 (rate limit 고려하여 천천히)
async function createAllIssues() {
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < incompleteItems.length; i++) {
    const item = incompleteItems[i];
    try {
      console.log(`[${i + 1}/${incompleteItems.length}] 이슈 생성: ${item.title}`);
      const result = await createIssue(item);
      console.log(`  ✓ 성공: ${result.html_url}`);
      successCount++;

      // Rate limit 방지를 위해 1초 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  ✗ 실패: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n=== 결과 ===`);
  console.log(`성공: ${successCount}`);
  console.log(`실패: ${failCount}`);
}

createAllIssues().catch(console.error);

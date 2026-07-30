# 质量门禁检查脚本
# 在 git commit 前被 PreToolUse hook 调用
# 检查 .claude/check-results/ 下的标记文件是否通过
# 退出码 0 = 通过，非 0 = 不通过

# 通过 stdin JSON 判断是否为 git commit 命令（非 git commit 直接放行）
$rawInput = $input | Out-String
if ($rawInput -notmatch '"command"\s*:\s*"[^"]*git\s+commit\b') {
    exit 0
}

$testFile = ".claude/check-results/test-result.json"
$qualityFile = ".claude/check-results/quality-result.json"

# 1. 检查文件存在
if (-not (Test-Path $testFile)) {
  Write-Host ""
  Write-Host "╔══════════════════════════════════════╗"
  Write-Host "║  🚦 质量门禁拦截                    ║"
  Write-Host "╠══════════════════════════════════════╣"
  Write-Host "║  ❌ 未找到测试结果文件              ║"
  Write-Host "║  📁 .claude/check-results/          ║"
  Write-Host "║     test-result.json 不存在         ║"
  Write-Host "║                                      ║"
  Write-Host "║  💡 请先运行 gitcommit-agent 提交   ║"
  Write-Host "╚══════════════════════════════════════╝"
  Write-Host ""
  exit 1
}

if (-not (Test-Path $qualityFile)) {
  Write-Host ""
  Write-Host "╔══════════════════════════════════════╗"
  Write-Host "║  🚦 质量门禁拦截                    ║"
  Write-Host "╠══════════════════════════════════════╣"
  Write-Host "║  ❌ 未找到质量审计结果文件          ║"
  Write-Host "║  📁 .claude/check-results/          ║"
  Write-Host "║     quality-result.json 不存在      ║"
  Write-Host "║                                      ║"
  Write-Host "║  💡 请先运行 gitcommit-agent 提交   ║"
  Write-Host "╚══════════════════════════════════════╝"
  Write-Host ""
  exit 1
}

# 2. 读取 JSON 文件

# 读取时处理可能的 BOM 和编码问题
$rawTest = Get-Content $testFile -Encoding UTF8 -Raw
$rawQuality = Get-Content $qualityFile -Encoding UTF8 -Raw

try {
  $testResult = $rawTest | ConvertFrom-Json
} catch {
  Write-Host "❌ test-result.json 格式错误：$_"
  exit 1
}

try {
  $qualityResult = $rawQuality | ConvertFrom-Json
} catch {
  Write-Host "❌ quality-result.json 格式错误：$_"
  exit 1
}

# 3. 检查是否过期（30 分钟内）
$maxAge = [DateTime]::UtcNow.AddMinutes(-30)

try {
  $testTime = [DateTime]::Parse($testResult.timestamp)
  $qualityTime = [DateTime]::Parse($qualityResult.timestamp)
} catch {
  Write-Host "❌ 标记文件时间戳无法解析"
  exit 1
}

if ($testTime -lt $maxAge) {
  $age = [Math]::Round(([DateTime]::UtcNow - $testTime).TotalMinutes)
  Write-Host ""
  Write-Host "╔══════════════════════════════════════╗"
  Write-Host "║  ⚠️  质量门禁：测试结果已过期       ║"
  Write-Host "╠══════════════════════════════════════╣"
  Write-Host "║  测试结果生成于 ${age} 分钟前       ║"
  Write-Host "║  超过 30 分钟的时效限制             ║"
  Write-Host "║                                      ║"
  Write-Host "║  💡 请重新运行 gitcommit-agent      ║"
  Write-Host "╚══════════════════════════════════════╝"
  Write-Host ""
  exit 1
}

if ($qualityTime -lt $maxAge) {
  $age = [Math]::Round(([DateTime]::UtcNow - $qualityTime).TotalMinutes)
  Write-Host ""
  Write-Host "╔══════════════════════════════════════╗"
  Write-Host "║  ⚠️  质量门禁：审计结果已过期       ║"
  Write-Host "╠══════════════════════════════════════╣"
  Write-Host "║  审计结果生成于 ${age} 分钟前       ║"
  Write-Host "║  超过 30 分钟的时效限制             ║"
  Write-Host "║                                      ║"
  Write-Host "║  💡 请重新运行 gitcommit-agent      ║"
  Write-Host "╚══════════════════════════════════════╝"
  Write-Host ""
  exit 1
}

# 4. 检查通过状态

$allPassed = $true

# 检查测试结果
if (-not $testResult.passed) {
  Write-Host ""
  Write-Host "╔══════════════════════════════════════╗"
  Write-Host "║  🚦 质量门禁拦截                    ║"
  Write-Host "╠══════════════════════════════════════╣"
  $summary = if ($testResult.summary) { $testResult.summary } else { "测试未通过" }
  Write-Host "║  ❌ 单元测试未通过！               ║"
  Write-Host "║  $($summary.PadRight(34))║"
  Write-Host "╚══════════════════════════════════════╝"
  Write-Host ""
  $allPassed = $false
}

# 检查质量审计结果
if (-not $qualityResult.passed) {
  Write-Host ""
  Write-Host "╔══════════════════════════════════════╗"
  Write-Host "║  🚦 质量门禁拦截                    ║"
  Write-Host "╠══════════════════════════════════════╣"
  Write-Host "║  ❌ 质量审计未通过！               ║"
  $qScore = if ($qualityResult.score) { "综合分: $($qualityResult.score)" } else { "不满足通行标准" }
  Write-Host "║  $($qScore.PadRight(34))║"
  Write-Host "╚══════════════════════════════════════╝"
  Write-Host ""
  $allPassed = $false
}

# 额外检查：安全维度不能低于 70
if ($qualityResult.dimensions -and $qualityResult.dimensions.security) {
  $secScore = [int]$qualityResult.dimensions.security
  if ($secScore -lt 70) {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════╗"
    Write-Host "║  🚦 质量门禁拦截                    ║"
    Write-Host "╠══════════════════════════════════════╣"
    Write-Host "║  ❌ 安全评分不达标！               ║"
    Write-Host "║  安全分: $secScore (最低要求: 70)   ║"
    Write-Host "╚══════════════════════════════════════╝"
    Write-Host ""
    $allPassed = $false
  }
}

if ($allPassed) {
  Write-Host ""
  Write-Host "╔══════════════════════════════════════╗"
  Write-Host "║  🟢 质量门禁通过！                 ║"
  Write-Host "╠══════════════════════════════════════╣"
  $testSummary = if ($testResult.summary) { $testResult.summary } else { "OK" }
  $qualityScore = if ($qualityResult.score) { $qualityResult.score } else { "OK" }
  Write-Host "║  🧪 测试: $testSummary             ║"
  Write-Host "║  🏆 质量分: $qualityScore          ║"
  Write-Host "╚══════════════════════════════════════╝"
  Write-Host ""
  exit 0
} else {
  exit 1
}

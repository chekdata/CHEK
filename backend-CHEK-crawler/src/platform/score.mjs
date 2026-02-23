function hasAny(text, words) {
  const s = String(text || '');
  return words.some((w) => s.includes(w));
}

function countAny(text, words) {
  const s = String(text || '');
  let c = 0;
  for (const w of words) if (s.includes(w)) c += 1;
  return c;
}

function clip01(x) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export function heuristicComplaintScore({ title, body }) {
  const t = String(title || '');
  const b = String(body || '');
  const text = `${t}\n${b}`;

  const geoWords = ['潮汕', '汕头', '潮州', '揭阳', '南澳', '普宁', '潮阳', '潮南', '饶平', '澄海', '潮安', '榕城'];
  const complaintWords = ['投诉', '举报', '曝光', '维权', '被坑', '宰客', '欺诈', '黑店', '强制', '恶心', '报警', '12315', '工商', '市场监管'];
  const evidenceWords = ['时间', '地点', '截图', '录音', '订单', '转账', '发票', '车牌', '店名', '定位', '金额', '元'];
  const spamWords = ['探店', '种草', '优惠', '团购', '买一送一', '私信', '加V', 'vx', '微信号', '带货', '推广'];

  const len = text.replace(/\s+/g, '').length;
  const geoHit = hasAny(text, geoWords);
  const complaintHit = hasAny(text, complaintWords);
  const complaintCount = countAny(text, complaintWords);
  const evidenceCount = countAny(text, evidenceWords);
  const spamCount = countAny(text, spamWords);

  let score = 0.15;
  if (geoHit) score += 0.18;
  if (complaintHit) score += 0.25;
  score += Math.min(0.25, complaintCount * 0.06);
  score += Math.min(0.2, evidenceCount * 0.04);

  if (len < 80) score -= 0.25;
  else if (len < 160) score -= 0.12;
  else if (len > 900) score += 0.06;

  score -= Math.min(0.35, spamCount * 0.08);

  const labels = [];
  if (complaintHit) labels.push('complaint');
  if (geoHit) labels.push('geo_related');
  if (spamCount >= 2 && !complaintHit) labels.push('likely_spam');
  if (evidenceCount >= 2) labels.push('has_evidence');

  return { score: clip01(score), labels };
}


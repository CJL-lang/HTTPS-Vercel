import translations from './i18n';

function getUiLang() {
    try {
        const v = (localStorage.getItem('language') || 'zh').toLowerCase();
        return v === 'en' ? 'en' : 'zh';
    } catch {
        return 'zh';
    }
}

function tByLang(key, lang) {
    const table = translations?.[lang];
    if (!table) return '';
    const val = table[key];
    return val == null ? '' : String(val);
}

function getRadarLabelI18nKey(type, fieldKey) {
    if (type === 'physical') {
        if (fieldKey === 'flexibility') return 'flexibilityLevel';
        if (fieldKey === 'upperBodyStrength') return 'upperBodyStrengthLevel';
        if (fieldKey === 'lowerBodyStrength') return 'lowerBodyStrengthLevel';
        if (fieldKey === 'coordination') return 'coordinationLevel';
        if (fieldKey === 'coreStability') return 'coreStabilityLevel';
        if (fieldKey === 'explosiveness') return 'rotationalExplosivenessLevel';
        if (fieldKey === 'cardio') return 'cardiorespiratoryEndurance';
        return '';
    }

    if (type === 'mental') {
        if (fieldKey === 'focus') return 'focusAbility';
        if (fieldKey === 'stability') return 'mentalResilience';
        if (fieldKey === 'confidence') return 'confidenceAndMotivation';
        return '';
    }

    if (type === 'skills') {
        if (fieldKey === 'basicAction') return 'basicAction';
        if (fieldKey === 'swingAnalysis') return 'swingAnalysis';
        if (fieldKey === 'driver') return 'clubDriver';
        if (fieldKey === 'mainIron') return 'clubMainIron';
        if (fieldKey === 'wood') return 'clubWood';
        if (fieldKey === 'putting') return 'clubPutting';
        if (fieldKey === 'scrambling') return 'clubScrambling';
        if (fieldKey === 'finesseWedges') return 'clubFinesseWedges';
        if (fieldKey === 'irons') return 'clubIrons';
        return '';
    }

    return '';
}

function translateRadarLabel(title, type, lang) {
    const raw = (title ?? '').toString();
    if (!raw) return raw;

    const candidateMap = buildCandidateMap(type);
    const norm = normalizeTitle(raw);
    const fieldKey = findBestFieldKey(norm, candidateMap);
    if (!fieldKey) return raw;

    const i18nKey = getRadarLabelI18nKey(type, fieldKey);
    if (!i18nKey) return raw;

    const translated = tByLang(i18nKey, lang);
    return translated || raw;
}

function normalizeTitle(input) {
    if (input == null) return '';
    return String(input)
        .trim()
        .toLowerCase()
        // remove whitespace
        .replace(/\s+/g, '')
        // remove common punctuation (CN+EN)
        .replace(/[·•\-_—–/\\:：,，.。()（）【】[\]{}<>《》'"“”‘’]/g, '')
        // remove common suffixes
        .replace(/(等级|level)/g, '');
}

function getI18nText(key) {
    const zh = translations?.zh?.[key];
    const en = translations?.en?.[key];
    return [zh, en].filter(Boolean);
}

function buildCandidateMap(type) {
    /** @type {Record<string, Set<string>>} */
    const map = {};

    const add = (fieldKey, titles) => {
        if (!map[fieldKey]) map[fieldKey] = new Set();
        titles
            .filter(Boolean)
            .map(normalizeTitle)
            .filter(Boolean)
            .forEach((t) => map[fieldKey].add(t));
    };

    if (type === 'mental') {
        add('focus', [...getI18nText('focusAbility'), '专注', '专注力', 'focus']);
        add('stability', [...getI18nText('mentalResilience'), '抗压', '抗压力', '韧性', 'resilience', 'stress', '心理韧性', 'stability']);
        add('confidence', [
            ...getI18nText('confidenceAndMotivation'),
            '自信',
            '自信心',
            '动机',
            'motivation',
            'confidence'
        ]);
    } else if (type === 'physical') {
        add('flexibility', [...getI18nText('flexibility'), ...getI18nText('flexibilityLevel'), '柔韧', '柔韧性']);
        add('upperBodyStrength', [
            ...getI18nText('upperBodyStrength'),
            ...getI18nText('upperBodyStrengthLevel'),
            '上肢力量'
        ]);
        add('lowerBodyStrength', [
            ...getI18nText('lowerBodyStrength'),
            ...getI18nText('lowerBodyStrengthLevel'),
            '下肢力量'
        ]);
        add('coordination', [...getI18nText('coordination'), ...getI18nText('coordinationLevel'), '协调', '协调性']);
        add('coreStability', [
            ...getI18nText('coreStability'),
            ...getI18nText('coreStabilityLevel'),
            '核心',
            '核心稳定'
        ]);
        add('explosiveness', [
            ...getI18nText('explosiveness'),
            ...getI18nText('rotationalExplosivenessLevel'),
            '爆发力',
            '旋转爆发力'
        ]);
        add('cardio', [
            ...getI18nText('cardio'),
            ...getI18nText('cardiorespiratoryEndurance'),
            '心肺',
            '心肺耐力',
            '耐力',
            'cardio'
        ]);
    } else if (type === 'skills') {
        add('basicAction', [...getI18nText('basicAction'), '基础动作', 'basicaction', 'basic actions']);
        add('swingAnalysis', [...getI18nText('swingAnalysis'), '挥杆分析', 'swinganalysis', 'swing analysis']);
        add('driver', [...getI18nText('clubDriver'), '1号木', '一号木', 'driver', 'no1wood']);
        add('mainIron', [...getI18nText('clubMainIron'), '主力铁', '主力铁杆', 'mainiron', 'primaryiron']);
        add('wood', [...getI18nText('clubWood'), '球道木', '木杆', 'wood']);
        add('putting', [...getI18nText('clubPutting'), '推杆', 'putt', 'putting']);
        add('scrambling', [...getI18nText('clubScrambling'), '救球', '救球率', 'scrambling']);
        add('finesseWedges', [...getI18nText('clubFinesseWedges'), '切杆', '挖起杆', 'wedge', 'finessewedge', 'finessewedges']);
        add('irons', [...getI18nText('clubIrons'), '铁杆', 'iron', 'irons']);
    }

    return map;
}

function initGradeData(type) {
    if (type === 'mental') return { focus: 0, stability: 0, confidence: 0 };
    if (type === 'physical')
        return {
            flexibility: 0,
            upperBodyStrength: 0,
            lowerBodyStrength: 0,
            coordination: 0,
            coreStability: 0,
            explosiveness: 0,
            cardio: 0
        };
    if (type === 'skills')
        return {
            driver: 0,
            mainIron: 0,
            wood: 0,
            putting: 0,
            scrambling: 0,
            finesseWedges: 0,
            irons: 0
        };
    return {};
}

function findBestFieldKey(titleNorm, candidateMap) {
    if (!titleNorm) return null;

    let bestKey = null;
    let bestScore = 0;

    for (const [fieldKey, candidates] of Object.entries(candidateMap)) {
        for (const cand of candidates) {
            if (!cand) continue;
            if (titleNorm === cand) return fieldKey;

            // fuzzy containment match (to tolerate prefixes/suffixes)
            if (titleNorm.includes(cand) || cand.includes(titleNorm)) {
                const score = Math.min(titleNorm.length, cand.length);
                if (score > bestScore) {
                    bestScore = score;
                    bestKey = fieldKey;
                }
            }
        }
    }

    return bestKey;
}

/**
 * Map GET /diagnoses/:ass_id response to RadarChart data.
 * Now dynamically uses all items from backend without fixed field mapping.
 *
 * Expected response shape:
 * { content: [{ title: string, grade: string|number, content?: string }, ...] }
 * 
 * Returns: { labels: string[], values: (string|number)[], totalCount: number }
 */
export function diagnosesToRadarGradeData(diagnosesResponse, type) {
    const content = Array.isArray(diagnosesResponse)
        ? diagnosesResponse
        : diagnosesResponse?.content;

    if (!Array.isArray(content) || content.length === 0) {
        return { labels: [], values: [], totalCount: 0 };
    }

    // 直接使用后端返回的所有项目，不做字段映射
    const labels = [];
    const values = [];

    const lang = getUiLang();

    for (const item of content) {
        if (item?.title) {
            labels.push(translateRadarLabel(item.title, type, lang));
            values.push(item?.grade ?? 0);
        }
    }

    return { labels, values, totalCount: content.length };
}



/**
 * 测评相关 API 调用
 */
import api from '../../../utils/api';
import { pickLocalizedContent } from '../../../utils/language';
export const saveGoalToBackend = async (type, content, currentId, user, studentId, language = 'cn') => {
    if (!user?.token || !currentId) return null;

    if (!content || (Array.isArray(content) && content.length === 0)) {
        return null;
    }

    try {
        // 将 'skills' 映射为后端期望的 'technique'
        const goalType = type === 'skills' || type === 'technique' ? 'technique' : type;

        // 格式化内容数组
        const formattedContent = (Array.isArray(content) ? content : []).map(item => ({
            title: item.title || item.name || '目标',
            content: item.content || item.stage_content || ''
        })).filter(item => item.content.trim() !== '');

        if (formattedContent.length === 0) return currentId;

        const requestBody = {
            assessment_id: currentId,
            type: goalType,
            content: formattedContent,
            language: language
        };

        const response = await fetch('/api/goals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            return currentId;
        } else {
            const txt = await response.text();
            console.error('Failed to save goals:', txt);
            return null;
        }
    } catch (error) {
        console.error('Error saving goals:', error);
        return null;
    }
};

/**
 * 删除测评
 * 建议后端使用与 create/update 相同的资源路径：DELETE /api/assessment
 * @param {string} assessmentId
 * @param {object} user
 */
export const deleteAssessment = async (assessmentId, user) => {
    if (!user?.token || !assessmentId) {
        console.warn('[API] deleteAssessment aborted: missing token or id', { assessmentId, hasToken: !!user?.token });
        return false;
    }

    try {
        const payload = { assessment_id: assessmentId };
        console.log('[API] DELETE /assessment payload:', payload);

        const response = await fetch('/api/assessment', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[API] DELETE /assessment failed:', response.status, errText);
        }

        return response.ok;
    } catch (error) {
        console.error('Error deleting assessment:', error);
        return false;
    }
};

/**
 * 删除 AI 报告
 * 后端路由：DELETE /AIReport/:assessment_id
 * @param {string|number} assessmentId
 * @param {object} user
 */
export const deleteAIReport = async (assessmentId, user) => {
    if (!user?.token || !assessmentId) {
        console.warn('[API] deleteAIReport aborted: missing token or id', { assessmentId, hasToken: !!user?.token });
        return false;
    }

    try {
        const response = await api.delete(`/api/AIReport/${assessmentId}`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });
        return response?.status >= 200 && response?.status < 300;
    } catch (error) {
        // 404 视为已不存在（幂等）
        if (error?.response?.status === 404) return true;
        console.error('[API] DELETE /AIReport failed:', error);
        return false;
    }
};

export const savePlanToBackend = async (type, content, currentId, user, studentId, title = '', language = 'cn') => {
    if (!user?.token || !currentId) return null;

    try {
        // 格式化内容数组，过滤掉空 title 和空 content 的项
        const formattedContent = (Array.isArray(content) ? content : [])
            .map(item => ({
                title: item.title || item.name || '',
                content: item.content || ''
            }))
            .filter(item => item.title.trim() !== '' && item.content.trim() !== '');

        if (formattedContent.length === 0) return currentId;

        const requestBody = {
            assessment_id: currentId,
            content: formattedContent,
            language: language
        };

        const response = await fetch('/api/plans', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(requestBody),
        });

        if (response.ok) {
            const resData = await response.json();
            return resData.assessment_id;
        }

        const txt = await response.text();
        console.error('Failed to save plans:', txt);
    } catch (error) {
        console.error('Error saving plans:', error);
    }
    return null;
};

export const saveDiagnosisToBackend = async (type, content, currentId, user, studentId, language = 'cn') => {
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (user?.token) headers['Authorization'] = `Bearer ${user.token}`;

        // Ensure content is formatted correctly for backend
        // Backend expects: [{"title": "...", "grade": "...", "content": "...", "workoutroutine": "..."}]
        const formattedContent = (Array.isArray(content) ? content : []).map(item => ({
            title: item.title || item.name || '',
            grade: item.grade || item.level || 'L1',
            content: item.content || item.description || '',
            workoutroutine: item.workoutroutine || item.testResult || ''
        }));

        const requestBody = {
            assessment_id: currentId || '',
            content: formattedContent,
            language: language
        };

        console.log('[API] POST /diagnosis payload:', requestBody);

        const response = await fetch('/api/diagnosis', {
            method: 'POST',
            headers,
            body: JSON.stringify(requestBody),
        });

        console.log('[API] POST /diagnosis response status:', response.status);

        if (response.ok) {
            const resData = await response.json();
            console.log('[API] POST /diagnosis success:', resData);
            return resData.assessment_id || resData.assessmentId || null;
        }

        const txt = await response.text();
        console.error('[API] POST /diagnosis failed:', response.status, txt);
    } catch (error) {
        console.error('[API] POST /diagnosis error:', error);
    }
    return null;
};

/**
 * 获取已有诊断数据
 */
export const getDiagnosisFromBackend = async (assessmentId, user) => {
    if (!user?.token || !assessmentId) return null;

    try {
        const response = await api.get(`/api/diagnoses/${assessmentId}`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (response.data) {
            const data = response.data;
            console.log('[API] GET /diagnoses success:', data);
            // 后端返回对象可能同时包含 content / content_en，根据当前 UI 语言选择
            return pickLocalizedContent(data);
        }

        // 404 是正常的（新 assessment 还没有诊断数据）
        if (response.status === 404) {
            // 静默处理，不输出日志
            return [];
        }

        console.warn('[API] GET /diagnoses unexpected status:', response.status);
        return null;
    } catch (error) {
        console.error('[API] GET /diagnoses error:', error);
        return null;
    }
};

/**
 * 更新已有诊断数据 (PATCH)
 */
export const updateDiagnosisToBackend = async (assessmentId, content, user, language = 'cn') => {
    if (!user?.token || !assessmentId) return false;

    try {
        const formattedContent = (Array.isArray(content) ? content : [])
            .map(item => ({
                title: item.title || item.name || '',
                grade: item.grade || item.level || 'L1',
                content: item.content || item.description || '',
                workoutroutine: item.workoutroutine || item.testResult || ''
            }))
            .filter(item => item.title.trim() !== ''); // 过滤掉 title 为空的项

        const requestBody = {
            assessment_id: assessmentId,
            content: formattedContent,
            language: language
        };

        const response = await fetch('/api/diagnoses', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[API] updateDiagnosisToBackend failed:', response.status, errText);
        }

        return response.ok;
    } catch (error) {
        console.error('Error patching diagnosis:', error);
        return false;
    }
};

export const saveStykuDataToBackend = async (assessmentId, stykuData, user, language = 'cn') => {
    if (!user?.token || !assessmentId) {
        console.warn('[API] POST /styku: Missing token or assessmentId', { hasToken: !!user?.token, assessmentId });
        return null;
    }

    try {
        // 确保所有必需字段都有值，避免发送 null 或 undefined
        const payload = {
            assessment_id: assessmentId.toString(), // 确保是字符串
            height: stykuData.height != null ? parseFloat(stykuData.height) : 0,
            weight: stykuData.weight != null ? parseFloat(stykuData.weight) : 0,
            sitting_height: stykuData.sittingHeight != null ? parseFloat(stykuData.sittingHeight) : 0,
            bmi: stykuData.bmi != null ? parseFloat(stykuData.bmi) : 0,
            chest: stykuData.torso?.chest != null ? parseFloat(stykuData.torso.chest) : 0,
            waist: stykuData.torso?.waist != null ? parseFloat(stykuData.torso.waist) : 0,
            hip: stykuData.torso?.hip != null ? parseFloat(stykuData.torso.hip) : 0,
            upper_arm: stykuData.upperLimbs?.upperArm != null ? parseFloat(stykuData.upperLimbs.upperArm) : 0,
            forearm: stykuData.upperLimbs?.forearm != null ? parseFloat(stykuData.upperLimbs.forearm) : 0,
            thigh: stykuData.lowerLimbs?.thigh != null ? parseFloat(stykuData.lowerLimbs.thigh) : 0,
            calf: stykuData.lowerLimbs?.calf != null ? parseFloat(stykuData.lowerLimbs.calf) : 0
        };

        // 只在有备注时添加 notes 字段
        if (stykuData.notes && stykuData.notes.trim()) {
            payload.notes = stykuData.notes.trim();
        }

        console.log('[API] POST /styku payload:', payload);

        const response = await fetch('/api/styku', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload),
        });

        console.log('[API] POST /styku response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('[API] POST /styku success:', result);
            return result;
        } else {
            const errData = await response.text();
            console.error('[API] POST /styku failed:', response.status, errData);
            console.error('[API] POST /styku request payload was:', payload);
            return null;
        }
    } catch (error) {
        console.error('[API] POST /styku error:', error);
        return null;
    }
};

export const saveMentalDataToBackend = async (assessmentId, mentalData, user, language = 'cn') => {
    if (!user?.token || !assessmentId) return null;

    try {
        // 后端需要 focus, stress, stability
        // 前端采集 focus, stability, confidence
        // 映射：confidence -> stress（或者添加 stress 字段）
        const payload = {
            assessment_id: assessmentId,
            focus: parseInt(mentalData.focus) || 0,
            stress: parseInt(mentalData.confidence) || 0,  // 将 confidence 映射为 stress
            stability: parseInt(mentalData.stability) || 0
        };

        // 如果后端也支持 confidence，可以额外发送
        if (mentalData.confidence !== undefined) {
            payload.confidence = parseInt(mentalData.confidence) || 0;
        }

        // 如果提供了 notes，也包含进去
        if (mentalData.notes) {
            payload.notes = mentalData.notes;
        }

        console.log('[API] POST /mental payload:', payload);

        // 后端实际路由是 /mental
        const response = await fetch('/api/mental', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload),
        });

        console.log('[API] POST /mentalData response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('[API] POST /mentalData success:', result);
            return assessmentId;
        } else {
            const errData = await response.text();
            console.error('[API] POST /mentalData failed:', response.status, errData);
            return null;
        }
    } catch (error) {
        console.error('[API] POST /mentalData error:', error);
        return null;
    }
};

export const saveTrackmanDataToBackend = async (assessmentId, trackmanData, user, language = 'cn') => {
    if (!user?.token || !assessmentId) {
        console.warn('[API] POST /trackman: Missing token or assessmentId', { hasToken: !!user?.token, assessmentId });
        return null;
    }

    try {
        // 根据后端文档，trackman POST 不需要 language 字段
        // 将前端嵌套结构扁平化为后端期望的字段
        const payload = {
            assessment_id: assessmentId.toString(), // 确保是字符串
            ball_speed: trackmanData.layerA?.ballSpeed != null && trackmanData.layerA.ballSpeed !== '' ? parseFloat(trackmanData.layerA.ballSpeed) : 0,
            launch_angle: trackmanData.layerA?.launchAngle != null && trackmanData.layerA.launchAngle !== '' ? parseFloat(trackmanData.layerA.launchAngle) : 0,
            launch_direction: trackmanData.layerA?.launchDirection || "",
            spin_rate: trackmanData.layerA?.spinRate != null && trackmanData.layerA.spinRate !== '' ? parseInt(trackmanData.layerA.spinRate) : 0,
            spin_axis: trackmanData.layerA?.spinAxis || "",
            carry: trackmanData.layerA?.carry != null && trackmanData.layerA.carry !== '' ? parseInt(trackmanData.layerA.carry) : 0,
            landing_angle: trackmanData.layerA?.landingAngle != null && trackmanData.layerA.landingAngle !== '' ? parseFloat(trackmanData.layerA.landingAngle) : 0,
            offline: trackmanData.layerA?.offline || "",
            club_speed: trackmanData.layerB?.clubSpeed != null && trackmanData.layerB.clubSpeed !== '' ? parseFloat(trackmanData.layerB.clubSpeed) : 0,
            attack_angle: trackmanData.layerB?.attackAngle != null && trackmanData.layerB.attackAngle !== '' ? parseFloat(trackmanData.layerB.attackAngle) : 0,
            club_path: trackmanData.layerB?.clubPath != null && trackmanData.layerB.clubPath !== '' ? parseFloat(trackmanData.layerB.clubPath) : 0,
            face_angle: trackmanData.layerB?.faceAngle != null && trackmanData.layerB.faceAngle !== '' ? parseFloat(trackmanData.layerB.faceAngle) : 0,
            face_to_path: trackmanData.layerB?.faceToPath != null && trackmanData.layerB.faceToPath !== '' ? parseFloat(trackmanData.layerB.faceToPath) : 0,
            dynamic_loft: trackmanData.layerB?.dynamicLoft != null && trackmanData.layerB.dynamicLoft !== '' ? parseFloat(trackmanData.layerB.dynamicLoft) : 0,
            smash_factor: trackmanData.layerB?.smashFactor != null && trackmanData.layerB.smashFactor !== '' ? parseFloat(trackmanData.layerB.smashFactor) : 0,
            spin_loft: trackmanData.layerB?.spinLoft != null && trackmanData.layerB.spinLoft !== '' ? parseFloat(trackmanData.layerB.spinLoft) : 0,
            low_point: trackmanData.layerC?.lowPoint || "",
            impact_offset: trackmanData.layerC?.impactOffset || "",
            indexing: trackmanData.layerC?.indexing || ""
        };
        // 只在有备注时添加 notes 字段
        if (trackmanData.notes && trackmanData.notes.trim()) {
            payload.notes = trackmanData.notes.trim();
        }

        console.log('[API] POST /trackman payload:', payload);

        const response = await fetch('/api/trackman', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload),
        });

        console.log('[API] POST /trackman response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('[API] POST /trackman success:', result);
            return assessmentId;
        } else {
            const errData = await response.text();
            console.error('[API] POST /trackman failed:', response.status, errData);
            console.error('[API] POST /trackman request payload was:', payload);
            return null;
        }
    } catch (error) {
        console.error('[API] POST /trackman error:', error);
        return null;
    }
};

export const updateAssessment = async (assessmentId, updateData, user) => {
    console.log('[API] updateAssessment trigger:', { assessmentId, updateData });
    if (!user?.token || !assessmentId) {
        console.warn('[API] updateAssessment aborted: missing token or id', { assessmentId, hasToken: !!user?.token });
        return false;
    }

    try {
        const payload = {
            assessment_id: assessmentId.toString(),
            ...updateData
        };

        console.log('[API] PATCH /assessment payload:', payload);

        const response = await fetch('/api/assessment', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload),
        });

        console.log('[API] PATCH /assessment response status:', response.status);

        if (response.ok) {
            return true;
        } else {
            const errData = await response.text();
            console.error('Failed to update assessment:', errData);
            return false;
        }
    } catch (error) {
        console.error('Error updating assessment:', error);
        return false;
    }
};

export const createAssessment = async (studentId, type, user, title = '', language = 'cn') => {
    if (!user?.token || !studentId) {
        console.error('[API] createAssessment: Missing token or studentId');
        return null;
    }

    try {
        const typeMapping = {
            'physical': 'physical',
            'mental': 'mental',
            'skills': 'technique',
            'technique': 'technique'
        };

        const backendType = typeMapping[type] || type;

        // 如果没有提供标题或标题为空，生成默认中文标题
        let finalTitle = title;
        if (!finalTitle || !finalTitle.trim()) {
            const defaultTitleMap = {
                'physical': '身体素质测评',
                'mental': '心理测评',
                'technique': '技能测评',
                'skills': '技能测评'
            };
            finalTitle = defaultTitleMap[type] || '新测评';
        }

        const payload = {
            student_user_id: studentId.toString(),
            type: backendType,
            title: finalTitle,
            language: language
        };

        console.log('[API] POST /assessment payload:', payload);

        const response = await fetch('/api/assessment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload),
        });

        console.log('[API] POST /assessment response status:', response.status);

        if (response.ok) {
            const data = await response.json();
            console.log('[API] POST /assessment success:', data);
            return data.assessment_id;
        } else {
            const errData = await response.text();
            console.error('[API] POST /assessment failed:', response.status, errData);
            return null;
        }
    } catch (error) {
        console.error('[API] POST /assessment error:', error);
        return null;
    }
};

/**
 * 获取已有训练计划
 */
export const getPlanFromBackend = async (assessmentId, user) => {
    if (!user?.token || !assessmentId) return null;

    try {
        const response = await api.get(`/api/plans/${assessmentId}`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (response.data) {
            const data = response.data;
            console.log('[API] GET /plans success:', data);
            return pickLocalizedContent(data);
        }

        // 404 是正常的（新 assessment 还没有训练计划数据）
        if (response.status === 404) {
            // 静默处理，不输出日志
            return [];
        }

        console.warn('[API] GET /plans unexpected status:', response.status);
        return null;
    } catch (error) {
        console.error('[API] GET /plans error:', error);
        return null;
    }
};

/**
 * 更新已有训练计划 (PATCH)
 */
export const updatePlanToBackend = async (assessmentId, content, user, language = 'cn') => {
    if (!user?.token || !assessmentId) return false;

    try {
        const formattedContent = (Array.isArray(content) ? content : []).map(item => ({
            title: item.title || item.name || '',
            content: item.content || ''
        })).filter(item => item.content.trim() !== '');

        const requestBody = {
            assessment_id: assessmentId,
            content: formattedContent,
            language: language
        };

        const response = await fetch('/api/plans', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(requestBody),
        });

        return response.ok;
    } catch (error) {
        console.error('Error patching plans:', error);
        return false;
    }
};

/**
 * 获取已有目标数据
 */
export const getGoalFromBackend = async (assessmentId, user) => {
    if (!user?.token || !assessmentId) return null;

    try {
        const response = await api.get(`/api/goals/${assessmentId}`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (response.data) {
            const data = response.data;
            console.log('[API] GET /goals success:', data);
            return pickLocalizedContent(data);
        }

        // 404 是正常的（新 assessment 还没有目标数据）
        if (response.status === 404) {
            // 静默处理，不输出日志
            return [];
        }

        console.warn('[API] GET /goals unexpected status:', response.status);
        return null;
    } catch (error) {
        console.error('[API] GET /goals error:', error);
        return null;
    }
};

/**
 * 更新已有目标数据 (PATCH)
 */
export const updateGoalToBackend = async (assessmentId, content, user, language = 'cn') => {
    if (!user?.token || !assessmentId) return false;

    try {
        const formattedContent = (Array.isArray(content) ? content : []).map(item => ({
            title: item.title || item.name || '',
            content: item.content || ''
        })).filter(item => item.content.trim() !== '');

        const requestBody = {
            assessment_id: assessmentId,
            content: formattedContent,
            language: language
        };

        const response = await fetch('/api/goals', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(requestBody),
        });

        return response.ok;
    } catch (error) {
        console.error('Error patching goals:', error);
        return false;
    }
};

/**
 * 获取单项测评全量数据 (采集数据 + 诊断 + 方案 + 目标)
 * 注意：后端没有 /singleAssess 接口，需要分别获取各模块数据
 * 此函数已废弃，请使用 getDiagnosisFromBackend, getPlanFromBackend, getGoalFromBackend 等分别获取
 * @deprecated Use individual API calls instead
 */
export const getFullAssessmentData = async (assessmentId, user) => {
    console.warn('[DEPRECATED] getFullAssessmentData: Please use individual API calls');
    return null;
};

/**
 * 更新 Trackman 数据 (PATCH)
 */
export const updateTrackmanDataToBackend = async (assessmentId, data, user, language = 'cn') => {
    if (!user?.token || !assessmentId) return false;
    try {
        // 后端 PATCH 使用 DisallowUnknownFields：不能传 layerA/layerB/layerC 等未知字段
        // 这里统一将前端嵌套结构扁平化为后端期望字段（与 POST 保持一致）
        const payload = {
            assessment_id: assessmentId,
            ball_speed: parseFloat(data?.ball_speed ?? data?.layerA?.ballSpeed) || 0,
            launch_angle: parseFloat(data?.launch_angle ?? data?.layerA?.launchAngle) || 0,
            launch_direction: (data?.launch_direction ?? data?.layerA?.launchDirection) || "",
            spin_rate: parseInt(data?.spin_rate ?? data?.layerA?.spinRate) || 0,
            spin_axis: (data?.spin_axis ?? data?.layerA?.spinAxis) || "",
            carry: parseInt(data?.carry ?? data?.layerA?.carry) || 0,
            landing_angle: parseFloat(data?.landing_angle ?? data?.layerA?.landingAngle) || 0,
            offline: (data?.offline ?? data?.layerA?.offline) || "",
            club_speed: parseFloat(data?.club_speed ?? data?.layerB?.clubSpeed) || 0,
            attack_angle: parseFloat(data?.attack_angle ?? data?.layerB?.attackAngle) || 0,
            club_path: parseFloat(data?.club_path ?? data?.layerB?.clubPath) || 0,
            face_angle: parseFloat(data?.face_angle ?? data?.layerB?.faceAngle) || 0,
            face_to_path: parseFloat(data?.face_to_path ?? data?.layerB?.faceToPath) || 0,
            dynamic_loft: parseFloat(data?.dynamic_loft ?? data?.layerB?.dynamicLoft) || 0,
            smash_factor: parseFloat(data?.smash_factor ?? data?.layerB?.smashFactor) || 0,
            spin_loft: parseFloat(data?.spin_loft ?? data?.layerB?.spinLoft) || 0,
            low_point: (data?.low_point ?? data?.layerC?.lowPoint) || "",
            impact_offset: (data?.impact_offset ?? data?.layerC?.impactOffset) || "",
            indexing: (data?.indexing ?? data?.layerC?.indexing) || ""
        };

        const response = await fetch('/api/trackman', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error('[API] PATCH /trackman failed:', response.status, errText);
        }
        return response.ok;
    } catch (error) {
        console.error('Error patching trackman data:', error);
        return false;
    }
};

/**
 * 更新 Mental 数据 (PATCH)
 */
export const updateMentalDataToBackend = async (assessmentId, data, user, language = 'cn') => {
    if (!user?.token || !assessmentId) return false;
    try {
        // 后端 PATCH 使用 DisallowUnknownFields：只发送后端 struct 支持的字段
        // 根据后端文档，需要 focus/stress/stability 字段
        const payload = {
            assessment_id: assessmentId,
            focus: parseInt(data?.focus) || 0,
            stress: parseInt(data?.stress) || 0,
            stability: parseInt(data?.stability) || 0
        };

        // 如果提供了 confidence，也包含进去（虽然文档中没有，但可能后端支持）
        if (data?.confidence !== undefined) {
            payload.confidence = parseInt(data.confidence) || 0;
        }

        console.log('[API] PATCH /mental payload:', payload);

        // 后端实际路由是 /mental
        const response = await fetch('/api/mental', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload),
        });

        console.log('[API] PATCH /mentalData response status:', response.status);

        if (!response.ok) {
            const errText = await response.text();
            console.error('[API] PATCH /mentalData failed:', response.status, errText);
        }
        return response.ok;
    } catch (error) {
        console.error('Error patching mental data:', error);
        return false;
    }
};

/**
 * 更新 Styku 数据 (PATCH)
 */
export const updateStykuDataToBackend = async (assessmentId, data, user, language = 'cn') => {
    if (!user?.token || !assessmentId) return false;
    try {
        // 后端 PATCH 使用 DisallowUnknownFields：不能传 torso/upperLimbs/lowerLimbs 等未知字段
        // 这里与 POST 保持一致：全部扁平化并转成数字
        const payload = {
            assessment_id: assessmentId,
            height: parseFloat(data?.height) || 0,
            weight: parseFloat(data?.weight) || 0,
            sitting_height: parseFloat(data?.sitting_height ?? data?.sittingHeight) || 0,
            bmi: parseFloat(data?.bmi) || 0,
            chest: parseFloat(data?.chest ?? data?.torso?.chest) || 0,
            waist: parseFloat(data?.waist ?? data?.torso?.waist) || 0,
            hip: parseFloat(data?.hip ?? data?.torso?.hip) || 0,
            upper_arm: parseFloat(data?.upper_arm ?? data?.upperLimbs?.upperArm) || 0,
            forearm: parseFloat(data?.forearm ?? data?.upperLimbs?.forearm) || 0,
            thigh: parseFloat(data?.thigh ?? data?.lowerLimbs?.thigh) || 0,
            calf: parseFloat(data?.calf ?? data?.lowerLimbs?.calf) || 0
        };

        const response = await fetch('/api/styku', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}`
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errText = await response.text();
            console.error('[API] PATCH /styku failed:', response.status, errText);
        }
        return response.ok;
    } catch (error) {
        console.error('Error patching styku data:', error);
        return false;
    }
};

/**
 * 获取单个测评数据
 * GET /singleAssess/:ass_id
 * @param {string} assessmentId - 测评ID，对应后端的 assessment_id 字段
 * @param {object} user - 用户对象，包含 token
 */
export const getSingleAssessment = async (assessmentId, user) => {
    if (!user?.token || !assessmentId) {
        console.error('[API] getSingleAssessment: Missing token or assessment_id');
        return null;
    }

    try {
        // 将 assessment_id 作为路径参数传递给后端
        const response = await api.get(`/api/singleAssess/${assessmentId}`, {
            headers: {
                'Authorization': `Bearer ${user.token}`
            }
        });

        if (response.data) {
            const data = response.data;
            console.log('[API] GET /singleAssess success:', data);
            return data;
        }

        const errText = await response.text();
        console.error('[API] GET /singleAssess failed:', response.status, errText);
        return null;
    } catch (error) {
        console.error('[API] GET /singleAssess error:', error);
        return null;
    }
};

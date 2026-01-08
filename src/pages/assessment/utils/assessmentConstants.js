/**
 * 测评常量和配置
 */

export const TYPE_MAP = {
    0: 'physical',
    1: 'mental',
    2: 'skills'
};

export const ROUTE_MAP = {
    0: 'physical',
    1: 'mental',
    2: 'technique'
};

export const TYPE_TO_INDEX = {
    physical: 0,
    mental: 1,
    skills: 2,
    technique: 2
};

export const STEP_MAP = {
    data: 0,
    diagnosis: 1,
    plan: 2,
    goal: 3
};

export const STEP_PATHS = ['data', 'diagnosis', 'plan', 'goal'];

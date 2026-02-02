/**
 * 将数字转换为中文数字（支持 1-99）
 * @param {number} num - 要转换的数字
 * @returns {string} - 中文数字
 */
export const numberToChinese = (num) => {
    const chnNumChar = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
    const chnUnitSection = ["", "万", "亿", "万亿", "亿亿"];
    const chnUnitChar = ["", "十", "百", "千"];

    const sectionToChinese = (section) => {
        let strIns = '', chnStr = '';
        let unitPos = 0;
        let zero = true;
        while (section > 0) {
            let v = section % 10;
            if (v === 0) {
                if (!zero) {
                    zero = true;
                    chnStr = chnNumChar[v] + chnStr;
                }
            } else {
                zero = false;
                strIns = chnNumChar[v];
                strIns += chnUnitChar[unitPos];
                chnStr = strIns + chnStr;
            }
            unitPos++;
            section = Math.floor(section / 10);
        }
        return chnStr;
    }

    if (num === 0) {
        return chnNumChar[0];
    }

    // 特殊处理 10-19，习惯上说“十”而不是“一十”
    if (num >= 10 && num < 20) {
        return '十' + (num % 10 === 0 ? '' : chnNumChar[num % 10]);
    }

    let unitPos = 0;
    let strIns = '', chnStr = '';
    let needZero = false;

    while (num > 0) {
        let section = num % 10000;
        if (needZero) {
            chnStr = chnNumChar[0] + chnStr;
        }
        strIns = sectionToChinese(section);
        strIns += (section !== 0) ? chnUnitSection[unitPos] : chnUnitSection[0];
        chnStr = strIns + chnStr;
        needZero = (section < 1000 && section > 0);
        num = Math.floor(num / 10000);
        unitPos++;
    }

    return chnStr;
};

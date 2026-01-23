import expected from './expected_result.json' with { type: 'json' };
import request from './request.json' with { type: 'json' };
import response from './response.json' with { type: 'json' };

function validate_response(expected_result, response_api, response_db, request_from_api, logger = () => {}) {
    
    logger('Begin Validate...');
    const errors = [];

    validateObject(expected_result, response_api, request_from_api, errors, '', logger);

    if (errors.length > 0) {
        logger('Validation Failed');
        errors.forEach(err => {
        logger(
            `❌ ${err.path} | expected: ${err.expected} | actual: ${err.actual}`
        );
        });
    } else {
        logger('Validation Succeeded');
    }

     return errors;
}

function validateObject(expectedObj, responseObj, requestObj, errorList, basePath = '', logger) {
    for (const key in expectedObj) {
        const expectedValue = expectedObj[key];  // ค่าใน path expected
        const responseValue = responseObj?.[key]; // ค่าใน response
        const currentPath = basePath ? `${basePath}.${key}` : key; // path ปัจจุบัน default เป็นว่าง ถ้า รันรอบแรกจะเป็น key เลย

        logger(`🔍 Checking: ${currentPath}`);
        // console.log('expectedValue', expectedValue, 'key', key, 'typeof', typeof expectedValue)

        /* ================= OBJECT ================= */
        if (typeof expectedValue === 'object' && expectedValue !== null) {
            validateObject(expectedValue, responseValue, requestObj, errorList, currentPath, logger); //ถ้าเป็น path object แล้วไม่มีค่า expected value จะไป key ข้างใน พร้อมกับทำ validateObject
            continue;
        }

        /* ================= STRING / DIRECTIVE ================= */
        if (typeof expectedValue === 'string') {

            const resolved = resolveExpectedValue(expectedValue, requestObj);
            // console.log('resolved', resolved)
            const actual = responseValue;

            if (resolved === undefined){
                logger(`⏭️  Skip: ${currentPath}`);
                 continue;
            }

            // primitive
            if (String(actual) !== String(resolved)) {
                logger(`❌ Mismatch: ${currentPath}`);
                errorList.push({
                    path: currentPath,
                    expected: resolved,
                    actual
                });
            }else{
                 logger(`✅ Match: ${currentPath}`);
            }
        }
    }
}

/* ================= HELPERS ================= */

function resolveExpectedValue(expectedValue, request) {
    if (expectedValue === 'auto_generate') return undefined; // ข้ามการ check

    if (expectedValue.startsWith('fix_')) {
        return expectedValue.slice(4); // คืนค่า value จาก expected_path
    }

    if (expectedValue.startsWith('request_')) {
        return getValueByPath(request, expectedValue.replace('request_', '')); //คืนค่าที่ได้จาก เอา ค่าจาก getValueByPath
        //profile.friends.0.name
    }

    return expectedValue;
}

function getValueByPath(obj, path) {
    return path
        .replace(/\[(\d+)\]/g, '.$1') // friends[0] → friends.0
        .split('.') //["profile", "friends", "0", "name"]
        .reduce((acc, key) => acc?.[key], obj); // เช็คเข้าไปข้างใน key
}

/* ================= RUN ================= */

validate_response(expected, response, {}, request);
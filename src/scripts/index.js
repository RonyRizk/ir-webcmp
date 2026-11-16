// Demo-page direction/language harness.
// Every src/pages/index-*.html loads this file from <head>, so reading `?dir=` and `?lang=`
// here sets the document direction before any component upgrades. This is the only way to
// exercise RTL locally — the pages themselves ship a hardcoded `dir` on <html>.


(function applyUrlDirection() {
    try {
        window.environment = 'alpha'
        const params = new URLSearchParams(window.location.search);
        const dir = (params.get('dir') || '').toLowerCase();
        const lang = params.get('lang');
        if (dir === 'rtl' || dir === 'ltr') {
            document.documentElement.setAttribute('dir', dir);
        }
        if (lang) {
            document.documentElement.setAttribute('lang', lang);
        }
    } catch (e) {
        // Non-fatal: the page just stays in its markup-declared direction.
        console.warn('direction harness skipped', e);
    }
})();

async function getToken() {
    try {
        if (!document.getElementById("jwt-decode-cdn")) {
            console.log("Injecting jwt-decode script...");
            const script = document.createElement('script');
            script.src = "/scripts/jwt-decode.js";
            script.id = "jwt-decode-cdn";

            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });

            console.log("jwt-decode script loaded.");
        }

        // Tokens are bound to the environment that issued them: an alpha token is rejected by
        // the prod gateway and vice versa, so each environment keeps its own storage slot.
        const env = _environmentName();
        const storageKey = _tokenStorageKey(env);
        let token = localStorage.getItem(storageKey);

        let isExpired = true;

        if (token) {
            try {
                const decoded = jwt_decode(token);
                isExpired = Date.now() > decoded.exp * 1000;
                console.log(`[${env}] token expiration:`, new Date(decoded.exp * 1000), "Now:", new Date(), "Expired?", isExpired);
            } catch (e) {
                console.warn(`[${env}] stored token is not a valid JWT, discarding`, e);
                localStorage.removeItem(storageKey);
                token = null;
            }
        }

        if (!token || isExpired) {
            console.log(`[${env}] token missing or expired. Fetching new one from ${_gatewayBaseUrl()}...`);
            const newtoken = await authenticate("A35", "H@mburger9");

            if (newtoken) {
                localStorage.setItem(storageKey, newtoken);
                token = newtoken;
                console.log(`[${env}] New token saved to localStorage (${storageKey}).`);
            } else {
                console.error(`[${env}] Failed to get new token.`);
                token = null;
            }
        }

        return token;
    } catch (error) {
        console.error("getToken error:", error);
    }
}

// token = await authenticate("A35", "QAZqaz900_")
function getId() {
    return "42"
}
function _isAlpha() {
    return typeof window !== 'undefined' && (window).environment === 'alpha';
}
// Mirrors ApiClient.ts: alpha routes every request to /IRALPHA, everything else to /IR.
function _environmentName() {
    return _isAlpha() ? 'alpha' : 'prod';
}
function _gatewayBaseUrl() {
    return `https://gateway.igloorooms.com/${_isAlpha() ? 'IRALPHA' : 'IR'}`;
}
function _tokenStorageKey(env = _environmentName()) {
    return `token:${env}`;
}
const authenticate = async (username = "A35", password = "12345") => {
    try {
        const myHeaders = new Headers();
        myHeaders.append("x-ir-bypass", "123");
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Cookie", "Cookie_1=value");

        const raw = JSON.stringify({
            "username": username,
            "password": password
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };
        const res = await fetch(`${_gatewayBaseUrl()}/Authenticate`, requestOptions);
        const data = await res.json();
        return data.My_Result;
    } catch (error) {
        console.error(error);
        return null;
    }
};
/* Helper function to calculate a date range based on a starting date (can be a Date object or a string) and a maximum span of months.
* 
* This function accepts a `fromDate` (either a Date object or a string in YYYY-MM-DD format) and a maximum number of months to generate a date range.
* The function returns an object containing the calculated `_FROM_DATE` (the start date) and `_TO_DATE` 
* (the end date, calculated by adding the specified number of months).
* 
* @param {Date|string} fromDate - The starting date as a Date object or a string in YYYY-MM-DD format (e.g., "2024-10-01").
* @param {number} maxMonths - The maximum number of months to calculate the `toDate` (e.g., 3 for 3 months).
* 
* @returns {Object} An object containing:
*   - `_FROM_DATE`: The provided `fromDate` in YYYY-MM-DD format.
*   - `_TO_DATE`: The calculated date after adding the specified months, in YYYY-MM-DD format.
* 
* Example usage:
*   const { _FROM_DATE, _TO_DATE } = calculateDateRange("2024-10-01", 3);
*   console.log(_FROM_DATE);  // "2024-10-01"
*   console.log(_TO_DATE);    // "2025-01-01" (approximately 3 months later)
*/
function calculateDateRange(fromDate, maxMonths) {
    // If fromDate is a string, convert it to a Date object
    const startDate = typeof fromDate === 'string' ? new Date(fromDate) : fromDate;

    // Ensure the fromDate is a valid Date object
    if (isNaN(startDate)) {
        throw new Error("Invalid start date. Please provide a valid Date object or a string in YYYY-MM-DD format.");
    }

    // Set the _FROM_DATE to the provided fromDate
    const _FROM_DATE = startDate.toISOString().substring(0, 10);

    // Calculate the _TO_DATE by adding the specified number of months
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + maxMonths);
    const _TO_DATE = endDate.toISOString().substring(0, 10);

    return {
        _FROM_DATE,
        _TO_DATE
    };
}
const logout = async () => {
    try {
        console.log("logout")
        const res = await fetch(`${_gatewayBaseUrl()}/Logout`, {
            headers: {
                'Content-Type': 'application/json'
            },
            method: "POST",
            credentials: 'include', // This ensures that cookies are sent and received
            body: JSON.stringify({

            })
        });

        const data = await res.json();
        localStorage.removeItem(_tokenStorageKey());
        return data.My_Result;
    } catch (error) {
        console.error(error);
        return null;
    }
};

function getBrowserInfo() {
    var ua = navigator.userAgent, tem,
        M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
        tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
        return { name: 'IE', version: (tem[1] || '') };
    }
    if (M[1] === 'Chrome') {
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if (tem != null) return { name: tem[1].replace('OPR', 'Opera'), version: tem[2] };
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1]);
    return {
        name: M[0],
        version: M[1]
    };
}

function checkBrowserValidity() {
    var { name, version } = getBrowserInfo();

    function suggestUpgrade(browserName) {
        return window.confirm(`Upgrade to the latest version of ${browserName} in order to get the full features of x.igloorooms.com`);
    }
    const browsers = [{
        name: "Chrome",
        minVersion: 79,
        redirectUrl: "https://www.google.com/chrome/"
    }, {
        name: "Safari",
        minVersion: 14,
        redirectUrl: "https://www.apple.com/safari/"
    }, {
        name: "Firefox",
        minVersion: 70,
        redirectUrl: "https://www.mozilla.org/firefox/"
    }]

    const currentBrowser = browsers.find(b => b.name === name)
    if (!currentBrowser) {
        return;
    }
    if (version < currentBrowser.minVersion && suggestUpgrade(currentBrowser.name)) {
        window.location.href = currentBrowser.redirectUrl;
    }
}

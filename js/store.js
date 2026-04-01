/**
 * Data Management & Local Storage
 * Utilizes Base64 encoding to slightly obfuscate PII (Personal Identifiable Information)
 * in localStorage (demonstration purposes).
 */

const DATA_KEY = '_lucky_data';
const ACTIVE_KEY = '_lucky_active';

// Simple obfuscation
const encode = (data) => btoa(encodeURIComponent(JSON.stringify(data)));
const decode = (str) => JSON.parse(decodeURIComponent(atob(str)));

// Internal function to get the entire store
function getStore() {
    const data = localStorage.getItem(DATA_KEY);
    if (!data) return {};
    try {
        return decode(data);
    } catch (e) {
        console.error("Store decode error", e);
        return {};
    }
}

function saveStore(storeObj) {
    localStorage.setItem(DATA_KEY, encode(storeObj));
}

// Migrate old data if present (for backward compatibility)
(function migrateOldData() {
    const oldProfileStr = localStorage.getItem('_lucky_usr');
    if (oldProfileStr) {
        try {
            const oldProfile = JSON.parse(decodeURIComponent(atob(oldProfileStr)));
            const store = getStore();
            if (!store[oldProfile.name]) {
                const oldSettingsStr = localStorage.getItem('_lucky_cfg');
                const oldHistoryStr = localStorage.getItem('_lucky_hst');
                
                store[oldProfile.name] = {
                    profile: oldProfile,
                    settings: oldSettingsStr ? JSON.parse(decodeURIComponent(atob(oldSettingsStr))) : { pushEnabled: false, pushTime: '08:00' },
                    history: oldHistoryStr ? JSON.parse(decodeURIComponent(atob(oldHistoryStr))) : []
                };
                saveStore(store);
                localStorage.setItem(ACTIVE_KEY, encode(oldProfile.name));
            }
            // Clear old keys
            localStorage.removeItem('_lucky_usr');
            localStorage.removeItem('_lucky_cfg');
            localStorage.removeItem('_lucky_hst');
        } catch(e) {}
    }
})();

export const Store = {
    getAllProfiles() {
        const store = getStore();
        return Object.values(store).map(s => s.profile);
    },

    getActiveProfileName() {
        const active = localStorage.getItem(ACTIVE_KEY);
        if (!active) return null;
        try {
            return decode(active);
        } catch(e) {
            return null;
        }
    },

    setActiveProfileName(name) {
        if (!name) {
            localStorage.removeItem(ACTIVE_KEY);
        } else {
            localStorage.setItem(ACTIVE_KEY, encode(name));
        }
    },

    hasProfile() {
        return this.getActiveProfileName() !== null;
    },

    getProfile(name = this.getActiveProfileName()) {
        if (!name) return null;
        const store = getStore();
        return store[name] ? store[name].profile : null;
    },

    saveProfile(profileData, isUpdate = false, originalName = null) {
        const store = getStore();
        let targetName = profileData.name;

        // 완벽히 동일한 데이터로 새 프로필 저장을 시도할 경우 중복 방지 스킵
        if (!isUpdate && store[targetName]) {
            if (JSON.stringify(store[targetName].profile) === JSON.stringify(profileData)) {
                this.setActiveProfileName(targetName);
                return targetName;
            }
        }

        // Auto-numbering if not an update or if the name changed during an update
        if ((!isUpdate) || (isUpdate && originalName !== targetName)) {
            let counter = 2;
            let tempName = targetName;
            while (store[tempName]) {
                tempName = `${targetName} ${counter}`;
                counter++;
            }
            targetName = tempName;
            profileData.name = targetName;
        }

        if (isUpdate && originalName && originalName !== targetName) {
            // Name changed: move data over to new name
            store[targetName] = store[originalName];
            delete store[originalName];
            if (this.getActiveProfileName() === originalName) {
                this.setActiveProfileName(targetName);
            }
        }

        if (!store[targetName]) {
            store[targetName] = {
                profile: profileData,
                settings: { pushEnabled: false, pushTime: '08:00' },
                history: []
            };
        } else {
            store[targetName].profile = profileData;
        }

        saveStore(store);
        
        // If it's the first profile created, or an update to the active one, make it active
        if (!this.getActiveProfileName() || (isUpdate && this.getActiveProfileName() === originalName)) {
            this.setActiveProfileName(targetName);
        }
        
        return targetName;
    },

    deleteProfile(name) {
        if (!name) return;
        const store = getStore();
        if (store[name]) {
            delete store[name];
            saveStore(store);
            
            // Auto switch active profile or clear
            if (this.getActiveProfileName() === name) {
                const keys = Object.keys(store);
                if (keys.length > 0) {
                    this.setActiveProfileName(keys[0]);
                } else {
                    this.setActiveProfileName(null);
                }
            }
        }
    },

    getSettings(name = this.getActiveProfileName()) {
        if (!name) return { pushEnabled: false, pushTime: '08:00' };
        const store = getStore();
        return store[name] && store[name].settings ? store[name].settings : { pushEnabled: false, pushTime: '08:00' };
    },

    saveSettings(settingsData, name = this.getActiveProfileName()) {
        if (!name) return;
        const store = getStore();
        if (store[name]) {
            store[name].settings = settingsData;
            saveStore(store);
        }
    },

    saveHistory(dateStr, fortuneData, name = this.getActiveProfileName()) {
        if (!name) return;
        const store = getStore();
        if (store[name]) {
            let history = store[name].history || [];
            const existingIdx = history.findIndex(h => h.date === dateStr);
            if (existingIdx > -1) {
                history[existingIdx] = { date: dateStr, data: fortuneData };
            } else {
                history.unshift({ date: dateStr, data: fortuneData });
            }
            store[name].history = history;
            saveStore(store);
        }
    },

    getHistory(name = this.getActiveProfileName()) {
        if (!name) return [];
        const store = getStore();
        return store[name] && store[name].history ? store[name].history : [];
    },

    getAllHistoryWithNames() {
        const store = getStore();
        let combined = [];
        for (const name in store) {
            const hist = store[name].history || [];
            hist.forEach(item => {
                combined.push({
                    profileName: name,
                    date: item.date,
                    data: item.data
                });
            });
        }
        // sort descending by date
        combined.sort((a, b) => b.date.localeCompare(a.date));
        return combined;
    },

    clearAll() {
        localStorage.removeItem(DATA_KEY);
        localStorage.removeItem(ACTIVE_KEY);
    }
};

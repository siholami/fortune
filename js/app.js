import { Store } from './store.js';
import { Engine } from './engine.js';
import { UI } from './ui.js';
import { Push } from './push.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Navigation Setup
    const headerLogo = document.getElementById('header-logo');
    if (headerLogo) {
        headerLogo.addEventListener('click', () => {
            const form = document.getElementById('profile-form');
            if(form) form.reset();
            loadProfileList(true);
        });
    }

    const navMenu = document.getElementById('nav-menu');
    if (navMenu) {
        navMenu.addEventListener('click', () => {
            const form = document.getElementById('profile-form');
            if(form) form.reset();
            loadProfileList(true);
        });
    }

    document.getElementById('nav-profile').addEventListener('click', () => {
        if (!Store.hasProfile()) {
            alert('먼저 프로필을 생성해주세요.');
            return;
        }
        UI.populateEditForm(Store.getProfile(), Store.getSettings());
        UI.switchView('view-profile');
    });

    // Date Auto Focus Logic
    function setupDateAutofocus(prefix) {
        const y = document.getElementById(prefix + 'year');
        const m = document.getElementById(prefix + 'month');
        const d = document.getElementById(prefix + 'day');
        if(!y || !m || !d) return;

        y.addEventListener('input', () => {
            if (y.value.length === 4) m.focus();
        });
        m.addEventListener('input', () => {
            if (m.value.length === 2) d.focus();
        });
    }

    setupDateAutofocus('birth-');
    setupDateAutofocus('edit-birth-');

    function getBirthDate(prefix) {
        const y = document.getElementById(prefix + 'year').value.trim();
        const m = document.getElementById(prefix + 'month').value.trim().padStart(2, '0');
        const d = document.getElementById(prefix + 'day').value.trim().padStart(2, '0');
        if (!y || !m || !d) return '';
        return `${y}-${m}-${d}`;
    }

    function showToast() {
        const t = document.getElementById('toast-message');
        t.classList.remove('hidden');
        setTimeout(() => t.classList.add('hidden'), 2000);
    }

    function getNewProfileData() {
        const mbtiVal = document.getElementById('mbti').value;
        const bDate = getBirthDate('birth-');
        if (!mbtiVal || !bDate) {
            alert('생년월일이나 MBTI 등을 정확히 입력해주세요.');
            return null;
        }

        const profileData = {
            name: document.getElementById('name').value.trim(),
            birthType: document.getElementById('birth-type').value,
            birthDate: bDate,
            birthTime: document.getElementById('birth-time').value,
            bloodType: document.getElementById('blood-type').value,
            mbti: mbtiVal
        };

        if(!profileData.name) {
            alert("이름을 입력해주세요.");
            return null;
        }
        return profileData;
    }

    document.getElementById('btn-save-only').addEventListener('click', () => {
        const data = getNewProfileData();
        if(data) {
            Store.saveProfile(data, false);
            showToast();
        }
    });

    // 2. Form Submission (New Profile / Onboarding - 일회성 분석)
    document.getElementById('profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = getNewProfileData();
        if (data) {
            // 저장하지 않고 일회성으로 분석만 실행
            await loadDashboard(data);
        }
    });

    // 3. EDIT Form Submission (Update Profile)
    document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const mbtiVal = document.getElementById('edit-mbti').value;
        const bDate = getBirthDate('edit-birth-');
        
        if (!mbtiVal || !bDate) {
            alert('생년월일과 MBTI를 정확히 입력해주세요.');
            return;
        }

        const profileData = {
            name: document.getElementById('edit-name').value.trim(),
            birthType: document.getElementById('edit-birth-type').value,
            birthDate: bDate,
            birthTime: document.getElementById('edit-birth-time').value,
            bloodType: document.getElementById('edit-blood-type').value,
            mbti: mbtiVal
        };

        if(!profileData.name) {
            alert("이름을 입력해주세요.");
            return;
        }

        const originalName = document.getElementById('edit-original-name').value;
        const newName = Store.saveProfile(profileData, true, originalName);
        
        // Save push settings
        const settings = Store.getSettings(newName);
        settings.pushEnabled = document.getElementById('push-enabled').checked;
        settings.pushTime = document.getElementById('push-time').value;
        Store.saveSettings(settings, newName);

        if (settings.pushEnabled) {
            Push.scheduleDaily(settings.pushTime, Store.getProfile(newName).name);
        } else {
            Push.clearSchedule(Store.getProfile(newName).name);
        }

        alert('정보가 수정되었습니다.');
        await loadDashboard();
    });

    document.getElementById('btn-delete-profile').addEventListener('click', () => {
        const originalName = document.getElementById('edit-original-name').value;
        if(confirm(`'${originalName}'님의 프로필과 모든 운세 기록을 삭제하시겠습니까?`)) {
            Store.deleteProfile(originalName);
            if (Store.hasProfile()) {
                loadProfileList();
            } else {
                UI.switchView('view-onboarding');
            }
        }
    });

    // 4. MBTI Test Modal (For both forms)
    document.getElementById('btn-mbti-test').addEventListener('click', () => {
        UI.showMbtiModal((resultMbti) => {
            document.getElementById('mbti').value = resultMbti;
        });
    });

    document.getElementById('btn-edit-mbti-test').addEventListener('click', () => {
        UI.showMbtiModal((resultMbti) => {
            document.getElementById('edit-mbti').value = resultMbti;
        });
    });

    // Formal Test Binding handled in HTML via anchor tags
    // 5. Push Notification Request
    document.getElementById('btn-enable-push').addEventListener('click', async () => {
        const granted = await Push.requestPermission();
        if (granted) {
            const activeName = Store.getActiveProfileName();
            if (!activeName) {
                alert('프로필을 먼저 저장한 후 알림을 설정할 수 있습니다.');
                return;
            }
            const settings = Store.getSettings(activeName);
            settings.pushEnabled = true;
            
            const dashPushTime = document.getElementById('dash-push-time');
            if (dashPushTime) {
                settings.pushTime = dashPushTime.value;
            }

            Store.saveSettings(settings, activeName);
            document.getElementById('push-promo').style.display = 'none';
            alert('지정된 시간에 알림이 설정되었습니다! 서비스워커를 통해 매일 발송됩니다.');
            Push.scheduleDaily(settings.pushTime, activeName);
        }
    });

    // 6. Dashboard & List Actions
    document.getElementById('btn-go-onboarding').addEventListener('click', () => {
        loadProfileList(true);
    });

    document.getElementById('btn-add-new-profile').addEventListener('click', () => {
        document.getElementById('profile-form').reset();
        loadProfileList(true);
    });

    let currentHistoryTab = 'profile';
    function loadHistoryView(tab) {
        currentHistoryTab = tab;
        const btnAll = document.getElementById('tab-history-all');
        const btnProfile = document.getElementById('tab-history-profile');
        
        if (tab === 'all') {
            btnAll.classList.replace('text-muted', 'active-tab');
            btnAll.style.borderBottomColor = 'var(--stark-black)';
            btnAll.style.opacity = '1';
            
            btnProfile.classList.replace('active-tab', 'text-muted');
            btnProfile.style.borderBottomColor = 'transparent';
            btnProfile.style.opacity = '0.6';
            
            const history = Store.getAllHistoryWithNames();
            UI.renderHistory(history, handleHistoryClick);
        } else {
            btnProfile.classList.replace('text-muted', 'active-tab');
            btnProfile.style.borderBottomColor = 'var(--stark-black)';
            btnProfile.style.opacity = '1';
            
            btnAll.classList.replace('active-tab', 'text-muted');
            btnAll.style.borderBottomColor = 'transparent';
            btnAll.style.opacity = '0.6';
            
            const activeProfileStr = Store.getActiveProfileName();
            const rawHist = Store.getHistory(activeProfileStr);
            const history = rawHist.map(h => ({
                profileName: activeProfileStr,
                date: h.date,
                data: h.data
            }));
            UI.renderHistory(history, handleHistoryClick);
        }
    }

    document.getElementById('tab-history-all').addEventListener('click', () => {
        loadHistoryView('all');
    });

    document.getElementById('tab-history-profile').addEventListener('click', () => {
        loadHistoryView('profile');
    });

    function handleHistoryClick(item) {
        UI.renderDashboard(item.data, item.profileName);
        document.getElementById('date-display').textContent = `${item.date}의 과거 운세 기록`;
        
        document.getElementById('dash-normal-actions').classList.add('hidden');
        document.getElementById('dash-history-actions').classList.remove('hidden');
        
        UI.switchView('view-dashboard');
    }

    document.getElementById('btn-return-today').addEventListener('click', () => {
        document.getElementById('dash-normal-actions').classList.remove('hidden');
        document.getElementById('dash-history-actions').classList.add('hidden');
        loadDashboard();
    });

    document.getElementById('btn-view-history').addEventListener('click', () => {
        loadHistoryView('profile');
        UI.switchView('view-history');
    });

    document.getElementById('btn-history-back').addEventListener('click', () => {
        UI.switchView('view-dashboard');
    });

    // Sub-routines
    function loadProfileList(switchView = true) {
        const profiles = Store.getAllProfiles();
        const activeName = Store.getActiveProfileName();
        UI.renderProfileList(profiles, activeName, {
            onSelect: (selectedName) => {
                Store.setActiveProfileName(selectedName);
                loadDashboard();
            },
            onEdit: (name) => {
                Store.setActiveProfileName(name);
                UI.populateEditForm(Store.getProfile(name), Store.getSettings(name));
                UI.switchView('view-profile');
            },
            onDelete: (name) => {
                if(confirm(`'${name}'님의 프로필을 삭제하시겠습니까?`)) {
                    Store.deleteProfile(name);
                    if(Store.hasProfile()) loadProfileList(switchView);
                    else UI.switchView('view-onboarding');
                }
            }
        });
        if(switchView) {
            UI.switchView('view-onboarding');
        }
    }

    async function loadDashboard(guestData = null) {
        const btn = document.querySelector('button[type="submit"]');
        if(btn) {
            btn.textContent = '분석 중...';
            btn.disabled = true;
        }

        try {
            const isGuest = guestData !== null;
            const profile = isGuest ? guestData : Store.getProfile();
            
            if (!profile) return loadProfileList();

            UI.updateDate();
            
            const d = new Date();
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            
            let analysisData;
            
            // 저장된 프로필이고 오늘 이미 측정한 기록이 있다면 재측정 스킵
            if (!isGuest) {
                const history = Store.getHistory(profile.name);
                const todayRecord = history.find(h => h.date === dateStr);
                if (todayRecord) {
                    analysisData = todayRecord.data;
                }
            }

            if (!analysisData) {
                analysisData = await Engine.analyze(profile);
                if (!isGuest) {
                    Store.saveHistory(dateStr, analysisData, profile.name);
                }
            }
            
            UI.renderDashboard(analysisData, profile.name);
            
            const careerTitleEl = document.getElementById('career-title');
            if (careerTitleEl) {
                careerTitleEl.innerHTML = analysisData.careerTitle || "💼 직장/사업운";
            }

            UI.switchView('view-dashboard');

            const pushCard = document.getElementById('push-promo');
            if (pushCard) {
                if (isGuest) {
                    pushCard.style.display = 'none'; // 게스트는 알림 안보임
                } else {
                    const settings = Store.getSettings(profile.name);
                    if (settings.pushEnabled || Push.checkPermission()) {
                        pushCard.style.display = 'none';
                    } else {
                        pushCard.style.display = 'flex'; // style flex since we changed it in HTML
                    }
                }
            }

        } catch (error) {
            console.error(error);
            alert("운세 분석 중 오류가 발생했습니다.");
        } finally {
            if(btn) {
                btn.textContent = '완료';
                setTimeout(() => {
                    btn.textContent = '나만의 운세 분석하기';
                    btn.disabled = false;
                }, 500);
            }
        }
    }

    // App Initialization Logic
    // Register Push SW early if available
    Push.init();

    if (Store.hasProfile()) {
        const profile = Store.getProfile();
        const d = new Date();
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        // 당일 기록이 있다면 애니메이션 딜레이 없이 즉시 대시보드 표시
        const history = Store.getHistory(profile.name);
        const todayRecord = history.find(h => h.date === dateStr);
        
        if (todayRecord) {
            UI.switchView('view-dashboard'); // 즉각 렌더링 화면 띄우기
        }
        
        loadDashboard(); // 캐시 데이터로 빠르게 채움
    } else {
        UI.switchView('view-onboarding');
    }

});

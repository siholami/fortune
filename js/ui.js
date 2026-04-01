/**
 * UI Controller
 * Manages view transitions and chart animations
 */
import { Avatar } from './avatar.js';

export const UI = {
    switchView(viewId) {
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });
        const target = document.getElementById(viewId);
        target.classList.remove('hidden');
        // allow browser to paint hidden to block transition briefly
        setTimeout(() => target.classList.add('active'), 10);
        
        window.scrollTo(0, 0);
    },

    updateDate() {
        const d = new Date();
        const str = `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
        document.getElementById('date-display').textContent = `${str}의 통합 운세`;
    },

    renderDashboard(data, profileName) {
        document.getElementById('user-name-display').textContent = profileName;
        document.getElementById('synthesis-summary').textContent = data.summary;
        
        const idiomTitle = document.getElementById('idiom-title');
        const idiomDesc = document.getElementById('idiom-desc');
        if (idiomTitle && data.idiom) {
            idiomTitle.textContent = data.idiom;
            idiomDesc.textContent = data.idiomDesc;
        }
        
        document.getElementById('adv-overall').textContent = data.categories.overall;
        document.getElementById('adv-love').textContent = data.categories.love;
        document.getElementById('adv-wealth').textContent = data.categories.wealth;
        document.getElementById('adv-career').textContent = data.categories.career;
        document.getElementById('adv-health').textContent = data.categories.health;
        
        document.getElementById('tag-zodiac').textContent = data.zodiac;
        document.getElementById('tag-mbti').textContent = data.mbti;
        document.getElementById('tag-blood').textContent = `${data.blood}형`;

        // Animate Biorhythm Bars and Comments
        const getBioDesc = (val) => val >= 70 ? "최상 🌟" : (val <= 30 ? "주의 ⚠️" : "보통 🟢");
        
        document.getElementById('bio-physical-text').textContent = getBioDesc(data.biorhythm.physical);
        document.getElementById('bio-emotional-text').textContent = getBioDesc(data.biorhythm.emotional);
        document.getElementById('bio-intellectual-text').textContent = getBioDesc(data.biorhythm.intellectual);

        setTimeout(() => {
            document.getElementById('bio-physical').style.width = `${data.biorhythm.physical}%`;
            document.getElementById('bio-emotional').style.width = `${data.biorhythm.emotional}%`;
            document.getElementById('bio-intellectual').style.width = `${data.biorhythm.intellectual}%`;
        }, 300);

        this.animateCircularScore(data.score);

        // Load 3D avatar
        Avatar.init('avatar-container', data.score);
    },

    animateCircularScore(score) {
        const circle = document.getElementById('score-path');
        const text = document.getElementById('score-text');
        
        // reset
        circle.style.strokeDasharray = `0, 100`;
        text.textContent = '0';
        
        setTimeout(() => {
            circle.style.strokeDasharray = `${score}, 100`;
            
            // Number counter animation
            let current = 0;
            const inc = score / 30; // 30 frames
            const textInterval = setInterval(() => {
                current += inc;
                if (current >= score) {
                    current = score;
                    clearInterval(textInterval);
                }
                text.textContent = Math.round(current);
            }, 30);
            
            // Change color based on score (Using Bauhaus colors)
            if (score >= 80) circle.style.stroke = 'var(--bh-red)';
            else if (score >= 50) circle.style.stroke = 'var(--bh-yellow)';
            else circle.style.stroke = 'var(--bh-blue)';
            
        }, 500);
    },

    populateEditForm(profile, settings) {
        if (!profile) return;
        document.getElementById('edit-page-title').textContent = `${profile.name}님의 프로필 설정`;
        document.getElementById('edit-original-name').value = profile.name;
        document.getElementById('edit-name').value = profile.name;
        document.getElementById('edit-birth-type').value = profile.birthType;
        
        const [y, m, d] = (profile.birthDate || '').split('-');
        document.getElementById('edit-birth-year').value = y || '';
        document.getElementById('edit-birth-month').value = m || '';
        document.getElementById('edit-birth-day').value = d || '';

        document.getElementById('edit-birth-time').value = profile.birthTime;
        document.getElementById('edit-blood-type').value = profile.bloodType;
        document.getElementById('edit-mbti').value = profile.mbti;
        
        document.getElementById('push-enabled').checked = settings.pushEnabled || false;
        document.getElementById('push-time').value = settings.pushTime || '08:00';
    },

    renderProfileList(profiles, activeName, callbacks) {
        const { onSelect, onEdit, onDelete } = callbacks;
        const container = document.getElementById('profile-list-container');
        container.innerHTML = '';

        if (profiles.length === 0) {
            container.innerHTML = `<p class="sub-text text-center" style="grid-column: 1/-1;">저장된 프로필이 없습니다. 새 프로필을 추가해보세요.</p>`;
            return;
        }

        profiles.forEach(p => {
            const isActive = p.name === activeName;
            const card = document.createElement('div');
            card.className = `bauhaus-card list-card ${isActive ? 'active-profile' : ''}`;
            card.style.padding = '16px';
            card.style.border = isActive ? '3px solid var(--bh-red)' : 'var(--border-thin) solid var(--stark-black)';
            
            card.innerHTML = `
                <h3 style="margin-bottom:8px;">${p.name} ${isActive ? '✨' : ''}</h3>
                <p class="sub-text mb-0">${p.birthDate}</p>
                <p class="sub-text mb-0">${p.mbti} | ${p.bloodType}형</p>
                <div class="list-card-actions">
                    <button class="ca-select">운세 확인</button>
                    <button class="ca-edit">수정</button>
                    <button class="ca-delete" style="color: white; background-color: var(--bh-red); padding: 4px 12px; border-radius: 4px; border: none; cursor: pointer; font-weight: bold; margin-left: auto;">삭제</button>
                </div>
            `;

            card.querySelector('.ca-select').addEventListener('click', () => onSelect(p.name));
            card.querySelector('.ca-edit').addEventListener('click', () => onEdit(p.name));
            card.querySelector('.ca-delete').addEventListener('click', () => onDelete(p.name));

            container.appendChild(card);
        });
    },

    showMbtiModal(onComplete) {
        const modal = document.getElementById('mbti-modal');
        const qContainer = document.getElementById('mbti-questions');
        modal.classList.remove('hidden');

        // 4 Questions for full MBTI
        qContainer.innerHTML = `
            <div class="mbti-question">
                <p>1. 에너지를 얻는 방식은?</p>
                <div class="mbti-options">
                    <button type="button" class="btn btn-outline mbti-sel" data-idx="0" data-val="E">외부 활동과 만남</button>
                    <button type="button" class="btn btn-outline mbti-sel" data-idx="0" data-val="I">혼자만의 휴식</button>
                </div>
            </div>
            <div class="mbti-question">
                <p>2. 정보를 받아들이는 방식은?</p>
                <div class="mbti-options">
                    <button type="button" class="btn btn-outline mbti-sel" data-idx="1" data-val="S">현실적이고 구체적인 사실</button>
                    <button type="button" class="btn btn-outline mbti-sel" data-idx="1" data-val="N">직관과 숨겨진 의미</button>
                </div>
            </div>
            <div class="mbti-question">
                <p>3. 결정을 내리는 기준은?</p>
                <div class="mbti-options">
                    <button type="button" class="btn btn-outline mbti-sel" data-idx="2" data-val="T">논리와 객관적 타당성</button>
                    <button type="button" class="btn btn-outline mbti-sel" data-idx="2" data-val="F">사람들의 감정과 조화</button>
                </div>
            </div>
            <div class="mbti-question">
                <p>4. 라이프 스타일은?</p>
                <div class="mbti-options">
                    <button type="button" class="btn btn-outline mbti-sel" data-idx="3" data-val="J">철저한 계획과 체계화</button>
                    <button type="button" class="btn btn-outline mbti-sel" data-idx="3" data-val="P">상황에 따른 유연한 대처</button>
                </div>
            </div>
            <p class="sub-text mt-4 text-center">모든 항목(4개)을 선택하시면 자동으로 완성됩니다.</p>
        `;

        let result = [null, null, null, null];

        const btns = qContainer.querySelectorAll('.mbti-sel');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-idx'));
                const val = e.target.getAttribute('data-val');
                
                result[idx] = val;
                
                // toggle active state
                const siblings = e.target.parentElement.querySelectorAll('.mbti-sel');
                siblings.forEach(s => {
                    s.classList.remove('btn-red');
                    s.classList.add('btn-outline');
                }); 
                e.target.classList.remove('btn-outline');
                e.target.classList.add('btn-red');

                // Check if all are selected
                if (!result.includes(null)) {
                    setTimeout(() => {
                        modal.classList.add('hidden');
                        onComplete(result.join(''));
                    }, 500);
                }
            });
        });

        document.getElementById('btn-close-mbti').onclick = () => {
            modal.classList.add('hidden');
        };
    },

    renderHistory(historyData, onHistoryClick) {
        const container = document.getElementById('history-list');
        container.innerHTML = '';
        
        if (!historyData || historyData.length === 0) {
            container.innerHTML = '<p class="sub-text text-center mt-4">아직 운세 기록이 없습니다.</p>';
            return;
        }

        let currentIndex = 0;
        const pageSize = 5;

        if (this._historyObserver) {
            this._historyObserver.disconnect();
        }

        const loadMore = () => {
            const nextBatch = historyData.slice(currentIndex, currentIndex + pageSize);
            if (nextBatch.length === 0) return;

            nextBatch.forEach(item => {
                const div = document.createElement('div');
                div.className = 'history-item';
                div.style.cursor = 'pointer';
                div.innerHTML = `
                    <div class="history-date">${item.profileName} - ${item.date}</div>
                    <div class="history-score">종합 지수: <span style="color:var(--bh-red); font-weight:900">${item.data.score}점</span></div>
                    <p class="sub-text" style="margin-top:8px">${item.data.summary}</p>
                `;
                if (onHistoryClick) {
                    div.addEventListener('click', () => onHistoryClick(item));
                }
                container.appendChild(div);
            });

            currentIndex += pageSize;

            if (this._historyObserver) {
                this._historyObserver.disconnect();
            }
            if (currentIndex < historyData.length) {
                this._historyObserver.observe(container.lastElementChild);
            } else {
                const endMsg = document.createElement('p');
                endMsg.className = 'sub-text text-center mt-4';
                endMsg.style.fontSize = '0.9rem';
                endMsg.style.opacity = '0.6';
                endMsg.textContent = '모든 운세 기록을 불러왔습니다.';
                container.appendChild(endMsg);
            }
        };

        this._historyObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                loadMore();
            }
        }, { rootMargin: '100px' });

        // Initial load
        loadMore();
    }
};

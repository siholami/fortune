/**
 * Synthesis Engine (Server Logic Mock)
 * Calculates Biorhythm, Zodiac, and resolves conflicting traits.
 */

// Biorhythm Constants
const CYCLES = {
    physical: 23,
    emotional: 28,
    intellectual: 33
};

function getDaysSinceBirth(birthDateStr) {
    const birth = new Date(birthDateStr);
    const today = new Date();
    const utcBirth = Date.UTC(birth.getFullYear(), birth.getMonth(), birth.getDate());
    const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.floor((utcToday - utcBirth) / (1000 * 60 * 60 * 24));
}

function calculateBiorhythm(birthDateStr) {
    const days = getDaysSinceBirth(birthDateStr);
    const getValue = (cycle) => {
        const val = Math.sin((2 * Math.PI * days) / cycle);
        return Math.round((val + 1) / 2 * 100);
    };

    return {
        physical: getValue(CYCLES.physical),
        emotional: getValue(CYCLES.emotional),
        intellectual: getValue(CYCLES.intellectual)
    };
}

function getZodiac(dateStr) {
    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const day = d.getDate();

    if ((m == 3 && day >= 21) || (m == 4 && day <= 19)) return { name: "양자리", element: "Fire", temp: "hot" };
    if ((m == 4 && day >= 20) || (m == 5 && day <= 20)) return { name: "황소자리", element: "Earth", temp: "stable" };
    if ((m == 5 && day >= 21) || (m == 6 && day <= 21)) return { name: "쌍둥이자리", element: "Air", temp: "social" };
    if ((m == 6 && day >= 22) || (m == 7 && day <= 22)) return { name: "게자리", element: "Water", temp: "emotional" };
    if ((m == 7 && day >= 23) || (m == 8 && day <= 22)) return { name: "사자자리", element: "Fire", temp: "hot" };
    if ((m == 8 && day >= 23) || (m == 9 && day <= 22)) return { name: "처녀자리", element: "Earth", temp: "stable" };
    if ((m == 9 && day >= 23) || (m == 10 && day <= 22)) return { name: "천칭자리", element: "Air", temp: "social" };
    if ((m == 10 && day >= 23) || (m == 11 && day <= 21)) return { name: "전갈자리", element: "Water", temp: "emotional" };
    if ((m == 11 && day >= 22) || (m == 12 && day <= 21)) return { name: "사수자리", element: "Fire", temp: "hot" };
    if ((m == 12 && day >= 22) || (m == 1 && day <= 19)) return { name: "염소자리", element: "Earth", temp: "stable" };
    if ((m == 1 && day >= 20) || (m == 2 && day <= 18)) return { name: "물병자리", element: "Air", temp: "social" };
    return { name: "물고기자리", element: "Water", temp: "emotional" };
}

function getSajuMock(birthDateStr) {
    const year = parseInt(birthDateStr.split('-')[0]);
    const energyLevel = (year % 5);
    const elements = ["목(초목)", "화(불꽃)", "토(대지)", "금(바위)", "수(강물)"];
    
    return {
        element: elements[energyLevel],
        score: 60 + (year % 30),
        luckType: energyLevel === 1 || energyLevel === 3 ? 'active' : 'passive' 
    };
}

function getDailyRandom(name, dateStr) {
    let seed = 0;
    const str = name + dateStr;
    for (let i = 0; i < str.length; i++) {
        seed = (seed * 31 + str.charCodeAt(i)) % 10000;
    }
    return 50 + (seed / 10000) * 40; // 50~90
}

export const Engine = {
    async analyze(profile) {
        await new Promise(r => setTimeout(r, 1000));

        const d = new Date();
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        
        const bio = calculateBiorhythm(profile.birthDate);
        const zodiac = getZodiac(profile.birthDate);
        const saju = getSajuMock(profile.birthDate);
        const dailyRandom = getDailyRandom(profile.name, dateStr);

        const bioAvg = Math.round((bio.physical + bio.emotional + bio.intellectual) / 3);
        const overallScore = Math.round((bioAvg * 0.3) + (saju.score * 0.4) + (dailyRandom * 0.3));

        let todaySummary = "";

        if (overallScore >= 80) todaySummary = "모든 기운이 당신을 향해 열려있는 완벽한 하루예요!";
        else if (overallScore >= 60) todaySummary = "무난하고 안정적인 기류가 흐르는 하루네요.";
        else todaySummary = "잠시 숨을 고르고 신중하게 결정해야 할 시기예요.";

        let synthesisText = "";
        const isRational = profile.mbti.includes('T');

        if (bio.physical < 40 && saju.luckType === 'active') {
            synthesisText += `사주 흐름을 보면 바깥 활동이나 새로운 일을 시작하기 아주 좋은 시기인데, 안타깝게도 지금 신체 리듬(${bio.physical}%)이 잘 따라주지 않네요. `;
            if (isRational) synthesisText += `타고난 분석적인 성향(${profile.mbti})을 발휘해서 무리하게 움직이기보다는 철저하게 계획을 세우고 다른 사람에게 일을 맡기는 전략을 써보는 건 어떨까요? `;
            else synthesisText += `중요한 결정이 있다면 혼자 안고 가기보다 주변의 믿을 수 있는 사람에게 조언을 구해서 체력 소모를 최대한 줄여보세요. `;
        } 
        else if (bio.physical > 80 && saju.luckType === 'passive') {
            synthesisText += `몸에 활력이 넘치고 의욕이 솟구치는 기분 좋은 날이에요! 다만 운의 흐름은 밖으로 뻗어나가기보다 내면을 지키는 쪽을 가리키고 있네요. 넘치는 에너지를 무리하게 발산하기보다는, 미뤄뒀던 개인적인 공부나 재정비에 쏟는다면 나중에 훨씬 강력한 무기가 될 거예요. `;
        }
        else {
            if (bio.intellectual > 75) synthesisText += `지성 리듬이 최고조에 달해 있어요. 계속 꼬여있던 문제를 해결하거나 번뜩이는 새로운 아이디어를 제안하기에 딱 좋은 타이밍이네요! `;
            else if (bio.emotional > 75) synthesisText += `감각과 직관이 아주 예리해지는 날이에요. ${zodiac.name}의 기운과 잘 어우러져서 주변 사람들에게 부드러운 리더십을 발휘하기 좋을 거예요. `;
            else synthesisText += `평온한 마음가짐이 가장 중요한 날이에요. 무리하게 새로운 변화를 시도하기보다는 일상을 단단하게 지키는 것이 결국 좋은 운을 불러올 거예요. `;
        }

        synthesisText += `(참고: 핵심 기운인 ${saju.element}과 ${profile.bloodType}형의 성향이 좋은 시너지를 내고 있어요)`;

        const categories = { overall: synthesisText, love: "", wealth: "", career: "", health: "" };

        // Career / Academic based on Age
        const birthYear = parseInt(profile.birthDate.split('-')[0]);
        const age = d.getFullYear() - birthYear;
        let careerTitle = "💼 직장/사업운";

        if (age < 20) {
            careerTitle = "📚 학업/시험운";
            if (bio.intellectual > 60) {
                categories.career = "머리가 맑아지고 집중력이 크게 향상되는 시기입니다. 평소 어려워하던 과목이나 복잡한 문제를 풀기에 아주 좋은 날이네요! 친구들과 스터디를 하거나 혼자 깊이 파고드는 공부 모두 흔들림 없이 해낼 수 있어요.";
            } else {
                categories.career = "오늘은 책상에 앉아있어도 딴생각이 들거나 진도가 잘 안 나갈 수 있어요. 너무 무리해서 새로운 진도를 빼기보다는, 예전에 틀렸던 문제를 가볍게 복습하거나 좋아하는 과목 위주로 흥미를 잃지 않는 선에서 공부를 조율해 보세요.";
            }
        } else {
            // Detailed career advice for adults
            if (bio.intellectual > 60 && saju.luckType === 'active') {
                categories.career = "직장 내 인간관계나 업무 성과에 있어 확실한 두각을 나타낼 수 있는 날입니다. 복잡한 보고서 작성이나 중요한 미팅이 예정되어 있다면, 본인의 숨겨진 통찰력을 마음껏 발휘해 보세요. 오늘은 상사나 동료들에게 당신의 제안이 매우 설득력 있게 다가갈 것입니다.";
            } else {
                categories.career = "업무적인 긴장감이 다소 높아지거나 타인과 의견 충돌이 발생할 수 있는 하루입니다. 큰 결정을 내리거나 이직/사업 전개를 서두르기보다는, 오늘 하루는 보수적인 관점에서 현재 진행 중인 업무의 마무리에만 집중하고 퇴근 후에는 완전히 스위치를 끄는 것이 좋습니다.";
            }
        }

        // Love
        if (bio.emotional > 70) categories.love = "감수성이 풍부해져서 대인관계나 연애에서 아주 긍정적인 기류가 흐르고 있어요. 평소 전하고 싶었던 솔직한 마음을 표현하기 참 좋은 날이네요.";
        else if (bio.emotional < 30) categories.love = "마음의 기복이 조금 생기기 쉬운 날이에요. 상대방의 말에 오해하지 않도록, 바로 반응하기보다 한 박자 쉬고 부드럽게 대답하는 게 좋아요.";
        else categories.love = "평온하고 안정적인 관계를 유지할 수 있는 무난한 하루예요. 가까운 사람과 소소하고 편안한 대화를 나누어 보는 건 어떨까요?";

        // Wealth
        if (saju.element === "금(바위)" || bio.intellectual > 80) categories.wealth = "이성적이고 날카로운 판단력이 돋보이는 하루예요! 재테크나 투자와 관련해서 중요한 정보를 얻거나 결정하기에 아주 유리한 시기랍니다.";
        else if (dailyRandom < 60) categories.wealth = "갑자기 충동적으로 소비하고 싶은 유혹이 생길 수 있어요. 지출 계획을 다시 한 번 꼼꼼히 점검해 보고, 꼭 필요한 곳에만 지갑을 여는 게 좋겠어요.";
        else categories.wealth = "금전운은 잔잔하고 평범한 수준이에요. 지금 당장 큰 이익을 좇기보다는 현재의 재무 상태를 차분히 점검하고 미래를 준비하는 일에 집중해 보세요.";

        // Health
        if (bio.physical > 75) categories.health = "컨디션이 아주 날아갈 듯 훌륭해요! 수시로 미뤄뒀던 운동을 본격적으로 시작하거나 활동적인 일정을 소화하기에 전혀 무리가 없겠어요.";
        else if (bio.physical < 40) categories.health = "오늘은 평소보다 피로가 훨씬 쉽게 쌓일 수 있는 날이에요. 과음이나 늦은 야식은 꼭 피하시고, 일찍 잠자리에 들어서 푹 쉬는 게 무엇보다 중요해요.";
        else categories.health = "전반적으로 무난하고 건강한 상태를 유지하고 있네요. 중간중간 가벼운 스트레칭을 하거나 짧고 상쾌한 산책으로 기분 좋은 활력을 불어넣어 주세요.";

        // Calculate idiom
        let idiom = "";
        let idiomDesc = "";
        if (overallScore >= 90) {
            idiom = "만사형통 (萬事亨通)";
            idiomDesc = "모든 일이 뜻하는 대로 시원하게 잘 풀리는 날입니다!";
        } else if (overallScore >= 80) {
            idiom = "승승장구 (乘勝長驅)";
            idiomDesc = "이긴 기세를 타고 계속 힘차게 나아가는 훌륭한 흐름입니다.";
        } else if (overallScore >= 70) {
            idiom = "유비무환 (有備無患)";
            idiomDesc = "미리 준비해 두면 근심할 일이 없으니 차분히 대비하세요.";
        } else if (overallScore >= 60) {
            idiom = "일취월장 (日就月將)";
            idiomDesc = "날마다 조금씩 끊임없이 발전하고 성취해 나가는 하루입니다.";
        } else if (overallScore >= 50) {
            idiom = "절차탁마 (切磋琢磨)";
            idiomDesc = "옥석을 갈고닦듯 지금은 묵묵히 내공을 쌓아야 할 시점입니다.";
        } else if (overallScore >= 40) {
            idiom = "전화위복 (轉禍爲福)";
            idiomDesc = "안 좋은 상황이 오히려 좋은 일로 뒤바뀔 수 있으니 희망을 가지세요.";
        } else {
            idiom = "와신상담 (臥薪嘗膽)";
            idiomDesc = "지금의 어려움을 참고 견디며 훗날 더 큰 도약을 준비할 때입니다.";
        }

        return {
            score: overallScore,
            summary: todaySummary,
            advice: synthesisText,
            categories: categories,
            careerTitle: careerTitle,
            biorhythm: bio,
            zodiac: zodiac.name,
            mbti: profile.mbti,
            blood: profile.bloodType,
            idiom: idiom,
            idiomDesc: idiomDesc
        };
    }
};

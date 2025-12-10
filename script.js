// 全局变量
let userName = "";
let userPoints = 0;
let activePrizes = [];
const COST_PER_DRAW = 10;
const PRIZE_HEIGHT = 80;
const HALF_PRIZE_HEIGHT = 0; // 保持精确对齐
const REPETITIONS = 6;

// DOM 元素引用
const prizeSetupPage = document.getElementById('prize-setup-page');
const lotteryPage = document.getElementById('lottery-page');
const pointsDisplay = document.getElementById('points-display');
const currentNameDisplay = document.getElementById('current-name');
const resultTextDisplay = document.getElementById('result-text-display');
const drawButton = document.getElementById('draw-button');
const inputName = document.getElementById('input-name');
const inputPoints = document.getElementById('input-points');
const inputPrizes = document.getElementById('input-prizes');
const probErrorDisplay = document.getElementById('prob-error');
const prizeRoller = document.getElementById('prize-roller');
const prizeCountDisplay = document.getElementById('prize-count');
const setNextUserButton = document.getElementById('set-next-user-button');

// 新增 DOM 元素引用
const prizeSetupSection = document.getElementById('prize-setup-section');
const togglePrizeSetupButton = document.getElementById('toggle-prize-setup');


/**
 * 新增函数：切换奖品设置的显示/隐藏状态。
 */
function togglePrizeSetup() {
    if (prizeSetupSection.style.display === 'none') {
        prizeSetupSection.style.display = 'block';
        togglePrizeSetupButton.textContent = '▼ 收起：奖品与概率设置';
    } else {
        prizeSetupSection.style.display = 'none';
        togglePrizeSetupButton.textContent = '▶️ 展开：奖品与概率设置';
    }
}


/**
 * 解析用户输入的奖品和概率，并计算累积概率。
 */
function parsePrizes() {
    const lines = inputPrizes.value.trim().split('\n').filter(line => line.trim() !== '');
    let totalProb = 0;
    let cumulativeProb = 0;
    const newPrizes = [];

    // 清空错误信息
    probErrorDisplay.textContent = "";

    for (const line of lines) {
        const parts = line.split(':');
        if (parts.length !== 2) {
            probErrorDisplay.textContent = `格式错误: "${line}"。应为 "名称:概率(%)"`;
            return null;
        }

        const name = parts[0].trim();
        const probPercent = parseFloat(parts[1].trim());

        if (isNaN(probPercent) || probPercent <= 0) {
            probErrorDisplay.textContent = `概率错误: "${line}"。概率必须是正数。`;
            return null;
        }

        // 将百分比转换为万分比 (例如 15% -> 1500)
        const probUnit = Math.round(probPercent * 100);

        cumulativeProb += probUnit;
        totalProb += probPercent;

        newPrizes.push({
            name: name,
            threshold: cumulativeProb // 存储累积阈值
        });
    }

    // 检查总概率是否为 100% (容忍 0.01% 的浮点误差)
    if (Math.abs(totalProb - 100) > 0.01) {
        probErrorDisplay.textContent = `概率总和必须为 100%。当前总和: ${totalProb.toFixed(2)}%。`;
        return null;
    }

    if (newPrizes.length === 0) {
        probErrorDisplay.textContent = `请设置至少一个奖品。`;
        return null;
    }

    probErrorDisplay.textContent = `✅ 概率总和正确 (${totalProb.toFixed(2)}%)，共 ${newPrizes.length} 项奖品。`;
    return newPrizes;
}

/**
 * 确认奖品设置，并切换到抽奖页面。
 */
function confirmPrizesAndStart() {
    const prizesData = parsePrizes();

    if (prizesData === null) {
        // 如果解析失败，强制展开设置部分，让用户看到错误
        if (prizeSetupSection.style.display === 'none') {
            togglePrizeSetup();
        }
        return; // 解析失败，停留在设置页
    }

    activePrizes = prizesData;

    // 提取用户输入的用户信息
    const name = inputName.value.trim();
    const points = parseInt(inputPoints.value);

    if (!name) {
        alert("请输入学生姓名！");
        return;
    }
    if (isNaN(points) || points < 0) {
        alert("请输入有效的初始积分数量！");
        return;
    }

    userName = name;
    userPoints = points;

    // 切换到抽奖页面，并初始化滚轮
    showLotteryPage();
}

/**
 * 切换到奖品设置页面 (第一页)
 */
function showPrizeSetup() {
    lotteryPage.style.display = 'none';
    prizeSetupPage.style.display = 'block';

    // 恢复用户积分到输入框，方便设置下一位时继续
    inputPoints.value = userPoints;

    // 确保回到设置页时，奖品设置部分是收起的（如果它当前是展开的）
    if (prizeSetupSection.style.display !== 'none') {
        togglePrizeSetup();
    }
}

/**
 * 切换到抽奖页面 (第二页)
 */
function showLotteryPage() {
    // 1. 切换界面
    prizeSetupPage.style.display = 'none';
    lotteryPage.style.display = 'block';

    // 2. 更新显示
    updateDisplay();

    // 3. 填充滚轮，使用新的 activePrizes
    populateRoller();

    // 4. 确保滚轮初始位置正确（空白）
    const prizesPerSet = activePrizes.length;
    const initialPosition = -(prizesPerSet * PRIZE_HEIGHT);
    prizeRoller.style.transition = 'none';
    prizeRoller.style.transform = `translateY(${initialPosition}px)`;

    // 5. 更新奖品数量显示
    prizeCountDisplay.textContent = prizesPerSet;

    // 6. 重置结果文本
    resultTextDisplay.textContent = "点击按钮开始抽奖！";
    resultTextDisplay.className = 'result-text win-text';

    // 7. 清空设置输入框，准备下一位用户输入
    inputName.value = "";
    inputPoints.value = "0";
}

/**
 * 填充滚动区域的奖品列表
 */
function populateRoller() {
    if (activePrizes.length === 0) return;

    const prizeNames = activePrizes.map(p => p.name);
    prizeRoller.innerHTML = '';

    for (let i = 0; i < REPETITIONS; i++) {
        prizeNames.forEach(name => {
            const item = document.createElement('div');
            item.className = 'prize-item';
            item.textContent = name;
            prizeRoller.appendChild(item);
        });
    }
}

/**
 * 更新页面上的积分和姓名显示
 */
function updateDisplay() {
    currentNameDisplay.textContent = userName;
    pointsDisplay.textContent = userPoints;

    drawButton.disabled = userPoints < COST_PER_DRAW;
    if (userPoints < COST_PER_DRAW) {
        drawButton.textContent = "积分不足 10，无法抽奖";
    } else {
        drawButton.textContent = `消耗 ${COST_PER_DRAW} 积分，开始抽奖！`;
    }

    setNextUserButton.textContent = `设置下一位学生 (${userName} 的 ${userPoints} 积分已保留)`;

    // 如果在设置页，则更新设置页的积分输入框
    if (prizeSetupPage.style.display !== 'none') {
        inputPoints.value = userPoints;
    }
}

/**
 * 根据随机数返回奖品对象
 */
function getPrize(randomNumber) {
    // randomNumber 范围是 1 到 10000
    for (const prize of activePrizes) {
        if (randomNumber <= prize.threshold) {
            return prize;
        }
    }
    return { name: "系统错误", threshold: 10000 };
}

/**
 * 开始抽奖流程
 */
function startDraw() {
    if (userPoints < COST_PER_DRAW) {
        alert("积分不足，请获取更多积分。");
        return;
    }
    if (activePrizes.length === 0) {
        alert("请先返回设置页面定义奖品和概率！");
        return;
    }

    drawButton.disabled = true;

    // 1. 扣除积分
    userPoints -= COST_PER_DRAW;
    updateDisplay();

    // 2. 确定中奖结果和其在列表中的位置
    // 随机数范围 1-10000
    const randomNumber = Math.floor(Math.random() * 10000) + 1;
    const finalPrize = getPrize(randomNumber);
    const prizeNames = activePrizes.map(p => p.name);
    const prizeIndex = prizeNames.findIndex(name => name === finalPrize.name);

    // 3. 计算滚动目标位置
    const prizesPerSet = prizeNames.length;
    const targetSet = REPETITIONS - 1; // 目标组数 (倒数第二组)
    const targetIndexInRoller = (prizesPerSet * targetSet) + prizeIndex;

    // 最终定位：- (目标索引 * 80 + 0)
    const targetPosition = -((targetIndexInRoller * PRIZE_HEIGHT) + HALF_PRIZE_HEIGHT);

    // 4. 开始滚动动画

    // 瞬间定位到第二组的某个随机奖品位置
    const jumpIndex = prizesPerSet * 2 + Math.floor(Math.random() * prizesPerSet);
    const jumpPosition = -((jumpIndex * PRIZE_HEIGHT) + HALF_PRIZE_HEIGHT);

    prizeRoller.style.transition = 'none';
    prizeRoller.style.transform = `translateY(${jumpPosition}px)`;

    // 延迟后开始平稳滚动到最终位置
    setTimeout(() => {
        prizeRoller.style.transition = 'transform 3.5s cubic-bezier(0.2, 0.8, 0.4, 1)';
        prizeRoller.style.transform = `translateY(${targetPosition}px)`;
    }, 50);


    // 5. 动画结束后显示最终结果
    setTimeout(() => {
        resultTextDisplay.textContent = `恭喜 ${userName} 抽中：${finalPrize.name}！`;
        resultTextDisplay.className = 'result-text win-text';

        // 重新启用按钮
        drawButton.disabled = (userPoints < COST_PER_DRAW);
    }, 3550); // 动画时间 3.5 秒后显示结果
}

/**
 * 跳转回设置页，用于设置下一位学生
 */
function promptSetupUser() {
    // 仅切换回设置页，保留当前积分
    showPrizeSetup();
}

/**
 * 清空所有积分并重置为设置界面
 */
function clearAllPrizes() {
    if (confirm("🚨 警告：这将重置并清空所有学生的积分和奖品设置。确定要执行此操作吗？")) {
        userName = "";
        userPoints = 0;
        activePrizes = [];
        // 清空默认值，强制用户重新输入
        inputPrizes.value = "";
        probErrorDisplay.textContent = "";

        showPrizeSetup();
        inputPoints.value = "0";

        alert("已成功清空所有数据并重置系统。");
    }
}


/**
 * 初始化函数
 */
function init() {
    // 默认奖品设置（方便测试，如果用户不修改则使用此默认值）
    inputPrizes.value =
        `哪吒卡片:15
橡皮:15
粘贴:15
笔:30
大笔记:10
资料夹:7
卡通本:5
挂件:2
胸针:1`;

    // 默认显示设置页面
    lotteryPage.style.display = 'none';
    prizeSetupPage.style.display = 'block';

    // 页面加载时解析默认奖品，以便用户可以直接点击“进入抽奖”
    parsePrizes();
}

// 页面加载完成后运行初始化函数
window.onload = init;

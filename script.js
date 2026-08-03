document.addEventListener('DOMContentLoaded', () => {
    const foodForm = document.getElementById('food-form');
    const foodNameInput = document.getElementById('food-name');
    const foodCaloriesInput = document.getElementById('food-calories');
    const foodList = document.getElementById('food-list');
    
    const remainingCaloriesEl = document.getElementById('remaining-calories');
    const consumedCaloriesEl = document.getElementById('consumed-calories');
    const progressCircle = document.getElementById('progress-circle');
    const clearBtn = document.getElementById('clear-btn');
    
    const goalCard = document.getElementById('goal-card');
    const goalCaloriesEl = document.getElementById('goal-calories');
    
    const toggleHistoryBtn = document.getElementById('toggle-history-btn');
    const historyList = document.getElementById('history-list');
    
    const weightForm = document.getElementById('weight-form');
    const weightInput = document.getElementById('weight-input');
    const ctx = document.getElementById('weightChart').getContext('2d');
    
    // 預設食物資料庫
    const foodDatabase = [
        { name: '白飯 (1碗)', calories: 280 },
        { name: '糙米飯 (1碗)', calories: 215 },
        { name: '麵條 (1碗)', calories: 285 },
        { name: '吐司 (1片)', calories: 140 },
        { name: '燕麥片 (50g)', calories: 195 },
        { name: '雞胸肉 (100g)', calories: 165 },
        { name: '水煮蛋 (1顆)', calories: 75 },
        { name: '荷包蛋 (1顆)', calories: 120 },
        { name: '鮭魚 (100g)', calories: 200 },
        { name: '豆腐 (半盒)', calories: 75 },
        { name: '高麗菜 (1盤)', calories: 65 },
        { name: '花椰菜 (1盤)', calories: 50 },
        { name: '香蕉 (1根)', calories: 89 },
        { name: '蘋果 (1顆)', calories: 52 },
        { name: '芭樂 (1顆)', calories: 150 },
        { name: '拿鐵 (1杯)', calories: 120 },
        { name: '美式咖啡 (1杯)', calories: 15 },
        { name: '珍珠奶茶 (1杯)', calories: 550 },
        { name: '便當 (平均)', calories: 800 },
        { name: '漢堡 (1個)', calories: 450 },
        { name: '披薩 (1片)', calories: 285 },
        { name: '薯條 (中薯)', calories: 330 },
        { name: '巧克力 (一片)', calories: 150 },
        { name: '鮮奶 (240ml)', calories: 150 }
    ];

    // Load from Local Storage
    let goalCalories = parseInt(localStorage.getItem('calorie_goal')) || 2000;
    let foods = JSON.parse(localStorage.getItem('calorie_foods')) || [];
    let history = JSON.parse(localStorage.getItem('calorie_history')) || {};
    let weightHistory = JSON.parse(localStorage.getItem('weight_history')) || {};
    let weightChartInstance = null;

    goalCaloriesEl.textContent = goalCalories;

    // Helper: 取得今天的日期字串 (YYYY-MM-DD)
    const getTodayString = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    };

    // 每天重置資料邏輯
    const lastSavedDate = localStorage.getItem('calorie_date');
    const todayStr = getTodayString();
    
    if (lastSavedDate && lastSavedDate !== todayStr) {
        // 如果是新的一天，清空昨天的紀錄 (昨天的總和已經在 history 中)
        foods = [];
        localStorage.setItem('calorie_date', todayStr);
        localStorage.setItem('calorie_foods', JSON.stringify(foods));
    } else if (!lastSavedDate) {
        localStorage.setItem('calorie_date', todayStr);
    }

    // --- 自動選字清單 (Autocomplete) ---
    const autocompleteList = document.getElementById('autocomplete-list');
    
    foodNameInput.addEventListener('input', function() {
        const val = this.value.trim().toLowerCase();
        autocompleteList.innerHTML = '';
        if (!val) {
            autocompleteList.style.display = 'none';
            return;
        }
        
        const matches = foodDatabase.filter(f => f.name.toLowerCase().includes(val));
        
        if (matches.length > 0) {
            autocompleteList.style.display = 'block';
            matches.forEach(match => {
                const li = document.createElement('li');
                li.className = 'autocomplete-item';
                li.innerHTML = `<span class="ac-name">${match.name}</span><span class="ac-cal">${match.calories} 大卡</span>`;
                li.addEventListener('click', () => {
                    foodNameInput.value = match.name;
                    foodCaloriesInput.value = match.calories;
                    autocompleteList.style.display = 'none';
                });
                autocompleteList.appendChild(li);
            });
        } else {
            autocompleteList.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (e.target !== foodNameInput && e.target !== autocompleteList) {
            autocompleteList.style.display = 'none';
        }
    });

    // --- 體重圖表 (Chart.js) ---
    function renderWeightChart() {
        const dates = Object.keys(weightHistory).sort();
        const weights = dates.map(date => weightHistory[date]);

        // 預設如果沒資料，給些空資料讓圖表出來
        const displayDates = dates.length > 0 ? dates : ['暫無資料'];
        const displayWeights = weights.length > 0 ? weights : [null];

        if (weightChartInstance) {
            weightChartInstance.destroy();
        }

        weightChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: displayDates,
                datasets: [{
                    label: '體重 (kg)',
                    data: displayWeights,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#10b981',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#10b981',
                        padding: 10,
                        displayColors: false
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: { color: '#64748b' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#64748b', maxTicksLimit: 5 }
                    }
                }
            }
        });
    }

    weightForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const weight = parseFloat(weightInput.value);
        if (weight > 0) {
            weightHistory[todayStr] = weight;
            localStorage.setItem('weight_history', JSON.stringify(weightHistory));
            renderWeightChart();
            weightInput.value = '';
            
            // 提示動畫
            const btn = weightForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = '已記錄 ✓';
            btn.style.background = 'var(--success)';
            btn.style.color = '#000';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
                btn.style.color = '';
            }, 2000);
        }
    });

    // --- 歷史紀錄 (History) ---
    function renderHistory() {
        historyList.innerHTML = '';
        const dates = Object.keys(history).sort().reverse();
        
        // 過濾掉今天，只顯示過去的紀錄（最多30天）
        const pastDates = dates.filter(date => date !== todayStr).slice(0, 30);

        if (pastDates.length === 0) {
            historyList.innerHTML = '<li class="history-item"><span class="history-date">尚無歷史紀錄</span></li>';
            return;
        }

        pastDates.forEach(date => {
            const data = history[date];
            const cal = data.consumed;
            const goal = data.goal;
            const percentage = (cal / goal) * 100;
            
            let statusClass = 'success';
            if (percentage > 100) statusClass = 'danger';
            else if (percentage > 85) statusClass = 'warning';

            const li = document.createElement('li');
            li.className = `history-item ${statusClass}`;
            li.innerHTML = `
                <span class="history-date">${date}</span>
                <span class="history-cal">${cal} / ${goal} 大卡</span>
            `;
            historyList.appendChild(li);
        });
    }

    // --- 主 UI 更新 ---
    function updateUI() {
        foodList.innerHTML = '';
        let totalConsumed = 0;

        foods.forEach((food, index) => {
            totalConsumed += food.calories;
            
            const li = document.createElement('li');
            li.className = 'food-item';
            li.innerHTML = `
                <div class="food-info">
                    <span class="food-name">${food.name}</span>
                    <span class="food-cal">${food.calories} 大卡</span>
                </div>
                <button class="delete-btn" onclick="deleteFood(${index})" aria-label="刪除紀錄">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            `;
            foodList.appendChild(li);
        });

        const remaining = goalCalories - totalConsumed;
        
        // 更新歷史紀錄中的「今天」，以便隔天保留
        history[todayStr] = { consumed: totalConsumed, goal: goalCalories };
        localStorage.setItem('calorie_history', JSON.stringify(history));
        
        // 動態數字更新
        consumedCaloriesEl.textContent = totalConsumed;
        
        // 更新進度條與顏色
        const percentage = Math.min((totalConsumed / goalCalories) * 100, 100);
        let color = 'var(--primary)'; // 正常 (綠色)
        
        if (percentage > 100) {
            color = 'var(--danger)'; // 超標
        } else if (percentage > 85) {
            color = 'var(--warning)'; // 警告
        }
        
        if (remaining < 0) {
            remainingCaloriesEl.style.color = 'var(--danger)';
            remainingCaloriesEl.textContent = Math.abs(remaining);
            document.querySelector('.progress-content .label').textContent = '超標大卡';
        } else {
            remainingCaloriesEl.style.color = 'var(--text-main)';
            remainingCaloriesEl.textContent = remaining;
            document.querySelector('.progress-content .label').textContent = '剩餘大卡';
        }

        progressCircle.style.background = `conic-gradient(${color} ${percentage * 3.6}deg, #f1f5f9 0deg)`;

        // 儲存到 Local Storage
        localStorage.setItem('calorie_foods', JSON.stringify(foods));
        localStorage.setItem('calorie_goal', goalCalories);
        
        // 重新渲染歷史清單
        renderHistory();
    }

    // 將 deleteFood 綁定到 window
    window.deleteFood = (index) => {
        const item = foodList.children[index];
        item.style.animation = 'slideIn 0.3s ease reverse forwards';
        
        setTimeout(() => {
            foods.splice(index, 1);
            updateUI();
        }, 250);
    };

    foodForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = foodNameInput.value.trim();
        const calories = parseInt(foodCaloriesInput.value.trim());

        if (name && calories) {
            foods.unshift({ name, calories, id: Date.now() });
            foodNameInput.value = '';
            foodCaloriesInput.value = '';
            foodNameInput.focus();
            updateUI();
        }
    });

    clearBtn.addEventListener('click', () => {
        if(foods.length > 0 && confirm('確定要清除今日所有紀錄嗎？')) {
            foods = [];
            updateUI();
        }
    });

    goalCard.addEventListener('click', () => {
        const newGoal = prompt('請輸入新的每日目標熱量 (大卡)：', goalCalories);
        if (newGoal !== null && newGoal.trim() !== '' && !isNaN(newGoal) && parseInt(newGoal) > 0) {
            goalCalories = parseInt(newGoal);
            goalCaloriesEl.textContent = goalCalories;
            updateUI();
        }
    });

    toggleHistoryBtn.addEventListener('click', () => {
        if (historyList.style.display === 'none') {
            historyList.style.display = 'flex';
            toggleHistoryBtn.textContent = '收起';
        } else {
            historyList.style.display = 'none';
            toggleHistoryBtn.textContent = '展開';
        }
    });

    // 初始化渲染
    updateUI();
    renderWeightChart();
});

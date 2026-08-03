document.addEventListener('DOMContentLoaded', () => {
    const foodForm = document.getElementById('food-form');
    const foodNameInput = document.getElementById('food-name');
    const foodAmountInput = document.getElementById('food-amount');
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
    
    // 精確食物資料庫 (以每 100g/ml 計算)
    const foodDatabase = [
        { name: '白飯', calPer100g: 183 },
        { name: '糙米飯', calPer100g: 111 },
        { name: '麵條 (熟)', calPer100g: 138 },
        { name: '白吐司', calPer100g: 290 },
        { name: '燕麥片', calPer100g: 389 },
        { name: '雞胸肉 (生)', calPer100g: 104 },
        { name: '水煮蛋', calPer100g: 155 },
        { name: '煎荷包蛋', calPer100g: 196 },
        { name: '鮭魚 (生)', calPer100g: 208 },
        { name: '板豆腐', calPer100g: 88 },
        { name: '高麗菜', calPer100g: 25 },
        { name: '花椰菜', calPer100g: 34 },
        { name: '香蕉', calPer100g: 89 },
        { name: '蘋果', calPer100g: 52 },
        { name: '芭樂', calPer100g: 38 },
        { name: '全脂鮮奶', calPer100g: 63 },
        { name: '無糖豆漿', calPer100g: 35 },
        { name: '拿鐵 (無糖)', calPer100g: 45 },
        { name: '美式咖啡', calPer100g: 2 },
        { name: '無糖綠茶', calPer100g: 0 },
        { name: '薯條 (油炸)', calPer100g: 311 },
        { name: '黑巧克力', calPer100g: 546 },
        { name: '原味優格', calPer100g: 61 }
    ];

    // Load from Local Storage
    let goalCalories = parseInt(localStorage.getItem('calorie_goal')) || 2000;
    let foods = JSON.parse(localStorage.getItem('calorie_foods')) || [];
    let history = JSON.parse(localStorage.getItem('calorie_history')) || {};
    let weightHistory = JSON.parse(localStorage.getItem('weight_history')) || {};
    let weightChartInstance = null;
    let selectedFoodCalPer100g = 0; // 用於自動計算

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
        foods = [];
        localStorage.setItem('calorie_date', todayStr);
        localStorage.setItem('calorie_foods', JSON.stringify(foods));
    } else if (!lastSavedDate) {
        localStorage.setItem('calorie_date', todayStr);
    }

    // --- 自動選字清單與精確計算 (Autocomplete) ---
    const autocompleteList = document.getElementById('autocomplete-list');
    
    foodNameInput.addEventListener('input', function() {
        const val = this.value.trim().toLowerCase();
        selectedFoodCalPer100g = 0; // 如果手動修改名稱，重置自動計算
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
                li.innerHTML = `<span class="ac-name">${match.name}</span><span class="ac-cal">${match.calPer100g} 大卡 / 100g</span>`;
                li.addEventListener('click', () => {
                    foodNameInput.value = match.name;
                    selectedFoodCalPer100g = match.calPer100g;
                    
                    // 自動計算目前的份量對應的熱量
                    const amount = parseFloat(foodAmountInput.value) || 100;
                    foodCaloriesInput.value = Math.round((amount / 100) * selectedFoodCalPer100g);
                    
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

    // 當份量改變時，自動計算熱量
    foodAmountInput.addEventListener('input', () => {
        if (selectedFoodCalPer100g > 0) {
            const amount = parseFloat(foodAmountInput.value) || 0;
            foodCaloriesInput.value = Math.round((amount / 100) * selectedFoodCalPer100g);
        }
    });

    // 當熱量手動被改變時，移除自動計算綁定
    foodCaloriesInput.addEventListener('input', () => {
        selectedFoodCalPer100g = 0; 
    });


    // --- 體重圖表 (Chart.js) ---
    function renderWeightChart() {
        const dates = Object.keys(weightHistory).sort();
        const weights = dates.map(date => weightHistory[date]);

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
            
            const btn = weightForm.querySelector('button');
            const originalText = btn.textContent;
            btn.textContent = '已記錄 ✓';
            btn.style.background = 'var(--success)';
            btn.style.color = '#fff';
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
            // 如果有份量就顯示，否則不顯示
            const amountStr = food.amount ? ` (${food.amount}g)` : '';
            li.innerHTML = `
                <div class="food-info">
                    <span class="food-name">${food.name}${amountStr}</span>
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
        
        history[todayStr] = { consumed: totalConsumed, goal: goalCalories };
        localStorage.setItem('calorie_history', JSON.stringify(history));
        
        consumedCaloriesEl.textContent = totalConsumed;
        
        const percentage = Math.min((totalConsumed / goalCalories) * 100, 100);
        let color = 'var(--primary)'; 
        
        if (percentage > 100) {
            color = 'var(--danger)'; 
        } else if (percentage > 85) {
            color = 'var(--warning)'; 
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

        localStorage.setItem('calorie_foods', JSON.stringify(foods));
        localStorage.setItem('calorie_goal', goalCalories);
        
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
        const amount = parseFloat(foodAmountInput.value) || 0;
        const calories = parseInt(foodCaloriesInput.value.trim());

        if (name && calories) {
            foods.unshift({ name, amount, calories, id: Date.now() });
            foodNameInput.value = '';
            foodAmountInput.value = '100'; // Reset to default 100
            foodCaloriesInput.value = '';
            selectedFoodCalPer100g = 0;
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

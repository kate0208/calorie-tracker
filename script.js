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
    
    // Load from Local Storage
    let goalCalories = parseInt(localStorage.getItem('calorie_goal')) || 2000;
    let foods = JSON.parse(localStorage.getItem('calorie_foods')) || [];
    let history = JSON.parse(localStorage.getItem('calorie_history')) || {};

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
        let color = 'var(--secondary)'; // 正常
        
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

        progressCircle.style.background = `conic-gradient(${color} ${percentage * 3.6}deg, rgba(255,255,255,0.05) 0deg)`;

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
});

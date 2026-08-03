document.addEventListener('DOMContentLoaded', () => {
    const foodForm = document.getElementById('food-form');
    const foodNameInput = document.getElementById('food-name');
    const foodCaloriesInput = document.getElementById('food-calories');
    const foodList = document.getElementById('food-list');
    
    const remainingCaloriesEl = document.getElementById('remaining-calories');
    const consumedCaloriesEl = document.getElementById('consumed-calories');
    const progressCircle = document.getElementById('progress-circle');
    const clearBtn = document.getElementById('clear-btn');
    
    let goalCalories = 2000; // 預設目標大卡
    let foods = JSON.parse(localStorage.getItem('calorie_foods')) || [];

    // Helper: 取得今天的日期字串 (YYYY-MM-DD)
    const getTodayString = () => {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    };

    // 每天重置資料邏輯
    const lastSavedDate = localStorage.getItem('calorie_date');
    const todayStr = getTodayString();
    
    if (lastSavedDate !== todayStr) {
        // 如果是新的一天，清空昨天的紀錄
        foods = [];
        localStorage.setItem('calorie_date', todayStr);
        localStorage.setItem('calorie_foods', JSON.stringify(foods));
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
        
        // 數字動畫 (簡單版)
        consumedCaloriesEl.textContent = totalConsumed;
        
        // 更新進度條與顏色
        const percentage = Math.min((totalConsumed / goalCalories) * 100, 100);
        let color = 'var(--secondary)'; // 正常 (綠色/藍色)
        
        if (percentage > 100) {
            color = 'var(--danger)'; // 超標 (紅色)
        } else if (percentage > 85) {
            color = 'var(--warning)'; // 警告 (黃色)
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

        // 更新圓餅圖
        progressCircle.style.background = `conic-gradient(${color} ${percentage * 3.6}deg, rgba(255,255,255,0.05) 0deg)`;

        // 儲存到 Local Storage
        localStorage.setItem('calorie_foods', JSON.stringify(foods));
    }

    // 將 deleteFood 綁定到 window 以便在 HTML onclick 中呼叫
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
            foods.unshift({ name, calories, id: Date.now() }); // 加到最前面
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

    // 初始化渲染
    updateUI();
});

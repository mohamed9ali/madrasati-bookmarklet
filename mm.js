// هذا الكود مصمم ليتم تشغيله مباشرة في نافذة "وحدة التحكم" (Console) للمتصفح.
// سيقوم بإنشاء النافذة المنبثقة لاختيار التاريخ لعرض الجدول الأسبوعي.

(function() {
    // التحقق من وجود نوافذ سابقة وإزالتها
    document.querySelectorAll('#input-overlay, #schedule-overlay').forEach(el => el.remove());

    /**
     * دالة لعرض رسالة تنبيه مخصصة (بدلاً من alert() المزعجة)
     * @param {string} message - الرسالة المراد عرضها.
     */
    function showCustomAlert(message) {
        // إنشاء حاوية التنبيه
        const alertModal = document.createElement('div');
        alertModal.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #f8d7da; color: #721c24; padding: 15px; border-radius: 8px; border: 1px solid #f5c6cb; z-index: 1000001; font-family: Tahoma, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.1); direction: rtl;';
        alertModal.innerHTML = `<strong>تنبيه:</strong> ${message}`;
        
        // زر إغلاق
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'cursor: pointer; float: left; margin-left: 10px; font-weight: bold; font-size: 1.2em;';
        closeBtn.onclick = () => alertModal.remove();
        
        alertModal.appendChild(closeBtn);
        document.body.appendChild(alertModal);
        
        // إزالة التنبيه تلقائياً بعد 5 ثوانٍ
        setTimeout(() => alertModal.remove(), 5000);
    }

    // ----------------------------------------------------
    // 1. إنشاء النافذة المنبثقة الخاصة باختيار التاريخ (الإدخال)
    // ----------------------------------------------------
    function createInputModal() {
        // التأكد من عدم وجود أي نوافذ مفتوحة سابقة
        document.querySelectorAll('#input-overlay, #schedule-overlay').forEach(el => el.remove());

        const overlay = document.createElement('div');
        overlay.id = 'input-overlay';
        overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:999998; display:flex; align-items:center; justify-content:center;';
        
        const modal = document.createElement('div');
        modal.style.cssText = 'background:white; padding:40px; border-radius:20px; box-shadow:0 10px 50px rgba(0,0,0,0.3); max-width:400px; width:90%; position:relative; direction:rtl; font-family:Inter, Tahoma, sans-serif;';
        
        const title = document.createElement('h2');
        title.textContent = '📚 جدول مدرستي الأسبوعي';
        title.style.cssText = 'color:#667eea; margin-bottom:20px; font-size:1.8em; text-align:center; font-weight:bold;';
        
        const label = document.createElement('label');
        label.textContent = 'اختر أي تاريخ في الأسبوع المطلوب:';
        label.style.cssText = 'display:block; font-weight:600; margin-bottom:10px; color:#333';
        
        const input = document.createElement('input');
        input.type = 'date';
        input.valueAsDate = new Date();
        input.style.cssText = 'width:100%; padding:12px; border:2px solid #667eea; border-radius:10px; font-size:1em; margin-bottom:20px; transition:border 0.2s';
        
        const btn = document.createElement('button');
        btn.textContent = '🚀 عرض الجدول';
        btn.style.cssText = 'background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:white; border:none; padding:15px 40px; border-radius:10px; font-size:1.1em; font-weight:600; cursor:pointer; width:100%; transition:all 0.3s; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);';
        
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = 'position:absolute; top:10px; left:10px; background:none; border:none; font-size:1.5em; color:#999; cursor:pointer';
        closeBtn.onclick = () => overlay.remove();
        
        modal.appendChild(closeBtn);
        modal.appendChild(title);
        modal.appendChild(label);
        modal.appendChild(input);
        modal.appendChild(btn);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        overlay.onclick = (e) => {
            // إغلاق النافذة عند الضغط على الخلفية السوداء
            if (e.target === overlay) overlay.remove();
        };
        
        btn.onclick = () => fetchSchedule(input, btn, overlay);
    }

    // ----------------------------------------------------
    // 2. دالة جلب البيانات
    // ----------------------------------------------------
    async function fetchSchedule(inputElement, buttonElement, inputOverlay) {
        buttonElement.disabled = true;
        buttonElement.textContent = '⏳ جاري التحميل...';
        
        // -------------------------------------
        // 🔍 استخراج SchoolId
        // -------------------------------------
        let schoolId = null;
        const schoolInput = document.querySelector('input#hSchoolId');
        if (schoolInput && schoolInput.value.trim().length > 0) {
            schoolId = schoolInput.value.trim();
        }
        
        if (!schoolId) {
            const pageText = document.body.innerText;
            const matchDom = pageText.match(/[A-F0-9]{32}/i);
            if (matchDom) {
                schoolId = matchDom[0];
            }
        }
        
        if (!schoolId) {
            const urlMatch = window.location.href.match(/([A-F0-9]{32})/i);
            if (urlMatch) {
                schoolId = urlMatch[1];
            }
        }
        
        if (!schoolId) {
            showCustomAlert('⚠️ لم يتم العثور على SchoolId داخل الصفحة أو الرابط. يرجى التأكد من وجوده.');
            buttonElement.disabled = false;
            buttonElement.textContent = '🚀 عرض الجدول';
            return;
        }
        
        // ---------------------------------------
        // 🔥 جلب البيانات
        // ---------------------------------------
        try {
            function getWeekStart(date) {
                const d = new Date(date);
                // يوم الأحد هو 0 (في JavaScript)
                d.setDate(d.getDate() - d.getDay()); 
                return d;
            }
            
            function formatDate(date) {
                const m = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const y = date.getFullYear();
                const h = date.getHours();
                const min = String(date.getMinutes()).padStart(2, '0');
                const s = String(date.getSeconds()).padStart(2, '0');
                const ap = h >= 12 ? 'PM' : 'AM';
                const dh = h % 12 || 12;
                return m + '/' + day + '/' + y + ' ' + dh + ':' + min + ':' + s + ' ' + ap;
            }
            
            function getDayName(i) {
                // الأيام من الأحد (0) إلى الخميس (4)
                return ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][i];
            }
            
            // دالة جلب بيانات يوم واحد من الخادم (نفس الكود الأصلي)
            async function fetchDay(sid, ds, idx) {
                const fd = new FormData();
                fd.append('Date', ds);
                fd.append('index', idx);
                fd.append('SchoolId', sid);
                const r = await fetch('/Teacher/TimeTable/GetCal', {method: 'POST', body: fd});
                return await r.json();
            }
            
            const baseDate = new Date(inputElement.value);
            const weekStart = getWeekStart(baseDate);
            const schedule = [];
            
            for (let i = 0; i < 5; i++) {
                const d = new Date(weekStart);
                d.setDate(weekStart.getDate() + i);
                const data = await fetchDay(schoolId, formatDate(d), i);
                if (data && data.TimeTable) {
                    schedule.push({
                        dayIndex: i,
                        dayName: getDayName(i),
                        dateAr: data.CurrentSelectedDateString,
                        dateHi: data.CurrentSelectedDateStringHijri,
                        isVac: data.IsVacation === 'Yes',
                        lectures: data.TimeTable.sort((a, b) => a.SlotNumber - b.SlotNumber)
                    });
                }
                // تأخير بسيط لمنع الضغط المفرط على الخادم
                await new Promise(r => setTimeout(r, 300)); 
            }
            
            const allSlotNumbers = [...new Set(schedule.flatMap(d => d.lectures.map(l => l.SlotNumber)))].sort((a,b) => a-b);
            
            // 3. عرض الجدول في نافذة منبثقة جديدة
            showScheduleModal(schedule, allSlotNumbers, inputOverlay);

        } catch (error) {
            console.error('Fetch Error:', error);
            showCustomAlert('حدث خطأ أثناء جلب البيانات: ' + error.message);
            buttonElement.disabled = false;
            buttonElement.textContent = '🚀 عرض الجدول';
        }
    }

    // ----------------------------------------------------
    // 3. دالة إنشاء وعرض النافذة المنبثقة للجدول
    // ----------------------------------------------------
    function showScheduleModal(schedule, allSlotNumbers, previousOverlay) {
        // إغلاق النافذة المنبثقة السابقة (اختيار التاريخ)
        previousOverlay.remove();

        // بناء الإحصائيات (باستخدام inline styles)
        const statsHtml = `
            <div class="stats print-hidden" style="display:flex; justify-content:center; gap:30px; margin:30px 0; flex-wrap:wrap;">
                <div class="stat-item total" style="text-align:center; padding:15px 30px; border-radius:10px; background:#f8f9fa; min-width:150px;">
                    <div class="stat-number" style="font-size:2.5em; font-weight:700; margin-bottom:5px; color:#1976d2;">${schedule.reduce((sum, d) => sum + d.lectures.length, 0)}</div>
                    <div class="stat-label" style="color:#666; font-size:0.9em;">إجمالي الحصص</div>
                </div>
                <div class="stat-item attended" style="text-align:center; padding:15px 30px; border-radius:10px; background:#f8f9fa; min-width:150px;">
                    <div class="stat-number" style="font-size:2.5em; font-weight:700; margin-bottom:5px; color:#4caf50;">${schedule.reduce((sum, d) => sum + d.lectures.filter(l => l.Status === 2).length, 0)}</div>
                    <div class="stat-label" style="color:#666; font-size:0.9em;">حصص محضرة</div>
                </div>
                <div class="stat-item not-attended" style="text-align:center; padding:15px 30px; border-radius:10px; background:#f8f9fa; min-width:150px;">
                    <div class="stat-number" style="font-size:2.5em; font-weight:700; margin-bottom:5px; color:#f44336;">${schedule.reduce((sum, d) => sum + d.lectures.filter(l => l.Status !== 2).length, 0)}</div>
                    <div class="stat-label" style="color:#666; font-size:0.9em;">حصص غير محضرة</div>
                </div>
            </div>
        `;

        // بناء رأس الجدول
        const headerHtml = `
            <div class="header" style="text-align:center; margin-bottom:30px; padding-bottom:20px; border-bottom:3px solid #667eea;">
                <h1 style="color:#667eea; font-size:2em; margin-bottom:10px;">📚 جدول مدرستي الأسبوعي</h1>
                <p style="color:#666; font-size:1em;">${schedule[0].dateAr} - ${schedule[4].dateAr}</p>
                <p style="color:#999; margin-top:5px; font-size:0.9em;">${schedule[0].dateHi} - ${schedule[4].dateHi}</p>
            </div>
        `;

        // بناء صفوف الجدول
        const tableRows = schedule.map(day => {
            const cells = allSlotNumbers.map(slotNum => {
                const lecture = day.lectures.find(l => l.SlotNumber === slotNum);
                if (!lecture) {
                    return '<td style="background:#f9f9f9; color:#ccc; border:2px solid #ddd; padding:12px 8px; text-align:center; vertical-align:middle;">-</td>';
                }
                const isAtt = lecture.Status === 2;
                const cellStyle = isAtt 
                    ? 'background:linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-top:4px solid #4caf50;' 
                    : 'background:linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-top:4px solid #f44336;';
                const url = 'https://schools.madrasati.sa/Teacher/Lessons/LessonDetailsNew?Data=' + lecture.Data;
                const statusColor = isAtt ? '#4caf50' : '#f44336';
                const statusText = isAtt ? '✓ محضر' : '✗ غير محضر';

                return `
                    <td class="lecture-cell" onclick="window.open('${url}', '_blank')" style="cursor:pointer; ${cellStyle} border:2px solid #ddd; padding:12px 8px; text-align:center; vertical-align:middle; height:90px; transition:all 0.3s; transform:translateZ(0);">
                        <div style="font-weight:700; font-size:1em; color:#333; margin-bottom:5px;">${lecture.SubjectName || lecture.Title}</div>
                        <div style="font-size:0.85em; color:#666; margin-bottom:3px;">${lecture.ClassRoomName}</div>
                        <div style="font-size:0.75em; color:#999; margin-top:3px;">${lecture.StartTime}</div>
                        <div style="display:inline-block; padding:3px 10px; border-radius:10px; font-size:0.75em; font-weight:600; margin-top:5px; background:${statusColor}; color:white;">
                            ${statusText}
                        </div>
                    </td>
                `;
            }).join('');

            return `
                <tr>
                    <th style="background:#f8f9fa; color:#333; font-weight:700; font-size:1.1em; width:150px; border:2px solid #ddd; padding:12px 8px;">
                        ${day.dayName}<br>
                        <span style="font-size:0.8em;opacity:0.8">${day.dateAr.split(' ')[0]}</span>
                    </th>
                    ${cells}
                </tr>
            `;
        }).join('');

        // بناء جدول الـ HTML بالكامل
        const tableHtml = `
            <table style="width:100%; border-collapse:collapse; margin:20px 0; font-size:0.9em; table-layout:fixed;">
                <thead>
                    <tr>
                        <th style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:white; font-weight:600; font-size:1em; border:2px solid #ddd; padding:12px 8px;">اليوم</th>
                        ${allSlotNumbers.map(slotNum => `<th style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:white; font-weight:600; font-size:0.9em; border:2px solid #ddd; padding:12px 8px;">الحصة<br>${slotNum}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        `;
        
        // تجميع محتوى الـ HTML النهائي داخل حاوية
        const fullScheduleHtml = `
            <div class="schedule-container" style="padding:30px; border-radius:15px; background:#fff; color:#333;">
                ${headerHtml}
                ${statsHtml}
                ${tableHtml}
            </div>
        `;

        // إنشاء النافذة المنبثقة للجدول
        const scheduleOverlay = document.createElement('div');
        scheduleOverlay.id = 'schedule-overlay';
        scheduleOverlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:999999; display:flex; align-items:center; justify-content:center; padding:20px;';
        
        const scheduleModalContainer = document.createElement('div');
        scheduleModalContainer.style.cssText = 'background:white; border-radius:15px; box-shadow:0 5px 30px rgba(0,0,0,0.3); max-width:95vw; width:95%; max-height:95vh; overflow-y:auto; position:relative; direction:rtl; font-family:Inter, Tahoma, sans-serif;';
        
        // زر الإغلاق
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕ إغلاق';
        closeBtn.style.cssText = 'position:sticky; top:20px; left:20px; background:#ef4444; color:white; font-weight:bold; padding:8px 16px; border-radius:8px; border:none; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:background 0.2s; z-index:1000;';
        closeBtn.onmouseover = function() { this.style.backgroundColor = '#dc2626'; };
        closeBtn.onmouseout = function() { this.style.backgroundColor = '#ef4444'; };
        closeBtn.onclick = () => scheduleOverlay.remove();
        
        // زر الطباعة
        const printBtn = document.createElement('button');
        printBtn.textContent = '🖨️ طباعة الجدول';
        printBtn.style.cssText = 'position:sticky; top:20px; right:20px; background:#4f46e5; color:white; font-weight:bold; padding:8px 16px; border-radius:8px; border:none; cursor:pointer; box-shadow:0 2px 5px rgba(0,0,0,0.2); transition:background 0.2s; z-index:1000;';
        printBtn.onmouseover = function() { this.style.backgroundColor = '#4338ca'; };
        printBtn.onmouseout = function() { this.style.backgroundColor = '#4f46e5'; };
        printBtn.onclick = () => {
            // إخفاء الأزرار والإحصائيات أثناء الطباعة
            closeBtn.style.display = 'none';
            printBtn.style.display = 'none';
            const stats = scheduleModalContainer.querySelector('.stats');
            if (stats) stats.style.display = 'none';

            window.print();

            // إعادة إظهار الأزرار والإحصائيات بعد الطباعة/الإلغاء
            closeBtn.style.display = 'block';
            printBtn.style.display = 'block';
            if (stats) stats.style.display = 'flex';
        };

        const controlsDiv = document.createElement('div');
        controlsDiv.style.cssText = 'display:flex; justify-content:space-between; padding:20px; background:white; border-top-left-radius:15px; border-top-right-radius:15px; position:sticky; top:0; z-index:1000;';
        
        controlsDiv.appendChild(closeBtn);
        controlsDiv.appendChild(printBtn);

        scheduleModalContainer.appendChild(controlsDiv);
        scheduleModalContainer.innerHTML += fullScheduleHtml; // إدخال محتوى الجدول
        
        scheduleOverlay.appendChild(scheduleModalContainer);
        document.body.appendChild(scheduleOverlay);
        
        scheduleOverlay.onclick = (e) => {
            // إغلاق النافذة عند الضغط على الخلفية السوداء
            if (e.target === scheduleOverlay) scheduleOverlay.remove();
        };
    }

    // ابدأ العملية بإنشاء نافذة إدخال التاريخ
    createInputModal();
})();

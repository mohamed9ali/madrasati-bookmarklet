(function() {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:40px;border-radius:20px;box-shadow:0 10px 50px rgba(0,0,0,0.3);z-index:999999;font-family:Arial;text-align:center';
    modal.dir = 'rtl';
    
    const title = document.createElement('h2');
    title.textContent = '📚 جدول مدرستي الأسبوعي';
    title.style.cssText = 'color:#667eea;margin-bottom:20px;font-size:1.8em';
    
    const label = document.createElement('label');
    label.textContent = 'اختر أي تاريخ في الأسبوع المطلوب:';
    label.style.cssText = 'display:block;font-weight:600;margin-bottom:10px;color:#333';
    
    const input = document.createElement('input');
    input.type = 'date';
    input.valueAsDate = new Date();
    input.style.cssText = 'width:100%;padding:12px;border:2px solid #667eea;border-radius:10px;font-size:1em;margin-bottom:20px';
    
    const btn = document.createElement('button');
    btn.textContent = '🚀 عرض الجدول';
    btn.style.cssText = 'background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:none;padding:15px 40px;border-radius:10px;font-size:1.1em;font-weight:600;cursor:pointer;width:100%';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'position:absolute;top:10px;left:10px;background:none;border:none;font-size:1.5em;color:#999;cursor:pointer';
    closeBtn.onclick = () => modal.remove();
    
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:999998';
    overlay.onclick = () => {
        modal.remove();
        overlay.remove();
    };
    
    modal.appendChild(closeBtn);
    modal.appendChild(title);
    modal.appendChild(label);
    modal.appendChild(input);
    modal.appendChild(btn);
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    btn.onclick = async function() {
        btn.disabled = true;
        btn.textContent = '⏳ جاري التحميل...';

        // -------------------------------------
        // 🔍 استخراج SchoolId حسب ترتيبك
        // -------------------------------------
        let schoolId = null;

        // 1️⃣ من input#hSchoolId
        const schoolInput = document.querySelector('input#hSchoolId');
        if (schoolInput && schoolInput.value.trim().length > 0) {
            schoolId = schoolInput.value.trim();
        }

        // 2️⃣ من الصفحة – DOM
        if (!schoolId) {
            const pageText = document.body.innerText;
            const matchDom = pageText.match(/[A-F0-9]{32}/i);
            if (matchDom) {
                schoolId = matchDom[0];
            }
        }

        // 3️⃣ من رابط الصفحة
        if (!schoolId) {
            const urlMatch = window.location.href.match(/([A-F0-9]{32})/i);
            if (urlMatch) {
                schoolId = urlMatch[1];
            }
        }

        // 4️⃣ لم يتم العثور عليه → رسالة خطأ
        if (!schoolId) {
            alert("⚠️ لم يتم العثور على SchoolId داخل الصفحة أو الرابط.");
            btn.disabled = false;
            btn.textContent = '🚀 عرض الجدول';
            return;
        }

        // ---------------------------------------
        // 🔥 تابع كود الجدول بدون أي تعديل
        // ---------------------------------------

        try {

            function getWeekStart(date) {
                const d = new Date(date);
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
                return ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'][i];
            }
            
            async function fetchDay(sid, ds, idx) {
                const fd = new FormData();
                fd.append('Date', ds);
                fd.append('index', idx);
                fd.append('SchoolId', sid);
                const r = await fetch('/Teacher/TimeTable/GetCal', {method: 'POST', body: fd});
                return await r.json();
            }
            
            const baseDate = new Date(input.value);
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
                await new Promise(r => setTimeout(r, 300));
            }
            
            const allSlotNumbers = [...new Set(schedule.flatMap(d => d.lectures.map(l => l.SlotNumber)))].sort((a,b) => a-b);
            
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>جدول مدرستي - ${schedule[0].dateAr}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }
        .container { 
            max-width: 100%; 
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
        }
        .header h1 { color: #667eea; font-size: 2em; margin-bottom: 10px; }
        .header p { color: #666; font-size: 1em; }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.9em;
        }
        
        th, td {
            border: 2px solid #ddd;
            padding: 12px;
            text-align: center;
            vertical-align: middle;
        }
        
        th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 600;
            font-size: 1em;
        }
        
        th.slot-header {
            font-size: 0.95em;
            padding: 15px 8px;
            min-width: 80px;
        }
        
        th.day-header {
            background: #f8f9fa;
            color: #333;
            font-weight: 700;
            font-size: 1.1em;
            width: 150px;
        }
        
        td {
            background: white;
            min-height: 80px;
            position: relative;
        }
        
        .lecture-cell {
            cursor: pointer;
            transition: all 0.3s;
            height: 100%;
            min-height: 80px;
            padding: 10px;
        }
        
        .lecture-cell:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10;
        }
        
        .lecture-cell.attended {
            background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
            border-top: 4px solid #4caf50;
        }
        
        .lecture-cell.not-attended {
            background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
            border-top: 4px solid #f44336;
        }
        
        .lecture-cell.empty {
            background: #f9f9f9;
            cursor: default;
            color: #ccc;
        }
        
        .subject-name {
            font-weight: 700;
            font-size: 1em;
            color: #333;
            margin-bottom: 5px;
        }
        
        .class-name {
            font-size: 0.85em;
            color: #666;
            margin-bottom: 3px;
        }
        
        .time {
            font-size: 0.75em;
            color: #999;
            margin-top: 3px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 10px;
            font-size: 0.75em;
            font-weight: 600;
            margin-top: 5px;
        }
        
        .status-badge.attended {
            background: #4caf50;
            color: white;
        }
        
        .status-badge.not-attended {
            background: #f44336;
            color: white;
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 30px 0;
            flex-wrap: wrap;
        }
        
        .stat-item {
            text-align: center;
            padding: 15px 30px;
            border-radius: 10px;
            background: #f8f9fa;
        }
        
        .stat-number {
            font-size: 2.5em;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .stat-item.total .stat-number { color: #1976d2; }
        .stat-item.attended .stat-number { color: #4caf50; }
        .stat-item.not-attended .stat-number { color: #f44336; }
        
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        
        .print-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 1em;
            font-weight: 600;
            cursor: pointer;
            position: fixed;
            bottom: 20px;
            left: 20px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .print-btn:hover { transform: translateY(-2px); }
        
        @media print {
            body { background: white; padding: 0; }
            .print-btn, .stats { display: none; }
            table { font-size: 0.75em; }
            th, td { padding: 8px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 جدول مدرستي الأسبوعي</h1>
            <p>${schedule[0].dateAr} - ${schedule[4].dateAr}</p>
            <p style="color: #999; margin-top: 5px;">${schedule[0].dateHi} - ${schedule[4].dateHi}</p>
        </div>
        
        <div class="stats">
            <div class="stat-item total">
                <div class="stat-number">${schedule.reduce((sum, d) => sum + d.lectures.length, 0)}</div>
                <div class="stat-label">إجمالي الحصص</div>
            </div>
            <div class="stat-item attended">
                <div class="stat-number">${schedule.reduce((sum, d) => sum + d.lectures.filter(l => l.Status === 2).length, 0)}</div>
                <div class="stat-label">حصص محضرة</div>
            </div>
            <div class="stat-item not-attended">
                <div class="stat-number">${schedule.reduce((sum, d) => sum + d.lectures.filter(l => l.Status !== 2).length, 0)}</div>
                <div class="stat-label">حصص غير محضرة</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th class="day-header">اليوم</th>
                    ${allSlotNumbers.map(slotNum => `
                        <th class="slot-header">الحصة<br>${slotNum}</th>
                    `).join('')}
                </tr>
            </thead>
            <tbody>
                ${schedule.map(day => `
                    <tr>
                        <th class="day-header">
                            ${day.dayName}<br>
                            <span style="font-size:0.8em;opacity:0.8">${day.dateAr}</span>
                        </th>
                        ${allSlotNumbers.map(slotNum => {
                            const lecture = day.lectures.find(l => l.SlotNumber === slotNum);
                            if (!lecture) {
                                return '<td class="lecture-cell empty">-</td>';
                            }
                            const isAtt = lecture.Status === 2;
                            const url = 'https://schools.madrasati.sa/Teacher/Lessons/LessonDetailsNew?Data=' + lecture.Data;
                            return `
                                <td class="lecture-cell ${isAtt ? 'attended' : 'not-attended'}" onclick="window.open('${url}', '_blank')">
                                    <div class="subject-name">${lecture.SubjectName || lecture.Title}</div>
                                    <div class="class-name">${lecture.ClassRoomName}</div>
                                    <div class="time">${lecture.StartTime}</div>
                                    <div class="status-badge ${isAtt ? 'attended' : 'not-attended'}">
                                        ${isAtt ? '✓' : '✗'}
                                    </div>
                                </td>
                            `;
                        }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <button class="print-btn" onclick="window.print()">🖨️ طباعة</button>
</body>
</html>
            `);
            
            newWindow.document.close();
            modal.remove();
            overlay.remove();
            
        } catch (error) {
            alert('حدث خطأ: ' + error.message);
            btn.disabled = false;
            btn.textContent = '🚀 عرض الجدول';
        }
    };
})();

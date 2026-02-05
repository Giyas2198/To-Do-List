let myChart = null;

function updateDashboardCharts(tasks) {
    const counts = {
        outstanding: tasks.filter(t => t.status === 'outstanding').length,
        todo: tasks.filter(t => t.status === 'todo').length,
        progress: tasks.filter(t => t.status === 'progress').length,
        done: tasks.filter(t => t.status === 'done').length,
        evaluation: tasks.filter(t => t.status === 'evaluation').length
    };

    const total = tasks.length;
    document.getElementById('dash-total').innerText = total;
    document.getElementById('dash-done').innerText = counts.done;
    document.getElementById('dash-eval').innerText = counts.evaluation;
    document.getElementById('dash-perc').innerText = total > 0 ? Math.round((counts.done / total) * 100) + "%" : "0%";

    const runningText = document.getElementById('running-text-container');
    if (runningText) {
        runningText.innerText = `Hi Yas! Keep Fighting! 🔥 .. Outstanding: ${counts.outstanding} | To Do: ${counts.todo} | Progress: ${counts.progress} | Done: ${counts.done} | Eval: ${counts.evaluation} .. Semangat Transport! 🚀`;
    }

    renderChart(counts);
}

function renderChart(counts) {
    const ctx = document.getElementById('jobDoughnutChart').getContext('2d');
    const legendEl = document.getElementById('chart-legend');
    
    if (myChart) myChart.destroy();

    const dataLabels = ['Outstanding', 'To Do', 'Progress', 'Done', 'Eval'];
    const dataColors = ['#94a3b8', '#3b82f6', '#f59e0b', '#10b981', '#ef4444'];
    const dataValues = [counts.outstanding, counts.todo, counts.progress, counts.done, counts.evaluation];

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: dataLabels,
            datasets: [{
                data: dataValues,
                backgroundColor: dataColors,
                borderWidth: 4,
                borderColor: '#ffffff',
                cutout: '70%'
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            maintainAspectRatio: false,
            animation: { duration: 1000 }
        }
    });
    legendEl.innerHTML = '';
    dataLabels.forEach((label, i) => {
        legendEl.innerHTML += `
            <div class="flex items-center justify-between text-xs leading-none py-1">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${dataColors[i]}"></div>
                    <span class="text-slate-500 font-bold uppercase tracking-tighter">${label}</span>
                </div>
                <span class="font-black text-slate-800 text-sm">${dataValues[i]}</span>
            </div>
        `;
    });
}

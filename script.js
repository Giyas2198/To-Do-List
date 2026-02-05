let tasks = [];
let currentSearch = "";

// Inisialisasi Firebase Listener
function initFirebase() {
    if (!window.db) return;
    
    const q = window.fs.query(
        window.fs.collection(window.db, "transport_tasks"), 
        window.fs.orderBy("id", "desc")
    );

    // Mendengarkan perubahan data secara real-time
    window.fs.onSnapshot(q, (snapshot) => {
        tasks = snapshot.docs.map(doc => ({
            fireId: doc.id,
            ...doc.data()
        }));
        renderTasks();
    });
}

async function addTask() {
    const text = document.getElementById('taskInput').value;
    const status = document.getElementById('statusSelect').value;
    const planDate = document.getElementById('planDateInput').value; 
    
    if (!text || !planDate) return alert("Lengkapi data tugas!");
    
    try {
        await window.fs.addDoc(window.fs.collection(window.db, "transport_tasks"), { 
            id: Date.now(), 
            text: text, 
            status: status, 
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            date: planDate 
        });
        document.getElementById('taskInput').value = '';
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

async function moveStatus(fireId, newStatus) {
    const docRef = window.fs.doc(window.db, "transport_tasks", fireId);
    await window.fs.updateDoc(docRef, { status: newStatus });
}

async function deleteTask(fireId) {
    if(confirm("Hapus tugas ini?")) { 
        await window.fs.deleteDoc(window.fs.doc(window.db, "transport_tasks", fireId));
    }
}

async function clearDoneTasks() {
    if(confirm("Hapus semua tugas yang sudah DONE di Cloud?")) {
        const doneTasks = tasks.filter(t => t.status === 'done');
        for (const task of doneTasks) {
            await window.fs.deleteDoc(window.fs.doc(window.db, "transport_tasks", task.fireId));
        }
    }
}

function renderTasks() {
    const columns = ['outstanding', 'todo', 'progress', 'done', 'evaluation'];
    const filteredTasks = tasks.filter(t => {
        const matchSearch = t.text.toLowerCase().includes(currentSearch.toLowerCase()) || 
                           t.date.includes(currentSearch);
        return matchSearch;
    });

    columns.forEach(col => {
        const listEl = document.getElementById(`list-${col}`);
        const colTasks = filteredTasks.filter(t => t.status === col);
        document.getElementById(`count-${col}`).innerText = colTasks.length;
        listEl.innerHTML = '';
        
        colTasks.forEach(task => {
            listEl.innerHTML += `
                <div class="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-2 animate-fade-in hover:shadow-md transition-all">
                    <p class="text-xs font-bold text-slate-800 leading-snug mb-2">${task.text}</p>
                    <div class="flex justify-between items-center border-t border-slate-50 pt-2">
                        <div class="flex flex-col">
                            <span class="text-[9px] text-slate-400 font-bold uppercase">${task.date}</span>
                            <span class="text-[10px] text-blue-500 font-mono font-black">${task.time}</span>
                        </div>
                        <div class="flex gap-2 items-center">
                            <button onclick="deleteTask('${task.fireId}')" class="text-slate-300 hover:text-rose-500 transition-colors">
                                <i class="fa fa-trash-can text-xs"></i>
                            </button>
                            <select onchange="moveStatus('${task.fireId}', this.value)" class="text-[10px] bg-slate-100 border-none rounded-lg px-1 py-1 font-black cursor-pointer hover:bg-slate-200 outline-none">
                                <option value="" disabled selected>MOVE</option>
                                <option value="outstanding">OUT</option>
                                <option value="todo">TODO</option>
                                <option value="progress">PROG</option>
                                <option value="done">DONE</option>
                                <option value="evaluation">EVAL</option>
                            </select>
                        </div>
                    </div>
                </div>
            `;
        });
    });

    if (typeof updateDashboardCharts === "function") {
        updateDashboardCharts(filteredTasks);
    }
}

// Fitur Pencarian & Export Tetap Sama
function searchTasks() { 
    currentSearch = document.getElementById('searchInput').value; 
    renderTasks(); 
}

function pickSearchDate(val) {
    document.getElementById('searchInput').value = val;
    currentSearch = val;
    renderTasks();
}

function resetFilters() { 
    document.getElementById('searchInput').value = ""; 
    document.getElementById('hiddenDateTrigger').value = "";
    currentSearch = ""; 
    renderTasks(); 
}

function sendWhatsApp() {
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const total = tasks.length;
    let message = `*LAPORAN HARIAN TRANSPORT*%0A---------------------------%0A`;
    message += `Total Tugas: ${total}%0ADone: ${doneTasks}%0A%0A*Rincian:*%0A`;
    tasks.forEach(t => { message += `- [${t.status.toUpperCase()}] ${t.text}%0A`; });
    window.open(`https://wa.me/?text=${message}`, '_blank');
}

function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,ID,Tugas,Status,Tanggal,Jam\n";
    tasks.forEach(t => { csvContent += `${t.id},"${t.text}",${t.status},${t.date},${t.time}\n`; });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "daily_transport_report.csv");
    document.body.appendChild(link);
    link.click();
}

async function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const element = document.body;
    try {
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('Daily-Transport-Report.pdf');
    } catch (e) { alert("Gagal PDF"); }
}

async function downloadImage() {
    const canvas = await html2canvas(document.body);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'Daily-Report.png';
    link.click();
}

window.onload = () => {
    document.getElementById('planDateInput').value = new Date().toISOString().split('T')[0];
};
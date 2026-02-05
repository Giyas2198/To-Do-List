let tasks = [];
let currentSearch = "";

// 1. Fungsi Login
function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;

    if (!email || !pass) return alert("Masukkan email dan password!");

    window.authTools.signInWithEmailAndPassword(window.auth, email, pass)
        .then(() => {
            console.log("Login Berhasil");
        })
        .catch((error) => {
            alert("Gagal Login: " + error.message);
        });
}

// 2. Fungsi Logout
function handleLogout() {
    if (confirm("Apakah anda ingin keluar?")) {
        window.authTools.signOut(window.auth);
    }
}

// 3. Pantau Status Auth
function watchAuthState() {
    window.authTools.onAuthStateChanged(window.auth, (user) => {
        const loginOverlay = document.getElementById('login-overlay');
        if (user) {
            loginOverlay.classList.add('hidden');
            initFirebase(); // Hanya panggil data jika sudah login
        } else {
            loginOverlay.classList.remove('hidden');
            tasks = []; // Kosongkan data saat logout
            renderTasks();
        }
    });
}

// 4. Inisialisasi Firebase Listener (Data Firestore)
function initFirebase() {
    if (!window.db) return;
    
    const q = window.fs.query(
        window.fs.collection(window.db, "transport_tasks"), 
        window.fs.orderBy("id", "desc")
    );

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
        const countEl = document.getElementById(`count-${col}`);
        
        if(countEl) countEl.innerText = colTasks.length;
        if(listEl) {
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
        }
    });

    if (typeof updateDashboardCharts === "function") {
        updateDashboardCharts(filteredTasks);
    }
}

function sendWhatsApp() {
    const doneTasks = tasks.filter(t => t.status === 'done').length;
    const total = tasks.length;
    let message = `*LAPORAN HARIAN TRANSPORT*%0A---------------------------%0A`;
    message += `Total Tugas: ${total}%0ADone: ${doneTasks}%0A%0A*Rincian:*%0A`;
    tasks.forEach(t => { message += `- [${t.status.toUpperCase()}] ${t.text}%0A`; });
    window.open(`https://wa.me/?text=${message}`, '_blank');
}

window.onload = () => {
    document.getElementById('planDateInput').value = new Date().toISOString().split('T')[0];
};

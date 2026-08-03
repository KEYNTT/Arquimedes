/* ==========================================
   CONFIGURACIÓN
========================================== */

const MS_PER_DAY = 86_400_000;
const TASKS_KEY = "progress-dashboard-tasks";

const meses = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE"
];

const dias = [
    "DOMINGO",
    "LUNES",
    "MARTES",
    "MIÉRCOLES",
    "JUEVES",
    "VIERNES",
    "SÁBADO"
];


/* ==========================================
   ELEMENTOS DEL HTML
========================================== */

const ui = {
    yearTitle: document.getElementById("yearTitle"),
    monthTitle: document.getElementById("monthTitle"),
    dayTitle: document.getElementById("dayTitle"),

    yearPercentage: document.getElementById("yearPercentage"),
    monthPercentage: document.getElementById("monthPercentage"),
    dayPercentage: document.getElementById("dayPercentage"),

    yearBar: document.getElementById("yearBar"),
    monthBar: document.getElementById("monthBar"),
    dayBar: document.getElementById("dayBar"),

    yearDetailLabel:
        document.getElementById("yearDetailLabel"),

    monthDetailLabel:
        document.getElementById("monthDetailLabel"),

    dayDetailLabel:
        document.getElementById("dayDetailLabel"),

    yearDetail:
        document.getElementById("yearDetail"),

    monthDetail:
        document.getElementById("monthDetail"),

    dayDetail:
        document.getElementById("dayDetail"),

    clock: document.getElementById("clock"),
    dayName: document.getElementById("dayName"),
    fullDate: document.getElementById("fullDate"),
    timezone: document.getElementById("timezone"),

    dayOfYear: document.getElementById("dayOfYear"),
    weekNumber: document.getElementById("weekNumber"),
    remainingDays: document.getElementById("remainingDays"),

    taskForm: document.getElementById("taskForm"),
    taskInput: document.getElementById("taskInput"),
    taskList: document.getElementById("taskList"),
    taskCount: document.getElementById("taskCount"),
    emptyTasks: document.getElementById("emptyTasks")

    
};


/* ==========================================
   SEMANA ISO
========================================== */

function getISOWeek(date) {
    const temp = new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        )
    );

    const dayNumber = temp.getUTCDay() || 7;

    temp.setUTCDate(
        temp.getUTCDate() + 4 - dayNumber
    );

    const yearStart = new Date(
        Date.UTC(temp.getUTCFullYear(), 0, 1)
    );

    return Math.ceil(
        (((temp - yearStart) / MS_PER_DAY) + 1) / 7
    );
}


/* ==========================================
   CALCULAR PROGRESO EXACTO
========================================== */

function calculateDashboardData(now) {
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();

    const isLeapYear =
        year % 4 === 0 &&
        (year % 100 !== 0 || year % 400 === 0);

    const daysInYear = isLeapYear ? 366 : 365;

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    /*
       Tiempo transcurrido desde las 00:00 de hoy.
       Incluye horas, minutos, segundos y milisegundos.
    */

    const secondsToday =
        now.getHours() * 3600 +
        now.getMinutes() * 60 +
        now.getSeconds() +
        now.getMilliseconds() / 1000;

    const elapsedHoursToday =
        secondsToday / 3600;

    const dayFraction =
        secondsToday / 86400;

    /*
       Día actual dentro del año.
       Se usa UTC para evitar errores por cambios horarios.
    */

    const currentDateUTC =
        Date.UTC(year, month, date);

    const startYearUTC =
        Date.UTC(year, 0, 1);

    const dayOfYear =
        Math.floor(
            (currentDateUTC - startYearUTC) /
            MS_PER_DAY
        ) + 1;

    /*
       No contamos el día actual como completado.
       Ejemplo: día 3 a las 12:00 = 2.5 días transcurridos.
    */

    const elapsedYearDays =
        dayOfYear - 1 + dayFraction;

    const elapsedMonthDays =
        date - 1 + dayFraction;

    return {
        now,
        year,
        month,
        date,

        daysInYear,
        daysInMonth,
        dayOfYear,

        elapsedYearDays,
        elapsedMonthDays,
        elapsedHoursToday,

        yearProgress:
            (elapsedYearDays / daysInYear) * 100,

        monthProgress:
            (elapsedMonthDays / daysInMonth) * 100,

        dayProgress:
            (elapsedHoursToday / 24) * 100,

        remainingDays:
            daysInYear - dayOfYear,

        weekNumber:
            getISOWeek(now)
    };
}


/* ==========================================
   MOSTRAR DASHBOARD
========================================== */

function renderDashboard(data) {
    const {
        now,
        year,
        month,
        date,

        daysInYear,
        daysInMonth,
        dayOfYear,

        elapsedYearDays,
        elapsedMonthDays,
        elapsedHoursToday,

        yearProgress,
        monthProgress,
        dayProgress,

        remainingDays,
        weekNumber
    } = data;

    const currentMonth = month + 1;

    const monthNumber =
        String(currentMonth).padStart(2, "0");

    const dayNumber =
        String(date).padStart(2, "0");


    /* ==========================================
       TÍTULOS
    ========================================== */

    ui.yearTitle.textContent =
        `AÑO · ${year}`;

    ui.monthTitle.textContent =
        `MES · ${meses[month]} ${monthNumber}`;

    ui.dayTitle.textContent =
        `DÍA · ${dias[now.getDay()]} ${dayNumber}`;


    /* ==========================================
       PORCENTAJES EXACTOS
    ========================================== */

    ui.yearPercentage.textContent =
        `${yearProgress.toFixed(3)}%`;

    ui.monthPercentage.textContent =
        `${monthProgress.toFixed(3)}%`;

    ui.dayPercentage.textContent =
        `${dayProgress.toFixed(3)}%`;


    /* ==========================================
       AVANCE EXACTO DE LAS BARRAS
    ========================================== */

    ui.yearBar.style.width =
        `${yearProgress}%`;

    ui.monthBar.style.width =
        `${monthProgress}%`;

    ui.dayBar.style.width =
        `${dayProgress}%`;


    /* ==========================================
       DIVISIONES VISUALES
    ========================================== */

    /*
       Año: 12 divisiones.
       Mes: 28, 29, 30 o 31 divisiones.
       Día: 24 divisiones.
    */

    ui.yearBar.parentElement.style.setProperty(
        "--segments",
        12
    );

    ui.monthBar.parentElement.style.setProperty(
        "--segments",
        daysInMonth
    );

    ui.dayBar.parentElement.style.setProperty(
        "--segments",
        24
    );


    /* ==========================================
       INFORMACIÓN DE CADA BARRA
    ========================================== */
    
        ui.yearDetailLabel.textContent =
            `Mes ${currentMonth} de 12`;

        ui.yearDetail.textContent =
            `${elapsedYearDays.toFixed(2)} / ${daysInYear} días`;


        ui.monthDetailLabel.textContent =
            `Día ${date} de ${daysInMonth}`;

        ui.monthDetail.textContent =
            `${elapsedMonthDays.toFixed(2)} días transcurridos`;


        ui.dayDetailLabel.textContent =
            `Hora ${now.getHours()} de 24`;

        ui.dayDetail.textContent =
            `${elapsedHoursToday.toFixed(2)} horas transcurridas`;


    /* ==========================================
       ACCESIBILIDAD DE LAS BARRAS
    ========================================== */

    ui.yearBar.parentElement.setAttribute(
        "aria-valuenow",
        yearProgress.toFixed(3)
    );

    ui.monthBar.parentElement.setAttribute(
        "aria-valuenow",
        monthProgress.toFixed(3)
    );

    ui.dayBar.parentElement.setAttribute(
        "aria-valuenow",
        dayProgress.toFixed(3)
    );


    /* ==========================================
       RELOJ Y FECHA
    ========================================== */

    ui.clock.textContent =
        now.toLocaleTimeString("es-PE", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });

    const formattedDay =
        now.toLocaleDateString("es-PE", {
            weekday: "long"
        });

    ui.dayName.textContent =
        formattedDay.charAt(0).toUpperCase() +
        formattedDay.slice(1);

    const formattedDate =
        now.toLocaleDateString("es-PE", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

    ui.fullDate.textContent =
        formattedDate.charAt(0).toUpperCase() +
        formattedDate.slice(1);

    ui.timezone.textContent =
        Intl.DateTimeFormat()
            .resolvedOptions()
            .timeZone;


    /* ==========================================
       ESTADO GENERAL
    ========================================== */

    ui.dayOfYear.textContent =
        dayOfYear;

    ui.weekNumber.textContent =
        weekNumber;

    ui.remainingDays.textContent =
        remainingDays;
}


/* ==========================================
   ACTUALIZAR DASHBOARD
========================================== */

function updateDashboard() {
    const data =
        calculateDashboardData(new Date());

    renderDashboard(data);
}


/* ==========================================
   TAREAS LOCALES
========================================== */

let tasks = [];

try {
    const savedTasks =
        JSON.parse(
            localStorage.getItem(TASKS_KEY) || "[]"
        );

    tasks =
        Array.isArray(savedTasks)
            ? savedTasks
            : [];
} catch {
    tasks = [];
}


function saveTasks() {
    localStorage.setItem(
        TASKS_KEY,
        JSON.stringify(tasks)
    );
}


function renderTasks() {
    ui.taskList.replaceChildren();

    const orderedTasks =
        [...tasks].sort((a, b) => {
            if (a.completed !== b.completed) {
                return (
                    Number(a.completed) -
                    Number(b.completed)
                );
            }

            return b.createdAt - a.createdAt;
        });

    const fragment =
        document.createDocumentFragment();

    orderedTasks.forEach((task) => {
        const item =
            document.createElement("li");

        item.className =
            task.completed
                ? "task-item is-complete"
                : "task-item";

        item.dataset.id = task.id;

        const toggle =
            document.createElement("button");

        toggle.type = "button";
        toggle.className = "task-toggle";
        toggle.dataset.action = "toggle";

        toggle.textContent =
            task.completed ? "✓" : "";

        toggle.setAttribute(
            "aria-label",
            task.completed
                ? "Marcar como pendiente"
                : "Marcar como completada"
        );

        const text =
            document.createElement("span");

        text.className = "task-text";
        text.textContent = task.text;

        const remove =
            document.createElement("button");

        remove.type = "button";
        remove.className = "task-delete";
        remove.dataset.action = "delete";
        remove.textContent = "×";

        remove.setAttribute(
            "aria-label",
            "Eliminar tarea"
        );

        item.append(
            toggle,
            text,
            remove
        );

        fragment.appendChild(item);
    });

    ui.taskList.appendChild(fragment);

    const pending =
        tasks.filter(
            task => !task.completed
        ).length;

    ui.taskCount.textContent =
        pending === 1
            ? "1 pendiente"
            : `${pending} pendientes`;

    ui.emptyTasks.hidden =
        tasks.length > 0;
}


/* ==========================================
   EVENTOS DE TAREAS
========================================== */

ui.taskForm.addEventListener(
    "submit",
    (event) => {
        event.preventDefault();

        const text =
            ui.taskInput.value.trim();

        if (!text) {
            ui.taskInput.focus();
            return;
        }

        tasks.push({
            id:
                typeof crypto.randomUUID === "function"
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random()}`,

            text,
            completed: false,
            createdAt: Date.now()
        });

        saveTasks();
        renderTasks();

        ui.taskInput.value = "";
        ui.taskInput.focus();
    }
);


ui.taskList.addEventListener(
    "click",
    (event) => {
        const button =
            event.target.closest(
                "button[data-action]"
            );

        if (!button) {
            return;
        }

        const item =
            button.closest(".task-item");

        if (!item) {
            return;
        }

        const task =
            tasks.find(
                currentTask =>
                    currentTask.id === item.dataset.id
            );

        if (!task) {
            return;
        }

        if (button.dataset.action === "toggle") {
            task.completed = !task.completed;
        }

        if (button.dataset.action === "delete") {
            tasks = tasks.filter(
                currentTask =>
                    currentTask.id !== task.id
            );
        }

        saveTasks();
        renderTasks();
    }
);


/* ==========================================
   INICIAR
========================================== */

updateDashboard();
renderTasks();

setInterval(updateDashboard, 1000);
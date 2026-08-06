/* ==========================================
   CONFIGURACIÓN
========================================== */

const MS_PER_DAY = 86_400_000;
const TASKS_KEY = "progress-dashboard-tasks";
const TASKS_TITLE_KEY = "progress-dashboard-tasks-title";
const DEFAULT_TASKS_TITLE = "Mis tareas";
const MAX_TASKS_TITLE_LENGTH = 45;
const LIKE_VISITOR_KEY = "progress-dashboard-like-visitor";

const LIKES_API_URL =
    "https://dashboard-feedback-api.kevin-123-abanto.workers.dev";

const TASK_COLORS = [
    "blue",
    "green",
    "amber",
    "red",
    "violet"
];

const TASK_COLOR_NAMES = {
    blue: "azul",
    green: "verde",
    amber: "amarillo",
    red: "rojo",
    violet: "morado"
};

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
    progressCards:
        document.querySelectorAll(
            "[data-progress-card]"
        ),

    yearTitle: document.getElementById("yearTitle"),
    monthTitle: document.getElementById("monthTitle"),
    dayTitle: document.getElementById("dayTitle"),

    yearPercentage:
        document.getElementById("yearPercentage"),

    monthPercentage:
        document.getElementById("monthPercentage"),

    dayPercentage:
        document.getElementById("dayPercentage"),

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

    dayOfYear:
        document.getElementById("dayOfYear"),

    weekNumber:
        document.getElementById("weekNumber"),

    remainingDays:
        document.getElementById("remainingDays"),

    taskForm:
        document.getElementById("taskForm"),

    taskInput:
        document.getElementById("taskInput"),

    taskImportant:
        document.getElementById("taskImportant"),

    taskList:
        document.getElementById("taskList"),

    taskCount:
        document.getElementById("taskCount"),

    emptyTasks:
        document.getElementById("emptyTasks"),

    tasksTitle:
        document.getElementById("tasksTitle"),

    editTasksTitle:
        document.getElementById("editTasksTitle"),

    likeButton:
        document.getElementById("likeButton"),

    likeCount:
        document.getElementById("likeCount")
};


/* ==========================================
   CONTADOR GLOBAL DE LIKES
========================================== */

let visitorId = "";
let likeRequestPending = false;


function createVisitorId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        `${Date.now()}-` +
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2)
    );
}


function getVisitorId() {
    if (visitorId) {
        return visitorId;
    }

    try {
        const savedId =
            localStorage.getItem(
                LIKE_VISITOR_KEY
            );

        if (savedId) {
            visitorId = savedId;
            return visitorId;
        }

        visitorId = createVisitorId();

        localStorage.setItem(
            LIKE_VISITOR_KEY,
            visitorId
        );
    } catch {
        visitorId = createVisitorId();
    }

    return visitorId;
}


function getLikesEndpoint() {
    if (
        !LIKES_API_URL ||
        LIKES_API_URL.includes("TU-SUBDOMINIO")
    ) {
        return null;
    }

    return new URL(
        "api/likes",
        `${LIKES_API_URL.replace(/\/$/, "")}/`
    );
}


function renderLikeState({ count, liked }) {
    ui.likeCount.textContent =
        new Intl.NumberFormat("es-PE")
            .format(count);

    ui.likeButton.classList.toggle(
        "is-liked",
        liked
    );

    ui.likeButton.setAttribute(
        "aria-pressed",
        String(liked)
    );

    ui.likeButton.setAttribute(
        "aria-label",
        liked
            ? "Quitar mi me gusta"
            : "Dar me gusta a esta página"
    );

    ui.likeButton.title =
        liked
            ? "Quitar me gusta"
            : "Me gusta";
}


async function loadLikeState() {
    const endpoint = getLikesEndpoint();

    if (!endpoint) {
        ui.likeCount.textContent = "—";
        ui.likeButton.disabled = true;
        ui.likeButton.title =
            "Configura la URL del Worker en app.js";
        return;
    }

    endpoint.searchParams.set(
        "visitorId",
        getVisitorId()
    );

    try {
        const response = await fetch(
            endpoint,
            {
                headers: {
                    Accept: "application/json"
                }
            }
        );

        if (!response.ok) {
            throw new Error(
                `Error ${response.status}`
            );
        }

        const data = await response.json();

        renderLikeState({
            count: Number(data.count) || 0,
            liked: Boolean(data.liked)
        });
    } catch {
        ui.likeCount.textContent = "—";
        ui.likeButton.title =
            "No se pudo conectar con el contador";
    }
}


async function toggleLike() {
    const endpoint = getLikesEndpoint();

    if (!endpoint || likeRequestPending) {
        return;
    }

    likeRequestPending = true;
    ui.likeButton.disabled = true;

    try {
        const response = await fetch(
            endpoint,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                },
                body: JSON.stringify({
                    visitorId: getVisitorId()
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `Error ${response.status}`
            );
        }

        const data = await response.json();

        renderLikeState({
            count: Number(data.count) || 0,
            liked: Boolean(data.liked)
        });
    } catch {
        ui.likeButton.title =
            "No se pudo registrar el me gusta";
    } finally {
        likeRequestPending = false;
        ui.likeButton.disabled = false;
    }
}


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

    const dayNumber =
        temp.getUTCDay() || 7;

    temp.setUTCDate(
        temp.getUTCDate() + 4 - dayNumber
    );

    const yearStart = new Date(
        Date.UTC(
            temp.getUTCFullYear(),
            0,
            1
        )
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
        (
            year % 100 !== 0 ||
            year % 400 === 0
        );

    const daysInYear =
        isLeapYear ? 366 : 365;

    const daysInMonth = new Date(
        year,
        month + 1,
        0
    ).getDate();

    /*
       Tiempo transcurrido desde las 00:00.
       Incluye horas, minutos, segundos
       y milisegundos.
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
       Se usa UTC para evitar errores
       por cambios horarios.
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
       No se cuenta el día actual como
       completamente transcurrido.

       Ejemplo:
       Día 3 a las 12:00 = 2.5 días.
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
   VISTA TRANSCURRIDA / RESTANTE
========================================== */

let latestDashboardData = null;


function clampPercentage(value) {
    return Math.min(
        100,
        Math.max(0, value)
    );
}


function renderProgressCard(card, data) {
    const type =
        card.dataset.progressCard;

    const isRemaining =
        card.dataset.view === "remaining";

    const monthNumber =
        String(data.month + 1)
            .padStart(2, "0");

    const dayNumber =
        String(data.date)
            .padStart(2, "0");

    const remainingYearDays =
        Math.max(
            0,
            data.daysInYear -
            data.elapsedYearDays
        );

    const remainingMonthDays =
        Math.max(
            0,
            data.daysInMonth -
            data.elapsedMonthDays
        );

    const remainingHours =
        Math.max(
            0,
            24 - data.elapsedHoursToday
        );

    const configurations = {
        year: {
            elapsed: {
                title: `AÑO · ${data.year}`,
                percentage: data.yearProgress,
                detailLabel:
                    `Mes ${data.month + 1} de 12`,
                detail:
                    `${data.elapsedYearDays.toFixed(2)} / ` +
                    `${data.daysInYear} días`,
                barLabel: "Progreso transcurrido del año"
            },
            remaining: {
                title: `RESTANTE · AÑO ${data.year}`,
                percentage:
                    100 - data.yearProgress,
                detailLabel: "Días que quedan",
                detail:
                    `${remainingYearDays.toFixed(2)} / ` +
                    `${data.daysInYear} días`,
                barLabel: "Tiempo restante del año"
            }
        },
        month: {
            elapsed: {
                title:
                    `MES · ${meses[data.month]} ` +
                    monthNumber,
                percentage: data.monthProgress,
                detailLabel:
                    `Día ${data.date} de ` +
                    data.daysInMonth,
                detail:
                    `${data.elapsedMonthDays.toFixed(2)} ` +
                    "días transcurridos",
                barLabel: "Progreso transcurrido del mes"
            },
            remaining: {
                title:
                    `RESTANTE · ${meses[data.month]} ` +
                    monthNumber,
                percentage:
                    100 - data.monthProgress,
                detailLabel: "Días que quedan",
                detail:
                    `${remainingMonthDays.toFixed(2)} / ` +
                    `${data.daysInMonth} días`,
                barLabel: "Tiempo restante del mes"
            }
        },
        day: {
            elapsed: {
                title:
                    `DÍA · ${dias[data.now.getDay()]} ` +
                    dayNumber,
                percentage: data.dayProgress,
                detailLabel:
                    `Hora ${data.now.getHours()} de 24`,
                detail:
                    `${data.elapsedHoursToday.toFixed(2)} ` +
                    "horas transcurridas",
                barLabel: "Progreso transcurrido del día"
            },
            remaining: {
                title:
                    `RESTANTE · ` +
                    `${dias[data.now.getDay()]} ${dayNumber}`,
                percentage:
                    100 - data.dayProgress,
                detailLabel: "Horas que quedan",
                detail:
                    `${remainingHours.toFixed(2)} / 24 horas`,
                barLabel: "Tiempo restante del día"
            }
        }
    };

    const configuration =
        configurations[type]?.[
            isRemaining
                ? "remaining"
                : "elapsed"
        ];

    if (!configuration) {
        return;
    }

    const percentage =
        clampPercentage(
            configuration.percentage
        );

    ui[`${type}Title`].textContent =
        configuration.title;

    ui[`${type}Percentage`].textContent =
        `${percentage.toFixed(3)}%`;

    ui[`${type}Bar`].style.width =
        `${percentage}%`;

    ui[`${type}DetailLabel`].textContent =
        configuration.detailLabel;

    ui[`${type}Detail`].textContent =
        configuration.detail;

    ui[`${type}Bar`]
        .parentElement
        .setAttribute(
            "aria-valuenow",
            percentage.toFixed(3)
        );

    ui[`${type}Bar`]
        .parentElement
        .setAttribute(
            "aria-label",
            configuration.barLabel
        );
}


function renderProgressCards(data) {
    ui.progressCards.forEach(
        card => renderProgressCard(
            card,
            data
        )
    );
}


function updateProgressCardAccessibility(
    card,
    isRemaining
) {
    const names = {
        year: "año",
        month: "mes",
        day: "día"
    };

    const name =
        names[card.dataset.progressCard];

    card.setAttribute(
        "aria-pressed",
        String(isRemaining)
    );

    card.setAttribute(
        "aria-label",
        isRemaining
            ? `Mostrar el tiempo transcurrido del ${name}`
            : `Mostrar el tiempo restante del ${name}`
    );

    card.title =
        isRemaining
            ? "Haz clic para volver al tiempo transcurrido"
            : "Haz clic para ver el tiempo restante";
}


function toggleProgressCard(card) {
    if (
        !latestDashboardData ||
        card.classList.contains("is-switching")
    ) {
        return;
    }

    card.classList.remove("is-entering");
    card.classList.add("is-switching");

    window.setTimeout(() => {
        const isRemaining =
            card.dataset.view !== "remaining";

        card.dataset.view =
            isRemaining
                ? "remaining"
                : "elapsed";

        card.classList.toggle(
            "is-remaining",
            isRemaining
        );

        updateProgressCardAccessibility(
            card,
            isRemaining
        );

        renderProgressCard(
            card,
            latestDashboardData
        );

        card.classList.remove("is-switching");

        void card.offsetWidth;

        card.classList.add("is-entering");

        window.setTimeout(
            () => card.classList.remove(
                "is-entering"
            ),
            280
        );
    }, 170);
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

    renderProgressCards(data);


    /* ======================================
       DIVISIONES VISUALES
    ====================================== */

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


    /* ======================================
       RELOJ Y FECHA
    ====================================== */

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


    /* ======================================
       ESTADO GENERAL
    ====================================== */

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

    latestDashboardData = data;
    renderDashboard(data);
}


/* ==========================================
   CONFIGURACIÓN DE TAREAS
========================================== */

let tasks = [];
let savedTasksTitle =
    DEFAULT_TASKS_TITLE;


function normalizeTaskColor(color) {
    return TASK_COLORS.includes(color)
        ? color
        : "blue";
}


function normalizeTasksTitle(title) {
    const cleanTitle = String(title || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, MAX_TASKS_TITLE_LENGTH);

    return cleanTitle ||
        DEFAULT_TASKS_TITLE;
}


function placeCaretAtEnd(element) {
    const range =
        document.createRange();

    const selection =
        window.getSelection();

    if (!selection) {
        return;
    }

    range.selectNodeContents(element);
    range.collapse(false);

    selection.removeAllRanges();
    selection.addRange(range);
}


/* ==========================================
   CARGAR TÍTULO
========================================== */

try {
    savedTasksTitle =
        normalizeTasksTitle(
            localStorage.getItem(
                TASKS_TITLE_KEY
            )
        );
} catch {
    savedTasksTitle =
        DEFAULT_TASKS_TITLE;
}

ui.tasksTitle.textContent =
    savedTasksTitle;


/* ==========================================
   CARGAR TAREAS
========================================== */

try {
    const savedTasks =
        JSON.parse(
            localStorage.getItem(TASKS_KEY) ||
            "[]"
        );

    tasks = Array.isArray(savedTasks)
        ? savedTasks
            .filter(
                task =>
                    task &&
                    typeof task.text === "string" &&
                    task.text.trim()
            )
            .map((task, index) => ({
                id: String(
                    task.id ||
                    `saved-${index}-${Date.now()}`
                ),

                text:
                    task.text
                        .trim()
                        .slice(0, 120),

                completed:
                    Boolean(task.completed),

                important:
                    Boolean(task.important),

                color:
                    normalizeTaskColor(task.color),

                createdAt:
                    Number.isFinite(task.createdAt)
                        ? task.createdAt
                        : Date.now() - index
            }))
        : [];
} catch {
    tasks = [];
}


/* ==========================================
   GUARDAR TÍTULO
========================================== */

function saveTasksTitle() {
    const title =
        normalizeTasksTitle(
            ui.tasksTitle.textContent
        );

    savedTasksTitle = title;
    ui.tasksTitle.textContent = title;

    try {
        localStorage.setItem(
            TASKS_TITLE_KEY,
            title
        );
    } catch {
        /*
           El título continúa funcionando
           durante la sesión.
        */
    }
}


/* ==========================================
   GUARDAR TAREAS
========================================== */

function saveTasks() {
    try {
        localStorage.setItem(
            TASKS_KEY,
            JSON.stringify(tasks)
        );
    } catch {
        /*
           Las tareas continúan funcionando
           durante la sesión.
        */
    }
}


/* ==========================================
   MOSTRAR TAREAS
========================================== */

function renderTasks() {
    ui.taskList.replaceChildren();

    const orderedTasks =
        [...tasks].sort((a, b) => {
            /*
               Primero se muestran las tareas
               que todavía están pendientes.
            */

            if (a.completed !== b.completed) {
                return (
                    Number(a.completed) -
                    Number(b.completed)
                );
            }

            /*
               Las tareas importantes aparecen
               antes que las tareas normales.
            */

            if (a.important !== b.important) {
                return (
                    Number(b.important) -
                    Number(a.important)
                );
            }

            /*
               Las tareas más recientes aparecen
               primero.
            */

            return b.createdAt - a.createdAt;
        });

    const fragment =
        document.createDocumentFragment();

    orderedTasks.forEach((task) => {
        const item =
            document.createElement("li");

        item.className =
            "task-item";

        if (task.completed) {
            item.classList.add(
                "is-complete"
            );
        }

        if (task.important) {
            item.classList.add(
                "is-important"
            );
        }

        item.dataset.id =
            task.id;

        item.dataset.color =
            normalizeTaskColor(task.color);


        /* ==================================
           BOTÓN COMPLETAR
        ================================== */

        const toggle =
            document.createElement("button");

        toggle.type = "button";
        toggle.className =
            "task-toggle";

        toggle.dataset.action =
            "toggle";

        toggle.textContent =
            task.completed ? "✓" : "";

        toggle.setAttribute(
            "aria-label",
            task.completed
                ? "Marcar como pendiente"
                : "Marcar como completada"
        );


        /* ==================================
           CONTENIDO DE LA TAREA
        ================================== */

        const content =
            document.createElement("div");

        content.className =
            "task-content";

        const text =
            document.createElement("span");

        text.className =
            "task-text";

        text.textContent =
            task.text;

        content.appendChild(text);

        if (task.important) {
            const priorityBadge =
                document.createElement("span");

            priorityBadge.className =
                "task-priority-badge";

            priorityBadge.textContent =
                "IMPORTANTE";

            content.appendChild(
                priorityBadge
            );
        }


        /* ==================================
           ACCIONES
        ================================== */

        const actions =
            document.createElement("div");

        actions.className =
            "task-actions";


        /* BOTÓN CAMBIAR COLOR */

        const colorButton =
            document.createElement("button");

        colorButton.type =
            "button";

        colorButton.className =
            "task-color-button";

        colorButton.dataset.action =
            "color";

        const colorDot =
            document.createElement("span");

        colorDot.className =
            "task-color-dot";

        colorDot.setAttribute(
            "aria-hidden",
            "true"
        );

        colorButton.appendChild(
            colorDot
        );

        colorButton.setAttribute(
            "aria-label",
            `Cambiar color. Color actual: ${
                TASK_COLOR_NAMES[
                    normalizeTaskColor(task.color)
                ]
            }`
        );

        colorButton.title =
            "Cambiar color";


        /* BOTÓN IMPORTANTE */

        const priorityButton =
            document.createElement("button");

        priorityButton.type =
            "button";

        priorityButton.className =
            task.important
                ? "task-priority-button is-active"
                : "task-priority-button";

        priorityButton.dataset.action =
            "important";

        priorityButton.textContent =
            "★";

        priorityButton.setAttribute(
            "aria-label",
            task.important
                ? "Quitar estado importante"
                : "Marcar como importante"
        );

        priorityButton.title =
            task.important
                ? "Quitar importancia"
                : "Marcar como importante";


        /* BOTÓN ELIMINAR */

        const remove =
            document.createElement("button");

        remove.type =
            "button";

        remove.className =
            "task-delete";

        remove.dataset.action =
            "delete";

        remove.textContent =
            "×";

        remove.setAttribute(
            "aria-label",
            "Eliminar tarea"
        );

        remove.title =
            "Eliminar tarea";


        /* AGREGAR ACCIONES */

        actions.append(
            colorButton,
            priorityButton,
            remove
        );

        item.append(
            toggle,
            content,
            actions
        );

        fragment.appendChild(item);
    });

    ui.taskList.appendChild(fragment);


    /* ======================================
       CONTADOR DE TAREAS
    ====================================== */

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
   TÍTULO EDITABLE DE TAREAS
========================================== */

ui.editTasksTitle.addEventListener(
    "click",
    () => {
        ui.tasksTitle.focus();

        const range =
            document.createRange();

        const selection =
            window.getSelection();

        if (!selection) {
            return;
        }

        range.selectNodeContents(
            ui.tasksTitle
        );

        selection.removeAllRanges();
        selection.addRange(range);
    }
);


ui.tasksTitle.addEventListener(
    "input",
    () => {
        const currentTitle =
            ui.tasksTitle.textContent || "";

        const singleLineTitle =
            currentTitle
                .replace(/[\r\n]+/g, " ")
                .slice(
                    0,
                    MAX_TASKS_TITLE_LENGTH
                );

        if (
            currentTitle !==
            singleLineTitle
        ) {
            ui.tasksTitle.textContent =
                singleLineTitle;

            placeCaretAtEnd(
                ui.tasksTitle
            );
        }
    }
);


ui.tasksTitle.addEventListener(
    "keydown",
    (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            ui.tasksTitle.blur();
        }

        if (event.key === "Escape") {
            event.preventDefault();

            ui.tasksTitle.textContent =
                savedTasksTitle;

            ui.tasksTitle.blur();
        }
    }
);


ui.tasksTitle.addEventListener(
    "blur",
    saveTasksTitle
);


/* ==========================================
   AGREGAR TAREA
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

        const selectedColor =
            ui.taskForm.querySelector(
                'input[name="taskColor"]:checked'
            )?.value;

        tasks.push({
            id:
                typeof crypto.randomUUID ===
                "function"
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random()}`,

            text,
            completed: false,

            important:
                ui.taskImportant.checked,

            color:
                normalizeTaskColor(
                    selectedColor
                ),

            createdAt:
                Date.now()
        });

        saveTasks();
        renderTasks();

        /*
           Limpia el formulario.
           El color vuelve a azul y
           "Importante" se desmarca.
        */

        ui.taskForm.reset();
        ui.taskInput.focus();
    }
);


/* ==========================================
   ACCIONES DE TAREAS
========================================== */

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
            button.closest(
                ".task-item"
            );

        if (!item) {
            return;
        }

        const task =
            tasks.find(
                currentTask =>
                    currentTask.id ===
                    item.dataset.id
            );

        if (!task) {
            return;
        }


        /* COMPLETAR */

        if (
            button.dataset.action ===
            "toggle"
        ) {
            task.completed =
                !task.completed;
        }


        /* IMPORTANTE */

        if (
            button.dataset.action ===
            "important"
        ) {
            task.important =
                !task.important;
        }


        /* CAMBIAR COLOR */

        if (
            button.dataset.action ===
            "color"
        ) {
            const currentColorIndex =
                TASK_COLORS.indexOf(
                    normalizeTaskColor(
                        task.color
                    )
                );

            task.color =
                TASK_COLORS[
                    (
                        currentColorIndex + 1
                    ) % TASK_COLORS.length
                ];
        }


        /* ELIMINAR */

        if (
            button.dataset.action ===
            "delete"
        ) {
            tasks =
                tasks.filter(
                    currentTask =>
                        currentTask.id !==
                        task.id
                );
        }

        saveTasks();
        renderTasks();
    }
);


/* ==========================================
   INICIAR
========================================== */

ui.progressCards.forEach((card) => {
    card.addEventListener(
        "click",
        () => toggleProgressCard(card)
    );

    card.addEventListener(
        "keydown",
        (event) => {
            if (
                event.key !== "Enter" &&
                event.key !== " "
            ) {
                return;
            }

            event.preventDefault();
            toggleProgressCard(card);
        }
    );
});

ui.likeButton.addEventListener(
    "click",
    toggleLike
);

updateDashboard();
renderTasks();
loadLikeState();

setInterval(
    updateDashboard,
    1000
);

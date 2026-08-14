/* ==========================================
   CONFIGURACIÓN
========================================== */
 
const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_MINUTE = 60_000;
const TASKS_KEY = "progress-dashboard-tasks";
const TASKS_TITLE_KEY = "progress-dashboard-tasks-title";
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
    weekTitle: document.getElementById("weekTitle"),
    dayTitle: document.getElementById("dayTitle"),
 
    yearPercentage:
        document.getElementById("yearPercentage"),
 
    monthPercentage:
        document.getElementById("monthPercentage"),

    weekPercentage:
        document.getElementById("weekPercentage"),
 
    dayPercentage:
        document.getElementById("dayPercentage"),
 
    yearBar: document.getElementById("yearBar"),
    monthBar: document.getElementById("monthBar"),
    weekBar: document.getElementById("weekBar"),
    dayBar: document.getElementById("dayBar"),
 
    yearDetailLabel:
        document.getElementById("yearDetailLabel"),
 
    monthDetailLabel:
        document.getElementById("monthDetailLabel"),

    weekDetailLabel:
        document.getElementById("weekDetailLabel"),
 
    dayDetailLabel:
        document.getElementById("dayDetailLabel"),
 
    yearDetail:
        document.getElementById("yearDetail"),
 
    monthDetail:
        document.getElementById("monthDetail"),

    weekDetail:
        document.getElementById("weekDetail"),
 
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
   TEXTOS TRADUCIBLES DESDE EL HTML
========================================== */
 
const dashboardTranslations =
    document.getElementById(
        "dashboardTranslations"
    );

const labels =
    dashboardTranslations?.dataset || {};

const dashboardLocale =
    labels.locale ||
    document.documentElement.lang ||
    undefined;

const DEFAULT_TASKS_TITLE =
    labels.defaultTasksTitle ||
    ui.tasksTitle.textContent.trim();

const TASK_COLOR_NAMES = {
    blue: labels.colorBlue,
    green: labels.colorGreen,
    amber: labels.colorAmber,
    red: labels.colorRed,
    violet: labels.colorViolet
};


function formatTranslation(
    template,
    values = {}
) {
    return String(template || "").replace(
        /\{([a-zA-Z][a-zA-Z0-9]*)\}/g,
        (match, key) =>
            Object.hasOwn(values, key)
                ? String(values[key])
                : match
    );
}


function formatUppercaseDatePart(
    date,
    options
) {
    return new Intl.DateTimeFormat(
        dashboardLocale,
        options
    )
        .format(date)
        .toLocaleUpperCase(dashboardLocale);
}


function capitalizeLocalized(value) {
    return (
        value.charAt(0)
            .toLocaleUpperCase(dashboardLocale) +
        value.slice(1)
    );
}
 
 
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
        new Intl.NumberFormat(dashboardLocale)
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
            ? labels.likeRemoveAria
            : labels.likeAddAria
    );
 
    ui.likeButton.title =
        liked
            ? labels.likeRemoveTitle
            : labels.likeTitle;
}
 
 
async function loadLikeState() {
    const endpoint = getLikesEndpoint();
 
    if (!endpoint) {
        ui.likeCount.textContent = "\u2014";
        ui.likeButton.disabled = true;
        ui.likeButton.title =
            labels.likesWorkerMissing;
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
        ui.likeCount.textContent = "\u2014";
        ui.likeButton.title =
            labels.likesConnectionError;
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
            labels.likesRegisterError;
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

    /*
       La semana ISO comienza el lunes.
       Lunes = 0 y domingo = 6.
    */

    const weekDayIndex =
        (now.getDay() + 6) % 7;

    const elapsedWeekDays =
        weekDayIndex + dayFraction;
 
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
        elapsedWeekDays,
        elapsedHoursToday,
 
        yearProgress:
            (elapsedYearDays / daysInYear) * 100,
 
        monthProgress:
            (elapsedMonthDays / daysInMonth) * 100,

        weekProgress:
            (elapsedWeekDays / 7) * 100,
 
        dayProgress:
            (elapsedHoursToday / 24) * 100,
 
        remainingDays:
            daysInYear - dayOfYear,
 
        weekNumber:
            getISOWeek(now),

        weekDayIndex
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
 
 
function formatUnit(
    value,
    singular,
    plural
) {
    return (
        `${value} ` +
        (value === 1 ? singular : plural)
    );
}
 
 
function joinDuration(parts) {
    const formattedParts =
        parts.map(
            ([value, singular, plural]) =>
                formatUnit(
                    value,
                    singular,
                    plural
                )
        );
 
    if (formattedParts.length === 1) {
        return formattedParts[0];
    }
 
    return (
        formattedParts
            .slice(0, -1)
            .join(", ") +
        ` ${labels.and} ` +
        formattedParts.at(-1)
    );
}
 
 
function getRemainingTimeParts(data) {
    const nextMidnight = new Date(
        data.year,
        data.month,
        data.date + 1
    );
 
    const remainingMinutesToday =
        Math.max(
            0,
            Math.ceil(
                (nextMidnight - data.now) /
                MS_PER_MINUTE
            )
        );
 
    const dayHours =
        Math.floor(
            remainingMinutesToday / 60
        );
 
    const dayMinutes =
        remainingMinutesToday % 60;
 
    const remainingHoursToday =
        Math.max(
            0,
            Math.ceil(
                (nextMidnight - data.now) /
                MS_PER_HOUR
            )
        );

    const nextWeekStart = new Date(
        data.year,
        data.month,
        data.date + (7 - data.weekDayIndex)
    );

    const remainingWeekHours =
        Math.max(
            0,
            Math.ceil(
                (nextWeekStart - data.now) /
                MS_PER_HOUR
            )
        );

    const weekDays =
        Math.floor(remainingWeekHours / 24);

    const weekHours =
        remainingWeekHours % 24;
 
    const monthDays =
        data.daysInMonth - data.date +
        Math.floor(
            remainingHoursToday / 24
        );
 
    const monthHours =
        remainingHoursToday % 24;
 
    let yearMonths =
        11 - data.month;
 
    let yearDays = monthDays;
    let yearHours = monthHours;
 
    if (
        monthDays === data.daysInMonth &&
        monthHours === 0
    ) {
        yearMonths += 1;
        yearDays = 0;
        yearHours = 0;
    }
 
    return {
        year: {
            months: yearMonths,
            days: yearDays,
            hours: yearHours
        },
        month: {
            days: monthDays,
            hours: monthHours
        },
        week: {
            days: weekDays,
            hours: weekHours
        },
        day: {
            hours: dayHours,
            minutes: dayMinutes
        }
    };
}
 
 
function getElapsedTimeParts(data) {
    return {
        year: {
            months: data.month,
            days: data.date - 1,
            hours: data.now.getHours()
        },
        month: {
            days: data.date - 1,
            hours: data.now.getHours()
        },
        week: {
            days: data.weekDayIndex,
            hours: data.now.getHours()
        },
        day: {
            hours: data.now.getHours(),
            minutes: data.now.getMinutes()
        }
    };
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

    const monthName =
        formatUppercaseDatePart(
            data.now,
            { month: "long" }
        );

    const weekdayName =
        formatUppercaseDatePart(
            data.now,
            { weekday: "long" }
        );
 
    const remainingTime =
        getRemainingTimeParts(data);
 
    const elapsedTime =
        getElapsedTimeParts(data);
 
    const configurations = {
        year: {
            elapsed: {
                title:
                    formatTranslation(
                        labels.yearTitleTemplate,
                        {
                            period: labels.year,
                            year: data.year
                        }
                    ),
                percentage: data.yearProgress,
                detailLabel:
                    labels.elapsedTime,
                detail: joinDuration([
                    [
                        elapsedTime.year.months,
                        labels.monthUnitSingular,
                        labels.monthUnitPlural
                    ],
                    [
                        elapsedTime.year.days,
                        labels.dayUnitSingular,
                        labels.dayUnitPlural
                    ],
                    [
                        elapsedTime.year.hours,
                        labels.hourUnitSingular,
                        labels.hourUnitPlural
                    ]
                ]),
                barLabel:
                    labels.yearElapsedBarLabel
            },
            remaining: {
                title:
                    formatTranslation(
                        labels.yearRemainingTitleTemplate,
                        {
                            remaining: labels.remaining,
                            period: labels.year,
                            year: data.year
                        }
                    ),
                percentage:
                    100 - data.yearProgress,
                detailLabel:
                    labels.remainingTime,
                detail: joinDuration([
                    [
                        remainingTime.year.months,
                        labels.monthUnitSingular,
                        labels.monthUnitPlural
                    ],
                    [
                        remainingTime.year.days,
                        labels.dayUnitSingular,
                        labels.dayUnitPlural
                    ],
                    [
                        remainingTime.year.hours,
                        labels.hourUnitSingular,
                        labels.hourUnitPlural
                    ]
                ]),
                barLabel:
                    labels.yearRemainingBarLabel
            }
        },
        month: {
            elapsed: {
                title:
                    formatTranslation(
                        labels.monthTitleTemplate,
                        {
                            period: labels.month,
                            monthName,
                            monthNumber
                        }
                    ),
                percentage: data.monthProgress,
                detailLabel:
                    labels.elapsedTime,
                detail: joinDuration([
                    [
                        elapsedTime.month.days,
                        labels.dayUnitSingular,
                        labels.dayUnitPlural
                    ],
                    [
                        elapsedTime.month.hours,
                        labels.hourUnitSingular,
                        labels.hourUnitPlural
                    ]
                ]),
                barLabel:
                    labels.monthElapsedBarLabel
            },
            remaining: {
                title:
                    formatTranslation(
                        labels.monthRemainingTitleTemplate,
                        {
                            remaining: labels.remaining,
                            period: labels.month,
                            monthName,
                            monthNumber
                        }
                    ),
                percentage:
                    100 - data.monthProgress,
                detailLabel:
                    labels.remainingTime,
                detail: joinDuration([
                    [
                        remainingTime.month.days,
                        labels.dayUnitSingular,
                        labels.dayUnitPlural
                    ],
                    [
                        remainingTime.month.hours,
                        labels.hourUnitSingular,
                        labels.hourUnitPlural
                    ]
                ]),
                barLabel:
                    labels.monthRemainingBarLabel
            }
        },
        week: {
            elapsed: {
                title:
                    formatTranslation(
                        labels.weekTitleTemplate,
                        {
                            period: labels.week,
                            weekNumber: data.weekNumber
                        }
                    ),
                percentage: data.weekProgress,
                detailLabel:
                    labels.elapsedTime,
                detail: joinDuration([
                    [
                        elapsedTime.week.days,
                        labels.dayUnitSingular,
                        labels.dayUnitPlural
                    ],
                    [
                        elapsedTime.week.hours,
                        labels.hourUnitSingular,
                        labels.hourUnitPlural
                    ]
                ]),
                barLabel:
                    labels.weekElapsedBarLabel
            },
            remaining: {
                title:
                    formatTranslation(
                        labels.weekRemainingTitleTemplate,
                        {
                            remaining: labels.remaining,
                            period: labels.week,
                            weekNumber: data.weekNumber
                        }
                    ),
                percentage:
                    100 - data.weekProgress,
                detailLabel:
                    labels.remainingTime,
                detail: joinDuration([
                    [
                        remainingTime.week.days,
                        labels.dayUnitSingular,
                        labels.dayUnitPlural
                    ],
                    [
                        remainingTime.week.hours,
                        labels.hourUnitSingular,
                        labels.hourUnitPlural
                    ]
                ]),
                barLabel:
                    labels.weekRemainingBarLabel
            }
        },
        day: {
            elapsed: {
                title:
                    formatTranslation(
                        labels.dayTitleTemplate,
                        {
                            period: labels.day,
                            weekday: weekdayName,
                            dayNumber
                        }
                    ),
                percentage: data.dayProgress,
                detailLabel:
                    labels.elapsedTime,
                detail: joinDuration([
                    [
                        elapsedTime.day.hours,
                        labels.hourUnitSingular,
                        labels.hourUnitPlural
                    ],
                    [
                        elapsedTime.day.minutes,
                        labels.minuteUnitSingular,
                        labels.minuteUnitPlural
                    ]
                ]),
                barLabel:
                    labels.dayElapsedBarLabel
            },
            remaining: {
                title:
                    formatTranslation(
                        labels.dayRemainingTitleTemplate,
                        {
                            remaining: labels.remaining,
                            period: labels.day,
                            weekday: weekdayName,
                            dayNumber
                        }
                    ),
                percentage:
                    100 - data.dayProgress,
                detailLabel:
                    labels.remainingTime,
                detail: joinDuration([
                    [
                        remainingTime.day.hours,
                        labels.hourUnitSingular,
                        labels.hourUnitPlural
                    ],
                    [
                        remainingTime.day.minutes,
                        labels.minuteUnitSingular,
                        labels.minuteUnitPlural
                    ]
                ]),
                barLabel:
                    labels.dayRemainingBarLabel
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
    const periodNames = {
        year: labels.periodYear,
        month: labels.periodMonth,
        week: labels.periodWeek,
        day: labels.periodDay
    };
 
    const periodName =
        periodNames[card.dataset.progressCard];
 
    card.setAttribute(
        "aria-pressed",
        String(isRemaining)
    );
 
    card.setAttribute(
        "aria-label",
        formatTranslation(
            isRemaining
                ? labels.showElapsedCardTemplate
                : labels.showRemainingCardTemplate,
            { period: periodName }
        )
    );
 
    card.title =
        isRemaining
            ? labels.showElapsedHint
            : labels.showRemainingHint;
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
        elapsedWeekDays,
        elapsedHoursToday,
 
        yearProgress,
        monthProgress,
        weekProgress,
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
       Semana: 7 divisiones.
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

    ui.weekBar.parentElement.style.setProperty(
        "--segments",
        7
    );
 
    ui.dayBar.parentElement.style.setProperty(
        "--segments",
        24
    );
 
 
    /* ======================================
       RELOJ Y FECHA
    ====================================== */
 
    ui.clock.textContent =
        now.toLocaleTimeString(dashboardLocale, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
 
    const formattedDay =
        now.toLocaleDateString(dashboardLocale, {
            weekday: "long"
        });
 
    ui.dayName.textContent =
        capitalizeLocalized(formattedDay);
 
    const formattedDate =
        now.toLocaleDateString(dashboardLocale, {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
 
    ui.fullDate.textContent =
        capitalizeLocalized(formattedDate);
 
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
            task.completed ? "\u2713" : "";
 
        toggle.setAttribute(
            "aria-label",
            task.completed
                ? labels.taskMarkPending
                : labels.taskMarkCompleted
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
                labels.taskImportantBadge;
 
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
            formatTranslation(
                labels.taskChangeColorTemplate,
                {
                    color:
                        TASK_COLOR_NAMES[
                            normalizeTaskColor(
                                task.color
                            )
                        ]
                }
            )
        );
 
        colorButton.title =
            labels.taskChangeColorTitle;
 
 
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
            "\u2605";
 
        priorityButton.setAttribute(
            "aria-label",
            task.important
                ? labels.taskRemoveImportantAria
                : labels.taskMarkImportantAria
        );
 
        priorityButton.title =
            task.important
                ? labels.taskRemoveImportantTitle
                : labels.taskMarkImportantTitle;
 
 
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
            "\u00d7";
 
        remove.setAttribute(
            "aria-label",
            labels.taskDelete
        );
 
        remove.title =
            labels.taskDelete;
 
 
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
        formatTranslation(
            pending === 1
                ? labels.pendingSingularTemplate
                : labels.pendingPluralTemplate,
            { count: pending }
        );
 
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


const LOCAL_API_BASE = "http://127.0.0.1:8000/api";
const runtimeApiBase = window.__APP_CONFIG__?.apiBase?.trim();
const isLocalStaticPreview = ["127.0.0.1:5500", "localhost:5500"].includes(window.location.host);
const API_BASE = runtimeApiBase || (isLocalStaticPreview ? LOCAL_API_BASE : `${window.location.origin}/api`);

const DEFAULT_PROFILE_STATE = {
  fullName: "Каламан Ерболат Тлеуханұлы",
  roleLabel: "Лектор: ст.преподаватель",
  roleShort: "ст.преподаватель",
  username: "kalaman_erbolat",
  email: "kalaman@university.kz",
  bio: "Ақпараттық қауіпсіздік және бағдарламалау пәндері бойынша оқытушы.",
  avatarUrl: ""
};

const profileState = { ...DEFAULT_PROFILE_STATE };

let subjects = [];
let coursesData = [];
let selectedRole = "kaz";
let selectedCourseNumber = null;

const DEFAULT_PROFILE_BIOS = {
  kaz: "Ақпараттық қауіпсіздік және бағдарламалау пәндері бойынша оқытушы.",
  rus: "Преподаватель по дисциплинам информационной безопасности и программирования."
};

const UI_TEXT = {
  kaz: {
    roleTeacher: "Оқытушы",
    roleLecturer: "Лектор",
    roleShort: "аға оқытушы",
    roleLabel: "Оқытушы",
    profileBioDefault: DEFAULT_PROFILE_BIOS.kaz,
    back: "← Артқа",
    edit: "Өңдеу",
    save: "Сақтау",
    editProfile: "Профильді өңдеу",
    logout: "Шығу",
    subjectField: "Пән",
    subjectPlaceholder: "Пәнді таңдаңыз",
    subjectNotFound: "Пән табылмады",
    subjectSelectFirst: "Алдымен пәнді таңдаңыз.",
    materialType: "Материал түрі",
    topic: "Тақырып",
    material: "Материал",
    generateTest: "Тест жасау",
    testQr: "Тест (QR)",
    results: "Нәтижелер",
    fullscreen: "Толық экран",
    openTest: "Тестті ашу",
    showQr: "QR ашу",
    topicPlaceholder: "Тақырыпты таңдаңыз",
    topicNotFound: "Тақырып табылмады",
    coursesLoadError: "Курстар жүктелмеді.",
    coursesNotFound: "Курстар табылмады.",
    disciplinesNotFound: "Осы курс үшін пән табылмады.",
    addDiscipline: "Пән қосу",
    disciplineModalTitle: "Жаңа пән",
    disciplinePreviewTitle: "Карточка үлгісі",
    disciplineTitleLabel: "Пән атауы",
    disciplineTitlePlaceholder: "Мысалы, Желілік қауіпсіздік",
    disciplinePreviewUntitled: "Жаңа пән",
    disciplineCreate: "Қосу",
    disciplineCreating: "Қосылып жатыр...",
    disciplineTitleRequired: "Пән атауын енгізіңіз.",
    disciplineCreateError: "Пәнді қосу кезінде қате шықты.",
    addInlineDiscipline: "Пән қосу",
    disciplineMenu: "Пән әрекеттері",
    disciplineDelete: "Жою",
    deleteMaterialAction: "Материалды жою",
    deletingMaterialAction: "Материал жойылып жатыр...",
    deleteDisciplineAction: "Пәнді жою",
    deleteDisciplineConfirm: ({ title }) => `«${title}» пәнін толық жою керек пе?`,
    confirmDelete: "Жоюды растау",
    cancel: "Бас тарту",
    disciplineDeleting: "Жойылып жатыр...",
    disciplineDeleteError: "Пәнді жою кезінде қате шықты.",
    disciplineTitlePlaceholder: "Пән атауын өзгертіңіз",
    disciplineRenameEmpty: "Пән атауы бос болмауы керек.",
    disciplineRenameError: "Пән атауын жаңарту кезінде қате шықты.",
    materialsEmpty: "Материалды ашыңыз",
    materialSelectPrompt: "Материалды таңдаңыз.",
    materialDescriptionMissing: "Материал сипаттамасы жоқ",
    selectMaterialFirst: "Алдымен материал таңдаңыз.",
    testLectureOnly: "Тест тек дәріс үшін қолжетімді.",
    testReady: ({ count }) => `Тест дайын болды · ${count} сұрақ`,
    formNotReady: "Тест формасының сілтемесі әлі дайын емес.",
    qrNotReady: "QR үшін тест формасының сілтемесі әлі дайын емес.",
    qrJoin: "Тестке қосылу",
    generatingAiTest: "AI тест жасалып жатыр...",
    aiTestError: "AI тест жасау кезінде қате шықты.",
    aiTestLectureOnly: "Тест жасау тек дәріс материалы бойынша қолжетімді.",
    testModalView: "Тестті қарау",
    testModalEdit: "Тестті өңдеу",
    questionLabel: ({ number }) => `${number}-сұрақ`,
    resultsLoading: "Тест нәтижелері жүктеліп жатыр...",
    noTestSession: "Бұл материал үшін әлі тест сессиясы жоқ.",
    noStudentResponses: "Студент жауаптары әлі жоқ.",
    resultsEmptyTitle: "Нәтижелер әлі жоқ",
    resultsEmptyText: "Студенттер бұл тестті әлі тапсырмаған.",
    resultsFound: ({ count }) => `Табылды: ${count} жауап`,
    resultsLoadError: "Нәтижелерді жүктеу кезінде қате шықты.",
    resultsSheetUnavailable: "Нәтижелер кестесінің сілтемесі әлі дайын емес.",
    resultsSyncError: "Нәтижелерді жаңарту кезінде қате шықты.",
    resultsOpenedHere: "Нәтижелер осы жерде ашылды.",
    resultsScoringMissing: "Бұл тестте дұрыс жауап кілті сақталмаған, сондықтан балл мен пайыз есептелмейді.",
    resultsScoreUnavailable: "Есептелмейді",
    resultsRegenerateHint: "Нақты балл көру үшін тестті қайта жасаңыз.",
    openResultsSheet: "Google Sheets-та ашу",
    downloadResults: "Нәтижелерді жүктеп алу",
    nameMissing: "Аты көрсетілмеген",
    answerMissing: "Жауап жоқ",
    submittedAt: "Жіберілген уақыты",
    allStudentResponses: "Барлық студент жауаптары",
    tableNumber: "#",
    tableName: "Аты-жөні",
    tableScore: "Балл",
    tableTime: "Уақыты",
    profileModalTitle: "Профильді өңдеу",
    qrModalTitle: "QR арқылы қосылу",
    participantTitle: "Қатысушы",
    username: "Username",
    email: "Email",
    bio: "Био",
    sheetFrameTitle: "Тест нәтижелері",
    authLogin: "Кіру",
    authModalTitle: "Жүйеге кіру",
    authModalText: "Материалдарды жүктеу мен профильді сақтау үшін Google арқылы кіріңіз.",
    authGoogle: "Google арқылы жалғастыру",
    authGooglePending: "Google-ға өту...",
    authModalNote: "Google аккаунты бар болса кіресіз, жаңа болса тіркелу автоматты жүреді.",
    authRequiredHome: "Файлдар мен пәндерді көру үшін алдымен Google арқылы кіріңіз.",
    authRequiredDisciplines: "Пәндер мен материалдар кіруден кейін ашылады.",
    authRequiredAction: "Алдымен жүйеге Google арқылы кіріңіз.",
    uploadMaterial: "Материал қосу",
    connectDrive: "Google Drive қосу",
    driveConnected: ({ email }) => `Google Drive қосылды: ${email}`,
    driveNotConnected: "Google Drive әлі қосылмаған.",
    driveNotConfigured: "Google Drive OAuth әлі бапталмаған.",
    driveConnectError: "Google Drive қосу кезінде қате шықты.",
    logoutError: "Шығу кезінде қате шықты.",
    materialUploading: "Материал жүктеліп жатыр...",
    materialUploadDone: ({ title }) => `"${title}" материалы жүктелді.`,
    materialUploadError: "Материалды жүктеу кезінде қате шықты.",
    voiceReady: "Дайын",
    voiceListening: "Тыңдап тұр...",
    voiceUnderstood: ({ text }) => `Түсінді: ${text}`,
    voiceTranscribing: "Дауысты мәтінге айналдырып жатырмын...",
    voiceRequestError: "Дауыстық көмекшіге сұрау жіберу кезінде қате шықты.",
    voiceSorry: "Кешіріңіз, қазір сұрауды өңдей алмадым.",
    micDenied: "Микрофонға рұқсат берілмеді.",
    voiceUnavailable: "Дауыстық функция қолжетімсіз",
    errorLabel: ({ error }) => `Қате: ${error}`,
    logoutPlaceholder: "Шығу функциясы.",
    courseLabel: ({ number }) => `${number} курс`
  },
  rus: {
    roleTeacher: "Оқытушы",
    roleLecturer: "Лектор",
    roleShort: "ст. преподаватель",
    roleLabel: "Лектор",
    profileBioDefault: DEFAULT_PROFILE_BIOS.rus,
    back: "← Назад",
    edit: "Изменить",
    save: "Сохранить",
    editProfile: "Редактировать профиль",
    logout: "Выйти",
    subjectField: "Дисциплина",
    subjectPlaceholder: "Выберите дисциплину",
    subjectNotFound: "Дисциплина не найдена",
    subjectSelectFirst: "Сначала выберите дисциплину.",
    materialType: "Тип материала",
    topic: "Тема",
    material: "Материал",
    generateTest: "Создать тест",
    testQr: "Тест (QR)",
    results: "Результаты",
    fullscreen: "Полный экран",
    openTest: "Открыть тест",
    showQr: "Открыть QR",
    topicPlaceholder: "Выберите тему",
    topicNotFound: "Темы не найдены",
    coursesLoadError: "Не удалось загрузить курсы.",
    coursesNotFound: "Курсы не найдены.",
    disciplinesNotFound: "Для этого курса дисциплины не найдены.",
    addDiscipline: "Добавить дисциплину",
    disciplineModalTitle: "Новая дисциплина",
    disciplinePreviewTitle: "Предпросмотр карточки",
    disciplineTitleLabel: "Название дисциплины",
    disciplineTitlePlaceholder: "Например, Сетевые технологии",
    disciplinePreviewUntitled: "Новая дисциплина",
    disciplineCreate: "Добавить",
    disciplineCreating: "Добавляется...",
    disciplineTitleRequired: "Введите название дисциплины.",
    disciplineCreateError: "Не удалось добавить дисциплину.",
    addInlineDiscipline: "Добавить дисциплину",
    disciplineMenu: "Действия дисциплины",
    disciplineDelete: "Удалить",
    deleteMaterialAction: "Удалить материал",
    deletingMaterialAction: "Материал удаляется...",
    deleteDisciplineAction: "Удалить дисциплину",
    deleteDisciplineConfirm: ({ title }) => `Удалить дисциплину «${title}» полностью?`,
    confirmDelete: "Подтвердить удаление",
    cancel: "Отмена",
    disciplineDeleting: "Удаляется...",
    disciplineDeleteError: "Не удалось удалить дисциплину.",
    disciplineTitlePlaceholder: "Измените название дисциплины",
    disciplineRenameEmpty: "Название дисциплины не должно быть пустым.",
    disciplineRenameError: "Не удалось обновить название дисциплины.",
    materialsEmpty: "Откройте материал",
    materialSelectPrompt: "Выберите материал.",
    materialDescriptionMissing: "Описание материала отсутствует",
    selectMaterialFirst: "Сначала выберите материал.",
    testLectureOnly: "Тест доступен только для лекции.",
    testReady: ({ count }) => `Тест готов · ${count} вопросов`,
    formNotReady: "Ссылка на форму теста пока не готова.",
    qrNotReady: "Ссылка на форму теста для QR пока не готова.",
    qrJoin: "Подключиться к тесту",
    generatingAiTest: "AI формирует тест...",
    aiTestError: "Произошла ошибка при создании AI-теста.",
    aiTestLectureOnly: "Создание теста доступно только для лекционного материала.",
    testModalView: "Просмотр теста",
    testModalEdit: "Редактирование теста",
    questionLabel: ({ number }) => `Вопрос ${number}`,
    resultsLoading: "Загружаются результаты теста...",
    noTestSession: "Для этого материала пока нет тестовой сессии.",
    noStudentResponses: "Ответов студентов пока нет.",
    resultsEmptyTitle: "Результатов пока нет",
    resultsEmptyText: "Студенты еще не прошли этот тест.",
    resultsFound: ({ count }) => `Найдено: ${count} ответов`,
    resultsLoadError: "Произошла ошибка при загрузке результатов.",
    resultsSheetUnavailable: "Ссылка на таблицу результатов пока не готова.",
    resultsSyncError: "Произошла ошибка при обновлении результатов.",
    resultsOpenedHere: "Результаты открыты здесь.",
    resultsScoringMissing: "Для этого теста не сохранился ключ правильных ответов, поэтому баллы и проценты не рассчитываются.",
    resultsScoreUnavailable: "Не рассчитано",
    resultsRegenerateHint: "Чтобы видеть точные баллы, пересоздайте тест.",
    openResultsSheet: "Открыть в Google Sheets",
    downloadResults: "Скачать результаты",
    nameMissing: "Имя не указано",
    answerMissing: "Нет ответа",
    submittedAt: "Время отправки",
    allStudentResponses: "Все ответы студентов",
    tableNumber: "#",
    tableName: "ФИО",
    tableScore: "Балл",
    tableTime: "Время",
    profileModalTitle: "Редактирование профиля",
    qrModalTitle: "Подключение по QR",
    participantTitle: "Участник",
    username: "Username",
    email: "Email",
    bio: "Био",
    sheetFrameTitle: "Результаты теста",
    authLogin: "Войти",
    authModalTitle: "Вход в систему",
    authModalText: "Чтобы загружать материалы и сохранять профиль, войдите через Google.",
    authGoogle: "Продолжить с Google",
    authGooglePending: "Переход в Google...",
    authModalNote: "Если аккаунт уже есть, вы войдете. Если нет, регистрация пройдет автоматически.",
    authRequiredHome: "Чтобы видеть файлы и дисциплины, сначала войдите через Google.",
    authRequiredDisciplines: "Дисциплины и материалы откроются после входа.",
    authRequiredAction: "Сначала войдите в систему через Google.",
    uploadMaterial: "Добавить материал",
    connectDrive: "Подключить Google Drive",
    driveConnected: ({ email }) => `Google Drive подключен: ${email}`,
    driveNotConnected: "Google Drive еще не подключен.",
    driveNotConfigured: "Google Drive OAuth еще не настроен.",
    driveConnectError: "Не удалось подключить Google Drive.",
    logoutError: "Не удалось выйти из аккаунта.",
    materialUploading: "Материал загружается...",
    materialUploadDone: ({ title }) => `Материал "${title}" загружен.`,
    materialUploadError: "Не удалось загрузить материал.",
    voiceReady: "Готово",
    voiceListening: "Слушаю...",
    voiceUnderstood: ({ text }) => `Понял: ${text}`,
    voiceTranscribing: "Преобразую голос в текст...",
    voiceRequestError: "Произошла ошибка при обращении к голосовому помощнику.",
    voiceSorry: "Извините, сейчас не удалось обработать запрос.",
    micDenied: "Доступ к микрофону не предоставлен.",
    voiceUnavailable: "Голосовая функция недоступна",
    errorLabel: ({ error }) => `Ошибка: ${error}`,
    logoutPlaceholder: "Функция выхода.",
    courseLabel: ({ number }) => `${number} курс`
  }
};

Object.assign(UI_TEXT.kaz, {
  slides: "Слайд",
  slidesGenerating: "Слайд дайындалып жатыр...",
  slidesReady: ({ title }) => `Презентация дайын: ${title}`,
  slidesLectureOnly: "Слайд тек дәріс материалы үшін қолжетімді.",
  slidesSelectPrompt: "Слайд дайындау үшін дәріс материалын таңдаңыз.",
  slidesEmptyTitle: "AI презентация осында ашылады",
  slidesEmptyText: "Слайд батырмасын басқанда жүйе дәріс материалы бойынша дайын презентация жасап береді.",
  slidesLoadingTitle: "Презентация құрастырылып жатыр",
  slidesLoadingText: "AI материалдың мазмұнын жинап, негізгі ойларды слайдтарға бөліп жатыр.",
  slidesOpen: "Слайдты ашу",
  downloadSlides: "Жүктеп алу",
  slidesError: "Слайд жасау кезінде қате шықты.",
  slidesDownloadUnavailable: "Презентацияны жүктеу сілтемесі әлі дайын емес.",
});

Object.assign(UI_TEXT.rus, {
  slides: "Слайд",
  slidesGenerating: "Презентация создается...",
  slidesReady: ({ title }) => `Презентация готова: ${title}`,
  slidesLectureOnly: "Слайды доступны только для лекционного материала.",
  slidesSelectPrompt: "Выберите лекционный материал для презентации.",
  slidesEmptyTitle: "AI-презентация появится здесь",
  slidesEmptyText: "Нажмите кнопку слайдов, и система соберет готовую презентацию по содержанию лекции.",
  slidesLoadingTitle: "Презентация собирается",
  slidesLoadingText: "AI выделяет ключевые идеи материала и превращает их в слайды.",
  slidesOpen: "Открыть слайды",
  downloadSlides: "Скачать",
  slidesError: "Произошла ошибка при создании презентации.",
  slidesDownloadUnavailable: "Ссылка на скачивание презентации пока не готова.",
});

Object.assign(UI_TEXT.kaz, {
  homeLogo: "Негізгі бетке өту",
  voiceAssistantLabel: "ИИ ассистент",
  voiceHelpLabel: "Жылдам көмек",
  voiceHelpTitle: "Дауыстық көмекші",
  voiceHelpIntro: "Жүйені дауыс арқылы басқаруға болады. Қысқа әрі нақты айтсаңыз, көмекші сұрағыңызды тезірек түсінеді.\n\nМысалы:",
  voiceHelpSteps: [
    "Қай бөлім керек екенін айтыңыз: материал, тест немесе нәтиже.",
    "Бір сұрауда бір ғана әрекет айтқаныңыз дұрыс.",
    "Сұранысты анық айтсаңыз, жауап дәл шығады."
  ],
  voiceInputPlaceholder: "",
  voiceSendLabel: "Жіберу",
  voiceInputEmpty: "Алдымен сұрағыңызды жазыңыз немесе айтыңыз.",
  voiceLiveCaptured: ({ text }) => `Тыңдалды: ${text}`,
  voiceAcknowledged: "Түсіндім, орындаймын.",
});

Object.assign(UI_TEXT.rus, {
  homeLogo: "Перейти на главную страницу",
  voiceAssistantLabel: "ИИ ассистент",
  voiceHelpLabel: "Быстрая помощь",
  voiceHelpTitle: "Голосовой помощник",
  voiceHelpIntro: "Системой можно управлять голосом. Если говорить коротко и конкретно, помощник быстрее поймет запрос.\n\nНапример:",
  voiceHelpSteps: [
    "Скажите, какой раздел нужен: материал, тест или результат.",
    "Лучше указывать только одно действие в одном запросе.",
    "Чем точнее сформулирован запрос, тем точнее будет ответ."
  ],
  voiceInputPlaceholder: "",
  voiceSendLabel: "Отправить",
  voiceInputEmpty: "Сначала введите запрос или продиктуйте его.",
  voiceLiveCaptured: ({ text }) => `Распознано: ${text}`,
  voiceAcknowledged: "Понял, выполняю.",
});

const typeOrder = [
  { key: "lecture", label: "Дәріс" },
  { key: "practice", label: "Практика" },
  { key: "lab", label: "Зертхана" },
  { key: "siw", label: "СӨЖ" },
  { key: "syllabus", label: "Силлабус" }
];

const APP_STATE_KEY = "lektor-teacher-state-v1";
const TEST_CONFIG_KEY = "lektor-test-config-v1";
const PUBLIC_TEST_ATTEMPT_KEY = "lektor-public-test-attempt-v1";
const PUBLIC_TEST_DEVICE_KEY = "lektor-public-test-device-v1";
const PROFILE_STATE_KEY = "lektor-profile-state-v1";

const DISCIPLINE_THEMES = [
  {
    coverClass: "discipline-cover-1",
    background: "linear-gradient(135deg, #2b629d 0%, #4f94da 52%, #1b406f 100%)"
  },
  {
    coverClass: "discipline-cover-2",
    background: "linear-gradient(135deg, #12787d 0%, #2ea9ab 52%, #114d57 100%)"
  },
  {
    coverClass: "discipline-cover-3",
    background: "linear-gradient(135deg, #197f9e 0%, #58b9d3 52%, #0f5871 100%)"
  },
  {
    coverClass: "discipline-cover-4",
    background: "linear-gradient(135deg, #2b73b8 0%, #5292da 54%, #214f95 100%)"
  },
  {
    coverClass: "discipline-cover-5",
    background: "linear-gradient(135deg, #4d76ae 0%, #7ba4d4 54%, #385886 100%)"
  },
  {
    coverClass: "discipline-cover-6",
    background: "linear-gradient(135deg, #477e9f 0%, #75b8ca 54%, #2f617d 100%)"
  }
];

const homeView = document.getElementById("homeView");
const subjectView = document.getElementById("subjectView");

const courseStage = document.getElementById("courseStage");
const disciplineStage = document.getElementById("disciplineStage");
const courseGrid = document.getElementById("courseGrid");
const homeLogoBtn = document.getElementById("homeLogoBtn");
const courseBackBtn = document.getElementById("courseBackBtn");
const addDisciplineBtn = document.getElementById("addDisciplineBtn");
const addDisciplineBtnText = document.getElementById("addDisciplineBtnText");

const brandRoleTitle = document.getElementById("brandRoleTitle");
const roleTitleBtn = document.getElementById("roleTitleBtn");
const roleMenu = document.getElementById("roleMenu");
const roleMenuItems = document.querySelectorAll(".role-menu-item");

const topAvatar = document.getElementById("topAvatar");
const dropdownAvatar = document.getElementById("dropdownAvatar");
const dropdownName = document.getElementById("dropdownName");
const dropdownRole = document.getElementById("dropdownRole");
const dropdownEmail = document.getElementById("dropdownEmail");

const profileBtn = document.getElementById("profileBtn");
const profileDropdown = document.getElementById("profileDropdown");
const topbarRight = document.querySelector(".topbar-right");
const authActions = document.getElementById("authActions");
const authOpenBtn = document.getElementById("authOpenBtn");
const profileShell = document.getElementById("profileShell");

const cardsGrid = document.getElementById("cardsGrid");

const backBtn = document.getElementById("backBtn");
const subjectCoverTop = document.getElementById("subjectCoverTop");
const subjectCoverCopy = document.querySelector(".subject-cover-copy");
const subjectCourseBannerBadge = document.getElementById("subjectCourseBannerBadge");
const subjectTitle = document.getElementById("subjectTitle");
const subjectTitleInput = document.getElementById("subjectTitleInput");
const subjectCourse = document.getElementById("subjectCourse");
const subjectCourseCardCover = document.getElementById("subjectCourseCardCover");
const subjectCourseIllustration = document.getElementById("subjectCourseIllustration");
const toggleMaterialManagerBtn = document.getElementById("toggleMaterialManagerBtn");
const changeCoverBtn = document.getElementById("changeCoverBtn");

const materialsPane = document.getElementById("materialsPane");
const slidesPane = document.getElementById("slidesPane");
const testPane = document.getElementById("testPane");
const resultsPane = document.getElementById("resultsPane");

const subjectSelect = document.getElementById("subjectSelect");
const materialTypeSelect = document.getElementById("materialTypeSelect");
const topicSelect = document.getElementById("topicSelect");
const openMaterialBtn = document.getElementById("openMaterialBtn");
const openSlidesBtn = document.getElementById("openSlidesBtn");
const generateTestBtn = document.getElementById("generateTestBtn");
const openQrBtn = document.getElementById("openQrBtn");
const openResultsBtn = document.getElementById("openResultsBtn");
const controlActionsRow = document.getElementById("controlActionsRow");

const materialPreview = document.getElementById("materialPreview");
const slidesPreview = document.getElementById("slidesPreview");
const slidesStatusText = document.getElementById("slidesStatusText");
const materialManagerPanel = document.getElementById("materialManagerPanel");
const materialManagerActions = document.getElementById("materialManagerActions");
const uploadMenuWrap = document.getElementById("uploadMenuWrap");
const uploadModeMenu = document.getElementById("uploadModeMenu");
const addInlineDisciplineBtn = document.getElementById("addInlineDisciplineBtn");
const uploadMaterialBtn = document.getElementById("uploadMaterialBtn");
const uploadSingleMaterialBtn = document.getElementById("uploadSingleMaterialBtn");
const uploadFolderMaterialBtn = document.getElementById("uploadFolderMaterialBtn");
const deleteMaterialBtn = document.getElementById("deleteMaterialBtn");
const deleteDisciplineBtn = document.getElementById("deleteDisciplineBtn");
const singleMaterialUploadInput = document.getElementById("singleMaterialUploadInput");
const folderMaterialUploadInput = document.getElementById("folderMaterialUploadInput");
const openMaterialFullscreenBtn = document.getElementById("openMaterialFullscreenBtn");
const openSlidesFullscreenBtn = document.getElementById("openSlidesFullscreenBtn");
const downloadSlidesBtn = document.getElementById("downloadSlidesBtn");

const testInfoRow = testPane?.querySelector(".test-info-row");
const testInfoCard = document.getElementById("testInfoCard");
const testInfoState = document.getElementById("testInfoState");
const testInfoText = document.getElementById("testInfoText");
const testInfoHint = document.getElementById("testInfoHint");
const qrImageInline = document.getElementById("qrImageInline");
const openTestDirectBtn = document.getElementById("openTestDirectBtn");
const showQrBtn = document.getElementById("showQrBtn");
const buildTestBtn = document.getElementById("buildTestBtn");
const previewTestBtn = document.getElementById("previewTestBtn");
const launchTestBtn = document.getElementById("launchTestBtn");
const testSettingsPanel = document.getElementById("testSettingsPanel");
const testQuestionCountInput = document.getElementById("testQuestionCountInput");
const testDurationInput = document.getElementById("testDurationInput");
const testSettingsTitle = document.getElementById("testSettingsTitle");
const testSettingsHint = document.getElementById("testSettingsHint");
const testQrBoard = testPane?.querySelector(".test-qr-board");
const testQrCard = testPane?.querySelector(".test-qr-card");
const testQrActions = testPane?.querySelector(".test-qr-actions");
const testQrCaption = document.getElementById("testQrCaption");
const testQrCaptionTitle = document.getElementById("testQrCaptionTitle");
const testQrCaptionText = document.getElementById("testQrCaptionText");

const resultsInfoText = document.getElementById("resultsInfoText") || { textContent: "" };
const resultsSheetFrame = document.getElementById("resultsSheetFrame");
const openResultsSheetBtn = document.getElementById("openResultsSheetBtn") || {
  disabled: true,
  addEventListener() {}
};
const downloadResultsBtn = document.getElementById("downloadResultsBtn") || {
  disabled: true,
  addEventListener() {}
};

const openVoiceBtn = document.getElementById("openVoiceBtn");
const openVoiceHelpBtn = document.getElementById("openVoiceHelpBtn");
const closeVoiceBtn = document.getElementById("closeVoiceBtn");
const closeVoiceHelpBtn = document.getElementById("closeVoiceHelpBtn");
const voicePanel = document.getElementById("voicePanel");
const voiceHelpPanel = document.getElementById("voiceHelpPanel");
const voiceCore = document.getElementById("voiceCore");
const voiceStatus = document.getElementById("voiceStatus");
const voiceBadge = document.getElementById("voiceBadge");
const voiceHelpBadge = document.getElementById("voiceHelpBadge");
const voiceHelpTitle = document.getElementById("voiceHelpTitle");
const voiceHelpIntro = document.getElementById("voiceHelpIntro");
const voiceHelpList = document.getElementById("voiceHelpList");
const voiceHelpExamplesTitle = document.getElementById("voiceHelpExamplesTitle");
const voiceHelpExamples = document.getElementById("voiceHelpExamples");
const voiceInputLabel = document.getElementById("voiceInputLabel");
const voiceInput = document.getElementById("voiceInput");
const voiceSendBtn = document.getElementById("voiceSendBtn");

const authModal = document.getElementById("authModal");
const authModalTitle = document.getElementById("authModalTitle");
const authModalText = document.getElementById("authModalText");
const authModalNote = document.getElementById("authModalNote");
const authGoogleBtn = document.getElementById("authGoogleBtn");
const authGoogleBtnText = document.getElementById("authGoogleBtnText");

const profileModal = document.getElementById("profileModal");
const avatarEditPreview = document.getElementById("avatarEditPreview");
const avatarFileInput = document.getElementById("avatarFileInput");
const profileUsernameInput = document.getElementById("profileUsernameInput");
const profileEmailInput = document.getElementById("profileEmailInput");
const profileBioInput = document.getElementById("profileBioInput");
const profileModalNameText = document.getElementById("profileModalNameText");
const profileModalRoleText = document.getElementById("profileModalRoleText");
const saveProfileBtn = document.getElementById("saveProfileBtn");

const testModal = document.getElementById("testModal");
const testModalTitle = document.getElementById("testModalTitle");
const testModalSummary = document.getElementById("testModalSummary");
const testQuestionsContainer = document.getElementById("testQuestionsContainer");
const editTestBtn = document.getElementById("editTestBtn");
const saveTestBtn = document.getElementById("saveTestBtn");

const qrModal = document.getElementById("qrModal");
const qrImage = document.getElementById("qrImage");
const qrCodeLabel = document.getElementById("qrCodeLabel");

const playerDetailModal = document.getElementById("playerDetailModal");
const playerDetailTitle = document.getElementById("playerDetailTitle");
const playerDetailMeta = document.getElementById("playerDetailMeta");
const playerAnswerList = document.getElementById("playerAnswerList");

const disciplineModal = document.getElementById("disciplineModal");
const disciplineModalTitle = document.getElementById("disciplineModalTitle");
const disciplinePreviewLabel = document.getElementById("disciplinePreviewLabel");
const disciplineTitleInput = document.getElementById("disciplineTitleInput");
const disciplineFormError = document.getElementById("disciplineFormError");
const disciplinePreviewCard = document.getElementById("disciplinePreviewCard");
const saveDisciplineBtn = document.getElementById("saveDisciplineBtn");

const publicTestView = document.getElementById("publicTestView");
const teacherApp = document.getElementById("teacherApp");
const publicTestCourse = document.getElementById("publicTestCourse");
const publicTestTitle = document.getElementById("publicTestTitle");
const publicTestMeta = document.getElementById("publicTestMeta");
const publicTestTimer = document.getElementById("publicTestTimer");
const publicTestStatus = document.getElementById("publicTestStatus");
const publicTestStartCard = document.getElementById("publicTestStartCard");
const publicTestNameLabel = document.getElementById("publicTestNameLabel");
const publicTestStudentNameInput = document.getElementById("publicTestStudentNameInput");
const publicTestStartBtn = document.getElementById("publicTestStartBtn");
const publicTestQuestionsWrap = document.getElementById("publicTestQuestionsWrap");
const publicTestQuestionList = document.getElementById("publicTestQuestionList");
const publicTestSubmitBtn = document.getElementById("publicTestSubmitBtn");
const publicTestResultCard = document.getElementById("publicTestResultCard");

let recognition = null;
let isListening = false;
let selectedSubject = null;
let activeType = "lecture";
let selectedMaterialId = null;
let activeSubjectPanel = "materials";
let isDisciplineAccessLocked = false;
let openedDisciplineMenuId = null;
let confirmingDisciplineDeleteId = null;
let deletingDisciplineId = null;
let disciplineDeleteError = "";
let isEditingSubjectTitle = false;
let isMaterialManagerOpen = false;
let isUploadMenuOpen = false;
let isMaterialDeleting = false;
let testConfig = {
  questionCount: 5,
  durationMinutes: 20,
};
let isTestGenerating = false;
let isSlidesGenerating = false;
let slidesErrorMessage = "";
let appStateRestoreDone = false;
let publicTestSessionToken = new URLSearchParams(window.location.search).get("session");
let publicTestAttemptToken = "";
let publicTestSession = null;
let publicTestAttempt = null;
let publicTestCountdownTimer = null;
let publicTestAnswers = [];
let teacherTestStatusTimer = null;

let generatedQuestions = [];
let currentTestSession = null;
let isEditingTest = false;
let driveConnection = {
  configured: false,
  connected: false,
  google_email: "",
  google_name: "",
};
let isAuthSubmitting = false;
let isMaterialUploading = false;

let mediaRecorder = null;
let recordedChunks = [];
let voiceInterimBaseText = "";
let isVoiceCaptureCancelled = false;
let assistantCommandAbortController = null;
let hasActiveVoiceDraft = false;
let voiceDraftRestoreValue = "";
let lastManualVoiceInputValue = "";
let voiceActivityAudioContext = null;
let voiceActivityAnimationFrameId = null;
let voiceSilenceStartedAt = 0;
let voiceHasDetectedSpeech = false;
let voiceRecognitionSilenceTimerId = 0;
let voiceRecognitionLastTranscript = "";
let voiceRecognitionHasSpeech = false;

const VOICE_ACTIVITY_THRESHOLD = 0.035;
const VOICE_SILENCE_STOP_MS = 2200;

function t(key, params = {}) {
  const dictionary = UI_TEXT[selectedRole] || UI_TEXT.kaz;
  const fallback = UI_TEXT.kaz[key];
  const value = dictionary[key] ?? fallback ?? key;
  return typeof value === "function" ? value(params) : value;
}

function formatCourseLabel(number) {
  return t("courseLabel", { number });
}

function getCourseVisualConfig(courseNumber) {
  const normalizedNumber = Number(courseNumber) || 1;
  const visualMap = {
    1: { coverClass: "course-card-cover-1", illustrationClass: "course-card-illustration-1" },
    2: { coverClass: "course-card-cover-2", illustrationClass: "course-card-illustration-2" },
    3: { coverClass: "course-card-cover-3", illustrationClass: "course-card-illustration-3" },
    4: { coverClass: "course-card-cover-4", illustrationClass: "course-card-illustration-4" }
  };

  return visualMap[normalizedNumber] || visualMap[1];
}

function getPreferredSubject(preferredSubjectId = null) {
  if (preferredSubjectId) {
    const matched = subjects.find(item => Number(item.id) === Number(preferredSubjectId));
    if (matched) return matched;
  }

  if (selectedSubject?.id) {
    const currentMatch = subjects.find(item => Number(item.id) === Number(selectedSubject.id));
    if (currentMatch) return currentMatch;
  }

  return subjects[0] || null;
}

function navigateToMainPage() {
  if (!subjectView.classList.contains("hidden")) {
    showHome();
  }

  showCourseStage();
}

function setVoicePanelOpen(shouldOpen) {
  if (!voicePanel) return;
  voicePanel.classList.toggle("show", shouldOpen);
}

function setVoiceHelpOpen(shouldOpen) {
  if (!voiceHelpPanel) return;
  voiceHelpPanel.classList.toggle("show", shouldOpen);
}

function renderVoiceHelp() {
  if (voiceHelpTitle) voiceHelpTitle.textContent = t("voiceHelpTitle");
  if (voiceHelpIntro) voiceHelpIntro.textContent = t("voiceHelpIntro");
  if (voiceInput) voiceInput.placeholder = t("voiceInputPlaceholder");
  if (voiceSendBtn) voiceSendBtn.setAttribute("aria-label", t("voiceSendLabel"));
  if (homeLogoBtn) homeLogoBtn.setAttribute("aria-label", t("homeLogo"));
  if (openVoiceHelpBtn) openVoiceHelpBtn.setAttribute("aria-label", t("voiceHelpLabel"));
  if (openVoiceBtn) openVoiceBtn.setAttribute("aria-label", t("voiceAssistantLabel"));

  if (voiceHelpList) {
    const items = t("voiceHelpSteps");
    voiceHelpList.innerHTML = Array.isArray(items)
      ? items.map((item, index) => `
          <div class="voice-help-item">
            <span>${index + 1}</span>
            <p>${escapeHtml(item)}</p>
          </div>
        `).join("")
      : "";
  }
}

function getSpeechLanguage() {
  return selectedRole === "kaz" ? "kk-KZ" : "ru-RU";
}

function applyRoleProfileState() {
  const hadDefaultBio = Object.values(DEFAULT_PROFILE_BIOS).includes(profileState.bio);
  profileState.roleLabel = t("roleLabel");
  profileState.roleShort = t("roleShort");

  if (hadDefaultBio) {
    profileState.bio = t("profileBioDefault");
  }
}

function applyStaticTranslations() {
  document.documentElement.lang = selectedRole === "kaz" ? "kk" : "ru";

  const subjectLabel = document.querySelector('label[for="subjectSelect"]');
  const materialTypeLabel = document.querySelector('label[for="materialTypeSelect"]');
  const topicLabel = document.querySelector('label[for="topicSelect"]');
  const editProfileBtn = document.getElementById("editProfileBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const profileModalTitle = document.querySelector("#profileModal .profile-modal-top h3");
  const qrModalTitle = document.querySelector("#qrModal .modal-top h3");
  const usernameLabel = document.querySelector('label[for="profileUsernameInput"]');
  const emailLabel = document.querySelector('label[for="profileEmailInput"]');
  const bioLabel = document.querySelector('label[for="profileBioInput"]');
  const disciplineTitleLabel = document.querySelector('label[for="disciplineTitleInput"]');

  updateBrandRoleLabel();
  updateRoleMenuActive();

  roleMenuItems.forEach(btn => {
    btn.textContent = btn.dataset.roleValue === "kaz" ? t("roleTeacher") : t("roleLecturer");
  });

  if (courseBackBtn) courseBackBtn.textContent = t("back");
  if (backBtn) backBtn.textContent = t("back");
  if (changeCoverBtn) changeCoverBtn.textContent = isEditingSubjectTitle ? t("save") : t("edit");
  if (subjectTitleInput) subjectTitleInput.placeholder = t("disciplineTitlePlaceholder");
  if (subjectLabel) subjectLabel.textContent = t("subjectField");
  if (materialTypeLabel) materialTypeLabel.textContent = t("materialType");
  if (topicLabel) topicLabel.textContent = t("topic");
  if (openMaterialBtn) openMaterialBtn.textContent = t("material");
  if (openSlidesBtn) openSlidesBtn.textContent = isSlidesGenerating ? t("slidesGenerating") : t("slides");
  if (generateTestBtn) generateTestBtn.textContent = t("generateTest");
  if (openQrBtn) openQrBtn.textContent = t("testQr");
  if (openResultsBtn) openResultsBtn.textContent = t("results");
  if (openMaterialFullscreenBtn) openMaterialFullscreenBtn.textContent = t("fullscreen");
  if (openSlidesFullscreenBtn) openSlidesFullscreenBtn.textContent = t("fullscreen");
  if (downloadSlidesBtn) downloadSlidesBtn.textContent = t("downloadSlides");
  if (openResultsSheetBtn) openResultsSheetBtn.textContent = t("openResultsSheet");
  if (downloadResultsBtn) downloadResultsBtn.textContent = t("downloadResults");
  if (openTestDirectBtn) openTestDirectBtn.textContent = t("openTest");
  if (showQrBtn) showQrBtn.textContent = t("showQr");
  if (qrCodeLabel) qrCodeLabel.textContent = t("qrJoin");
  if (editProfileBtn) editProfileBtn.textContent = t("editProfile");
  if (logoutBtn) logoutBtn.textContent = t("logout");
  if (authOpenBtn) authOpenBtn.textContent = t("authLogin");
  if (authModalTitle) authModalTitle.textContent = t("authModalTitle");
  if (authModalText) authModalText.textContent = t("authModalText");
  if (authModalNote) authModalNote.textContent = t("authModalNote");
  if (authGoogleBtnText) authGoogleBtnText.textContent = isAuthSubmitting ? t("authGooglePending") : t("authGoogle");
  if (profileModalTitle) profileModalTitle.textContent = t("profileModalTitle");
  if (qrModalTitle) qrModalTitle.textContent = t("qrModalTitle");
  if (playerDetailTitle) playerDetailTitle.textContent = t("participantTitle");
  if (usernameLabel) usernameLabel.textContent = t("username");
  if (emailLabel) emailLabel.textContent = t("email");
  if (bioLabel) bioLabel.textContent = t("bio");
  if (saveProfileBtn) saveProfileBtn.textContent = t("save");
  if (addDisciplineBtn) {
    addDisciplineBtn.setAttribute("aria-label", t("addDiscipline"));
    addDisciplineBtn.setAttribute("title", t("addDiscipline"));
  }
  if (addDisciplineBtnText) addDisciplineBtnText.textContent = t("addDiscipline");
  if (disciplineModalTitle) disciplineModalTitle.textContent = t("disciplineModalTitle");
  if (disciplinePreviewLabel) disciplinePreviewLabel.textContent = t("disciplinePreviewTitle");
  if (disciplineTitleLabel) disciplineTitleLabel.textContent = t("disciplineTitleLabel");
  if (disciplineTitleInput) disciplineTitleInput.placeholder = t("disciplineTitlePlaceholder");
  if (saveDisciplineBtn) {
    saveDisciplineBtn.textContent = saveDisciplineBtn.disabled ? t("disciplineCreating") : t("disciplineCreate");
  }
  if (editTestBtn) editTestBtn.textContent = t("edit");
  if (saveTestBtn) saveTestBtn.textContent = t("save");
  if (previewTestBtn) previewTestBtn.textContent = selectedRole === "kaz" ? "Тестті қарау" : "Посмотреть тест";
  if (testModalTitle) testModalTitle.textContent = isEditingTest ? t("testModalEdit") : t("testModalView");
  if (resultsSheetFrame) resultsSheetFrame.title = t("sheetFrameTitle");
  if (buildTestBtn) buildTestBtn.textContent = selectedRole === "kaz" ? "Тестті құрастыру" : "Собрать тест";
  if (testSettingsTitle) testSettingsTitle.textContent = selectedRole === "kaz" ? "Тест баптауы" : "Настройки теста";
  if (testQuestionCountInput) testQuestionCountInput.placeholder = selectedRole === "kaz" ? "Сұрақ саны" : "Количество вопросов";
  if (testDurationInput) testDurationInput.placeholder = selectedRole === "kaz" ? "Уақыт" : "Время";
  if (publicTestNameLabel) publicTestNameLabel.textContent = selectedRole === "kaz" ? "Аты-жөніңіз" : "Имя и фамилия";
  if (publicTestStartBtn) publicTestStartBtn.textContent = selectedRole === "kaz" ? "Тестті бастау" : "Начать тест";
  if (publicTestSubmitBtn) publicTestSubmitBtn.textContent = selectedRole === "kaz" ? "Тапсыру" : "Отправить";
  if (publicTestStudentNameInput) publicTestStudentNameInput.placeholder = selectedRole === "kaz" ? "Аты-жөніңізді енгізіңіз" : "Введите имя и фамилию";
  if (profileBtn) profileBtn.setAttribute("aria-label", t("editProfile"));
  if (authOpenBtn) authOpenBtn.setAttribute("aria-label", t("authLogin"));
  if (authGoogleBtn) authGoogleBtn.setAttribute("aria-label", t("authGoogle"));

  if (recognition) {
    recognition.lang = getSpeechLanguage();
  }

  renderVoiceHelp();
  renderAuthState();
  renderDisciplinePreviewCard();
  renderDriveStatus();
  renderSlidesPreview();
}

function normalizeMaterialType(type) {
  const normalized = String(type || "").toLowerCase().trim();

  const map = {
    lecture: "lecture",
    lesson: "lecture",
    lection: "lecture",
    дәріс: "lecture",

    practice: "practice",
    practical: "practice",
    практикалық: "practice",
    практика: "practice",

    lab: "lab",
    laboratory: "lab",
    зертхана: "lab",
    зертханалық: "lab",

    sowj: "siw",
    siw: "siw",
    сөж: "siw",
    срс: "siw",
    self: "siw",

    syllabus: "syllabus",
    силлабус: "syllabus"
  };

  return map[normalized] || normalized || "lecture";
}

function toUploadCategory(type) {
  if (type === "siw") return "sowj";
  return type || "lecture";
}

async function fetchJSON(url, options = {}) {
  const requestOptions = { ...options };
  const method = (requestOptions.method || "GET").toUpperCase();
  const shouldHandleUnauthorized = requestOptions.handleUnauthorized !== false;

  delete requestOptions.handleUnauthorized;

  if (url.startsWith(API_BASE) && !requestOptions.credentials) {
    requestOptions.credentials = "include";
  }

  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const csrfToken = getCookie("csrftoken");
    requestOptions.headers = {
      ...(requestOptions.headers || {}),
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
    };
  }

  const response = await fetch(url, requestOptions);
  const responseType = response.headers.get("content-type") || "";
  const payload = responseType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const firstNestedError = Array.isArray(payload?.errors) ? payload.errors[0]?.detail : "";
    const detail =
      payload?.detail ||
      firstNestedError ||
      payload?.title?.[0] ||
      payload?.course?.[0] ||
      payload?.language?.[0] ||
      `Request failed: ${response.status}`;

    if (response.status === 401 && !url.includes("/results/public-test/") && shouldHandleUnauthorized) {
      handleUnauthorizedAccess();
    }

    const error = new Error(detail);
    error.payload = payload;
    error.status = response.status;
    throw error;
  }

  return payload;
}

function getCookie(name) {
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    const [cookieName, ...rest] = cookie.split("=");
    if (cookieName === name) {
      return decodeURIComponent(rest.join("="));
    }
  }
  return "";
}

function clampTestConfig(questionCount, durationMinutes) {
  return {
    questionCount: Math.max(3, Math.min(Number(questionCount) || 5, 25)),
    durationMinutes: Math.max(5, Math.min(Number(durationMinutes) || 20, 180)),
  };
}

function getCurrentQuestionCount() {
  return clampTestConfig(testQuestionCountInput?.value, testConfig.durationMinutes).questionCount;
}

function getCurrentDurationMinutes() {
  return clampTestConfig(testConfig.questionCount, testDurationInput?.value).durationMinutes;
}

function syncTestConfigInputs() {
  if (testQuestionCountInput) testQuestionCountInput.value = String(testConfig.questionCount);
  if (testDurationInput) testDurationInput.value = String(testConfig.durationMinutes);
}

function saveStoredTestConfig() {
  localStorage.setItem(TEST_CONFIG_KEY, JSON.stringify(testConfig));
}

function loadStoredTestConfig() {
  try {
    const raw = localStorage.getItem(TEST_CONFIG_KEY);
    if (!raw) {
      syncTestConfigInputs();
      return;
    }

    const parsed = JSON.parse(raw);
    testConfig = clampTestConfig(parsed?.questionCount, parsed?.durationMinutes);
  } catch (error) {
    console.error("Test config restore error:", error);
    testConfig = clampTestConfig(5, 20);
  }

  syncTestConfigInputs();
}

function buildPublicTestUrl(accessToken) {
  if (!accessToken) return "";
  const url = new URL(window.location.href);
  url.search = `session=${accessToken}`;
  url.hash = "";
  return url.toString();
}

function getPublicTestDeviceId() {
  let deviceId = localStorage.getItem(PUBLIC_TEST_DEVICE_KEY);
  if (deviceId) {
    return deviceId;
  }

  if (window.crypto?.randomUUID) {
    deviceId = window.crypto.randomUUID();
  } else {
    deviceId = `device-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  localStorage.setItem(PUBLIC_TEST_DEVICE_KEY, deviceId);
  return deviceId;
}

function getSessionRemainingSeconds(session = currentTestSession) {
  const expiresAt = session?.public_expires_at;
  if (!expiresAt) {
    return Number(session?.remaining_seconds ?? (session?.duration_minutes || 0) * 60) || 0;
  }

  const expiresAtMs = new Date(expiresAt).getTime();
  if (Number.isNaN(expiresAtMs)) {
    return Number(session?.remaining_seconds || 0) || 0;
  }

  return Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
}

function getTeacherTestInfoState(session = currentTestSession) {
  const questionCount = generatedQuestions.length || Number(session?.question_count) || testConfig.questionCount;
  const durationMinutes = Number(session?.duration_minutes) || testConfig.durationMinutes;
  const sessionStatus = String(session?.session_status || "").toLowerCase();
  const remainingSeconds = getSessionRemainingSeconds(session);

  if (sessionStatus === "live" && remainingSeconds > 0) {
    return {
      message: selectedRole === "kaz"
        ? `Тест ашық · Жабылуына ${formatCountdown(remainingSeconds)} қалды`
        : `Тест открыт · До закрытия ${formatCountdown(remainingSeconds)}`,
      state: "live",
    };
  }

  if (sessionStatus === "expired") {
    return {
      message: selectedRole === "kaz"
        ? `Тест жабылды · ${questionCount} сұрақ · ${durationMinutes} мин`
        : `Тест закрыт · ${questionCount} вопросов · ${durationMinutes} мин`,
      state: "done",
    };
  }

  return {
    message: selectedRole === "kaz"
      ? `Тест дайын · ${questionCount} сұрақ · ${durationMinutes} мин · QR әлі іске қосылмаған`
      : `Тест готов · ${questionCount} вопросов · ${durationMinutes} мин · QR еще не запущен`,
    state: "ready",
  };
}

function buildPublicTestGateUrl(accessToken) {
  if (!accessToken) return "";
  return `${API_BASE}/results/public-test/${accessToken}/open/`;
}

function setOpenTestDirectDisabled(disabled = true) {
  if (openTestDirectBtn) {
    openTestDirectBtn.disabled = disabled;
  }
}

function formatTeacherClock(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleTimeString(selectedRole === "kaz" ? "kk-KZ" : "ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTeacherTestInfoState(session = currentTestSession) {
  const questionCount = generatedQuestions.length || Number(session?.question_count) || testConfig.questionCount;
  const durationMinutes = Number(session?.duration_minutes) || testConfig.durationMinutes;
  const sessionStatus = String(session?.session_status || "").toLowerCase();
  const remainingSeconds = getSessionRemainingSeconds(session);
  const meta = selectedRole === "kaz"
    ? `${questionCount} сұрақ · ${durationMinutes} мин`
    : `${questionCount} вопросов · ${durationMinutes} мин`;
  const closeClock = formatTeacherClock(session?.public_expires_at);

  if (sessionStatus === "live" && remainingSeconds > 0) {
    return {
      state: "live",
      label: selectedRole === "kaz" ? "Тест жүріп жатыр" : "Тест запущен",
      meta,
      hint: selectedRole === "kaz"
        ? `${formatCountdown(remainingSeconds)} қалды${closeClock ? ` · ${closeClock}-де жабылады` : ""}`
        : `${formatCountdown(remainingSeconds)} до закрытия${closeClock ? ` · закроется в ${closeClock}` : ""}`,
      actionLabel: selectedRole === "kaz" ? "QR-ды ашу" : "Открыть QR",
      qrTitle: selectedRole === "kaz" ? "QR кодты аудиторияға көрсетіңіз" : "Покажите QR аудитории",
      qrHint: selectedRole === "kaz"
        ? "Студенттер телефонмен сканерлеп, Google Form-ға бірден өтеді. Уақыт аяқталғанда форма автоматты түрде жабылады."
        : "Студенты сканируют код телефоном и сразу переходят в Google Form.",
    };
  }

  if (sessionStatus === "expired") {
    return {
      state: "done",
      label: selectedRole === "kaz" ? "Тест жабылды" : "Тест закрыт",
      meta,
      hint: selectedRole === "kaz"
        ? "Қажет болса жаңа уақытпен қайта бастауға болады."
        : "При необходимости можно запустить тест заново с новым временем.",
      actionLabel: selectedRole === "kaz" ? "Қайта бастау" : "Запустить снова",
      qrTitle: selectedRole === "kaz" ? "QR терезесі жабық" : "QR-окно закрыто",
      qrHint: selectedRole === "kaz"
        ? "Қайта бастау батырмасы студенттер үшін жаңа уақыт терезесін ашады."
        : "Повторный запуск откроет для студентов новое временное окно.",
    };
  }

  return {
    state: "ready",
    label: selectedRole === "kaz" ? "Тест дайын" : "Тест готов",
    meta,
    hint: selectedRole === "kaz"
      ? "Таймер тек «Тестті бастау» басылғаннан кейін жүреді."
      : "Таймер начнется только после нажатия кнопки запуска теста.",
    actionLabel: selectedRole === "kaz" ? "Тестті бастау" : "Запустить тест",
    qrTitle: selectedRole === "kaz" ? "QR код тест басталғаннан кейін шығады" : "QR появится после запуска теста",
    qrHint: selectedRole === "kaz"
      ? "Тест басталған соң студенттер телефонмен сканерлеп, Google Form-ға өтеді."
      : "После запуска студенты сканируют код и переходят к форме.",
  };
}

function normalizeProfileStorageIdentity(email = "") {
  return String(email || "").trim().toLowerCase() || "guest";
}

function getTeacherAppStateKey(email = driveConnection.google_email || profileState.email) {
  return `${APP_STATE_KEY}:${normalizeProfileStorageIdentity(email)}`;
}

function getProfileStorageKey(email = driveConnection.google_email || profileState.email) {
  return `${PROFILE_STATE_KEY}:${normalizeProfileStorageIdentity(email)}`;
}

function readStoredProfileState(email = driveConnection.google_email || profileState.email) {
  try {
    const raw = localStorage.getItem(getProfileStorageKey(email));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Profile state parse error:", error);
    return null;
  }
}

function applyStoredProfileState(email = driveConnection.google_email || profileState.email) {
  const storedProfile = readStoredProfileState(email);
  if (!storedProfile || typeof storedProfile !== "object") {
    return false;
  }

  const nextUsername = String(storedProfile.username || "").trim();
  const nextBio = String(storedProfile.bio || "").trim();
  const nextAvatarUrl = typeof storedProfile.avatarUrl === "string" ? storedProfile.avatarUrl : "";

  if (nextUsername) {
    profileState.username = nextUsername;
  }

  if (nextBio) {
    profileState.bio = nextBio;
  }

  profileState.avatarUrl = nextAvatarUrl;
  return true;
}

function persistProfileState(email = driveConnection.google_email || profileState.email) {
  const payload = {
    username: String(profileState.username || "").trim(),
    bio: String(profileState.bio || "").trim(),
    avatarUrl: typeof profileState.avatarUrl === "string" ? profileState.avatarUrl : "",
  };

  localStorage.setItem(getProfileStorageKey(email), JSON.stringify(payload));
}

function getCurrentTestLaunchUrl(session = currentTestSession) {
  if (!session) return "";
  return session.form_url || session.public_url || buildPublicTestUrl(session.access_token);
}

function getCurrentTestJoinUrl(session = currentTestSession) {
  if (!session) return "";
  return buildPublicTestGateUrl(session.access_token) || session.form_url || session.public_url || buildPublicTestUrl(session.access_token);
}

function readTeacherAppState() {
  try {
    const raw = localStorage.getItem(getTeacherAppStateKey());
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("App state parse error:", error);
    return null;
  }
}

function saveTeacherAppState() {
  if (publicTestSessionToken) return;

  const payload = {
    currentView: subjectView.classList.contains("hidden") ? "home" : "subject",
    selectedRole,
    selectedCourseNumber,
    selectedSubjectId: selectedSubject?.id || null,
    activeType,
    selectedMaterialId,
    activeSubjectPanel,
    isMaterialManagerOpen,
  };

  localStorage.setItem(getTeacherAppStateKey(), JSON.stringify(payload));
}

function clearTeacherAppState(email = driveConnection.google_email || profileState.email) {
  localStorage.removeItem(getTeacherAppStateKey(email));
  localStorage.removeItem(APP_STATE_KEY);
}

function getAuthRequiredWorkspaceMessage() {
  return t("authRequiredDisciplines");
}

function promptGoogleLogin() {
  window.alert(t("authRequiredAction"));
  openAuthModal();
}

function renderLoginRequiredState() {
  if (cardsGrid) {
    cardsGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1 / -1;">
        ${escapeHtml(getAuthRequiredWorkspaceMessage())}
      </div>
    `;
  }
}

function resetProtectedAppData() {
  stopTeacherTestStatusTimer();
  stopPublicTestTimer();
  subjects = [];
  isDisciplineAccessLocked = false;
  selectedCourseNumber = null;
  selectedSubject = null;
  selectedMaterialId = null;
  activeSubjectPanel = "materials";
  openedDisciplineMenuId = null;
  confirmingDisciplineDeleteId = null;
  deletingDisciplineId = null;
  disciplineDeleteError = "";
  currentTestSession = null;
  generatedQuestions = [];
  slidesErrorMessage = "";
  isMaterialManagerOpen = false;
  isUploadMenuOpen = false;

  if (subjectSelect) subjectSelect.innerHTML = `<option value="">${t("subjectPlaceholder")}</option>`;
  if (topicSelect) topicSelect.innerHTML = `<option value="">${t("topicPlaceholder")}</option>`;
  if (resultsInfoText) resultsInfoText.textContent = "";
  if (resultsSheetFrame) {
    resultsSheetFrame.src = "about:blank";
    resultsSheetFrame.srcdoc = "";
  }

  clearMaterialPreview();
  renderSlidesPreview();
  renderTestBlock(false);
  renderResultsBlock();
  showHome();
  showCourseStage();
  renderCourseCards();
}

function handleUnauthorizedAccess({ openLoginModal = false } = {}) {
  driveConnection = {
    ...driveConnection,
    connected: false,
    google_email: "",
    google_name: "",
  };

  clearTeacherAppState();
  resetProtectedAppData();
  syncProfileWithDriveConnection();
  renderProfile();
  renderAuthState();
  renderDriveStatus();

  if (openLoginModal) {
    openAuthModal();
  }
}

function getPublicAttemptStorageKey(accessToken = publicTestSessionToken) {
  return `${PUBLIC_TEST_ATTEMPT_KEY}:${accessToken || "none"}`;
}

function readStoredPublicAttempt(accessToken = publicTestSessionToken) {
  try {
    const raw = localStorage.getItem(getPublicAttemptStorageKey(accessToken));
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("Public attempt restore error:", error);
    return null;
  }
}

function saveStoredPublicAttempt(payload, accessToken = publicTestSessionToken) {
  if (!accessToken) return;
  localStorage.setItem(getPublicAttemptStorageKey(accessToken), JSON.stringify(payload));
}

function clearStoredPublicAttempt(accessToken = publicTestSessionToken) {
  if (!accessToken) return;
  localStorage.removeItem(getPublicAttemptStorageKey(accessToken));
}

function stripAnswerPrefix(value) {
  return String(value || "").replace(/^\s*[A-D0-9]+\s*[\).:\-]\s*/i, "").trim();
}

function resolveQuestionAnswerIndex(questionLike) {
  const options = Array.isArray(questionLike?.options) ? questionLike.options : [];
  const directIndex = Number(questionLike?.correct_option_index);
  if (Number.isInteger(directIndex) && directIndex >= 0 && directIndex < options.length) {
    return directIndex;
  }

  const answerCandidates = [
    questionLike?.correct_answer,
    questionLike?.answer,
    questionLike?.correct,
  ];

  for (const candidate of answerCandidates) {
    if (candidate === null || candidate === undefined || candidate === "") continue;

    const normalizedCandidate = String(candidate).trim();
    if (!normalizedCandidate) continue;

    const numericCandidate = Number(normalizedCandidate);
    if (Number.isInteger(numericCandidate) && numericCandidate >= 0 && numericCandidate < options.length) {
      return numericCandidate;
    }

    const letterMatch = normalizedCandidate.match(/^\s*([A-D])(?:[\).:\-\s]|$)/i);
    if (letterMatch) {
      const optionIndex = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
      if (optionIndex >= 0 && optionIndex < options.length) {
        return optionIndex;
      }
    }

    const cleanedCandidate = stripAnswerPrefix(normalizedCandidate).toLowerCase();
    const exactIndex = options.findIndex((option) => String(option || "").trim().toLowerCase() === normalizedCandidate.toLowerCase());
    if (exactIndex >= 0) {
      return exactIndex;
    }

    const cleanedIndex = options.findIndex((option) => stripAnswerPrefix(option).toLowerCase() === cleanedCandidate);
    if (cleanedIndex >= 0) {
      return cleanedIndex;
    }
  }

  return -1;
}

function serializeGeneratedQuestion(question) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const answerIndex = Number.isInteger(question?.answer) ? question.answer : resolveQuestionAnswerIndex(question);
  const safeAnswerIndex = answerIndex >= 0 ? answerIndex : -1;
  const rawAnswer = String(question?.answerRaw ?? question?.correct_answer ?? question?.answer ?? "").trim();

  return {
    question: question?.question || "",
    options,
    correct_answer: safeAnswerIndex >= 0 ? (options[safeAnswerIndex] || "") : rawAnswer,
    correct_option_index: safeAnswerIndex,
    answer: rawAnswer || (safeAnswerIndex >= 0 ? ["A", "B", "C", "D"][safeAnswerIndex] : ""),
  };
}

function hydrateCurrentTestSession(sessionData) {
  if (!sessionData) {
    currentTestSession = null;
    generatedQuestions = [];
    return;
  }

  currentTestSession = {
    ...sessionData,
    public_url: buildPublicTestUrl(sessionData.access_token),
  };

  const restoredQuestions = Array.isArray(sessionData.questions_json) ? sessionData.questions_json : [];
  generatedQuestions = restoredQuestions.map((item, index) => {
    const options = Array.isArray(item.options) ? item.options : [];
    const resolvedAnswer = resolveQuestionAnswerIndex(item);

    return {
      id: index + 1,
      question: item.question,
      options,
      answer: resolvedAnswer,
      answerRaw: item.answer || item.correct_answer || "",
    };
  });

  testConfig = clampTestConfig(
    sessionData.question_count || generatedQuestions.length || testConfig.questionCount,
    sessionData.duration_minutes || testConfig.durationMinutes,
  );
  saveStoredTestConfig();
  syncTestConfigInputs();
}

async function loadDriveStatus() {
  const previousConnected = Boolean(driveConnection.connected);
  const previousEmail = String(driveConnection.google_email || "").trim().toLowerCase();
  const hadProtectedData = Boolean(subjects.length || selectedSubject || selectedCourseNumber || currentTestSession);

  try {
    driveConnection = await fetchJSON(`${API_BASE}/users/drive/status/`, {
      credentials: "include"
    });
  } catch (error) {
    console.error("Drive status error:", error);
    driveConnection = {
      configured: false,
      connected: false,
      google_email: "",
      google_name: "",
    };
  }

  const nextEmail = String(driveConnection.google_email || "").trim().toLowerCase();
  const didAccountChange =
    previousConnected &&
    driveConnection.connected &&
    previousEmail &&
    nextEmail &&
    previousEmail !== nextEmail;

  if (didAccountChange) {
    clearTeacherAppState(previousEmail);
    resetProtectedAppData();
    appStateRestoreDone = false;
  }

  if (!driveConnection.connected && hadProtectedData) {
    clearTeacherAppState();
    resetProtectedAppData();
  }

  syncProfileWithDriveConnection();
  renderProfile();
  renderAuthState();
  renderDriveStatus();
  return driveConnection;
}

function renderDriveStatus() {
  ensureMaterialManagerLayout();

  if (addInlineDisciplineBtn) {
    addInlineDisciplineBtn.disabled = !selectedCourseNumber || isMaterialUploading || isMaterialDeleting;
    addInlineDisciplineBtn.textContent = t("addInlineDiscipline");
  }

  if (uploadMaterialBtn) {
    uploadMaterialBtn.disabled = !selectedSubject || isMaterialUploading || isMaterialDeleting;
    uploadMaterialBtn.textContent = getUploadActionLabel();
  }

  if (uploadSingleMaterialBtn) {
    uploadSingleMaterialBtn.disabled = !selectedSubject || isMaterialUploading || isMaterialDeleting;
    uploadSingleMaterialBtn.textContent = getUploadSingleActionLabel();
  }

  if (uploadFolderMaterialBtn) {
    uploadFolderMaterialBtn.disabled = !selectedSubject || isMaterialUploading || isMaterialDeleting;
    uploadFolderMaterialBtn.textContent = getUploadFolderActionLabel();
  }

  if (deleteMaterialBtn) {
    deleteMaterialBtn.disabled = !selectedSubject || !getSelectedMaterial() || isMaterialUploading || isMaterialDeleting;
    deleteMaterialBtn.textContent = isMaterialDeleting ? getDeletingActionLabel() : getDeleteActionLabel();
  }

  if (deleteDisciplineBtn) {
    deleteDisciplineBtn.disabled = !selectedSubject || isMaterialUploading || isMaterialDeleting;
    deleteDisciplineBtn.textContent = t("deleteDisciplineAction");
  }

  renderMaterialManagerPanel();
}

async function connectGoogleDrive() {
  try {
    const payload = await fetchJSON(`${API_BASE}/users/drive/connect/`, {
      credentials: "include"
    });

    if (payload.authorization_url) {
      window.location.href = payload.authorization_url;
      return true;
    }
  } catch (error) {
    console.error("Drive connect error:", error);
    renderDriveStatus();
    window.alert(error.message || t("driveConnectError"));
  }

  return false;
}

async function disconnectGoogleDrive() {
  try {
    await fetchJSON(`${API_BASE}/users/drive/disconnect/`, {
      method: "POST",
      credentials: "include"
    });
  } catch (error) {
    console.error("Drive disconnect error:", error);
    window.alert(error.message || t("logoutError"));
    return false;
  }

  profileDropdown?.classList.remove("show");
  closeModal(profileModal);
  closeModal(authModal);
  await loadDriveStatus();
  return true;
}

async function uploadMaterialFiles(fileList) {
  const files = Array.from(fileList || []).filter(file => file && file.size >= 0);

  if (!selectedSubject || !files.length) return;

  isMaterialUploading = true;
  isUploadMenuOpen = false;
  renderDriveStatus();

  try {
    const formData = new FormData();
    formData.append("discipline", selectedSubject.id);
    formData.append("category", toUploadCategory(activeType));
    formData.append("description", "");
    files.forEach(file => {
      formData.append("files", file, file.webkitRelativePath || file.name);
    });

    const payload = await fetchJSON(`${API_BASE}/materials/upload/`, {
      method: "POST",
      body: formData,
      credentials: "include"
    });

    const created = Array.isArray(payload?.created) ? payload.created : [];
    selectedSubject.materials = await loadMaterialsForSubject(selectedSubject.id);
    slidesErrorMessage = "";

    if (created.length) {
      activeType = normalizeMaterialType(created[created.length - 1].category);
      selectedMaterialId = created[created.length - 1].id;
    }

    populateMaterialTypeSelect();
    populateTopicSelect();
    renderMaterialPreview();
    renderSlidesPreview();
    resetTestState();
    renderTestBlock();
    renderResultsBlock();
    renderDriveStatus();
  } catch (error) {
    console.error("Material upload error:", error);
    renderDriveStatus();
    window.alert(error?.message || t("materialUploadError"));
  } finally {
    isMaterialUploading = false;
    renderDriveStatus();
  }
}

async function deleteSelectedMaterial() {
  const material = getSelectedMaterial();
  if (!selectedSubject || !material || isMaterialDeleting) return;

  isMaterialDeleting = true;
  renderDriveStatus();

  const confirmMessage = selectedRole === "kaz"
    ? `"${material.title}" материалы және оған қатысты тесттері жойылады. Жалғастыру керек пе?`
    : `Материал "${material.title}" и связанные с ним тесты будут удалены. Продолжить?`;

  try {
    if (!window.confirm(confirmMessage)) {
      isMaterialDeleting = false;
      renderDriveStatus();
      return;
    }

    await fetchJSON(`${API_BASE}/materials/${material.id}/`, {
      method: "DELETE"
    });

    selectedSubject.materials = await loadMaterialsForSubject(selectedSubject.id);
    slidesErrorMessage = "";
    selectedMaterialId = null;
    populateMaterialTypeSelect();
    populateTopicSelect();
    clearMaterialPreview();
    renderSlidesPreview();
    resetTestState();
    renderTestBlock();
    renderResultsBlock();
    renderDriveStatus();
  } catch (error) {
    console.error("Material delete error:", error);
    renderDriveStatus();
  } finally {
    isMaterialDeleting = false;
    renderDriveStatus();
  }
}

async function loadTestSessionsForMaterial(materialId) {
  try {
    const sessions = await fetchJSON(`${API_BASE}/results/test-sessions/?material=${materialId}`);
    return sessions;
  } catch (error) {
    console.error("Test sessions жүктеу қатесі:", error);
    return [];
  }
}

async function getLatestSessionForSelectedMaterial() {
  const material = getSelectedMaterial();

  if (!material) {
    currentTestSession = null;
    return null;
  }

  if (currentTestSession && Number(currentTestSession.material) === Number(material.id)) {
    return currentTestSession;
  }

  const sessions = await loadTestSessionsForMaterial(material.id);
  hydrateCurrentTestSession(sessions[0] || null);
  return currentTestSession;
}

async function loadLatestTestSessionForSelectedMaterial() {
  const material = getSelectedMaterial();

  if (!material) {
    resetTestState();
    return null;
  }

  const sessions = await loadTestSessionsForMaterial(material.id);
  hydrateCurrentTestSession(sessions[0] || null);
  return currentTestSession;
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() || "")
    .join("") || "SU";
}

function setAvatar(el, avatarUrl, fallback) {
  if (!el) return;
  if (avatarUrl) el.innerHTML = `<img src="${avatarUrl}" alt="avatar" />`;
  else el.textContent = fallback;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getBadgeClass(type) {
  if (type === "lecture") return "badge-lecture";
  if (type === "practice") return "badge-practice";
  if (type === "lab") return "badge-lab";
  if (type === "siw") return "badge-self";
  return "badge-syllabus";
}

function getDisciplineTheme(seed = 0) {
  const index = Math.abs(Number(seed) || 0) % DISCIPLINE_THEMES.length;
  const theme = DISCIPLINE_THEMES[index];
  return {
    ...theme,
    coverBackground: theme.background,
    index: index + 1
  };
}

function getDisciplineCoverMarkup(card = {}, extraClass = "") {
  const coverClass = card.coverClass || DISCIPLINE_THEMES[0].coverClass;
  return `
    <div class="class-cover discipline-cover ${coverClass} ${extraClass}">
      <div class="discipline-cover-art">
        <span class="discipline-asset asset-a"></span>
        <span class="discipline-asset asset-b"></span>
        <span class="discipline-asset asset-c"></span>
        <span class="discipline-asset asset-d"></span>
      </div>
    </div>
  `;
}

function openModal(modal) {
  if (modal) modal.classList.add("show");
}

function closeModal(modal) {
  if (modal) modal.classList.remove("show");
}

function saveProfile() {
  profileState.username = profileUsernameInput.value.trim() || profileState.username;
  profileState.bio = profileBioInput.value.trim() || profileState.bio;
  persistProfileState();
  renderProfile();
  closeModal(profileModal);
}

function updateRoleMenuActive() {
  roleMenuItems.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.roleValue === selectedRole);
  });
}

function getTypeLabel(type) {
  const labels = {
    lecture: selectedRole === "kaz" ? "Дәріс" : "Лекция",
    practice: selectedRole === "kaz" ? "Практика" : "Практика",
    lab: selectedRole === "kaz" ? "Зертхана" : "Лаборатория",
    siw: selectedRole === "kaz" ? "СӨЖ" : "СРС",
    syllabus: selectedRole === "kaz" ? "Силлабус" : "Силлабус"
  };

  return labels[type] || t("material");
}

function getDeleteActionLabel() {
  return selectedRole === "kaz" ? "Жою" : "Удалить";
}

function getDeletingActionLabel() {
  return selectedRole === "kaz" ? "Р–РѕР№С‹Р»СѓРґР°..." : "РЈРґР°Р»РµРЅРёРµ...";
}

function getUploadActionLabel() {
  return selectedRole === "kaz" ? "Жүктеу" : "Загрузка";
}

function getUploadSingleActionLabel() {
  return selectedRole === "kaz" ? "Файл" : "Файл";
}

function getUploadFolderActionLabel() {
  return selectedRole === "kaz" ? "Папка жүктеу" : "Загрузить папку";
}

function getMaterialManagerToggleLabel() {
  if (selectedRole === "kaz") {
    return isMaterialManagerOpen ? "Жүктеуді жабу" : "Материал жүктеу";
  }

  return isMaterialManagerOpen ? "Скрыть загрузку" : "Загрузка материала";
}

function getDeleteActionLabel() {
  return t("deleteMaterialAction");
}

function getDeletingActionLabel() {
  return t("deletingMaterialAction");
}

function ensureMaterialManagerLayout() {
  return;
}

function renderUploadMenu() {
  const canShowMenu = Boolean(selectedSubject) && isMaterialManagerOpen && !isMaterialUploading;
  const shouldShowMenu = canShowMenu && isUploadMenuOpen;

  if (uploadMenuWrap) {
    uploadMenuWrap.classList.toggle("is-open", shouldShowMenu);
  }

  if (uploadModeMenu) {
    uploadModeMenu.classList.toggle("show", shouldShowMenu);
    uploadModeMenu.setAttribute("aria-hidden", String(!shouldShowMenu));
  }
}

function renderMaterialManagerPanel() {
  ensureMaterialManagerLayout();
  const canShowManager = Boolean(selectedCourseNumber);
  const isManagerOpen = canShowManager && isMaterialManagerOpen;

  if (!isManagerOpen) {
    isUploadMenuOpen = false;
  }

  if (toggleMaterialManagerBtn) {
    const label = getMaterialManagerToggleLabel();
    toggleMaterialManagerBtn.textContent = label;
    toggleMaterialManagerBtn.setAttribute("title", label);
    toggleMaterialManagerBtn.setAttribute("aria-expanded", String(isManagerOpen));
    toggleMaterialManagerBtn.classList.toggle("is-open", isManagerOpen);
    toggleMaterialManagerBtn.disabled = !selectedCourseNumber;
  }

  if (materialManagerPanel) {
    materialManagerPanel.classList.toggle("is-open", isManagerOpen);
    materialManagerPanel.setAttribute("aria-hidden", String(!isManagerOpen));
  }

  if (controlActionsRow) {
    controlActionsRow.classList.toggle("is-hidden", isManagerOpen);
  }

  renderUploadMenu();
}

function renderProfile() {
  applyRoleProfileState();

  const initials = getInitials(profileState.fullName);

  dropdownName.textContent = profileState.fullName;
  dropdownRole.textContent = profileState.roleShort;
  dropdownEmail.textContent = profileState.email;

  profileModalNameText.textContent = profileState.fullName;
  profileModalRoleText.textContent = profileState.roleShort;
  profileUsernameInput.value = profileState.username;
  profileEmailInput.value = profileState.email;
  profileBioInput.value = profileState.bio;

  setAvatar(topAvatar, profileState.avatarUrl, initials);
  setAvatar(dropdownAvatar, profileState.avatarUrl, initials);
  setAvatar(avatarEditPreview, profileState.avatarUrl, initials);
}

function syncProfileWithDriveConnection() {
  const usesDefaultBio = Object.values(DEFAULT_PROFILE_BIOS).includes(profileState.bio);

  if (driveConnection.connected) {
    const googleName = String(driveConnection.google_name || "").trim();
    const googleEmail = String(driveConnection.google_email || "").trim();

    if (googleName) {
      profileState.fullName = googleName;
    }

    if (googleEmail) {
      profileState.email = googleEmail;
      profileState.username = googleEmail.split("@")[0] || DEFAULT_PROFILE_STATE.username;
    }

    profileState.avatarUrl = "";

    if (usesDefaultBio || !profileState.bio.trim()) {
      profileState.bio = t("profileBioDefault");
    }

    applyStoredProfileState(googleEmail);

    return;
  }

  profileState.fullName = DEFAULT_PROFILE_STATE.fullName;
  profileState.email = DEFAULT_PROFILE_STATE.email;
  profileState.username = DEFAULT_PROFILE_STATE.username;
  profileState.avatarUrl = "";

  if (usesDefaultBio || !profileState.bio.trim()) {
    profileState.bio = t("profileBioDefault");
  }
}

function renderAuthState() {
  const isConnected = Boolean(driveConnection.connected);

  if (authActions) {
    authActions.classList.toggle("hidden", isConnected);
  }

  if (profileShell) {
    profileShell.classList.toggle("hidden", !isConnected);
  }

  if (authOpenBtn) {
    authOpenBtn.textContent = t("authLogin");
  }

  if (authModalTitle) {
    authModalTitle.textContent = t("authModalTitle");
  }

  if (authModalText) {
    authModalText.textContent = t("authModalText");
  }

  if (authModalNote) {
    authModalNote.textContent = t("authModalNote");
  }

  if (authGoogleBtnText) {
    authGoogleBtnText.textContent = isAuthSubmitting ? t("authGooglePending") : t("authGoogle");
  }

  if (authGoogleBtn) {
    authGoogleBtn.disabled = isAuthSubmitting;
  }
}

function openAuthModal() {
  profileDropdown?.classList.remove("show");
  openModal(authModal);
}

function updateBrandRoleLabel() {
  if (!brandRoleTitle) return;
  brandRoleTitle.textContent = selectedRole === "kaz" ? t("roleTeacher") : t("roleLecturer");
}

function renderDisciplinePreviewCard() {
  if (!disciplinePreviewCard) return;

  const previewTitle = disciplineTitleInput?.value.trim() || t("disciplinePreviewUntitled");
  const previewTheme = getDisciplineTheme((selectedCourseNumber || 0) + subjects.length + (selectedRole === "rus" ? 2 : 0));

  disciplinePreviewCard.className = "discipline-preview-card";
  disciplinePreviewCard.innerHTML = `
    ${getDisciplineCoverMarkup(previewTheme, "discipline-preview-cover")}
    <div class="discipline-preview-body">
      <div class="discipline-preview-name">${escapeHtml(previewTitle)}</div>
      <div class="discipline-preview-course">${selectedCourseNumber ? formatCourseLabel(selectedCourseNumber) : ""}</div>
    </div>
  `;
}

function openDisciplineModal() {
  if (!selectedCourseNumber || !disciplineModal) return;
  if (!driveConnection.connected) {
    promptGoogleLogin();
    return;
  }
  if (disciplineTitleInput) disciplineTitleInput.value = "";
  if (disciplineFormError) disciplineFormError.textContent = "";
  renderDisciplinePreviewCard();
  openModal(disciplineModal);
  disciplineTitleInput?.focus();
}

async function createDisciplineFromModal() {
  if (!disciplineTitleInput || !saveDisciplineBtn || !selectedCourseNumber) return;
  if (!driveConnection.connected) {
    promptGoogleLogin();
    return;
  }

  const title = disciplineTitleInput.value.trim();
  if (!title) {
    if (disciplineFormError) disciplineFormError.textContent = t("disciplineTitleRequired");
    disciplineTitleInput.focus();
    return;
  }

  const courseId = await getCourseIdByNumber(selectedCourseNumber);
  if (!courseId) {
    if (disciplineFormError) disciplineFormError.textContent = t("coursesLoadError");
    return;
  }

  saveDisciplineBtn.disabled = true;
  saveDisciplineBtn.textContent = t("disciplineCreating");
  if (disciplineFormError) disciplineFormError.textContent = "";
  const shouldKeepManagerOpen = isMaterialManagerOpen;

  try {
    const createdDiscipline = await fetchJSON(`${API_BASE}/disciplines/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        course: courseId,
        language: selectedRole,
        description: ""
      })
    });

    closeModal(disciplineModal);
    await loadDisciplinesForCourse(selectedCourseNumber);
    const nextSubject = createdDiscipline?.id
      ? getPreferredSubject(createdDiscipline.id)
      : subjects.find(item => item.title.trim().toLowerCase() === title.toLowerCase()) || subjects[subjects.length - 1] || null;

    if (nextSubject) {
      await openSubject(nextSubject);
      isMaterialManagerOpen = shouldKeepManagerOpen;
      renderDriveStatus();
    } else {
      openEmptySubjectWorkspace(selectedCourseNumber);
      isMaterialManagerOpen = shouldKeepManagerOpen;
      renderDriveStatus();
    }
  } catch (error) {
    console.error("Discipline create error:", error);
    if (disciplineFormError) {
      disciplineFormError.textContent = error.message || t("disciplineCreateError");
    }
  } finally {
    saveDisciplineBtn.disabled = false;
    saveDisciplineBtn.textContent = t("disciplineCreate");
  }
}

function startSubjectTitleEdit() {
  if (!selectedSubject || !subjectTitleInput || !subjectTitle) return;
  isEditingSubjectTitle = true;
  subjectTitleInput.value = selectedSubject.title || "";
  renderSubjectHeader();
  subjectTitleInput.focus();
  subjectTitleInput.select();
}

function cancelSubjectTitleEdit() {
  if (!subjectTitleInput) return;
  isEditingSubjectTitle = false;
  subjectTitleInput.value = selectedSubject?.title || "";
  renderSubjectHeader();
}

async function saveSubjectTitleEdit() {
  if (!selectedSubject || !subjectTitleInput) return;

  const nextTitle = subjectTitleInput.value.trim();
  if (!nextTitle) {
    subjectTitleInput.focus();
    subjectTitleInput.select();
    return;
  }

  if (nextTitle === selectedSubject.title) {
    cancelSubjectTitleEdit();
    return;
  }

  try {
    const updated = await fetchJSON(`${API_BASE}/disciplines/${selectedSubject.id}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: nextTitle
      })
    });

    selectedSubject.title = updated.title;
    subjects = subjects.map(item =>
      Number(item.id) === Number(selectedSubject.id)
        ? { ...item, title: updated.title }
        : item
    );

    isEditingSubjectTitle = false;
    renderSubjectHeader();
    populateSubjectSelect();
  } catch (error) {
    console.error("Discipline rename error:", error);
    subjectTitleInput.focus();
    subjectTitleInput.select();
  }
}

async function deleteDiscipline(card) {
  try {
    deletingDisciplineId = card.id;
    disciplineDeleteError = "";
    renderDisciplineCards();

    await fetchJSON(`${API_BASE}/disciplines/${card.id}/`, {
      method: "DELETE"
    });

    openedDisciplineMenuId = null;
    confirmingDisciplineDeleteId = null;
    deletingDisciplineId = null;

    if (selectedSubject && Number(selectedSubject.id) === Number(card.id)) {
      await loadDisciplinesForCourse(selectedCourseNumber);
      const nextSubject = getPreferredSubject();
      if (nextSubject) {
        await openSubject(nextSubject);
      } else if (selectedCourseNumber) {
        openEmptySubjectWorkspace(selectedCourseNumber);
      } else {
        showHome();
      }
      return;
    }

    if (selectedCourseNumber) {
      await loadDisciplinesForCourse(selectedCourseNumber);
      populateSubjectSelect();
    }
  } catch (error) {
    console.error("Discipline delete error:", error);
    deletingDisciplineId = null;
    disciplineDeleteError = error.message || t("disciplineDeleteError");
    openedDisciplineMenuId = card.id;
    confirmingDisciplineDeleteId = card.id;
    renderDisciplineCards();
  }
}

async function deleteCurrentSubject() {
  if (!selectedSubject) return;

  const shouldDelete = window.confirm(
    t("deleteDisciplineConfirm", { title: selectedSubject.title || t("subjectPlaceholder") })
  );

  if (!shouldDelete) {
    return;
  }

  const shouldKeepManagerOpen = isMaterialManagerOpen;
  await deleteDiscipline(selectedSubject);

  if (!subjectView.classList.contains("hidden") && selectedCourseNumber) {
    isMaterialManagerOpen = shouldKeepManagerOpen;
    renderDriveStatus();
  }
}

async function refreshInterfaceLanguage({ roleChanged = false } = {}) {
  const wasSubjectOpen = !subjectView.classList.contains("hidden");
  const previousSubjectId = selectedSubject?.id || null;

  applyStaticTranslations();
  renderProfile();
  renderCourseCards();

  if (selectedCourseNumber) {
    await loadDisciplinesForCourse(selectedCourseNumber);
  }

  if (roleChanged && wasSubjectOpen) {
    const nextSubject = getPreferredSubject(previousSubjectId);
    if (nextSubject) {
      await openSubject(nextSubject);
    } else if (selectedCourseNumber) {
      openEmptySubjectWorkspace(selectedCourseNumber);
    } else {
      showHome();
      showCourseStage();
    }
  }

  saveTeacherAppState();
}

async function restoreTeacherAppState() {
  if (appStateRestoreDone || publicTestSessionToken) return;

  loadStoredTestConfig();

  const savedState = readTeacherAppState();
  if (!savedState) {
    appStateRestoreDone = true;
    return;
  }

  if (savedState.selectedRole && ["kaz", "rus"].includes(savedState.selectedRole)) {
    selectedRole = savedState.selectedRole;
    applyStaticTranslations();
    renderProfile();
  }

  const shouldRestoreSubjectView = savedState.currentView === "subject" || (!("currentView" in savedState) && savedState.selectedSubjectId);

  if (!shouldRestoreSubjectView || !savedState.selectedCourseNumber) {
    appStateRestoreDone = true;
    return;
  }

  activeSubjectPanel = savedState.activeSubjectPanel || "materials";
  await openCourseDisciplines(Number(savedState.selectedCourseNumber), savedState.selectedSubjectId || null);

  if (savedState.activeType) {
    activeType = savedState.activeType;
    populateMaterialTypeSelect();
  }

  if (savedState.selectedMaterialId) {
    selectedMaterialId = Number(savedState.selectedMaterialId);
  }

  populateTopicSelect();
  await loadLatestTestSessionForSelectedMaterial();
  renderMaterialPreview();
  renderSlidesPreview();
  renderTestBlock(false);

  if (activeSubjectPanel === "results") {
    await renderResultsBlock();
  }

  switchSubjectPanel(activeSubjectPanel || "materials");
  isMaterialManagerOpen = Boolean(savedState.isMaterialManagerOpen);
  renderMaterialManagerPanel();
  saveTeacherAppState();
  appStateRestoreDone = true;
}

function getDisciplineLang(discipline) {
  return discipline.language || "kaz";
}

async function openCourseDisciplines(courseNumber, preferredSubjectId = null) {
  selectedCourseNumber = courseNumber;
  isDisciplineAccessLocked = false;
  disciplineStage.classList.add("hidden");
  await loadDisciplinesForCourse(courseNumber);

  const nextSubject = getPreferredSubject(preferredSubjectId);
  if (nextSubject) {
    await openSubject(nextSubject);
  } else {
    openEmptySubjectWorkspace(courseNumber);
  }

  saveTeacherAppState();
}

function showCourseStage() {
  selectedCourseNumber = null;
  isDisciplineAccessLocked = false;
  openedDisciplineMenuId = null;
  confirmingDisciplineDeleteId = null;
  deletingDisciplineId = null;
  disciplineDeleteError = "";
  disciplineStage.classList.add("hidden");
  courseStage.classList.remove("hidden");
  cardsGrid.innerHTML = "";
  saveTeacherAppState();
}

async function getCourseIdByNumber(courseNumber) {
  const found = coursesData.find(course => Number(course.number) === Number(courseNumber));
  return found ? found.id : null;
}

function switchSubjectPanel(panelName) {
  activeSubjectPanel = panelName;

  materialsPane.classList.add("hidden");
  slidesPane.classList.add("hidden");
  testPane.classList.add("hidden");
  resultsPane.classList.add("hidden");

  if (panelName === "materials") {
    materialsPane.classList.remove("hidden");
  }

  if (panelName === "slides") {
    slidesPane.classList.remove("hidden");
  }

  if (panelName === "test") {
    testPane.classList.remove("hidden");
  }

  if (panelName === "results") {
    resultsPane.classList.remove("hidden");
  }

  saveTeacherAppState();
}

async function loadCoursesFromApi() {
  try {
    coursesData = await fetchJSON(`${API_BASE}/courses/`);
    renderCourseCards();
    if (driveConnection.connected) {
      await restoreTeacherAppState();
    }
  } catch (error) {
    console.error("Courses load error:", error);
    courseGrid.innerHTML = `<div class="empty-state">${t("coursesLoadError")}</div>`;
  }
}

function renderCourseCards() {
  if (!courseGrid) return;

  if (!coursesData.length) {
    courseGrid.innerHTML = `<div class="empty-state">${t("coursesNotFound")}</div>`;
    return;
  }

  const coverClasses = {
    1: "course-card-cover-1",
    2: "course-card-cover-2",
    3: "course-card-cover-3",
    4: "course-card-cover-4"
  };

  courseGrid.innerHTML = coursesData.map(course => `
    <article class="course-card" data-course-number="${course.number}">
      <div class="course-card-cover ${coverClasses[course.number] || coverClasses[1]}">
        <div class="course-card-illustration course-card-illustration-${course.number}">
          <span class="course-card-asset asset-base"></span>
          <span class="course-card-asset asset-sheet"></span>
          <span class="course-card-asset asset-tool"></span>
          <span class="course-card-asset asset-chip"></span>
        </div>
      </div>

      <div class="course-card-body">
        <div class="course-card-title">${formatCourseLabel(course.number)}</div>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".course-card").forEach(card => {
    card.addEventListener("click", async () => {
      const courseNumber = Number(card.dataset.courseNumber);
      await openCourseDisciplines(courseNumber);
    });
  });
}

async function loadDisciplinesForCourse(courseNumber) {
  try {
    const courseId = await getCourseIdByNumber(courseNumber);

    if (!courseId) {
      subjects = [];
      isDisciplineAccessLocked = false;
      renderDisciplineCards();
      return;
    }

    const disciplines = await fetchJSON(`${API_BASE}/disciplines/?course_id=${courseId}&language=${selectedRole}`, {
      handleUnauthorized: false
    });

    subjects = disciplines
      .map((discipline, index) => ({
        ...getDisciplineTheme(discipline.id || index),
        id: discipline.id,
        title: discipline.title,
        course: formatCourseLabel(discipline.course_number),
        courseNum: formatCourseLabel(discipline.course_number),
        courseNumber: discipline.course_number,
        groupLang: getDisciplineLang(discipline),
        coverImage: "",
        materials: []
      }))
      .filter(item => item.groupLang === selectedRole);

    isDisciplineAccessLocked = false;
    renderDisciplineCards();
  } catch (error) {
    console.error("Disciplines load error:", error);
    subjects = [];
    isDisciplineAccessLocked = error?.status === 401;

    if (isDisciplineAccessLocked) {
      renderLoginRequiredState();
      return;
    }

    renderDisciplineCards();
  }
}

function renderDisciplineCards() {
  cardsGrid.innerHTML = "";

  subjects.forEach(card => {
    const el = document.createElement("div");
    el.className = "class-card";
    const menuOpen = openedDisciplineMenuId === card.id;
    const confirmDelete = confirmingDisciplineDeleteId === card.id;
    const isDeleting = deletingDisciplineId === card.id;
    const menuContent = confirmDelete
      ? `
        <button class="class-card-menu-item danger" type="button" data-discipline-action="confirm-delete" ${isDeleting ? "disabled" : ""}>
          ${isDeleting ? t("disciplineDeleting") : t("confirmDelete")}
        </button>
        <button class="class-card-menu-item" type="button" data-discipline-action="cancel-delete" ${isDeleting ? "disabled" : ""}>
          ${t("cancel")}
        </button>
        ${disciplineDeleteError ? `<div class="class-card-menu-error">${escapeHtml(disciplineDeleteError)}</div>` : ""}
      `
      : `
        <button class="class-card-menu-item danger" type="button" data-discipline-action="start-delete">${t("disciplineDelete")}</button>
      `;
    el.innerHTML = `
      <div class="class-card-menu-wrap">
        <button class="class-card-menu-btn" type="button" aria-label="${t("disciplineMenu")}">
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="10" cy="4.25" r="1.45"></circle>
            <circle cx="10" cy="10" r="1.45"></circle>
            <circle cx="10" cy="15.75" r="1.45"></circle>
          </svg>
        </button>
        <div class="class-card-menu ${menuOpen ? "show" : ""}">
          ${menuContent}
        </div>
      </div>
      ${getDisciplineCoverMarkup(card)}
      <div class="class-body">
        <div class="class-subject">${card.title}</div>
        <div class="class-course">${card.course}</div>
      </div>
    `;

    const menuBtn = el.querySelector(".class-card-menu-btn");

    if (menuBtn) {
      menuBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        disciplineDeleteError = "";
        confirmingDisciplineDeleteId = null;
        openedDisciplineMenuId = menuOpen ? null : card.id;
        renderDisciplineCards();
      });
    }

    el.querySelectorAll("[data-discipline-action]").forEach((actionBtn) => {
      actionBtn.addEventListener("click", async (event) => {
        event.stopPropagation();
        const action = actionBtn.dataset.disciplineAction;

        if (action === "start-delete") {
          disciplineDeleteError = "";
          openedDisciplineMenuId = card.id;
          confirmingDisciplineDeleteId = card.id;
          renderDisciplineCards();
          return;
        }

        if (action === "cancel-delete") {
          disciplineDeleteError = "";
          confirmingDisciplineDeleteId = null;
          openedDisciplineMenuId = null;
          renderDisciplineCards();
          return;
        }

        if (action === "confirm-delete") {
          await deleteDiscipline(card);
        }
      });
    });

    el.addEventListener("click", () => openSubject(card));
    cardsGrid.appendChild(el);
  });

  if (!subjects.length) {
    cardsGrid.innerHTML = `
      <div class="empty-state" style="grid-column:1 / -1;">
        ${escapeHtml(isDisciplineAccessLocked ? getAuthRequiredWorkspaceMessage() : t("disciplinesNotFound"))}
      </div>
    `;
  }
}

function mapMaterialFromApi(item) {
  const normalizedType = normalizeMaterialType(item.category);

  return {
    id: item.id,
    type: normalizedType,
    typeLabel: getTypeLabel(normalizedType),
    title: item.title,
    desc: item.description || t("materialDescriptionMissing"),
    fileUrl: item.cloud_url,
    previewUrl: item.id ? `${API_BASE}/materials/${item.id}/preview/` : item.cloud_url,
    formUrl: item.form_url || "",
    resultsSheetUrl: item.results_sheet_url || "",
    slidesUrl: item.slides_url || "",
    slidesEmbedUrl: item.slides_embed_url || "",
    slidesDownloadUrl: item.slides_download_url || "",
    slidesPresentationId: item.slides_presentation_id || "",
    createdAt: item.created_at || "",
    mimeType: item.mime_type || "",
    originalFilename: item.original_filename || "",
    driveFileId: item.drive_file_id || "",
  };
}

async function loadMaterialsForSubject(subjectId) {
  try {
    const materials = await fetchJSON(`${API_BASE}/materials/?discipline_id=${subjectId}`);
    return materials.map(mapMaterialFromApi);
  } catch (error) {
    console.error("Materials load error:", error);
    return [];
  }
}

async function openSubject(subject) {
  selectedSubject = { ...subject };
  slidesErrorMessage = "";
  isEditingSubjectTitle = false;
  isMaterialManagerOpen = false;
  isUploadMenuOpen = false;
  openedDisciplineMenuId = null;
  confirmingDisciplineDeleteId = null;
  deletingDisciplineId = null;
  disciplineDeleteError = "";

  if (!selectedSubject.materials || !selectedSubject.materials.length) {
    selectedSubject.materials = await loadMaterialsForSubject(selectedSubject.id);
  }

  await loadDriveStatus();

  if (!selectedSubject) {
    return;
  }

  const existingType = typeOrder.find(t => selectedSubject.materials.some(m => m.type === t.key));
  activeType = existingType ? existingType.key : "lecture";

  const firstMaterial = selectedSubject.materials.find(m => m.type === activeType) || selectedSubject.materials[0] || null;
  selectedMaterialId = firstMaterial ? firstMaterial.id : null;

  await loadLatestTestSessionForSelectedMaterial();

  homeView.classList.add("hidden");
  subjectView.classList.remove("hidden");

  renderSubjectHeader();
  populateSubjectSelect();
  populateMaterialTypeSelect();
  populateTopicSelect();
  renderDriveStatus();
  clearMaterialPreview();
  renderSlidesPreview();
  renderTestBlock(false);
  renderResultsBlock();
  switchSubjectPanel(activeSubjectPanel || "materials");
  saveTeacherAppState();
}

function showHome() {
  cancelSubjectTitleEdit();
  subjectView.classList.add("hidden");
  homeView.classList.remove("hidden");
  disciplineStage.classList.add("hidden");
  courseStage.classList.remove("hidden");
  isDisciplineAccessLocked = false;
  selectedSubject = null;
  slidesErrorMessage = "";
  isMaterialManagerOpen = false;
  isUploadMenuOpen = false;
  openedDisciplineMenuId = null;
  confirmingDisciplineDeleteId = null;
  deletingDisciplineId = null;
  disciplineDeleteError = "";
  activeSubjectPanel = "materials";
  renderMaterialManagerPanel();
  saveTeacherAppState();
}

function getTypeMaterials() {
  if (!selectedSubject) return [];
  return selectedSubject.materials.filter(m => m.type === activeType);
}

function ensureSelectedMaterial() {
  const list = getTypeMaterials();
  if (!list.some(m => m.id === selectedMaterialId)) {
    selectedMaterialId = list[0]?.id || null;
  }
}

function getSelectedMaterial() {
  const list = getTypeMaterials();
  ensureSelectedMaterial();
  return list.find(m => m.id === selectedMaterialId) || null;
}

function findSubjectById(subjectId) {
  return subjects.find(item => Number(item.id) === Number(subjectId)) || null;
}

function getAssistantSubjectSnapshots() {
  return subjects.map(item => ({
    id: Number(item.id),
    title: item.title,
    course_number: Number(item.courseNumber || selectedCourseNumber || 0),
  }));
}

function getAssistantMaterialSnapshots() {
  if (!selectedSubject?.materials?.length) {
    return [];
  }

  return selectedSubject.materials.map(item => ({
    id: Number(item.id),
    title: item.title,
    type: item.type,
    subject_id: Number(selectedSubject.id || 0),
    course_number: Number(selectedSubject.courseNumber || selectedCourseNumber || 0),
  }));
}

function buildAssistantContext() {
  const material = getSelectedMaterial();

  return {
    selected_role: selectedRole,
    current_view: subjectView?.classList.contains("hidden") ? "home" : "subject",
    active_panel: activeSubjectPanel,
    selected_course_number: selectedCourseNumber,
    selected_subject: selectedSubject
      ? {
          id: Number(selectedSubject.id),
          title: selectedSubject.title,
          course_number: Number(selectedSubject.courseNumber || selectedCourseNumber || 0),
        }
      : null,
    selected_material: material
      ? {
          id: Number(material.id),
          title: material.title,
          type: material.type,
          subject_id: Number(selectedSubject?.id || 0),
          course_number: Number(selectedSubject?.courseNumber || selectedCourseNumber || 0),
        }
      : null,
    available_subjects: getAssistantSubjectSnapshots(),
    available_materials: getAssistantMaterialSnapshots(),
    has_generated_test: generatedQuestions.length > 0,
    has_results: Boolean(currentTestSession),
  };
}

async function ensureAssistantSubjectContext({ courseNumber = null, subjectId = null } = {}) {
  const normalizedCourseNumber = Number(courseNumber) || Number(selectedCourseNumber) || null;
  const normalizedSubjectId = Number(subjectId) || null;

  if (!selectedSubject && !subjects.length) {
    const fallbackCourseNumber = normalizedCourseNumber || Number(coursesData?.[0]?.number || 0) || null;
    if (fallbackCourseNumber) {
      await openCourseDisciplines(fallbackCourseNumber, normalizedSubjectId);
      if (selectedSubject) {
        return selectedSubject;
      }
    }
  }

  if (normalizedCourseNumber && Number(selectedCourseNumber) !== normalizedCourseNumber) {
    await openCourseDisciplines(normalizedCourseNumber, normalizedSubjectId);
    return selectedSubject;
  }

  if (!selectedSubject && normalizedCourseNumber) {
    await openCourseDisciplines(normalizedCourseNumber, normalizedSubjectId);
    return selectedSubject;
  }

  if (normalizedSubjectId && Number(selectedSubject?.id) !== normalizedSubjectId) {
    const nextSubject = findSubjectById(normalizedSubjectId);
    if (nextSubject) {
      await openSubject(nextSubject);
    } else if (normalizedCourseNumber) {
      await openCourseDisciplines(normalizedCourseNumber, normalizedSubjectId);
    }
  }

  if (!selectedSubject) {
    const fallbackSubject = normalizedSubjectId
      ? findSubjectById(normalizedSubjectId)
      : getPreferredSubject();

    if (fallbackSubject) {
      await openSubject(fallbackSubject);
    }
  }

  return selectedSubject;
}

async function syncAssistantMaterialSelection({
  courseNumber = null,
  subjectId = null,
  materialId = null,
  materialType = "",
} = {}) {
  await ensureAssistantSubjectContext({ courseNumber, subjectId });

  if (!selectedSubject) {
    return null;
  }

  const normalizedMaterialType = typeof materialType === "string" ? materialType.trim().toLowerCase() : "";
  if (normalizedMaterialType) {
    activeType = normalizedMaterialType;
  }

  const subjectMaterials = Array.isArray(selectedSubject.materials) ? selectedSubject.materials : [];
  const matchedMaterial = subjectMaterials.find(item => Number(item.id) === Number(materialId));

  if (matchedMaterial) {
    activeType = matchedMaterial.type || activeType;
    selectedMaterialId = matchedMaterial.id;
  } else if (normalizedMaterialType) {
    const firstByType = subjectMaterials.find(item => item.type === normalizedMaterialType);
    if (firstByType) {
      selectedMaterialId = firstByType.id;
    }
  }

  populateMaterialTypeSelect();
  populateTopicSelect();
  renderDriveStatus();
  await loadLatestTestSessionForSelectedMaterial();
  clearMaterialPreview();
  renderSlidesPreview();
  renderTestBlock();
  await renderResultsBlock();
  saveTeacherAppState();

  return getSelectedMaterial();
}

function populateSubjectSelect() {
  if (!subjectSelect) return;

  if (!subjects.length) {
    subjectSelect.innerHTML = `<option value="">${isDisciplineAccessLocked ? escapeHtml(getAuthRequiredWorkspaceMessage()) : t("subjectNotFound")}</option>`;
    subjectSelect.disabled = true;
    return;
  }

  subjectSelect.disabled = false;
  subjectSelect.innerHTML = subjects.map(item => `
    <option value="${item.id}" ${Number(item.id) === Number(selectedSubject?.id) ? "selected" : ""}>
      ${escapeHtml(item.title)}
    </option>
  `).join("");
}

function openEmptySubjectWorkspace(courseNumber) {
  selectedCourseNumber = courseNumber || selectedCourseNumber;
  selectedSubject = null;
  slidesErrorMessage = "";
  isEditingSubjectTitle = false;
  isMaterialManagerOpen = false;
  isUploadMenuOpen = false;
  activeType = "lecture";
  activeSubjectPanel = "materials";
  selectedMaterialId = null;
  resetTestState();

  homeView.classList.add("hidden");
  subjectView.classList.remove("hidden");

  renderSubjectHeader();
  populateSubjectSelect();
  populateMaterialTypeSelect();
  populateTopicSelect();
  renderDriveStatus();
  clearMaterialPreview();
  renderSlidesPreview();
  renderTestBlock(false);
  renderResultsBlock();
  switchSubjectPanel(activeSubjectPanel || "materials");
  saveTeacherAppState();
}

function renderSubjectHeader() {
  const courseNumber = Number(selectedSubject?.courseNumber || selectedCourseNumber || 1);
  const courseVisual = getCourseVisualConfig(courseNumber);

  subjectTitle.textContent = selectedSubject?.title || t("subjectPlaceholder");
  if (subjectTitleInput) {
    subjectTitleInput.value = selectedSubject?.title || "";
    subjectTitleInput.classList.toggle("hidden", !selectedSubject || !isEditingSubjectTitle);
  }
  if (subjectTitle) {
    subjectTitle.classList.toggle("hidden", isEditingSubjectTitle);
  }
  const currentCourseLabel = selectedSubject?.course || (selectedCourseNumber ? formatCourseLabel(selectedCourseNumber) : "");
  subjectCourse.textContent = currentCourseLabel;
  if (subjectCourseBannerBadge) {
    subjectCourseBannerBadge.textContent = currentCourseLabel;
  }
  if (subjectCoverTop) {
    subjectCoverTop.dataset.courseNumber = String(courseNumber);
    subjectCoverTop.style.backgroundImage = "";
  }
  if (subjectCourseCardCover) {
    subjectCourseCardCover.className = `course-card-cover subject-course-card-cover ${courseVisual.coverClass}`;
  }
  if (subjectCourseIllustration) {
    subjectCourseIllustration.className = `course-card-illustration subject-course-illustration ${courseVisual.illustrationClass}`;
  }
  if (changeCoverBtn) {
    changeCoverBtn.textContent = isEditingSubjectTitle ? t("save") : t("edit");
  }
}

function populateMaterialTypeSelect() {
  if (!materialTypeSelect) return;

  if (!selectedSubject) {
    materialTypeSelect.innerHTML = `<option value="">${isDisciplineAccessLocked ? escapeHtml(getAuthRequiredWorkspaceMessage()) : t("subjectSelectFirst")}</option>`;
    materialTypeSelect.disabled = true;
    return;
  }

  materialTypeSelect.disabled = false;

  const existingTypes = typeOrder;

  materialTypeSelect.innerHTML = existingTypes.map(type => `
    <option value="${type.key}" ${type.key === activeType ? "selected" : ""}>${getTypeLabel(type.key)}</option>
  `).join("");

  if (!existingTypes.length) {
    materialTypeSelect.innerHTML = `<option value="lecture">Дәріс</option>`;
    activeType = "lecture";
  }
}

function populateTopicSelect() {
  if (!topicSelect) return;

  if (!selectedSubject) {
    topicSelect.innerHTML = `<option value="">${isDisciplineAccessLocked ? escapeHtml(getAuthRequiredWorkspaceMessage()) : t("subjectSelectFirst")}</option>`;
    topicSelect.disabled = true;
    return;
  }

  topicSelect.disabled = false;

  const list = getTypeMaterials();
  ensureSelectedMaterial();

  if (!list.length) {
    topicSelect.innerHTML = `<option value="">${t("topicNotFound")}</option>`;
    return;
  }

  topicSelect.innerHTML = list.map(item => `
    <option value="${item.id}" ${item.id === selectedMaterialId ? "selected" : ""}>${escapeHtml(item.title)}</option>
  `).join("");
}

function getPreviewKindFromUrl(url) {
  const clean = String(url || "").toLowerCase().split("?")[0].split("#")[0];
  const ext = clean.split(".").pop() || "";

  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
  if (["mp3", "wav", "oga", "m4a"].includes(ext)) return "audio";
  return "external";
}

function getPreviewKind(item) {
  const mime = String(item?.mimeType || "").toLowerCase();
  const name = String(item?.originalFilename || item?.title || "").toLowerCase();
  const ext = name.split("?")[0].split("#")[0].split(".").pop() || "";

  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext)) return "image";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("video/") || ["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
  if (mime.startsWith("audio/") || ["mp3", "wav", "oga", "m4a"].includes(ext)) return "audio";
  if (mime.startsWith("text/") || ["txt", "md", "csv", "json", "xml", "html"].includes(ext)) return "text";

  return getPreviewKindFromUrl(item?.fileUrl || "");
}

function upsertSelectedSubjectMaterial(materialPayload) {
  if (!selectedSubject || !materialPayload) return null;

  const mappedMaterial = mapMaterialFromApi(materialPayload);
  const existingIndex = selectedSubject.materials.findIndex(item => item.id === mappedMaterial.id);

  if (existingIndex >= 0) {
    selectedSubject.materials.splice(existingIndex, 1, mappedMaterial);
  } else {
    selectedSubject.materials.push(mappedMaterial);
  }

  return mappedMaterial;
}

function clearMaterialPreview() {
  materialPreview.innerHTML = `
    <div class="empty-state">${t("materialsEmpty")}</div>
  `;
}

function renderMaterialPreview() {
  if (!selectedSubject) {
    materialPreview.innerHTML = `<div class="empty-state">${escapeHtml(isDisciplineAccessLocked ? getAuthRequiredWorkspaceMessage() : t("subjectSelectFirst"))}</div>`;
    return;
  }

  const item = getSelectedMaterial();

  if (!item) {
    materialPreview.innerHTML = `<div class="empty-state">${t("materialSelectPrompt")}</div>`;
    return;
  }

  let previewInner = selectedSubject?.coverImage
    ? `<img src="${selectedSubject.coverImage}" alt="preview" />`
    : `
      <div class="preview-discipline-shell">
        ${getDisciplineCoverMarkup(selectedSubject, "preview-discipline-cover")}
      </div>
    `;
  const kind = getPreviewKind(item);
  const inlinePreviewUrl = item.previewUrl || item.fileUrl;

  if (item.fileUrl) {
    if (kind === "pdf" || kind === "text") {
      previewInner = `<iframe src="${inlinePreviewUrl}" loading="lazy"></iframe>`;
    } else if (kind === "image") {
      previewInner = `<img src="${inlinePreviewUrl}" alt="${escapeHtml(item.title)}" />`;
    } else if (kind === "video") {
      previewInner = `<video src="${inlinePreviewUrl}" controls style="width:100%;height:100%;object-fit:contain;background:#102842;border-radius:14px;"></video>`;
    } else if (kind === "audio") {
      previewInner = `<div style="height:100%;display:flex;align-items:center;justify-content:center;padding:24px;"><audio src="${inlinePreviewUrl}" controls style="width:min(560px,100%);"></audio></div>`;
    } else if (kind === "external") {
      previewInner = `<iframe src="${item.fileUrl}" loading="lazy"></iframe>`;
    }
  }

  materialPreview.innerHTML = `
    <div class="preview-box">
      ${previewInner}
    </div>

    <div class="preview-type ${getBadgeClass(item.type)}">${item.typeLabel}</div>
    <div class="preview-title">${escapeHtml(item.title)}</div>
    <div class="preview-actions"></div>
  `;
}

async function openPreviewFullscreen() {
  const target = document.querySelector("#materialPreview .preview-box iframe") ||
                 document.querySelector("#materialPreview .preview-box img") ||
                 document.querySelector("#materialPreview .preview-box");

  if (!target) return;

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (target.requestFullscreen) {
      await target.requestFullscreen();
    }
  } catch (e) {
    console.error(e);
  }
}

function resetTestState() {
  generatedQuestions = [];
  currentTestSession = null;
  isEditingTest = false;
  isTestGenerating = false;
  updateActionButtonsState();
}

function renderTestSettingsPanel() {
  const material = getSelectedMaterial();
  const isLecture = material?.type === "lecture";
  const hasTest = Boolean(currentTestSession && generatedQuestions.length);

  syncTestConfigInputs();

  if (buildTestBtn) {
    buildTestBtn.disabled = !isLecture || isTestGenerating;
    buildTestBtn.textContent = isTestGenerating
      ? (selectedRole === "kaz" ? "Құрастырылып жатыр..." : "Создается...")
      : (selectedRole === "kaz" ? "Тестті құрастыру" : "Собрать тест");
  }

  if (testQuestionCountInput) {
    testQuestionCountInput.disabled = !isLecture || isTestGenerating;
  }

  if (testDurationInput) {
    testDurationInput.disabled = !isLecture || isTestGenerating;
  }

  if (testInfoText) {
    testInfoText.classList.toggle("is-error", !isLecture);
  }

  if (testSettingsHint) {
    if (!isLecture) {
      testSettingsHint.textContent = t("testLectureOnly");
      return;
    }

    if (hasTest) {
      testSettingsHint.textContent = selectedRole === "kaz"
        ? `Тест дайын: ${generatedQuestions.length} сұрақ, ${testConfig.durationMinutes} минут.`
        : `Тест готов: ${generatedQuestions.length} вопросов, ${testConfig.durationMinutes} минут.`;
      return;
    }

    testSettingsHint.textContent = selectedRole === "kaz"
      ? "Сұрақ санын және тест уақытын белгілеп, содан кейін тестті құрастырыңыз."
      : "Укажите количество вопросов и длительность теста, затем соберите тест.";
  }
}

function setSlidesStatus(message = "", state = "neutral") {
  if (!slidesStatusText) return;
  slidesStatusText.textContent = message || "";
  slidesStatusText.classList.toggle("is-error", state === "error");
}

function buildSlidesEmptyCard(title, text, extraClass = "") {
  return `
    <div class="slides-preview-shell">
      <div class="slides-preview-card ${extraClass}">
        <div class="slides-preview-copy">
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(text)}</p>
        </div>
      </div>
    </div>
  `;
}

function renderSlidesPreview() {
  if (!slidesPreview) return;

  if (!selectedSubject) {
    slidesErrorMessage = "";
    setSlidesStatus("");
    slidesPreview.innerHTML = buildSlidesEmptyCard(
      t("slidesEmptyTitle"),
      isDisciplineAccessLocked ? getAuthRequiredWorkspaceMessage() : t("subjectSelectFirst")
    );
    return;
  }

  const material = getSelectedMaterial();
  const isLecture = material?.type === "lecture";
  const hasSlides = Boolean(material?.slidesEmbedUrl || material?.slidesUrl);

  if (openSlidesFullscreenBtn) {
    openSlidesFullscreenBtn.disabled = !hasSlides || isSlidesGenerating;
  }

  if (downloadSlidesBtn) {
    downloadSlidesBtn.disabled = !material?.slidesDownloadUrl || isSlidesGenerating;
  }

  if (!material) {
    slidesErrorMessage = "";
    setSlidesStatus("");
    slidesPreview.innerHTML = buildSlidesEmptyCard(t("slidesEmptyTitle"), t("slidesSelectPrompt"));
    return;
  }

  if (!isLecture) {
    slidesErrorMessage = "";
    setSlidesStatus(t("slidesLectureOnly"), "error");
    slidesPreview.innerHTML = buildSlidesEmptyCard(t("slidesEmptyTitle"), t("slidesLectureOnly"));
    return;
  }

  if (isSlidesGenerating) {
    setSlidesStatus(t("slidesGenerating"));
    slidesPreview.innerHTML = `
      <div class="slides-preview-shell">
        <div class="slides-preview-card is-loading">
          <div class="slides-preview-copy">
            <div class="slides-loader"></div>
            <h3>${t("slidesLoadingTitle")}</h3>
            <p>${t("slidesLoadingText")}</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (!hasSlides) {
    if (slidesErrorMessage) {
      setSlidesStatus(slidesErrorMessage, "error");
      slidesPreview.innerHTML = buildSlidesEmptyCard(t("slidesEmptyTitle"), slidesErrorMessage);
      return;
    }

    setSlidesStatus("");
    slidesPreview.innerHTML = buildSlidesEmptyCard(t("slidesEmptyTitle"), t("slidesEmptyText"));
    return;
  }

  slidesErrorMessage = "";
  setSlidesStatus(t("slidesReady", { title: material.title }));
  slidesPreview.innerHTML = `
    <div class="slides-preview-shell">
      <div class="slides-embed-meta">
        <div>
          <strong>${escapeHtml(material.title)}</strong>
          <span>${escapeHtml(selectedSubject?.title || "")}</span>
        </div>
      </div>

      <div class="slides-embed-shell">
        <iframe
          src="${material.slidesEmbedUrl || material.slidesUrl}"
          loading="lazy"
          allowfullscreen
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  `;
}

async function openSlidesPreviewFullscreen() {
  const target = document.querySelector("#slidesPreview .slides-embed-shell") || slidesPreview;
  if (!target) return;

  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (target.requestFullscreen) {
      await target.requestFullscreen();
    }
  } catch (error) {
    console.error(error);
  }
}

function downloadCurrentSlides() {
  const material = getSelectedMaterial();
  const downloadUrl = material?.slidesDownloadUrl;

  if (!downloadUrl) {
    setSlidesStatus(t("slidesDownloadUnavailable"), "error");
    renderSlidesPreview();
    return;
  }

  window.open(downloadUrl, "_blank", "noopener");
}

function updateActionButtonsState() {
  const material = getSelectedMaterial();
  const isLecture = material?.type === "lecture";
  const hasGeneratedTest = generatedQuestions.length > 0;
  const hasSessionLink = !!currentTestSession?.access_token || !!currentTestSession?.form_url;
  const hasResults = !!currentTestSession;

  openSlidesBtn.disabled = !isLecture || isSlidesGenerating;
  openSlidesBtn.textContent = isSlidesGenerating ? t("slidesGenerating") : t("slides");
  generateTestBtn.disabled = !isLecture || isTestGenerating;
  openQrBtn.disabled = !hasGeneratedTest || !hasSessionLink;
  openResultsBtn.disabled = !hasResults;
  renderTestSettingsPanel();
}

function buildInlineQrUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(value || "Lektor")}`;
}

function convertGoogleSheetToEmbed(url) {
  if (!url) return "";
  try {
    const parsed = new URL(url);

    if (parsed.pathname.includes("/pubhtml")) {
      return parsed.toString();
    }

    if (parsed.pathname.includes("/edit")) {
      parsed.searchParams.set("rm", "minimal");
      return parsed.toString();
    }

    return parsed.toString();
  } catch (error) {
    console.error("Invalid Google Sheet URL:", error);
    return url;
  }
}

function buildGoogleSheetDownloadUrl(url, format = "xlsx") {
  if (!url) return "";

  const matched = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!matched?.[1]) return "";

  return `https://docs.google.com/spreadsheets/d/${matched[1]}/export?format=${encodeURIComponent(format)}`;
}

function buildResultsSummaryDoc(title, responses = [], options = {}) {
  const labels = selectedRole === "kaz"
    ? {
        participants: "Тапсырғандар",
        average: "Орташа пайыз",
        best: "Үздік балл",
        percent: "Пайыз",
        noData: "Нәтиже табылмады",
      }
    : {
        participants: "Участников",
        average: "Средний процент",
        best: "Лучший балл",
        percent: "Процент",
        noData: "Результаты не найдены",
      };

  const normalizedResponses = Array.isArray(responses) ? responses : [];
  const scoringReady = options.scoringReady !== false;
  const averagePercent = scoringReady && normalizedResponses.length
    ? Math.round(normalizedResponses.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0) / normalizedResponses.length)
    : 0;
  const bestScoreLabel = scoringReady && normalizedResponses.length
    ? normalizedResponses.reduce((best, item) => {
        const current = Number(item.score) || 0;
        const bestValue = Number(best.score) || 0;
        return current > bestValue ? item : best;
      }, normalizedResponses[0]).score_label || "-"
    : t("resultsScoreUnavailable");

  const summaryNote = !scoringReady
    ? `
      <div style="padding:16px 18px;border-radius:18px;background:#fff7ed;border:1px solid #fdba74;color:#9a3412;line-height:1.55;">
        <div style="font-weight:800;margin-bottom:6px;">${escapeHtml(t("resultsScoringMissing"))}</div>
        <div style="font-size:14px;">${escapeHtml(t("resultsRegenerateHint"))}</div>
      </div>
    `
    : "";

  const rowsHtml = normalizedResponses.map((response, index) => {
    const submittedAt = response.submitted_at
      ? new Date(response.submitted_at).toLocaleString(selectedRole === "kaz" ? "kk-KZ" : "ru-RU")
      : "-";
    const scoreLabel = scoringReady ? escapeHtml(response.score_label || "-") : escapeHtml(t("resultsScoreUnavailable"));
    const percentLabel = scoringReady ? `${Number(response.percentage) || 0}%` : "—";

    return `
      <tr>
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#475569;">${index + 1}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:700;">${escapeHtml(response.student_name || t("nameMissing"))}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;">
          <span style="display:inline-flex;align-items:center;justify-content:center;min-width:88px;height:34px;padding:0 14px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-weight:800;">${scoreLabel}</span>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:700;">${percentLabel}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #e2e8f0;color:#475569;">${escapeHtml(submittedAt)}</td>
      </tr>
    `;
  }).join("");

  return `
    <html>
      <body style="margin:0;padding:28px;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
        <div style="display:grid;gap:16px;">
          <div>
            <h2 style="margin:0 0 8px;font-size:28px;line-height:1.2;">${escapeHtml(title || t("results"))}</h2>
          </div>

          ${summaryNote}

          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
            <div style="padding:18px;border-radius:18px;background:#ffffff;border:1px solid #dbe3f0;">
              <div style="font-size:13px;color:#64748b;margin-bottom:8px;">${labels.participants}</div>
              <div style="font-size:28px;font-weight:800;color:#0f172a;">${normalizedResponses.length}</div>
            </div>
            <div style="padding:18px;border-radius:18px;background:#ffffff;border:1px solid #dbe3f0;">
              <div style="font-size:13px;color:#64748b;margin-bottom:8px;">${labels.average}</div>
              <div style="font-size:28px;font-weight:800;color:#0f172a;">${scoringReady ? `${averagePercent}%` : "—"}</div>
            </div>
            <div style="padding:18px;border-radius:18px;background:#ffffff;border:1px solid #dbe3f0;">
              <div style="font-size:13px;color:#64748b;margin-bottom:8px;">${labels.best}</div>
              <div style="font-size:28px;font-weight:800;color:#0f172a;">${escapeHtml(bestScoreLabel)}</div>
            </div>
          </div>

          <div style="border-radius:22px;overflow:hidden;border:1px solid #dbe3f0;background:#ffffff;">
            <table style="width:100%;border-collapse:collapse;">
              <thead style="background:#eaf1ff;">
                <tr>
                  <th style="padding:14px 16px;text-align:left;color:#1e3a8a;font-size:13px;">${t("tableNumber")}</th>
                  <th style="padding:14px 16px;text-align:left;color:#1e3a8a;font-size:13px;">${t("tableName")}</th>
                  <th style="padding:14px 16px;text-align:left;color:#1e3a8a;font-size:13px;">${t("tableScore")}</th>
                  <th style="padding:14px 16px;text-align:left;color:#1e3a8a;font-size:13px;">${labels.percent}</th>
                  <th style="padding:14px 16px;text-align:left;color:#1e3a8a;font-size:13px;">${t("tableTime")}</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || `
                  <tr>
                    <td colspan="5" style="padding:28px 16px;text-align:center;color:#64748b;">${labels.noData}</td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  `;
}

function makeQuestion(index, topicTitle) {
  const templates = [
    `${topicTitle} тақырыбы бойынша негізгі қауіп қайсы?`,
    `${topicTitle} бойынша дұрыс қорғану тәсілін таңдаңыз.`,
    `${topicTitle} ішінде ең маңызды түсінік қайсы?`,
    `${topicTitle} бойынша қате әрекетті таңдаңыз.`
  ];

  const optionSets = [
    ["Қауіпті анықтау және қорғану", "Тек атауын білу", "Файлды көшіру", "Тек дизайнды қарау"],
    ["Күмәнді белгілерді тексеру", "Сілтемені бірден ашу", "Кез келген файлды жүктеу", "Белгісіз хатқа сену"],
    ["Қауіпсіздік саясаты", "Кездейсоқ пароль", "Бос тексеру", "Қорғаныссыз желі"],
    ["Хатты тексермей ашу", "Доменді тексеру", "Жіберушіні тексеру", "Күмәнді сілтемені ашпау"]
  ];

  return {
    id: index + 1,
    question: templates[index % templates.length],
    options: [...optionSets[index % optionSets.length]],
    answer: index % 4 === 3 ? 1 : 0
  };
}

async function saveEditedQuestions() {
  document.querySelectorAll(".edit-textarea").forEach(area => {
    const qIndex = Number(area.dataset.questionIndex);
    generatedQuestions[qIndex].question = area.value.trim() || generatedQuestions[qIndex].question;
  });

  document.querySelectorAll(".edit-input").forEach(input => {
    const qIndex = Number(input.dataset.questionIndex);
    const oIndex = Number(input.dataset.optionIndex);
    generatedQuestions[qIndex].options[oIndex] = input.value.trim() || generatedQuestions[qIndex].options[oIndex];
  });

  generatedQuestions.forEach((question, qIndex) => {
    const checked = document.querySelector(`input[name="correct-${qIndex}"]:checked`);
    if (checked) question.answer = Number(checked.value);
  });

  const durationInput = document.getElementById("testModalDurationInput");
  if (durationInput) {
    testConfig = clampTestConfig(generatedQuestions.length || testConfig.questionCount, durationInput.value);
    syncTestConfigInputs();
    saveStoredTestConfig();
  }

  if (currentTestSession?.id) {
    try {
      const updated = await fetchJSON(`${API_BASE}/results/test-sessions/${currentTestSession.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions_json: generatedQuestions.map((q) => serializeGeneratedQuestion(q)),
          question_count: generatedQuestions.length,
          duration_minutes: testConfig.durationMinutes,
        }),
      });

      hydrateCurrentTestSession(updated);
    } catch (error) {
      console.error("Test session save error:", error);
    }
  }

  renderTestSettingsPanel();
  renderTestBlock(false);
  renderQuestionModal(false);
}

function renderTestBlock(showQrInline = false) {
  const material = getSelectedMaterial();
  renderTestSettingsPanel();

  if (!material) {
    testInfoText.textContent = "";
    qrImageInline.style.display = "none";
    setOpenTestDirectDisabled(true);
    showQrBtn.disabled = true;
    updateActionButtonsState();
    return;
  }

  const isLecture = material.type === "lecture";

  if (!isLecture) {
    testInfoText.textContent = t("testLectureOnly");
    qrImageInline.style.display = "none";
    setOpenTestDirectDisabled(true);
    showQrBtn.disabled = true;
    updateActionButtonsState();
    return;
  }

  if (!generatedQuestions.length) {
    testInfoText.textContent = "";
    qrImageInline.style.display = "none";
    setOpenTestDirectDisabled(true);
    showQrBtn.disabled = true;
    updateActionButtonsState();
    return;
  }

  const publicUrl = getCurrentTestLaunchUrl();
  testInfoText.textContent = selectedRole === "kaz"
    ? `Тест дайын · ${generatedQuestions.length} сұрақ · ${testConfig.durationMinutes} мин`
    : `Тест готов · ${generatedQuestions.length} вопросов · ${testConfig.durationMinutes} мин`;

  if (!publicUrl) {
    qrImageInline.style.display = "none";
    setOpenTestDirectDisabled(true);
    showQrBtn.disabled = true;
    updateActionButtonsState();
    return;
  }

  if (showQrInline) {
    qrImageInline.src = buildInlineQrUrl(publicUrl);
    qrImageInline.style.display = "block";
  } else {
    qrImageInline.style.display = "none";
  }

  setOpenTestDirectDisabled(false);
  showQrBtn.disabled = false;

  updateActionButtonsState();
}

async function renderResultsBlock() {
  const material = getSelectedMaterial();
  let latestSession = null;

  resultsSheetFrame.src = "about:blank";
  resultsSheetFrame.srcdoc = "";

  if (!material) {
    resultsInfoText.textContent = "";
    openResultsSheetBtn.disabled = !(currentTestSession?.results_sheet_url);
    downloadResultsBtn.disabled = !(currentTestSession?.results_sheet_url);
    updateActionButtonsState();
    return;
  }

  resultsInfoText.textContent = t("resultsLoading");
  openResultsSheetBtn.disabled = true;
  downloadResultsBtn.disabled = true;
  updateActionButtonsState();

  try {
    latestSession = await getLatestSessionForSelectedMaterial();

    if (!latestSession) {
      resultsInfoText.textContent = "";
      openResultsSheetBtn.disabled = true;
      downloadResultsBtn.disabled = true;
      updateActionButtonsState();
      return;
    }

    const data = await fetchJSON(`${API_BASE}/results/test-sessions/${latestSession.id}/responses/`);
    const responses = data.responses || [];
    const sheetUrl = data.results_sheet_url || latestSession.results_sheet_url || "";
    const scoringReady = data.scoring_ready !== false;
    currentTestSession = {
      ...latestSession,
      ...data,
      id: latestSession.id
    };

    if (!responses.length) {
      resultsInfoText.textContent = "";
      resultsSheetFrame.srcdoc = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h3>${t("resultsEmptyTitle")}</h3>
            <p>${t("resultsEmptyText")}</p>
          </body>
        </html>
      `;
      openResultsSheetBtn.disabled = !sheetUrl;
      downloadResultsBtn.disabled = !sheetUrl;
      updateActionButtonsState();
      return;
    }

    resultsInfoText.textContent = "";
    resultsSheetFrame.src = "about:blank";
    resultsSheetFrame.srcdoc = buildResultsSummaryDoc(data.title, responses, { scoringReady });

    openResultsSheetBtn.disabled = !sheetUrl;
    downloadResultsBtn.disabled = !sheetUrl;
    updateActionButtonsState();
  } catch (error) {
    console.error("RESULTS LOAD ERROR:", error);
    const fallbackSheetUrl =
      latestSession?.results_sheet_url ||
      currentTestSession?.results_sheet_url ||
      "";

    if (fallbackSheetUrl) {
      resultsInfoText.textContent = "";
      resultsSheetFrame.src = "about:blank";
      resultsSheetFrame.srcdoc = `
        <html>
          <body style="margin:0;padding:28px;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
            <div style="padding:24px;border-radius:24px;background:#ffffff;border:1px solid #dbe3f0;">
              <h3 style="margin:0 0 12px;font-size:24px;">${escapeHtml(t("results"))}</h3>
              <p style="margin:0;color:#64748b;line-height:1.6;">${escapeHtml(error?.message || t("resultsLoadError"))}</p>
            </div>
          </body>
        </html>
      `;
      openResultsSheetBtn.disabled = false;
      downloadResultsBtn.disabled = false;
      updateActionButtonsState();
      return;
    }

    resultsInfoText.textContent = "";
    resultsSheetFrame.src = "about:blank";
    resultsSheetFrame.srcdoc = "";
    openResultsSheetBtn.disabled = !(currentTestSession?.results_sheet_url);
    downloadResultsBtn.disabled = !(currentTestSession?.results_sheet_url);
    updateActionButtonsState();
  }
}

async function syncResultsSheetSession() {
  const latestSession = await getLatestSessionForSelectedMaterial();
  const sessionId = latestSession?.id;
  const sheetUrl = latestSession?.results_sheet_url || "";

  if (!sessionId || !sheetUrl) {
    return { latestSession, sheetUrl };
  }

  try {
    const syncData = await fetchJSON(`${API_BASE}/results/test-sessions/${sessionId}/responses/`);
    currentTestSession = {
      ...latestSession,
      ...syncData,
      id: sessionId
    };
  } catch (error) {
    console.error("RESULTS SHEET SYNC ERROR:", error);
    return {
      latestSession,
      sheetUrl,
      syncError: error
    };
  }

  return {
    latestSession: currentTestSession,
    sheetUrl: currentTestSession.results_sheet_url || sheetUrl
  };
}

async function openResultsSheetDirect() {
  switchSubjectPanel("results");

  try {
    const { sheetUrl, syncError } = await syncResultsSheetSession();

    if (!sheetUrl) {
      alert(t("resultsSheetUnavailable"));
      return;
    }

    resultsInfoText.textContent = "";
    window.open(sheetUrl, "_blank", "noopener");
    openResultsSheetBtn.disabled = false;
    downloadResultsBtn.disabled = false;
    updateActionButtonsState();
    if (syncError) {
      console.warn("Results sheet opened without sync:", syncError);
    }
  } catch (error) {
    console.error("RESULTS SHEET OPEN ERROR:", error);
    alert(error?.message || t("resultsSyncError"));
  }
}

async function downloadResultsSheet() {
  switchSubjectPanel("results");

  try {
    const { sheetUrl, syncError } = await syncResultsSheetSession();

    if (!sheetUrl) {
      alert(t("resultsSheetUnavailable"));
      return;
    }

    const downloadUrl = buildGoogleSheetDownloadUrl(sheetUrl, "xlsx");
    if (!downloadUrl) {
      alert(t("resultsSheetUnavailable"));
      return;
    }

    window.open(downloadUrl, "_blank", "noopener");
    downloadResultsBtn.disabled = false;
    updateActionButtonsState();
    if (syncError) {
      console.warn("Results download started without sync:", syncError);
    }
  } catch (error) {
    console.error("RESULTS DOWNLOAD ERROR:", error);
    alert(error?.message || t("resultsSyncError"));
  }
}

async function launchCurrentTestSession() {
  if (!currentTestSession?.id) {
    throw new Error(selectedRole === "kaz" ? "Тест сессиясы табылмады." : "Тестовая сессия не найдена.");
  }

  const payload = await fetchJSON(`${API_BASE}/results/test-sessions/${currentTestSession.id}/launch-public/`, {
    method: "POST",
  });

  hydrateCurrentTestSession({
    ...currentTestSession,
    ...payload,
  });
  saveTeacherAppState();
  return currentTestSession;
}

async function closeCurrentTestSessionWindow() {
  if (!currentTestSession?.id) return;

  const payload = await fetchJSON(`${API_BASE}/results/test-sessions/${currentTestSession.id}/close-public/`, {
    method: "POST",
  });

  hydrateCurrentTestSession({
    ...currentTestSession,
    ...payload,
  });
  saveTeacherAppState();
}

async function openTestDirect() {
  if (!generatedQuestions.length) return;

  try {
    await launchCurrentTestSession();
  } catch (error) {
    alert(error?.message || t("formNotReady"));
    return;
  }

  const formUrl = getCurrentTestLaunchUrl();

  if (!formUrl) {
    alert(t("formNotReady"));
    return;
  }

  renderTestBlock(false);
  window.open(formUrl, "_blank");
}

async function showQr() {
  if (!generatedQuestions.length) return;

  try {
    await launchCurrentTestSession();
  } catch (error) {
    alert(error?.message || t("qrNotReady"));
    return;
  }

  const formUrl = getCurrentTestLaunchUrl();

  if (!formUrl) {
    alert(t("qrNotReady"));
    return;
  }

  switchSubjectPanel("test");
  renderTestBlock(true);
}

async function createAiQuestions() {
  const currentMaterial = getSelectedMaterial();

  if (!currentMaterial) {
    alert(t("selectMaterialFirst"));
    return;
  }

  if (currentMaterial.type !== "lecture") {
    alert(t("aiTestLectureOnly"));
    return;
  }

  isTestGenerating = true;
  generateTestBtn.disabled = true;
  testInfoText.textContent = t("generatingAiTest");
  renderTestSettingsPanel();

  try {
    const nextQuestionCount = getCurrentQuestionCount();
    const nextDurationMinutes = getCurrentDurationMinutes();
    testConfig = clampTestConfig(nextQuestionCount, nextDurationMinutes);
    saveStoredTestConfig();

    const response = await fetch(`${API_BASE}/materials/${currentMaterial.id}/generate-test/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        language: selectedRole,
        question_count: testConfig.questionCount,
      })
    });

    if (!response.ok) {
      throw new Error(`AI test request failed: ${response.status}`);
    }

    const data = await response.json();

    generatedQuestions = data.test.map((item, index) => ({
      id: index + 1,
      question: item.question,
      options: Array.isArray(item.options) ? item.options : [],
      answer: resolveQuestionAnswerIndex(item),
      answerRaw: item.answer || "",
    }));

    const sessionResponse = await fetch(`${API_BASE}/results/test-sessions/create-from-ai/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        material_id: currentMaterial.id,
        question_count: testConfig.questionCount,
        duration_minutes: testConfig.durationMinutes,
        questions: generatedQuestions.map((q) => serializeGeneratedQuestion(q))
      })
    });

    if (!sessionResponse.ok) {
      throw new Error(`Test session create failed: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    hydrateCurrentTestSession({
      ...sessionData,
      material: currentMaterial.id,
      questions_json: generatedQuestions.map((q) => serializeGeneratedQuestion(q)),
    });

    renderTestBlock(false);
    switchSubjectPanel("test");
    saveTeacherAppState();
  } catch (error) {
    console.error("AI TEST ERROR:", error);
    testInfoText.textContent = t("aiTestError");
    alert(t("aiTestError"));
  } finally {
    isTestGenerating = false;
    generateTestBtn.disabled = false;
    updateActionButtonsState();
  }
}

function formatCountdown(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const restSeconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(restSeconds).padStart(2, "0")}`;
}

function setPublicTestStatus(message = "", state = "neutral") {
  if (!publicTestStatus) return;
  publicTestStatus.textContent = message;
  publicTestStatus.dataset.state = state;
}

function stopPublicTestTimer() {
  if (publicTestCountdownTimer) {
    clearInterval(publicTestCountdownTimer);
    publicTestCountdownTimer = null;
  }
}

function persistPublicAttemptState() {
  if (!publicTestSessionToken || !publicTestAttempt) return;

  saveStoredPublicAttempt({
    attemptToken: publicTestAttempt.attempt_token,
    studentName: publicTestAttempt.student_name,
    answers: publicTestAnswers,
  }, publicTestSessionToken);
}

function renderPublicTestQuestions() {
  if (!publicTestQuestionList) return;

  const questions = publicTestSession?.questions || [];
  publicTestQuestionList.innerHTML = questions.map((question, qIndex) => `
    <article class="public-test-question-card">
      <div class="public-test-question-top">
        <div class="public-test-question-index">${qIndex + 1}</div>
        <div class="public-test-question-text">${escapeHtml(question.question)}</div>
      </div>

      <div class="public-test-options">
        ${(question.options || []).map((option, oIndex) => `
          <label class="public-test-option">
            <input type="radio" name="public-question-${qIndex}" value="${oIndex}" ${publicTestAnswers[qIndex] === oIndex ? "checked" : ""} />
            <span>${escapeHtml(option)}</span>
          </label>
        `).join("")}
      </div>
    </article>
  `).join("");

  publicTestQuestionList.querySelectorAll("input[type='radio']").forEach((input) => {
    input.addEventListener("change", () => {
      const match = input.name.match(/public-question-(\d+)/);
      if (!match) return;
      const questionIndex = Number(match[1]);
      publicTestAnswers[questionIndex] = Number(input.value);
      persistPublicAttemptState();
    });
  });
}

function renderPublicResultCard(resultAttempt = publicTestAttempt) {
  if (!publicTestResultCard || !resultAttempt) return;

  publicTestResultCard.innerHTML = `
    <h3 style="font-size:24px;line-height:1.2;font-weight:800;color:#fff;">${selectedRole === "kaz" ? "Тест аяқталды" : "Тест завершен"}</h3>
    <p style="font-size:15px;line-height:1.6;color:rgba(226,232,240,0.82);">
      ${selectedRole === "kaz" ? "Нәтижеңіз" : "Ваш результат"}: <strong>${escapeHtml(resultAttempt.score_label || "-")}</strong>
    </p>
  `;
  publicTestResultCard.classList.remove("hidden");
}

function startPublicTestTimer() {
  stopPublicTestTimer();

  if (!publicTestAttempt || publicTestAttempt.status !== "started") {
    publicTestTimer.textContent = "--:--";
    return;
  }

  const updateTimer = () => {
    const remaining = Number(publicTestAttempt.remaining_seconds || 0);
    publicTestTimer.textContent = formatCountdown(remaining);

    if (remaining <= 0) {
      stopPublicTestTimer();
      setPublicTestStatus(selectedRole === "kaz" ? "Тест уақыты аяқталды." : "Время теста истекло.", "error");
      publicTestSubmitBtn.disabled = true;
      publicTestQuestionsWrap.classList.add("hidden");
      publicTestResultCard.classList.remove("hidden");
      publicTestResultCard.innerHTML = `<p style="color:#fff;">${selectedRole === "kaz" ? "Уақыт аяқталды." : "Время вышло."}</p>`;
      clearStoredPublicAttempt(publicTestSessionToken);
      return;
    }

    publicTestAttempt.remaining_seconds = remaining - 1;
  };

  updateTimer();
  publicTestCountdownTimer = setInterval(updateTimer, 1000);
}

function renderPublicTestState() {
  if (!publicTestView) return;

  const session = publicTestSession;
  const attempt = publicTestAttempt;

  publicTestTitle.textContent = session?.title || (selectedRole === "kaz" ? "Тест" : "Тест");
  publicTestCourse.textContent = session?.discipline_title || (selectedRole === "kaz" ? "Тест сессиясы" : "Тестовая сессия");
  publicTestMeta.textContent = session
    ? `${session.material_title} · ${session.question_count} ${selectedRole === "kaz" ? "сұрақ" : "вопросов"} · ${session.duration_minutes} ${selectedRole === "kaz" ? "мин" : "мин"}`
    : "";

  publicTestResultCard.classList.add("hidden");
  publicTestQuestionsWrap.classList.add("hidden");
  publicTestStartCard.classList.remove("hidden");
  publicTestSubmitBtn.disabled = false;

  if (!attempt) {
    publicTestTimer.textContent = session ? formatCountdown(session.duration_minutes * 60) : "--:--";
    setPublicTestStatus(
      selectedRole === "kaz"
        ? "Тестті бастау үшін аты-жөніңізді енгізіңіз."
        : "Введите имя и фамилию, чтобы начать тест.",
      "neutral",
    );
    return;
  }

  if (attempt.status === "submitted") {
    publicTestStartCard.classList.add("hidden");
    renderPublicResultCard(attempt);
    setPublicTestStatus(
      selectedRole === "kaz"
        ? "Бұл тест осы студент үшін бұрын тапсырылған."
        : "Этот тест уже был отправлен этим студентом.",
      "success",
    );
    publicTestTimer.textContent = "00:00";
    persistPublicAttemptState();
    return;
  }

  if (attempt.status === "expired") {
    publicTestStartCard.classList.add("hidden");
    publicTestResultCard.classList.remove("hidden");
    publicTestResultCard.innerHTML = `<p style="color:#fff;">${selectedRole === "kaz" ? "Бұл әрекет уақыты аяқталған." : "Время этой попытки истекло."}</p>`;
    setPublicTestStatus(
      selectedRole === "kaz"
        ? "Уақыт аяқталған соң бұл тестті қайта бастауға болмайды."
        : "После истечения времени повторно начать тест нельзя.",
      "error",
    );
    publicTestTimer.textContent = "00:00";
    clearStoredPublicAttempt(publicTestSessionToken);
    return;
  }

  publicTestStartCard.classList.add("hidden");
  publicTestQuestionsWrap.classList.remove("hidden");
  publicTestStudentNameInput.value = attempt.student_name || "";
  setPublicTestStatus(
    selectedRole === "kaz"
      ? "Тест жүріп жатыр. Уақыт аяқталғанша тапсырып үлгеріңіз."
      : "Тест запущен. Успейте отправить до окончания времени.",
    "info",
  );
  renderPublicTestQuestions();
  startPublicTestTimer();
}

async function loadPublicTestSession() {
  if (!publicTestSessionToken) return;

  const storedAttempt = readStoredPublicAttempt(publicTestSessionToken);
  if (storedAttempt?.attemptToken) {
    publicTestAttemptToken = storedAttempt.attemptToken;
    publicTestAnswers = Array.isArray(storedAttempt.answers) ? storedAttempt.answers : [];
  }

  const query = publicTestAttemptToken ? `?attempt_token=${publicTestAttemptToken}` : "";
  const sessionPayload = await fetchJSON(`${API_BASE}/results/public-test/${publicTestSessionToken}/${query}`);
  publicTestSession = sessionPayload;
  publicTestAttempt = sessionPayload.attempt || null;

  if (publicTestSession?.language && ["kaz", "rus"].includes(publicTestSession.language)) {
    selectedRole = publicTestSession.language;
    applyStaticTranslations();
  }

  if (!publicTestAttempt && storedAttempt?.studentName) {
    publicTestStudentNameInput.value = storedAttempt.studentName;
  }

  if (publicTestAttempt?.attempt_token) {
    publicTestAttemptToken = publicTestAttempt.attempt_token;
  }

  renderPublicTestState();
}

async function startPublicTest() {
  if (!publicTestSessionToken) return;

  const studentName = publicTestStudentNameInput.value.trim();
  if (!studentName) {
    setPublicTestStatus(
      selectedRole === "kaz" ? "Аты-жөніңізді енгізіңіз." : "Введите имя и фамилию.",
      "error",
    );
    publicTestStudentNameInput.focus();
    return;
  }

  publicTestStartBtn.disabled = true;
  setPublicTestStatus(selectedRole === "kaz" ? "Тест ашылып жатыр..." : "Тест открывается...", "info");

  try {
    const payload = await fetchJSON(`${API_BASE}/results/public-test/${publicTestSessionToken}/start/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_name: studentName,
        attempt_token: publicTestAttemptToken || undefined,
      }),
    });

    publicTestSession = payload.session;
    publicTestAttempt = payload.attempt;
    publicTestAttemptToken = publicTestAttempt?.attempt_token || "";
    publicTestAnswers = new Array(publicTestSession?.questions?.length || 0).fill(null);
    persistPublicAttemptState();
    renderPublicTestState();
  } catch (error) {
    console.error("Public test start error:", error);
    const payload = error.payload || {};
    if (payload.attempt) {
      publicTestSession = payload.session || publicTestSession;
      publicTestAttempt = payload.attempt;
      publicTestAttemptToken = publicTestAttempt?.attempt_token || "";
      publicTestAnswers = Array.isArray(publicTestAttempt?.answers)
        ? publicTestAttempt.answers.map(item => item.selected_option_index ?? null)
        : publicTestAnswers;
      persistPublicAttemptState();
      renderPublicTestState();
      return;
    }

    setPublicTestStatus(error.message || (selectedRole === "kaz" ? "Тестті бастау мүмкін болмады." : "Не удалось начать тест."), "error");
  } finally {
    publicTestStartBtn.disabled = false;
  }
}

async function submitPublicTest() {
  if (!publicTestSessionToken || !publicTestAttemptToken) return;

  publicTestSubmitBtn.disabled = true;
  setPublicTestStatus(selectedRole === "kaz" ? "Жауаптар жіберіліп жатыр..." : "Ответы отправляются...", "info");

  try {
    const payload = await fetchJSON(`${API_BASE}/results/public-test/${publicTestSessionToken}/submit/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attempt_token: publicTestAttemptToken,
        answers: publicTestAnswers,
      }),
    });

    publicTestSession = payload.session;
    publicTestAttempt = payload.attempt;
    publicTestAttemptToken = publicTestAttempt?.attempt_token || "";
    persistPublicAttemptState();
    renderPublicTestState();
  } catch (error) {
    console.error("Public test submit error:", error);
    setPublicTestStatus(error.message || (selectedRole === "kaz" ? "Тестті тапсыру мүмкін болмады." : "Не удалось отправить тест."), "error");
  } finally {
    publicTestSubmitBtn.disabled = false;
  }
}

async function initPublicTestMode() {
  if (!publicTestSessionToken || !publicTestView) return false;

  document.body.classList.add("public-test-mode");
  publicTestView.classList.remove("hidden");

  try {
    await loadPublicTestSession();
  } catch (error) {
    console.error("Public test init error:", error);
    setPublicTestStatus(selectedRole === "kaz" ? "Тест сессиясын ашу мүмкін болмады." : "Не удалось открыть тестовую сессию.", "error");
  }

  return true;
}

function getProjectedTeacherCloseClock(durationMinutes, session = currentTestSession) {
  if (!session?.public_started_at) {
    return selectedRole === "kaz" ? "Тест басталған соң көрінеді" : "Появится после запуска теста";
  }

  const startedAtMs = new Date(session.public_started_at).getTime();
  if (Number.isNaN(startedAtMs)) {
    return selectedRole === "kaz" ? "Уақыт есептелмеді" : "Время не определено";
  }

  const projected = new Date(startedAtMs + Number(durationMinutes || 0) * 60 * 1000);
  return formatTeacherClock(projected.toISOString()) || (selectedRole === "kaz" ? "Уақыт есептелмеді" : "Время не определено");
}

function renderTestModalSummary(editMode = false) {
  if (!testModalSummary) return;

  const info = getTeacherTestInfoState(currentTestSession);
  const durationValue = Number(currentTestSession?.duration_minutes) || testConfig.durationMinutes;
  const closeClock = getProjectedTeacherCloseClock(durationValue, currentTestSession);
  const statusLabel = info.label || (selectedRole === "kaz" ? "Тест дайын" : "Тест готов");
  const questionCountLabel = selectedRole === "kaz" ? "Сұрақ саны" : "Количество вопросов";
  const durationLabel = selectedRole === "kaz" ? "Белсенді уақыт" : "Активное время";
  const closeLabel = selectedRole === "kaz" ? "Жабылу уақыты" : "Время закрытия";
  const statusTitle = selectedRole === "kaz" ? "Тест параметрлері" : "Параметры теста";
  const closeHint = editMode && String(currentTestSession?.session_status || "").toLowerCase() === "live"
    ? `<div class="test-modal-summary-note">${selectedRole === "kaz" ? "Уақытты сақтағаннан кейін жабылу мезгілі автоматты түрде жаңарады." : "После сохранения время закрытия обновится автоматически."}</div>`
    : "";

  testModalSummary.innerHTML = `
    <div class="test-modal-summary-title">${statusTitle}</div>
    <div class="test-modal-summary-grid">
      <div class="test-modal-summary-field">
        <span>${selectedRole === "kaz" ? "Күйі" : "Статус"}</span>
        <strong>${escapeHtml(statusLabel)}</strong>
      </div>
      <div class="test-modal-summary-field">
        <span>${questionCountLabel}</span>
        <strong>${generatedQuestions.length}</strong>
      </div>
      <div class="test-modal-summary-field">
        <span>${durationLabel}</span>
        ${
          editMode
            ? `<input id="testModalDurationInput" class="edit-input test-modal-summary-input" type="number" min="5" max="180" value="${durationValue}" />`
            : `<strong>${durationValue} ${selectedRole === "kaz" ? "мин" : "мин"}</strong>`
        }
      </div>
      <div class="test-modal-summary-field">
        <span>${closeLabel}</span>
        <strong id="testModalCloseTimeValue">${escapeHtml(closeClock)}</strong>
      </div>
    </div>
    ${closeHint}
  `;

  if (editMode) {
    const modalDurationInput = document.getElementById("testModalDurationInput");
    if (modalDurationInput) {
      modalDurationInput.addEventListener("input", () => {
        const nextConfig = clampTestConfig(generatedQuestions.length || testConfig.questionCount, modalDurationInput.value);
        const closeValue = document.getElementById("testModalCloseTimeValue");

        modalDurationInput.value = String(nextConfig.durationMinutes);
        if (closeValue) {
          closeValue.textContent = getProjectedTeacherCloseClock(nextConfig.durationMinutes, currentTestSession);
        }
      });
    }
  }
}

function renderQuestionModal(editMode = false) {
  isEditingTest = editMode;
  testModalTitle.textContent = editMode ? t("testModalEdit") : t("testModalView");
  editTestBtn.classList.toggle("hidden", editMode);
  saveTestBtn.classList.toggle("hidden", !editMode);

  renderTestModalSummary(editMode);
  testQuestionsContainer.innerHTML = "";

  generatedQuestions.forEach((q, qIndex) => {
    const card = document.createElement("div");
    card.className = "question-edit-card";

    if (editMode) {
      card.innerHTML = `
        <h4>${t("questionLabel", { number: qIndex + 1 })}</h4>
        <textarea class="edit-textarea" data-question-index="${qIndex}">${escapeHtml(q.question)}</textarea>
        ${q.options.map((option, oIndex) => `
          <div class="edit-option-row">
            <div class="edit-letter">${String.fromCharCode(65 + oIndex)}</div>
            <input class="edit-input" data-question-index="${qIndex}" data-option-index="${oIndex}" value="${escapeHtml(option)}" />
            <label class="correct-radio-wrap">
              <input type="radio" name="correct-${qIndex}" value="${oIndex}" ${q.answer === oIndex ? "checked" : ""} />
            </label>
          </div>
        `).join("")}
      `;
    } else {
      card.innerHTML = `
        <h4>${t("questionLabel", { number: qIndex + 1 })}</h4>
        <div style="color:#17314b;line-height:1.6;margin-bottom:12px;">${escapeHtml(q.question)}</div>
        <div style="display:grid;gap:8px;">
          ${q.options.map((option, oIndex) => `
            <div style="
              min-height:44px;
              border-radius:12px;
              border:1px solid ${q.answer === oIndex ? "rgba(0,93,176,0.22)" : "rgba(0,93,176,0.14)"};
              background:${q.answer === oIndex ? "rgba(0,93,176,0.12)" : "#f5f8fc"};
              color:${q.answer === oIndex ? "#0f5d9b" : "#17314b"};
              display:flex;
              align-items:center;
              gap:10px;
              padding:10px 12px;
              font-size:14px;
              font-weight:600;
            ">
              <div style="
                width:26px;height:26px;border-radius:50%;
                background:${q.answer === oIndex ? "rgba(0,93,176,0.18)" : "rgba(0,93,176,0.10)"};
                display:flex;align-items:center;justify-content:center;
                font-size:11px;font-weight:800;flex-shrink:0;
              ">${String.fromCharCode(65 + oIndex)}</div>
              <div>${escapeHtml(option)}</div>
            </div>
          `).join("")}
        </div>
      `;
    }

    testQuestionsContainer.appendChild(card);
  });
}

function normalizeVoiceText(text) {
  if (!text) return "";

  return text
    .toLowerCase()
    .trim()
    .replace(/[!?.,;:]/g, "")
    .replace(/\s+/g, " ");
}

function detectAssistantReplyLanguage(text) {
  const rawText = String(text || "").toLowerCase();
  const normalized = normalizeVoiceText(text);
  const kazakhCharMatch = /[әіңғүұқөһі]/i.test(rawText);
  const kazakhHints = [
    "сәлем",
    "көмек",
    "қалай",
    "қайда",
    "неге",
    "материалдарды",
    "нәтижелерді",
    "тестті",
    "слайдтарды",
    "аш",
  ];
  const russianHints = [
    "привет",
    "здравствуй",
    "как",
    "где",
    "почему",
    "открой",
    "материалы",
    "результаты",
    "тест",
    "слайды",
  ];

  let kazakhScore = kazakhCharMatch ? 2 : 0;
  let russianScore = 0;

  kazakhScore += kazakhHints.filter(item => normalized.includes(item)).length;
  russianScore += russianHints.filter(item => normalized.includes(item)).length;

  if (kazakhScore > russianScore && kazakhScore > 0) {
    return "kaz";
  }

  if (russianScore > kazakhScore && russianScore > 0) {
    return "rus";
  }

  return selectedRole;
}

function selectLocalizedAssistantReply(language, kazakhText, russianText) {
  return language === "rus" ? russianText : kazakhText;
}

function buildLocalAssistantFallback(transcript) {
  const normalized = normalizeVoiceText(transcript);
  if (!normalized) {
    return null;
  }

  const language = detectAssistantReplyLanguage(transcript);
  const hasSystemAction = ["аш", "открой", "покажи", "жаса", "создай", "generate", "баста", "start"].some(item => normalized.includes(item));
  const isGreeting = ["сәлем", "салам", "салем", "қайырлы күн", "привет", "hello", "hi"].some(item => normalized.includes(item));
  const isThanks = ["рақмет", "рахмет", "спасибо", "thanks", "thank you"].some(item => normalized.includes(item));
  const isWhoAreYou = ["сен кімсің", "өзің кімсің", "кімсің", "кто ты", "who are you"].some(item => normalized.includes(item));
  const isHowAreYou = ["қалайсың", "жағдайың қалай", "халың қалай", "как дела", "how are you"].some(item => normalized.includes(item));
  const asksHow = ["қалай", "қайда", "неге", "what", "how", "where", "как", "где", "почему"].some(item => normalized.includes(item));

  if (isGreeting && !hasSystemAction) {
    return selectLocalizedAssistantReply(
      language,
      "Сәлем! Мен материалдар, тесттер, слайдтар және нәтижелер бойынша көмектесе аламын.",
      "Здравствуйте! Я могу помочь с материалами, тестами, слайдами и результатами.",
    );
  }

  if (isThanks && !hasSystemAction) {
    return selectLocalizedAssistantReply(
      language,
      "Әрқашан көмектесемін.",
      "Всегда рад помочь.",
    );
  }

  if (isWhoAreYou) {
    return selectLocalizedAssistantReply(
      language,
      "Мен осы жүйедегі дауыстық көмекшімін. Қай бөлім керек болса, айтып жіберіңіз.",
      "Я голосовой помощник этой системы. Скажите, какой раздел вам нужен.",
    );
  }

  if (isHowAreYou) {
    return selectLocalizedAssistantReply(
      language,
      "Жақсымын. Сізге қалай көмектесейін?",
      "Все хорошо. Чем помочь?",
    );
  }

  if (asksHow && normalized.includes("тест")) {
    return selectLocalizedAssistantReply(
      language,
      "Тест бөліміне өту үшін «тестті аш» деңіз. Ал жаңа тест керек болса «тест жасап бер» деп айтыңыз.",
      "Чтобы перейти в тесты, скажите «открой тест». Если нужен новый тест, скажите «создай тест».",
    );
  }

  if (asksHow && normalized.includes("материал")) {
    return selectLocalizedAssistantReply(
      language,
      "Материалдарды ашу үшін «материалдарды аш» деп айтыңыз.",
      "Чтобы открыть материалы, скажите «открой материалы».",
    );
  }

  if (asksHow && (normalized.includes("нәтиже") || normalized.includes("результ"))) {
    return selectLocalizedAssistantReply(
      language,
      "Нәтижелерді көру үшін «нәтижелерді аш» деп айтыңыз.",
      "Чтобы посмотреть результаты, скажите «открой результаты».",
    );
  }

  if (asksHow && (normalized.includes("слайд") || normalized.includes("презентац"))) {
    return selectLocalizedAssistantReply(
      language,
      "Слайдтарды ашу үшін «слайдтарды аш» деңіз. Ал жаңасын жасау үшін «слайд жасап бер» деп айтыңыз.",
      "Чтобы открыть слайды, скажите «открой слайды». Чтобы создать новые, скажите «создай слайды».",
    );
  }

  return null;
}

async function sendAudioToAssistant(audioBlob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "voice.webm");

  return fetchJSON(`${API_BASE}/assistant/transcribe/`, {
    method: "POST",
    body: formData
  });
}

async function sendTextToAssistant(text, signal) {
  return fetchJSON(`${API_BASE}/assistant/command/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      context: buildAssistantContext(),
    }),
    signal,
  });
}

function cancelAssistantRequest() {
  if (!assistantCommandAbortController) {
    return;
  }

  assistantCommandAbortController.abort();
  assistantCommandAbortController = null;
}

function beginVoiceDraftSession() {
  if (hasActiveVoiceDraft) {
    return;
  }

  voiceDraftRestoreValue = "";
  hasActiveVoiceDraft = true;
}

function resetVoiceDraftSession() {
  if (!hasActiveVoiceDraft) {
    return;
  }

  if (voiceInput) {
    voiceInput.value = voiceDraftRestoreValue;
  }

  voiceDraftRestoreValue = "";
  hasActiveVoiceDraft = false;
}

function stopVoiceActivityMonitor() {
  if (voiceActivityAnimationFrameId) {
    cancelAnimationFrame(voiceActivityAnimationFrameId);
    voiceActivityAnimationFrameId = 0;
  }

  if (voiceActivityAudioContext) {
    voiceActivityAudioContext.close().catch(() => {});
    voiceActivityAudioContext = null;
  }

  voiceSilenceStartedAt = 0;
  voiceHasDetectedSpeech = false;
}

function stopVoiceRecognitionSilenceTimer() {
  if (!voiceRecognitionSilenceTimerId) {
    return;
  }

  clearTimeout(voiceRecognitionSilenceTimerId);
  voiceRecognitionSilenceTimerId = 0;
}

function resetVoiceRecognitionSession() {
  stopVoiceRecognitionSilenceTimer();
  voiceRecognitionLastTranscript = "";
  voiceRecognitionHasSpeech = false;
}

function scheduleVoiceRecognitionStop() {
  stopVoiceRecognitionSilenceTimer();

  if (!voiceRecognitionHasSpeech) {
    return;
  }

  voiceRecognitionSilenceTimerId = window.setTimeout(() => {
    voiceRecognitionSilenceTimerId = 0;

    if (recognition && isListening && !isVoiceCaptureCancelled) {
      stopVoiceCapture();
    }
  }, VOICE_SILENCE_STOP_MS);
}

async function startVoiceActivityMonitor(stream) {
  stopVoiceActivityMonitor();

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const audioContext = new AudioContextClass();
  voiceActivityAudioContext = audioContext;

  if (audioContext.state === "suspended") {
    try {
      await audioContext.resume();
    } catch (error) {
      console.warn("Voice activity monitor resume failed:", error);
    }
  }

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.15;

  const sourceNode = audioContext.createMediaStreamSource(stream);
  sourceNode.connect(analyser);

  const sampleBuffer = new Uint8Array(analyser.fftSize);

  const tick = () => {
    if (!mediaRecorder || mediaRecorder.state !== "recording") {
      stopVoiceActivityMonitor();
      return;
    }

    analyser.getByteTimeDomainData(sampleBuffer);

    let peak = 0;
    for (let index = 0; index < sampleBuffer.length; index += 1) {
      const normalizedSample = Math.abs((sampleBuffer[index] - 128) / 128);
      if (normalizedSample > peak) {
        peak = normalizedSample;
      }
    }

    if (peak >= VOICE_ACTIVITY_THRESHOLD) {
      voiceHasDetectedSpeech = true;
      voiceSilenceStartedAt = 0;
    } else if (voiceHasDetectedSpeech) {
      if (!voiceSilenceStartedAt) {
        voiceSilenceStartedAt = performance.now();
      } else if (performance.now() - voiceSilenceStartedAt >= VOICE_SILENCE_STOP_MS) {
        stopVoiceCapture();
        return;
      }
    }

    voiceActivityAnimationFrameId = requestAnimationFrame(tick);
  };

  voiceActivityAnimationFrameId = requestAnimationFrame(tick);
}

async function submitVoiceInput(customText, options = {}) {
  const { source = "manual" } = options;
  const message = (customText ?? voiceInput?.value ?? "").trim();

  if (!message) {
    setVoiceState("idle", t("voiceInputEmpty"));
    return;
  }

  if (voiceInput && source !== "voice") {
    voiceInput.value = message;
  }

  if (source === "voice") {
    if (voiceInput) {
      voiceInput.value = "";
    }
    setVoiceState("idle", t("voiceAcknowledged"));
    speakAssistantReply(t("voiceAcknowledged"));
    resetVoiceDraftSession();
  }

  await handleAssistantCommand(message, { source });
}

async function handleAssistantAction(assistantData) {
  if (!assistantData) return;

  const selectionPayload = {
    courseNumber: assistantData.course_number,
    subjectId: assistantData.subject_id,
    materialId: assistantData.material_id,
    materialType: assistantData.material_type,
  };

  if (assistantData.action === "show_help") {
    setVoicePanelOpen(true);
    setVoiceHelpOpen(true);
    return;
  }

  if (assistantData.action === "go_home") {
    showHome();
    return;
  }

  if (assistantData.action === "open_course") {
    if (assistantData.course_number) {
      await openCourseDisciplines(Number(assistantData.course_number), assistantData.subject_id || null);
    }
    return;
  }

  if (assistantData.action === "open_subject") {
    await ensureAssistantSubjectContext(selectionPayload);
    switchSubjectPanel("materials");
    renderMaterialPreview();
    return;
  }

  if ([
    "select_material",
    "open_materials",
    "open_test",
    "open_results",
    "open_slides",
    "generate_test",
    "generate_slides",
    "open_qr",
    "start_test",
  ].includes(assistantData.action)) {
    await syncAssistantMaterialSelection(selectionPayload);
  }

  if (assistantData.action === "select_material") {
    switchSubjectPanel("materials");
    renderMaterialPreview();
    return;
  }

  if (assistantData.action === "open_materials") {
    switchSubjectPanel("materials");
    renderMaterialPreview();
    return;
  }

  if (assistantData.action === "open_test") {
    switchSubjectPanel("test");
    renderTestBlock(false);
    return;
  }

  if (assistantData.action === "open_results") {
    switchSubjectPanel("results");
    await renderResultsBlock();
    return;
  }

  if (assistantData.action === "open_slides") {
    switchSubjectPanel("slides");
    renderSlidesPreview();
    return;
  }

  if (assistantData.action === "generate_slides") {
    await generateSlidesForSelectedMaterial();
    return;
  }

  if (assistantData.action === "generate_test") {
    switchSubjectPanel("test");
    await createAiQuestions();
    return;
  }

  if (assistantData.action === "open_course") {
    return;
  }

  if (assistantData.action === "open_qr") {
    switchSubjectPanel("test");
    if (!generatedQuestions.length) {
      await createAiQuestions();
    }
    if (generatedQuestions.length) {
      showQr();
    }
    return;
  }

  if (assistantData.action === "start_test") {
    switchSubjectPanel("test");
    if (!generatedQuestions.length) {
      await createAiQuestions();
    }
    if (generatedQuestions.length) {
      openTestDirect();
    }
    return;
  }

  if (assistantData.action === "go_back") {
    if (!subjectView.classList.contains("hidden")) {
      showHome();
    } else {
      showCourseStage();
    }
    return;
  }
}

function setVoiceState(state, text) {
  voiceCore.classList.remove("listening");
  if (state === "listening") {
    voiceCore.classList.add("listening");
  }

  const normalizedText = ["Дайын", "Готово"].includes(text) ? t("voiceReady") : text;
  voiceStatus.textContent = normalizedText;
}

function sanitizeSpeechText(text) {
  return String(text || "")
    .replace(/["«»]/g, "")
    .replace(/\bQR\b/gi, selectedRole === "kaz" ? "кью ар код" : "ку эр код")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAssistantSpeechReply(assistantData, fallbackText = "") {
  const fallback = sanitizeSpeechText(fallbackText);
  if (!assistantData || selectedRole !== "kaz") {
    return fallback;
  }

  const subjectTitle = sanitizeSpeechText(assistantData.subject_title || "");
  const materialTitle = sanitizeSpeechText(assistantData.material_title || "");
  const courseNumber = Number(assistantData.course_number) || 0;

  const speechMap = {
    show_help: "Түсіндім, көмекті ашып беремін.",
    go_home: "Түсіндім, басты бетке өтемін.",
    go_back: "Түсіндім, артқа қайтарамын.",
    open_materials: "Түсіндім, материалдарды ашып беремін.",
    open_test: "Түсіндім, тест бөлімін ашып беремін.",
    open_results: "Түсіндім, нәтижелерді ашып беремін.",
    open_slides: "Түсіндім, слайдтарды ашып беремін.",
    open_qr: "Түсіндім, кью ар кодты ашып беремін.",
    start_test: "Түсіндім, тестті бастаймын.",
    generate_test: "Түсіндім, тест жасап беремін.",
    generate_slides: "Түсіндім, слайд жасап беремін.",
  };

  if (assistantData.action === "open_course" && courseNumber) {
    return `Түсіндім, ${courseNumber}-курсты ашып беремін.`;
  }

  if (assistantData.action === "open_subject" && subjectTitle) {
    return `Түсіндім, ${subjectTitle} пәнін ашып беремін.`;
  }

  if (assistantData.action === "select_material" && materialTitle) {
    return `Түсіндім, ${materialTitle} материалын ашып беремін.`;
  }

  return speechMap[assistantData.action] || fallback;
}

function speakAssistantReply(text) {
  if (!text || !("speechSynthesis" in window)) {
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(sanitizeSpeechText(text));
  const voices = synth.getVoices();
  let preferredVoice = null;

  if (selectedRole === "kaz") {
    preferredVoice =
      voices.find(v => v.lang === "kk-KZ") ||
      voices.find(v => v.lang?.startsWith("kk")) ||
      voices.find(v => /kazakh|қазақ/i.test(v.name || "")) ||
      null;
  } else {
    preferredVoice =
      voices.find(v => v.lang === "ru-RU") ||
      voices.find(v => v.lang?.startsWith("ru")) ||
      voices.find(v => v.lang === "en-US") ||
      voices[0] ||
      null;
  }

  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang || getSpeechLanguage();
  } else if (selectedRole === "kaz") {
    utterance.lang = "kk-KZ";
  } else {
    utterance.lang = getSpeechLanguage();
  }

  utterance.rate = selectedRole === "kaz" ? 0.92 : 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  synth.speak(utterance);
}

function stopVoiceCapture() {
  isVoiceCaptureCancelled = false;
  stopVoiceRecognitionSilenceTimer();

  if (recognition && isListening) {
    recognition.stop();
    return true;
  }

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    return true;
  }

  return false;
}

function cancelVoiceCapture() {
  isVoiceCaptureCancelled = true;
  stopVoiceRecognitionSilenceTimer();

  if (recognition && isListening) {
    if (typeof recognition.abort === "function") {
      recognition.abort();
    } else {
      recognition.stop();
    }
    return true;
  }

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    return true;
  }

  return false;
}

async function startMediaRecorderCapture() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  recordedChunks = [];
  mediaRecorder = new MediaRecorder(stream);
  voiceSilenceStartedAt = 0;
  voiceHasDetectedSpeech = false;

  mediaRecorder.onstart = () => {
    setVoiceState("listening", t("voiceListening"));
  };

  mediaRecorder.ondataavailable = (eventData) => {
    if (eventData.data.size > 0) {
      recordedChunks.push(eventData.data);
    }
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });

    try {
      if (isVoiceCaptureCancelled) {
        return;
      }

      setVoiceState("idle", t("voiceTranscribing"));
      const data = await sendAudioToAssistant(audioBlob);
      const capturedText = data.text?.trim();

      if (!capturedText) return;

      const mergedText = `${voiceInterimBaseText}${capturedText}`.trim();
      if (voiceInput) {
        voiceInput.value = mergedText;
      }

      setVoiceState("idle", t("voiceLiveCaptured", { text: capturedText }));
      await submitVoiceInput(mergedText, { source: "voice" });
    } catch (error) {
      console.error("TRANSCRIBE ERROR:", error);
      setVoiceState("idle", t("voiceRequestError"));
      speakAssistantReply(t("voiceSorry"));
    } finally {
      stopVoiceActivityMonitor();
      stream.getTracks().forEach(track => track.stop());
      resetVoiceDraftSession();
      voiceInterimBaseText = "";
      isVoiceCaptureCancelled = false;
    }
  };

  mediaRecorder.start();
  await startVoiceActivityMonitor(stream);
}

async function toggleListening(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  setVoicePanelOpen(true);
  setVoiceHelpOpen(false);

  if (stopVoiceCapture()) {
    return;
  }

  beginVoiceDraftSession();
  voiceInterimBaseText = "";
  resetVoiceRecognitionSession();
  if (voiceInput) {
    voiceInput.value = "";
  }

  try {
    if (recognition) {
      try {
        recognition.start();
        return;
      } catch (recognitionError) {
        console.warn("Speech recognition start failed, falling back to recorder:", recognitionError);
      }
    }

    await startMediaRecorderCapture();
  } catch (error) {
    console.error("MIC ACCESS ERROR:", error);
    setVoiceState("idle", t("micDenied"));
    resetVoiceDraftSession();
    voiceInterimBaseText = "";
  }
}

async function handleAssistantCommand(transcript, options = {}) {
  const { source = "manual" } = options;
  const cleanTranscript = String(transcript || "").trim();
  if (!cleanTranscript) {
    setVoiceState("idle", t("voiceInputEmpty"));
    return;
  }

  const localReply = buildLocalAssistantFallback(cleanTranscript);
  if (localReply) {
    setVoiceState("idle", localReply);
    speakAssistantReply(localReply);
    return;
  }

  cancelAssistantRequest();
  const abortController = new AbortController();
  assistantCommandAbortController = abortController;

  try {
    if (source !== "voice") {
      setVoiceState("idle", t("voiceUnderstood", { text: cleanTranscript }));
    }

    const data = await sendTextToAssistant(cleanTranscript, abortController.signal);
    const spokenReply = buildAssistantSpeechReply(data, data.reply || "");
    const visibleReply = data.reply || spokenReply;

    if (visibleReply) {
      setVoiceState("idle", visibleReply);
    }

    if (spokenReply) {
      speakAssistantReply(spokenReply);
    }

    await handleAssistantAction(data);
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }

    console.error("Assistant command error:", error);
    const detailedReply = String(error?.message || "").trim();
    const visibleReply =
      detailedReply && !/^Request failed:/i.test(detailedReply)
        ? detailedReply
        : t("voiceRequestError");
    const spokenReply =
      detailedReply && !/^Request failed:/i.test(detailedReply)
        ? detailedReply
        : t("voiceSorry");

    setVoiceState("idle", visibleReply);
    speakAssistantReply(spokenReply);
  } finally {
    if (assistantCommandAbortController === abortController) {
      assistantCommandAbortController = null;
    }
  }
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setVoiceState("idle", t("voiceUnavailable"));
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = getSpeechLanguage();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    resetVoiceRecognitionSession();
    setVoiceState("listening", t("voiceListening"));
  };

  recognition.onerror = (event) => {
    isListening = false;
    stopVoiceRecognitionSilenceTimer();
    if (isVoiceCaptureCancelled) {
      setVoiceState("idle", t("voiceReady"));
      resetVoiceDraftSession();
      resetVoiceRecognitionSession();
      isVoiceCaptureCancelled = false;
      return;
    }
    setVoiceState("idle", t("errorLabel", { error: event.error }));
  };

  recognition.onend = async () => {
    isListening = false;
    voiceCore.classList.remove("listening");
    const completeTranscript = String(voiceRecognitionLastTranscript || "").trim();
    const shouldSubmitTranscript = !isVoiceCaptureCancelled && completeTranscript;
    resetVoiceRecognitionSession();
    voiceInterimBaseText = "";

    if (shouldSubmitTranscript) {
      try {
        setVoiceState("idle", t("voiceLiveCaptured", { text: completeTranscript }));
        await submitVoiceInput(completeTranscript, { source: "voice" });
      } finally {
        isVoiceCaptureCancelled = false;
      }
      return;
    }

    if (!voiceStatus.textContent || voiceStatus.textContent === t("voiceListening")) {
      setVoiceState("idle", t("voiceReady"));
    }
    resetVoiceDraftSession();
    isVoiceCaptureCancelled = false;
  };

  recognition.onresult = (event) => {
    if (isVoiceCaptureCancelled) {
      return;
    }

    let finalParts = [];
    let interimParts = [];

    for (let index = 0; index < event.results.length; index += 1) {
      const result = event.results[index];
      const transcriptPart = (result[0]?.transcript || "").trim();

      if (!transcriptPart) {
        continue;
      }

      if (result.isFinal) {
        finalParts.push(transcriptPart);
      } else {
        interimParts.push(transcriptPart);
      }
    }

    const finalTranscript = finalParts.join(" ").trim();
    const interimTranscript = interimParts.join(" ").trim();
    const draftTranscript = [voiceInterimBaseText, finalTranscript, interimTranscript]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (!draftTranscript) {
      return;
    }

    voiceRecognitionLastTranscript = draftTranscript;
    voiceRecognitionHasSpeech = true;

    if (voiceInput) {
      voiceInput.value = draftTranscript;
    }

    setVoiceState("listening", draftTranscript);
    scheduleVoiceRecognitionStop();
  };
}

if (profileBtn) {
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("show");
  });
}

if (authOpenBtn) {
  authOpenBtn.addEventListener("click", () => {
    openAuthModal();
  });
}

if (authGoogleBtn) {
  authGoogleBtn.addEventListener("click", async () => {
    if (isAuthSubmitting) return;
    isAuthSubmitting = true;
    renderAuthState();
    await connectGoogleDrive();
    isAuthSubmitting = false;
    renderAuthState();
  });
}

document.getElementById("editProfileBtn").addEventListener("click", () => {
  profileDropdown.classList.remove("show");
  openModal(profileModal);
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await disconnectGoogleDrive();
});

if (roleTitleBtn) {
  roleTitleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    roleMenu.classList.toggle("hidden");
  });
}

roleMenuItems.forEach(btn => {
  btn.addEventListener("click", async () => {
    selectedRole = btn.dataset.roleValue;
    roleMenu.classList.add("hidden");
    await refreshInterfaceLanguage({ roleChanged: true });
  });
});

if (courseBackBtn) {
  courseBackBtn.addEventListener("click", showCourseStage);
}

if (homeLogoBtn) {
  homeLogoBtn.addEventListener("click", navigateToMainPage);
}

function handleDriveReturnParams() {
  const params = new URLSearchParams(window.location.search);
  const driveStatus = params.get("drive");
  const message = params.get("message");

  if (!driveStatus && !message) {
    return;
  }

  window.history.replaceState({}, "", window.location.pathname);

  if (driveStatus === "error") {
    window.alert(message || t("driveConnectError"));
  }
}

if (addDisciplineBtn) {
  addDisciplineBtn.addEventListener("click", openDisciplineModal);
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    showHome();
  });
}

if (toggleMaterialManagerBtn) {
  toggleMaterialManagerBtn.addEventListener("click", () => {
    if (!selectedCourseNumber) return;
    isMaterialManagerOpen = !isMaterialManagerOpen;
    if (!isMaterialManagerOpen) {
      isUploadMenuOpen = false;
    }
    if (isMaterialManagerOpen) {
      switchSubjectPanel("materials");
      renderMaterialPreview();
    }
    renderMaterialManagerPanel();
  });
}

if (changeCoverBtn) {
  changeCoverBtn.addEventListener("click", async () => {
    if (!isEditingSubjectTitle) {
      startSubjectTitleEdit();
      return;
    }

    await saveSubjectTitleEdit();
  });
}

if (subjectTitleInput) {
  subjectTitleInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await saveSubjectTitleEdit();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelSubjectTitleEdit();
    }
  });
}

if (addInlineDisciplineBtn) {
  addInlineDisciplineBtn.addEventListener("click", () => {
    if (!selectedCourseNumber || isMaterialUploading || isMaterialDeleting) return;
    openDisciplineModal();
  });
}

if (subjectSelect) {
  subjectSelect.addEventListener("change", async () => {
    const nextSubjectId = Number(subjectSelect.value);
    const nextSubject = subjects.find(item => Number(item.id) === nextSubjectId);

    if (!nextSubject || Number(nextSubject.id) === Number(selectedSubject?.id)) {
      return;
    }

    await openSubject(nextSubject);
  });
}

if (materialTypeSelect) {
  materialTypeSelect.addEventListener("change", async () => {
    activeType = materialTypeSelect.value;
    selectedMaterialId = null;
    slidesErrorMessage = "";
    populateTopicSelect();
    renderDriveStatus();
    await loadLatestTestSessionForSelectedMaterial();
    clearMaterialPreview();
    renderSlidesPreview();
    renderTestBlock();
    renderResultsBlock();
    saveTeacherAppState();
  });
}

if (uploadMaterialBtn) {
  uploadMaterialBtn.addEventListener("click", async () => {
    if (!selectedSubject || isMaterialUploading) return;

    if (!driveConnection.connected) {
      promptGoogleLogin();
      return;
    }

    isUploadMenuOpen = !isUploadMenuOpen;
    renderUploadMenu();
  });
}

if (uploadSingleMaterialBtn) {
  uploadSingleMaterialBtn.addEventListener("click", () => {
    if (!selectedSubject || isMaterialUploading) return;
    isUploadMenuOpen = false;
    renderUploadMenu();
    singleMaterialUploadInput?.click();
  });
}

if (uploadFolderMaterialBtn) {
  uploadFolderMaterialBtn.addEventListener("click", () => {
    if (!selectedSubject || isMaterialUploading) return;
    isUploadMenuOpen = false;
    renderUploadMenu();
    folderMaterialUploadInput?.click();
  });
}

if (deleteMaterialBtn) {
  deleteMaterialBtn.addEventListener("click", async () => {
    if (!selectedSubject || !getSelectedMaterial()) return;
    await deleteSelectedMaterial();
  });
}

if (deleteDisciplineBtn) {
  deleteDisciplineBtn.addEventListener("click", async () => {
    if (!selectedSubject || isMaterialUploading || isMaterialDeleting) return;
    await deleteCurrentSubject();
  });
}

if (singleMaterialUploadInput) {
  singleMaterialUploadInput.addEventListener("change", async (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    await uploadMaterialFiles(files);
    singleMaterialUploadInput.value = "";
  });
}

if (folderMaterialUploadInput) {
  folderMaterialUploadInput.addEventListener("change", async (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    await uploadMaterialFiles(files);
    folderMaterialUploadInput.value = "";
  });
}

if (disciplineTitleInput) {
  disciplineTitleInput.addEventListener("input", () => {
    if (disciplineFormError) disciplineFormError.textContent = "";
    renderDisciplinePreviewCard();
  });

  disciplineTitleInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      createDisciplineFromModal();
    }
  });
}

if (saveDisciplineBtn) {
  saveDisciplineBtn.addEventListener("click", createDisciplineFromModal);
}

if (topicSelect) {
  topicSelect.addEventListener("change", async () => {
    selectedMaterialId = Number(topicSelect.value);
    slidesErrorMessage = "";
    renderDriveStatus();
    await loadLatestTestSessionForSelectedMaterial();
    clearMaterialPreview();
    renderSlidesPreview();
    renderTestBlock();
    renderResultsBlock();
    saveTeacherAppState();
  });
}

if (openMaterialBtn) {
  openMaterialBtn.addEventListener("click", () => {
    isMaterialManagerOpen = false;
    renderMaterialManagerPanel();
    renderMaterialPreview();
    switchSubjectPanel("materials");
  });
}

if (openSlidesBtn) {
  openSlidesBtn.addEventListener("click", async () => {
    isMaterialManagerOpen = false;
    renderMaterialManagerPanel();
    switchSubjectPanel("slides");
    renderSlidesPreview();

    const material = getSelectedMaterial();
    if (!material || material.type !== "lecture" || isSlidesGenerating) {
      return;
    }

    if (material.slidesEmbedUrl || material.slidesUrl) {
      return;
    }

    await generateSlidesForSelectedMaterial();
  });
}

async function generateSlidesForSelectedMaterial() {
  const currentMaterial = getSelectedMaterial();

  switchSubjectPanel("slides");

  if (!currentMaterial) {
    setSlidesStatus(t("slidesSelectPrompt"), "error");
    renderSlidesPreview();
    return;
  }

  if (currentMaterial.type !== "lecture") {
    slidesErrorMessage = "";
    setSlidesStatus(t("slidesLectureOnly"), "error");
    renderSlidesPreview();
    return;
  }

  slidesErrorMessage = "";
  isSlidesGenerating = true;
  updateActionButtonsState();
  renderSlidesPreview();

  try {
    const updatedMaterial = await fetchJSON(`${API_BASE}/materials/${currentMaterial.id}/generate-slides/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        language: selectedRole,
      })
    });

    upsertSelectedSubjectMaterial(updatedMaterial);
    setSlidesStatus(t("slidesReady", { title: updatedMaterial.title || currentMaterial.title }));
    renderSlidesPreview();
    saveTeacherAppState();
  } catch (error) {
    console.error("AI SLIDES ERROR:", error);
    slidesErrorMessage = error?.message || t("slidesError");
  } finally {
    isSlidesGenerating = false;
    updateActionButtonsState();
    renderSlidesPreview();
  }
}

function setTestPanelInfo(message = "", state = "neutral") {
  if (!testInfoText || !testInfoCard) return;

  const options = arguments[2] && typeof arguments[2] === "object" ? arguments[2] : {};
  const stateLabel = String(options.stateLabel || "").trim();
  const metaText = String(options.metaText || message || "").trim();
  const hintText = String(options.hintText || "").trim();
  const actionLabel = String(options.actionLabel || "").trim();
  const hasContent = Boolean(stateLabel || metaText || hintText);

  testInfoCard.classList.toggle("hidden", !hasContent);
  testInfoCard.dataset.state = state || "neutral";

  if (testInfoRow) {
    testInfoRow.classList.toggle("hidden", !hasContent && !actionLabel && previewTestBtn?.classList.contains("hidden"));
  }

  if (testInfoState) {
    testInfoState.textContent = stateLabel;
    testInfoState.classList.toggle("hidden", !stateLabel);
  }

  testInfoText.textContent = metaText;

  if (testInfoHint) {
    testInfoHint.textContent = hintText;
    testInfoHint.classList.toggle("hidden", !hintText);
  }

  if (launchTestBtn) {
    launchTestBtn.textContent = actionLabel;
    launchTestBtn.dataset.state = state || "neutral";
    launchTestBtn.disabled = Boolean(options.actionDisabled);
    launchTestBtn.classList.toggle("hidden", !actionLabel);
  }
}

function setTestQrCaption(title = "", text = "", visible = false) {
  if (!testQrCaption) return;

  const hasContent = Boolean(visible && (title || text));
  testQrCaption.classList.toggle("hidden", !hasContent);

  if (testQrCaptionTitle) {
    testQrCaptionTitle.textContent = title || "";
  }

  if (testQrCaptionText) {
    testQrCaptionText.textContent = text || "";
  }
}

function stopTeacherTestStatusTimer() {
  if (teacherTestStatusTimer) {
    clearInterval(teacherTestStatusTimer);
    teacherTestStatusTimer = null;
  }
}

function syncTeacherTestPanelInfo(session = currentTestSession) {
  if (!generatedQuestions.length) {
    stopTeacherTestStatusTimer();
    setTestPanelInfo("");
    return;
  }

  const info = getTeacherTestInfoState(session);
  setTestPanelInfo("", info.state, {
    stateLabel: info.label,
    metaText: info.meta,
    hintText: info.hint,
    actionLabel: info.actionLabel,
  });
}

function startTeacherTestStatusTimer(session = currentTestSession) {
  stopTeacherTestStatusTimer();

  if (!session || String(session.session_status || "").toLowerCase() !== "live") {
    return;
  }

  syncTeacherTestPanelInfo(session);
  teacherTestStatusTimer = setInterval(() => {
    if (!currentTestSession) {
      stopTeacherTestStatusTimer();
      return;
    }

    const remainingSeconds = getSessionRemainingSeconds(currentTestSession);
    currentTestSession.remaining_seconds = remainingSeconds;

    if (remainingSeconds <= 0) {
      currentTestSession.session_status = "expired";
      syncTeacherTestPanelInfo(currentTestSession);
      stopTeacherTestStatusTimer();
      closeCurrentTestSessionWindow().catch((error) => {
        console.error("Test close sync error:", error);
      });
      return;
    }

    syncTeacherTestPanelInfo(currentTestSession);
  }, 1000);
}

function setTestPaneMode(mode = "settings") {
  const qrMode = mode === "qr";

  if (testQrBoard) {
    testQrBoard.classList.toggle("is-qr-mode", qrMode);
    testQrBoard.classList.toggle("is-settings-mode", !qrMode);
  }

  if (testQrCard) {
    testQrCard.classList.toggle("is-qr-mode", qrMode);
    testQrCard.classList.toggle("is-settings-mode", !qrMode);
  }

  if (testSettingsPanel) {
    testSettingsPanel.classList.toggle("hidden", qrMode);
  }

  if (testQrActions) {
    testQrActions.classList.toggle("hidden", !qrMode);
  }
}

renderTestSettingsPanel = function renderTestSettingsPanelOverride() {
  const material = getSelectedMaterial();
  const isLecture = material?.type === "lecture";

  syncTestConfigInputs();

  if (buildTestBtn) {
    buildTestBtn.disabled = !isLecture || isTestGenerating;
    buildTestBtn.textContent = isTestGenerating
      ? (selectedRole === "kaz" ? "Жасалып жатыр..." : "Создается...")
      : (selectedRole === "kaz" ? "Тест жасау" : "Создать тест");
  }

  if (testQuestionCountInput) {
    testQuestionCountInput.disabled = !isLecture || isTestGenerating;
  }

  if (testDurationInput) {
    testDurationInput.disabled = !isLecture || isTestGenerating;
  }

  if (testSettingsTitle) {
    testSettingsTitle.textContent = "";
  }

  if (testSettingsHint) {
    testSettingsHint.textContent = "";
  }
};

renderTestBlock = function renderTestBlockOverride(showQrInline = false) {
  const material = getSelectedMaterial();
  const qrMode = showQrInline === true;
  renderTestSettingsPanel();
  setTestPaneMode(qrMode ? "qr" : "settings");

  if (!material) {
    setTestPanelInfo("");
    qrImageInline.style.display = "none";
    setOpenTestDirectDisabled(true);
    if (showQrBtn) showQrBtn.disabled = true;
    setTestPaneMode("settings");
    updateActionButtonsState();
    return;
  }

  if (material.type !== "lecture") {
    setTestPanelInfo(t("testLectureOnly"), "error");
    qrImageInline.style.display = "none";
    setOpenTestDirectDisabled(true);
    if (showQrBtn) showQrBtn.disabled = true;
    setTestPaneMode("settings");
    updateActionButtonsState();
    return;
  }

  if (!generatedQuestions.length) {
    setTestPanelInfo("");
    qrImageInline.style.display = "none";
    setOpenTestDirectDisabled(true);
    if (showQrBtn) showQrBtn.disabled = true;
    setTestPaneMode("settings");
    updateActionButtonsState();
    return;
  }

  const publicUrl = getCurrentTestLaunchUrl();

  if (!qrMode) {
    setTestPanelInfo(
      selectedRole === "kaz"
        ? `Тест дайын · ${generatedQuestions.length} сұрақ · ${testConfig.durationMinutes} мин`
        : `Тест готов · ${generatedQuestions.length} вопросов · ${testConfig.durationMinutes} мин`
    );
  } else {
    setTestPanelInfo("");
  }

  if (!publicUrl) {
    qrImageInline.style.display = "none";
    setOpenTestDirectDisabled(true);
    if (showQrBtn) showQrBtn.disabled = true;
    updateActionButtonsState();
    return;
  }

  if (qrMode) {
    qrImageInline.src = buildInlineQrUrl(publicUrl);
    qrImageInline.style.display = "block";
  } else {
    qrImageInline.style.display = "none";
  }

  setOpenTestDirectDisabled(!qrMode);
  if (showQrBtn) showQrBtn.disabled = false;
  setTestPaneMode(qrMode ? "qr" : "settings");
  updateActionButtonsState();
};

createAiQuestions = async function createAiQuestionsOverride() {
  const currentMaterial = getSelectedMaterial();

  switchSubjectPanel("test");
  setTestPaneMode("settings");

  if (!currentMaterial) {
    setTestPanelInfo(t("selectMaterialFirst"), "error");
    renderTestSettingsPanel();
    return;
  }

  if (currentMaterial.type !== "lecture") {
    setTestPanelInfo(t("aiTestLectureOnly"), "error");
    renderTestSettingsPanel();
    return;
  }

  isTestGenerating = true;
  generateTestBtn.disabled = true;
  setTestPanelInfo(t("generatingAiTest"));
  renderTestSettingsPanel();

  try {
    const nextQuestionCount = getCurrentQuestionCount();
    const nextDurationMinutes = getCurrentDurationMinutes();
    testConfig = clampTestConfig(nextQuestionCount, nextDurationMinutes);
    saveStoredTestConfig();

    const data = await fetchJSON(`${API_BASE}/materials/${currentMaterial.id}/generate-test/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        language: selectedRole,
        question_count: testConfig.questionCount,
      })
    });

    generatedQuestions = data.test.map((item, index) => ({
      id: index + 1,
      question: item.question,
      options: Array.isArray(item.options) ? item.options : [],
      answer: resolveQuestionAnswerIndex(item),
      answerRaw: item.answer || "",
    }));

    const sessionData = await fetchJSON(`${API_BASE}/results/test-sessions/create-from-ai/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        material_id: currentMaterial.id,
        question_count: testConfig.questionCount,
        duration_minutes: testConfig.durationMinutes,
        questions: generatedQuestions.map((q) => serializeGeneratedQuestion(q))
      })
    });
    hydrateCurrentTestSession({
      ...sessionData,
      material: currentMaterial.id,
      questions_json: generatedQuestions.map((q) => serializeGeneratedQuestion(q)),
    });

    renderTestBlock(false);
    saveTeacherAppState();
  } catch (error) {
    console.error("AI TEST ERROR:", error);
    setTestPanelInfo(error?.message || t("aiTestError"), "error");
  } finally {
    isTestGenerating = false;
    generateTestBtn.disabled = false;
    updateActionButtonsState();
  }
};

renderTestSettingsPanel = function renderTestSettingsPanelEnhanced() {
  const material = getSelectedMaterial();
  const isLecture = material?.type === "lecture";
  const hasGeneratedTest = generatedQuestions.length > 0;

  syncTestConfigInputs();

  if (buildTestBtn) {
    buildTestBtn.disabled = !isLecture || isTestGenerating;
    buildTestBtn.textContent = isTestGenerating
      ? (selectedRole === "kaz" ? "Жасалып жатыр..." : "Создается...")
      : (selectedRole === "kaz" ? "Тест жасау" : "Создать тест");
  }

  if (previewTestBtn) {
    previewTestBtn.disabled = !isLecture || !hasGeneratedTest || isTestGenerating;
    previewTestBtn.classList.toggle("hidden", !isLecture || !hasGeneratedTest);
  }

  if (testQuestionCountInput) {
    testQuestionCountInput.disabled = !isLecture || isTestGenerating;
  }

  if (testDurationInput) {
    testDurationInput.disabled = !isLecture || isTestGenerating;
  }

  if (testSettingsTitle) {
    testSettingsTitle.textContent = "";
  }

  if (testSettingsHint) {
    if (!isLecture) {
      testSettingsHint.textContent = t("testLectureOnly");
    } else if (hasGeneratedTest) {
      testSettingsHint.textContent = selectedRole === "kaz"
        ? "QR іске қосылғаннан кейін уақыт барлық студентке ортақ жүреді. Алдымен тестті қарап, керек болса өңдеп алыңыз."
        : "После запуска QR время станет общим для всех студентов. Сначала просмотрите тест и при необходимости отредактируйте его.";
    } else {
      testSettingsHint.textContent = selectedRole === "kaz"
        ? "Сұрақ саны мен жалпы уақытты таңдаңыз. Таймер QR ашылған сәттен басталады."
        : "Выберите количество вопросов и общее время. Таймер начнется в момент открытия QR.";
    }
  }
};

renderTestBlock = function renderTestBlockEnhanced(showQrInline = false) {
  const material = getSelectedMaterial();
  const qrMode = showQrInline === true;
  renderTestSettingsPanel();
  setTestPaneMode(qrMode ? "qr" : "settings");

  if (!material) {
    stopTeacherTestStatusTimer();
    setTestPanelInfo("");
    qrImageInline.style.display = "none";
    setTestQrCaption("", "", false);
    setOpenTestDirectDisabled(true);
    if (showQrBtn) showQrBtn.disabled = true;
    setTestPaneMode("settings");
    updateActionButtonsState();
    return;
  }

  if (material.type !== "lecture") {
    stopTeacherTestStatusTimer();
    setTestPanelInfo(t("testLectureOnly"), "error");
    qrImageInline.style.display = "none";
    setTestQrCaption("", "", false);
    setOpenTestDirectDisabled(true);
    if (showQrBtn) showQrBtn.disabled = true;
    setTestPaneMode("settings");
    updateActionButtonsState();
    return;
  }

  if (!generatedQuestions.length) {
    stopTeacherTestStatusTimer();
    setTestPanelInfo("");
    qrImageInline.style.display = "none";
    setTestQrCaption("", "", false);
    setOpenTestDirectDisabled(true);
    if (showQrBtn) showQrBtn.disabled = true;
    setTestPaneMode("settings");
    updateActionButtonsState();
    return;
  }

  const launchUrl = getCurrentTestLaunchUrl();
  const info = getTeacherTestInfoState(currentTestSession);
  const canDisplayQr = qrMode && info.state === "live" && Boolean(launchUrl);
  const canOpenDirect = info.state === "live" && Boolean(launchUrl);

  syncTeacherTestPanelInfo(currentTestSession);

  if (info.state === "live") {
    startTeacherTestStatusTimer(currentTestSession);
  } else {
    stopTeacherTestStatusTimer();
  }

  if (!launchUrl) {
    qrImageInline.style.display = "none";
    setTestQrCaption("", "", false);
    setOpenTestDirectDisabled(true);
    if (showQrBtn) showQrBtn.disabled = true;
    updateActionButtonsState();
    return;
  }

  if (canDisplayQr) {
    qrImageInline.src = buildInlineQrUrl(launchUrl);
    qrImageInline.style.display = "block";
    setTestQrCaption(info.qrTitle, info.qrHint, true);
  } else {
    qrImageInline.style.display = "none";
    setTestQrCaption(info.qrTitle, info.qrHint, qrMode);
  }

  setOpenTestDirectDisabled(!canOpenDirect);
  if (showQrBtn) showQrBtn.disabled = false;
  setTestPaneMode(qrMode ? "qr" : "settings");
  updateActionButtonsState();
};

startPublicTestTimer = function startPublicTestTimerEnhanced() {
  stopPublicTestTimer();

  if (!publicTestSession) {
    publicTestTimer.textContent = "--:--";
    return;
  }

  if (String(publicTestSession.session_status || "").toLowerCase() !== "live") {
    const fallbackSeconds = Number(publicTestSession?.duration_minutes || 0) * 60;
    publicTestTimer.textContent = publicTestSession?.session_status === "expired"
      ? "00:00"
      : (fallbackSeconds ? formatCountdown(fallbackSeconds) : "--:--");
    return;
  }

  const updateTimer = () => {
    const remaining = getSessionRemainingSeconds(publicTestSession);
    publicTestSession.remaining_seconds = remaining;
    publicTestTimer.textContent = formatCountdown(remaining);

    if (remaining <= 0) {
      publicTestSession.session_status = "expired";
      if (publicTestAttempt?.status === "started") {
        publicTestAttempt.status = "expired";
      }
      stopPublicTestTimer();
      renderPublicTestState();
    }
  };

  updateTimer();
  publicTestCountdownTimer = setInterval(updateTimer, 1000);
};

renderPublicTestState = function renderPublicTestStateEnhanced() {
  if (!publicTestView) return;

  const session = publicTestSession;
  const attempt = publicTestAttempt;
  const sessionStatus = String(session?.session_status || "").toLowerCase();
  const remainingSeconds = getSessionRemainingSeconds(session);

  publicTestTitle.textContent = session?.title || (selectedRole === "kaz" ? "Тест" : "Тест");
  publicTestCourse.textContent = session?.discipline_title || (selectedRole === "kaz" ? "Тест сессиясы" : "Тестовая сессия");
  publicTestMeta.textContent = session
    ? `${session.material_title} · ${session.question_count} ${selectedRole === "kaz" ? "сұрақ" : "вопросов"} · ${session.duration_minutes} ${selectedRole === "kaz" ? "мин" : "мин"}`
    : "";

  publicTestResultCard.classList.add("hidden");
  publicTestQuestionsWrap.classList.add("hidden");
  publicTestStartCard.classList.remove("hidden");
  publicTestSubmitBtn.disabled = false;
  publicTestStartBtn.disabled = false;
  startPublicTestTimer();

  if (!attempt) {
    if (sessionStatus === "ready") {
      publicTestStartBtn.disabled = true;
      setPublicTestStatus(
        selectedRole === "kaz"
          ? "Тест әлі іске қосылған жоқ. Оқытушы QR-ды ашқаннан кейін ғана бастай аласыз."
          : "Тест еще не запущен. Начать можно только после того, как преподаватель откроет QR.",
        "info",
      );
      return;
    }

    if (sessionStatus === "expired") {
      publicTestStartBtn.disabled = true;
      publicTestTimer.textContent = "00:00";
      setPublicTestStatus(
        selectedRole === "kaz"
          ? "Тест жабылды. Белгіленген уақыт аяқталды."
          : "Тест закрыт. Отведенное время закончилось.",
        "error",
      );
      return;
    }

    setPublicTestStatus(
      selectedRole === "kaz"
        ? `Тест ашық. Жабылуына ${formatCountdown(remainingSeconds)} қалды.`
        : `Тест открыт. До закрытия осталось ${formatCountdown(remainingSeconds)}.`,
      "info",
    );
    return;
  }

  if (attempt.status === "submitted") {
    publicTestStartCard.classList.add("hidden");
    renderPublicResultCard(attempt);
    setPublicTestStatus(
      selectedRole === "kaz"
        ? "Бұл құрылғы үшін тест бұрын тапсырылған."
        : "Для этого устройства тест уже был отправлен.",
      "success",
    );
    publicTestTimer.textContent = sessionStatus === "live" ? formatCountdown(remainingSeconds) : "00:00";
    persistPublicAttemptState();
    return;
  }

  if (attempt.status === "expired" || sessionStatus === "expired") {
    publicTestStartCard.classList.add("hidden");
    publicTestResultCard.classList.remove("hidden");
    publicTestResultCard.innerHTML = `<p style="color:#fff;">${selectedRole === "kaz" ? "Тест уақыты аяқталды. Енді тапсыру мүмкін емес." : "Время теста истекло. Отправить ответы больше нельзя."}</p>`;
    setPublicTestStatus(
      selectedRole === "kaz"
        ? "Уақыт аяқталды. Бұл құрылғыдан тестке қайта кіруге болмайды."
        : "Время истекло. Повторно войти в тест с этого устройства нельзя.",
      "error",
    );
    publicTestTimer.textContent = "00:00";
    clearStoredPublicAttempt(publicTestSessionToken);
    return;
  }

  publicTestStartCard.classList.add("hidden");
  publicTestQuestionsWrap.classList.remove("hidden");
  publicTestStudentNameInput.value = attempt.student_name || "";
  setPublicTestStatus(
    selectedRole === "kaz"
      ? `Тест жүріп жатыр. Жабылуына ${formatCountdown(remainingSeconds)} қалды.`
      : `Тест запущен. До закрытия осталось ${formatCountdown(remainingSeconds)}.`,
    "info",
  );
  renderPublicTestQuestions();
  startPublicTestTimer();
};

loadPublicTestSession = async function loadPublicTestSessionEnhanced() {
  if (!publicTestSessionToken) return;

  const storedAttempt = readStoredPublicAttempt(publicTestSessionToken);
  if (storedAttempt?.attemptToken) {
    publicTestAttemptToken = storedAttempt.attemptToken;
    publicTestAnswers = Array.isArray(storedAttempt.answers) ? storedAttempt.answers : [];
  }

  const params = new URLSearchParams();
  if (publicTestAttemptToken) {
    params.set("attempt_token", publicTestAttemptToken);
  }
  params.set("device_id", getPublicTestDeviceId());

  const query = params.toString() ? `?${params.toString()}` : "";
  const sessionPayload = await fetchJSON(`${API_BASE}/results/public-test/${publicTestSessionToken}/${query}`);
  publicTestSession = sessionPayload;
  publicTestAttempt = sessionPayload.attempt || null;

  if (publicTestSession?.language && ["kaz", "rus"].includes(publicTestSession.language)) {
    selectedRole = publicTestSession.language;
    applyStaticTranslations();
  }

  if (!publicTestAttempt && storedAttempt?.studentName) {
    publicTestStudentNameInput.value = storedAttempt.studentName;
  }

  if (publicTestAttempt?.attempt_token) {
    publicTestAttemptToken = publicTestAttempt.attempt_token;
  }

  if ((!Array.isArray(publicTestAnswers) || !publicTestAnswers.length) && Array.isArray(publicTestAttempt?.answers)) {
    publicTestAnswers = publicTestAttempt.answers.map(item => item.selected_option_index ?? null);
  }

  renderPublicTestState();
};

startPublicTest = async function startPublicTestEnhanced() {
  if (!publicTestSessionToken) return;

  const studentName = publicTestStudentNameInput.value.trim();
  if (!studentName) {
    setPublicTestStatus(
      selectedRole === "kaz" ? "Аты-жөніңізді енгізіңіз." : "Введите имя и фамилию.",
      "error",
    );
    publicTestStudentNameInput.focus();
    return;
  }

  publicTestStartBtn.disabled = true;
  setPublicTestStatus(selectedRole === "kaz" ? "Тест ашылып жатыр..." : "Тест открывается...", "info");

  try {
    const payload = await fetchJSON(`${API_BASE}/results/public-test/${publicTestSessionToken}/start/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        student_name: studentName,
        attempt_token: publicTestAttemptToken || undefined,
        device_id: getPublicTestDeviceId(),
      }),
    });

    publicTestSession = payload.session;
    publicTestAttempt = payload.attempt;
    publicTestAttemptToken = publicTestAttempt?.attempt_token || "";
    publicTestAnswers = new Array(publicTestSession?.questions?.length || 0).fill(null);
    persistPublicAttemptState();
    renderPublicTestState();
  } catch (error) {
    console.error("Public test start error:", error);
    const payload = error.payload || {};

    if (payload.session) {
      publicTestSession = payload.session;
    }

    if (payload.attempt) {
      publicTestAttempt = payload.attempt;
      publicTestAttemptToken = publicTestAttempt?.attempt_token || "";
      publicTestAnswers = Array.isArray(publicTestAttempt?.answers)
        ? publicTestAttempt.answers.map(item => item.selected_option_index ?? null)
        : publicTestAnswers;
      persistPublicAttemptState();
      renderPublicTestState();
      return;
    }

    renderPublicTestState();
    setPublicTestStatus(
      error.message || (selectedRole === "kaz" ? "Тестті бастау мүмкін болмады." : "Не удалось начать тест."),
      "error",
    );
  } finally {
    publicTestStartBtn.disabled = false;
  }
};

submitPublicTest = async function submitPublicTestEnhanced() {
  if (!publicTestSessionToken || !publicTestAttemptToken) return;

  publicTestSubmitBtn.disabled = true;
  setPublicTestStatus(selectedRole === "kaz" ? "Жауаптар жіберіліп жатыр..." : "Ответы отправляются...", "info");

  try {
    const payload = await fetchJSON(`${API_BASE}/results/public-test/${publicTestSessionToken}/submit/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attempt_token: publicTestAttemptToken,
        answers: publicTestAnswers,
      }),
    });

    publicTestSession = payload.session;
    publicTestAttempt = payload.attempt;
    publicTestAttemptToken = publicTestAttempt?.attempt_token || "";
    persistPublicAttemptState();
    renderPublicTestState();
  } catch (error) {
    console.error("Public test submit error:", error);
    const payload = error.payload || {};

    if (payload.session) {
      publicTestSession = payload.session;
    }

    if (payload.attempt) {
      publicTestAttempt = payload.attempt;
      renderPublicTestState();
      return;
    }

    setPublicTestStatus(
      error.message || (selectedRole === "kaz" ? "Тестті тапсыру мүмкін болмады." : "Не удалось отправить тест."),
      "error",
    );
  } finally {
    publicTestSubmitBtn.disabled = false;
  }
};

if (buildTestBtn) {
  buildTestBtn.addEventListener("click", createAiQuestions);
}

if (previewTestBtn) {
  previewTestBtn.addEventListener("click", () => {
    if (!generatedQuestions.length) return;
    renderQuestionModal(false);
    openModal(testModal);
  });
}

if (launchTestBtn) {
  launchTestBtn.addEventListener("click", () => {
    if (!generatedQuestions.length) return;
    showQr();
  });
}

if (testQuestionCountInput) {
  testQuestionCountInput.addEventListener("input", () => {
    testConfig = clampTestConfig(testQuestionCountInput.value, testConfig.durationMinutes);
    saveStoredTestConfig();
    renderTestSettingsPanel();
  });
}

if (testDurationInput) {
  testDurationInput.addEventListener("input", () => {
    testConfig = clampTestConfig(testConfig.questionCount, testDurationInput.value);
    saveStoredTestConfig();
    renderTestSettingsPanel();
  });
}

if (generateTestBtn) {
  generateTestBtn.addEventListener("click", () => {
    isMaterialManagerOpen = false;
    renderMaterialManagerPanel();
    switchSubjectPanel("test");
    renderTestBlock(false);
  });
}

if (openQrBtn) {
  openQrBtn.addEventListener("click", () => {
    if (!generatedQuestions.length) return;

    isMaterialManagerOpen = false;
    renderMaterialManagerPanel();
    renderTestBlock(true);
    switchSubjectPanel("test");
  });
}

if (openResultsBtn) {
  openResultsBtn.addEventListener("click", async () => {
    isMaterialManagerOpen = false;
    renderMaterialManagerPanel();
    switchSubjectPanel("results");
    await renderResultsBlock();
  });
}

if (openMaterialFullscreenBtn) {
  openMaterialFullscreenBtn.addEventListener("click", openPreviewFullscreen);
}

if (openSlidesFullscreenBtn) {
  openSlidesFullscreenBtn.addEventListener("click", openSlidesPreviewFullscreen);
}

if (downloadSlidesBtn) {
  downloadSlidesBtn.addEventListener("click", downloadCurrentSlides);
}

if (openTestDirectBtn) {
  openTestDirectBtn.addEventListener("click", openTestDirect);
}

if (showQrBtn) {
  showQrBtn.addEventListener("click", showQr);
}

if (openResultsSheetBtn) {
  openResultsSheetBtn.addEventListener("click", openResultsSheetDirect);
}

if (downloadResultsBtn) {
  downloadResultsBtn.addEventListener("click", downloadResultsSheet);
}

if (publicTestStartBtn) {
  publicTestStartBtn.addEventListener("click", startPublicTest);
}

if (publicTestStudentNameInput) {
  publicTestStudentNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      startPublicTest();
    }
  });
}

if (publicTestSubmitBtn) {
  publicTestSubmitBtn.addEventListener("click", submitPublicTest);
}

if (editTestBtn) {
  editTestBtn.addEventListener("click", () => {
    renderQuestionModal(true);
  });
}

if (saveTestBtn) {
  saveTestBtn.addEventListener("click", saveEditedQuestions);
}

if (openVoiceBtn) {
  openVoiceBtn.addEventListener("click", () => {
    const shouldOpen = !voicePanel.classList.contains("show");
    if (!shouldOpen) {
      cancelVoiceCapture();
      cancelAssistantRequest();
    }
    setVoicePanelOpen(shouldOpen);
  });
}

if (closeVoiceBtn) {
  closeVoiceBtn.addEventListener("click", () => {
    cancelVoiceCapture();
    cancelAssistantRequest();
    setVoicePanelOpen(false);
  });
}

if (openVoiceHelpBtn) {
  openVoiceHelpBtn.addEventListener("click", () => {
    setVoiceHelpOpen(!voiceHelpPanel.classList.contains("show"));
  });
}

if (closeVoiceHelpBtn) {
  closeVoiceHelpBtn.addEventListener("click", () => {
    setVoiceHelpOpen(false);
  });
}

if (voiceCore) {
  voiceCore.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleListening(event);
  });
}

if (voiceSendBtn) {
  voiceSendBtn.addEventListener("click", async () => {
    await submitVoiceInput();
  });
}

if (voiceInput) {
  voiceInput.addEventListener("input", () => {
    if (!hasActiveVoiceDraft) {
      lastManualVoiceInputValue = voiceInput.value || "";
    }
  });

  voiceInput.addEventListener("keydown", async (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await submitVoiceInput();
    }
  });
}

if (avatarEditPreview) {
  avatarEditPreview.addEventListener("click", () => {
    avatarFileInput.click();
  });
}

if (avatarFileInput) {
  avatarFileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      profileState.avatarUrl = reader.result;
      persistProfileState();
      renderProfile();
    };
    reader.readAsDataURL(file);
  });
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", saveProfile);
}

document.querySelectorAll("[data-close-modal]").forEach((btn) => {
  btn.addEventListener("click", () => {
    closeModal(document.getElementById(btn.dataset.closeModal));
  });
});

[authModal, profileModal, disciplineModal, testModal, qrModal, playerDetailModal].forEach(modal => {
  if (!modal) return;
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal(modal);
  });
});

document.addEventListener("click", (e) => {
  if (topbarRight && !topbarRight.contains(e.target)) {
    profileDropdown.classList.remove("show");
  }

  if (roleMenu && roleTitleBtn && !roleTitleBtn.contains(e.target) && !roleMenu.contains(e.target)) {
    roleMenu.classList.add("hidden");
  }

  if (openedDisciplineMenuId !== null && !e.target.closest(".class-card-menu-wrap")) {
    openedDisciplineMenuId = null;
    confirmingDisciplineDeleteId = null;
    deletingDisciplineId = null;
    disciplineDeleteError = "";
    renderDisciplineCards();
  }

  if (isUploadMenuOpen && uploadMenuWrap && !uploadMenuWrap.contains(e.target)) {
    isUploadMenuOpen = false;
    renderUploadMenu();
  }

});

async function bootstrapApp() {
  loadStoredTestConfig();
  applyStaticTranslations();
  renderProfile();
  renderAuthState();

  if (await initPublicTestMode()) {
    return;
  }

  handleDriveReturnParams();
  await loadDriveStatus();
  await loadCoursesFromApi();
  initSpeechRecognition();
  setVoiceState("idle", t("voiceReady"));
}

bootstrapApp();

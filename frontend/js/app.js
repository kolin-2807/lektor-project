const LOCAL_API_BASE = "http://127.0.0.1:8000/api";
const runtimeApiBase = window.__APP_CONFIG__?.apiBase?.trim();
const isLocalStaticPreview = ["127.0.0.1:5500", "localhost:5500"].includes(window.location.host);
const API_BASE = runtimeApiBase || (isLocalStaticPreview ? LOCAL_API_BASE : `${window.location.origin}/api`);
const TEST_GENERATION_TIMEOUT_MS = 180000;

const SUPPORTED_ROLES = Object.freeze(["kaz", "rus", "eng"]);
const ROLE_LABELS = Object.freeze({
  kaz: "Оқытушы",
  rus: "Лектор",
  eng: "Lector",
});
const ROLE_LOCALES = Object.freeze({
  kaz: "kk-KZ",
  rus: "ru-RU",
  eng: "en-US",
});
const ROLE_HTML_LANG = Object.freeze({
  kaz: "kk",
  rus: "ru",
  eng: "en",
});
const AUTH_LANGUAGE_LABELS = Object.freeze({
  kaz: "Қазақша",
  rus: "Русский",
  eng: "English",
});
const PORTAL_URL = "https://sso.satbayev.university";
const DEPARTMENT_URLS = Object.freeze({
  kaz: "https://official.satbayev.university/kk/information-telecommunication-technologies/kafedra-informatsionnykh-sistem",
  rus: "https://official.satbayev.university/ru/information-telecommunication-technologies/kafedra-informatsionnykh-sistem",
  eng: "https://official.satbayev.university/en/information-telecommunication-technologies/kafedra-informatsionnykh-sistem",
});
const DEPARTMENT_FOOTER_LABELS = Object.freeze([
  "\"Ақпараттық жүйелер\" кафедрасы",
  "кафедра \"Информационные системы\"",
  "Department of Information Systems",
]);

const DEFAULT_PROFILE_STATE = {
  fullName: "",
  roleLabel: ROLE_LABELS.kaz,
  roleShort: ROLE_LABELS.kaz,
  username: "",
  email: "",
  bio: "",
  avatarUrl: ""
};

const profileState = { ...DEFAULT_PROFILE_STATE };

let subjects = [];
let coursesData = [];
let selectedRole = "kaz";
let selectedCourseNumber = null;

const DEFAULT_PROFILE_BIOS = {
  kaz: "",
  rus: "",
  eng: ""
};

const LEGACY_PROFILE_BIOS = new Set([
  "Ақпараттық қауіпсіздік және бағдарламалау пәндері бойынша оқытушы.",
  "Преподаватель по дисциплинам информационной безопасности и программирования.",
  "Lecturer in information security and programming disciplines."
]);

const UI_TEXT = {
  kaz: {
    profileBioDefault: DEFAULT_PROFILE_BIOS.kaz,
    back: "Артқа",
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
    generateTest: "Жасау",
    testQr: "Жариялау (QR)",
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
    disciplineTitlePlaceholder: "Пән атауын өзгертіңіз",
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
    authModalTitle: "",
    authModalText: [
      {
        lead: true,
        text: "Құрметті ОҚЫТУШЫ сізді “iLector” веб-қосымшасын таңдағаныңыз үшін алғыс білдіреміз !"
      },
      {
        label: "Кіру:",
        text: "Қосымшаға кіру үшін тек Google аккаунттың болуы, егер болмаса тіркелу автоматты түрде Google талаптары бойынша жүреді."
      },
      {
        label: "Мүмкіншілігі:",
        text: "қосымшаға дайын дәріс материалын жүктеу арқылы, сіз автоматты түрде «дауыстық көмекші», «презентация», «тест», «тест нәтижесі» сияқты ыңғайлы әдістерге қол жеткізесіз."
      },
      {
        label: "Артықшылығы:",
        text: "Тест сұрақтарын жариялау QR арқылы. Қолайлы интерфейс. Киберқауіпсіз орта. Ақпараттарыңыз өз Google Drive-та сақталады."
      }
    ],
    authGoogle: "Google арқылы жалғастыру",
    authGooglePending: "Google-ға өту...",
    authModalNote: "sso.satbayev.university\nCopyright © 2026 \"Ақпараттық жүйелер\" кафедрасы",
    authRequiredHome: "Файлдар мен пәндерді көру үшін алдымен Google арқылы кіріңіз.",
    authRequiredDisciplines: "Пәндер мен материалдар кіргеннен кейін ашылады.",
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
    micUnavailable: "Бұл браузер микрофонды қолдамайды.",
    micSecureContext: "Микрофон жұмыс істеуі үшін сайт HTTPS арқылы ашылуы керек.",
    voiceUnavailable: "Дауыстық функция қолжетімсіз",
    errorLabel: ({ error }) => `Қате: ${error}`,
    logoutPlaceholder: "Шығу функциясы.",
    courseLabel: ({ number }) => `${number} курс`
  },

  rus: {
    profileBioDefault: DEFAULT_PROFILE_BIOS.rus,
    back: "Назад",
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
    generateTest: "Создать",
    testQr: "Опубликовать (QR)",
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
    disciplineTitlePlaceholder: "Измените название дисциплины",
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
    authModalTitle: "",
    authModalText: [
      {
        lead: true,
        text: "Уважаемый ЛЕКТОР, благодарим вас за выбор веб-приложения “iLector”!"
      },
      {
        label: "Вход:",
        text: "Для входа в приложение нужен только Google аккаунт. Если его нет, регистрация проходит автоматически по требованиям Google."
      },
      {
        label: "Возможности:",
        text: "загрузив готовый лекционный материал, вы получите доступ к голосовому помощнику, презентации, тесту и результатам теста."
      },
      {
        label: "Преимущества:",
        text: "Публикация тестов через QR. Удобный интерфейс. Кибербезопасная среда. Ваши данные сохраняются в Google Drive."
      }
    ],
    authGoogle: "Продолжить с Google",
    authGooglePending: "Переход в Google...",
    authModalNote: "sso.satbayev.university\nCopyright © 2026 кафедра \"Информационные системы\"",
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
    micUnavailable: "Этот браузер не поддерживает микрофон.",
    micSecureContext: "Для работы микрофона откройте сайт через HTTPS.",
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
  slidesEmptyText: "Дәрісті таңдап, слайд параметрлерін берсеңіз, жүйе дайын презентация жасап береді.",
  slidesLoadingTitle: "Презентация құрастырылып жатыр",
  slidesLoadingText: "AI материалдың мазмұнын жинап, негізгі ойларды слайдтарға бөліп жатыр.",
  slidesOpen: "Слайдты ашу",
  downloadSlides: "Жүктеп алу",
  regenerateSlides: "Қайта жасау",
  updateSlides: "Жаңарту",
  buildSlides: "Презентация дайындау",
  slidesSettingsTitle: "Слайд параметрлері",
  slidesCountLabel: "Слайд саны",
  slidesCountHint: "Дайын презентациядағы жалпы слайд саны",
  slidesCountUnit: "слайд",
  slidesTemplateLabel: "Шаблон",
  slidesTemplateHint: "Презентацияның визуалды стилі",
  slidesTemplateClassic: "Академиялық шаблон",
  slidesTemplateMinimal: "Корпоративтік шаблон",
  slidesTemplateFocus: "Минималистік шаблон",
  slidesReadyMeta: ({ count, subject }) => `${count} слайд · ${subject}`,
  slidesResetting: "Презентация өшіріліп жатыр...",
  slidesResettingTitle: "Презентация жаңартылуға дайындалып жатыр",
  slidesResettingText: "Ескі файл Google Drive-тан өшіріліп, жаңа параметрлерге орын босатылып жатыр.",
  slidesSettingsReady: "Слайд параметрлері ашылды.",
  slidesError: "Слайд жасау кезінде қате шықты.",
  slidesDownloadUnavailable: "Презентацияны жүктеу сілтемесі әлі дайын емес.",
  slidesCountChangeUnavailable: "Дайын презентацияда әзірге тек шаблонды жаңартуға болады. Слайд санын өзгертсеңіз, презентацияны толық қайта жасау керек.",
});

Object.assign(UI_TEXT.rus, {
  slides: "Слайд",
  slidesGenerating: "Презентация создается...",
  slidesReady: ({ title }) => `Презентация готова: ${title}`,
  slidesLectureOnly: "Слайды доступны только для лекционного материала.",
  slidesSelectPrompt: "Выберите лекционный материал для презентации.",
  slidesEmptyTitle: "AI-презентация появится здесь",
  slidesEmptyText: "Выберите лекцию, укажите параметры, и система соберет готовую презентацию.",
  slidesLoadingTitle: "Презентация собирается",
  slidesLoadingText: "AI выделяет ключевые идеи материала и превращает их в слайды.",
  slidesOpen: "Открыть слайды",
  downloadSlides: "Скачать",
  regenerateSlides: "Пересоздать",
  updateSlides: "Обновить",
  buildSlides: "Подготовить презентацию",
  slidesSettingsTitle: "Параметры слайдов",
  slidesCountLabel: "Количество слайдов",
  slidesCountHint: "Общее число слайдов в готовой презентации",
  slidesCountUnit: "слайдов",
  slidesTemplateLabel: "Шаблон",
  slidesTemplateHint: "Визуальный стиль презентации",
  slidesTemplateClassic: "Академический шаблон",
  slidesTemplateMinimal: "Корпоративный шаблон",
  slidesTemplateFocus: "Минималистский шаблон",
  slidesReadyMeta: ({ count, subject }) => `${count} слайдов · ${subject}`,
  slidesResetting: "Презентация удаляется...",
  slidesResettingTitle: "Готовим презентацию к пересозданию",
  slidesResettingText: "Старый файл удаляется из Google Drive, после чего снова откроются параметры.",
  slidesSettingsReady: "Параметры слайдов открыты.",
  slidesError: "Произошла ошибка при создании презентации.",
  slidesDownloadUnavailable: "Ссылка на скачивание презентации пока не готова.",
  slidesCountChangeUnavailable: "Для готовой презентации пока можно обновить только шаблон. Изменение количества слайдов требует полного пересоздания.",
});

Object.assign(UI_TEXT.kaz, {
  homeLogo: "Негізгі бетке өту",
  voiceAssistantLabel: "Ayla",
  voiceHelpLabel: "Жылдам көмек",
  voiceHelpTitle: "Ayla",
  voiceHelpIntro: "Ayla жүйеде тез бағдар беріп, қажетті бөлімдерді ашып береді. Қысқа әрі нақты айтсаңыз, жауаптары да табиғирақ шығады.\n\nМысалы:",
  voiceHelpSteps: [
    "Қай бөлім керек екенін айтыңыз: материал, тест немесе нәтиже.",
    "Бір сұрауда бір ғана әрекет айтқаныңыз дұрыс.",
    "Сұранысты анық айтсаңыз, жауап дәл шығады."
  ],
  voiceInputPlaceholder: "",
  voiceSendLabel: "Жіберу",
  voiceInputEmpty: "Алдымен сұрағыңызды жазыңыз немесе айтыңыз.",
  voiceLiveCaptured: ({ text }) => `Тыңдалды: ${text}`,
  voiceAcknowledged: "Жарайды, қарап шығамын.",
});

Object.assign(UI_TEXT.rus, {
  homeLogo: "Перейти на главную страницу",
  voiceAssistantLabel: "Ayla",
  voiceHelpLabel: "Быстрая помощь",
  voiceHelpTitle: "Ayla",
  voiceHelpIntro: "Ayla помогает быстро ориентироваться в системе и открывать нужные разделы. Чем точнее запрос, тем естественнее и точнее ответ.\n\nНапример:",
  voiceHelpSteps: [
    "Скажите, какой раздел нужен: материал, тест или результат.",
    "Лучше указывать только одно действие в одном запросе.",
    "Чем точнее сформулирован запрос, тем точнее будет ответ."
  ],
  voiceInputPlaceholder: "",
  voiceSendLabel: "Отправить",
  voiceInputEmpty: "Сначала введите запрос или продиктуйте его.",
  voiceLiveCaptured: ({ text }) => `Распознано: ${text}`,
  voiceAcknowledged: "Хорошо, сейчас посмотрю.",
});

UI_TEXT.eng = {
  ...UI_TEXT.rus,
  profileBioDefault: DEFAULT_PROFILE_BIOS.eng,
  back: "Back",
  edit: "Edit",
  save: "Save",
  editProfile: "Edit profile",
  logout: "Log out",
  subjectField: "Subject",
  subjectPlaceholder: "Choose a subject",
  subjectNotFound: "Subject not found",
  subjectSelectFirst: "Choose a subject first.",
  materialType: "Material type",
  topic: "Topic",
  material: "Material",
  generateTest: "Create",
  testQr: "Publish (QR)",
  results: "Results",
  fullscreen: "Fullscreen",
  openTest: "Open test",
  showQr: "Open QR",
  topicPlaceholder: "Choose a topic",
  topicNotFound: "Topic not found",
  coursesLoadError: "Could not load courses.",
  coursesNotFound: "No courses found.",
  disciplinesNotFound: "No subjects found for this course.",
  addDiscipline: "Add subject",
  disciplineModalTitle: "New subject",
  disciplinePreviewTitle: "Card preview",
  disciplineTitleLabel: "Subject name",
  disciplineTitlePlaceholder: "Change the subject name",
  disciplinePreviewUntitled: "New subject",
  disciplineCreate: "Add",
  disciplineCreating: "Adding...",
  disciplineTitleRequired: "Enter the subject name.",
  disciplineCreateError: "Could not add the subject.",
  addInlineDiscipline: "Add subject",
  disciplineMenu: "Subject actions",
  disciplineDelete: "Delete",
  deleteMaterialAction: "Delete material",
  deletingMaterialAction: "Deleting material...",
  deleteDisciplineAction: "Delete subject",
  deleteDisciplineConfirm: ({ title }) => `Delete the subject "${title}" completely?`,
  confirmDelete: "Confirm delete",
  cancel: "Cancel",
  disciplineDeleting: "Deleting...",
  disciplineDeleteError: "Could not delete the subject.",
  disciplineRenameEmpty: "Subject name cannot be empty.",
  disciplineRenameError: "Could not update the subject name.",
  materialsEmpty: "Open a material",
  materialSelectPrompt: "Choose a material.",
  materialDescriptionMissing: "Material description is missing",
  selectMaterialFirst: "Choose a material first.",
  testLectureOnly: "Tests are available only for lecture materials.",
  testReady: ({ count }) => `Test ready · ${count} questions`,
  formNotReady: "The test form link is not ready yet.",
  qrNotReady: "The test form link for QR is not ready yet.",
  qrJoin: "Join the test",
  generatingAiTest: "AI is generating the test...",
  aiTestError: "An error occurred while generating the AI test.",
  aiTestLectureOnly: "Test generation is available only for lecture materials.",
  testModalView: "View test",
  testModalEdit: "Edit test",
  questionLabel: ({ number }) => `Question ${number}`,
  resultsLoading: "Loading test results...",
  noTestSession: "There is no test session for this material yet.",
  noStudentResponses: "There are no student responses yet.",
  resultsEmptyTitle: "No results yet",
  resultsEmptyText: "Students have not taken this test yet.",
  resultsFound: ({ count }) => `Found: ${count} responses`,
  resultsLoadError: "An error occurred while loading results.",
  resultsSheetUnavailable: "The results sheet link is not ready yet.",
  resultsSyncError: "An error occurred while updating results.",
  resultsOpenedHere: "Results opened here.",
  resultsScoringMissing: "This test does not have a saved answer key, so scores and percentages cannot be calculated.",
  resultsScoreUnavailable: "Not calculated",
  resultsRegenerateHint: "Regenerate the test to see exact scores.",
  openResultsSheet: "Open in Google Sheets",
  downloadResults: "Download results",
  nameMissing: "Name is missing",
  answerMissing: "No answer",
  submittedAt: "Submitted at",
  allStudentResponses: "All student responses",
  tableNumber: "#",
  tableName: "Full name",
  tableScore: "Score",
  tableTime: "Time",
  profileModalTitle: "Edit profile",
  qrModalTitle: "Join by QR",
  participantTitle: "Participant",
  username: "Username",
  email: "Email",
  bio: "Bio",
  sheetFrameTitle: "Test results",
  authLogin: "Sign in",
  authModalTitle: "",
  authModalText: [
    {
      lead: true,
      text: "Dear LECTOR, thank you for choosing the “iLector” web application!"
    },
    {
      label: "Sign in:",
      text: "You only need a Google account to enter the application. If you do not have one, registration continues automatically according to Google requirements."
    },
    {
      label: "Features:",
      text: "after uploading a ready lecture material, you get access to the voice assistant, presentation, test, and test results."
    },
    {
      label: "Advantages:",
      text: "Publish test questions with QR. Convenient interface. Cyber-secure environment. Your information is stored in Google Drive."
    }
  ],
  authGoogle: "Continue with Google",
  authGooglePending: "Opening Google...",
  authModalNote: "sso.satbayev.university\nCopyright © 2026 Department of Information Systems",
  authRequiredHome: "Sign in with Google first to view files and subjects.",
  authRequiredDisciplines: "Subjects and materials open after sign-in.",
  authRequiredAction: "Sign in with Google first.",
  uploadMaterial: "Upload material",
  connectDrive: "Connect Google Drive",
  driveConnected: ({ email }) => `Google Drive connected: ${email}`,
  driveNotConnected: "Google Drive is not connected yet.",
  driveNotConfigured: "Google Drive OAuth is not configured yet.",
  driveConnectError: "Could not connect Google Drive.",
  logoutError: "Could not log out.",
  materialUploading: "Uploading material...",
  materialUploadDone: ({ title }) => `"${title}" material uploaded.`,
  materialUploadError: "Could not upload material.",
  voiceReady: "Ready",
  voiceListening: "Listening...",
  voiceUnderstood: ({ text }) => `Understood: ${text}`,
  voiceTranscribing: "Converting voice to text...",
  voiceRequestError: "An error occurred while contacting the voice assistant.",
  voiceSorry: "Sorry, I could not process the request right now.",
  micDenied: "Microphone access was denied.",
  micUnavailable: "This browser does not support microphone input.",
  micSecureContext: "Open the site over HTTPS to use the microphone.",
  voiceUnavailable: "Voice feature is unavailable",
  errorLabel: ({ error }) => `Error: ${error}`,
  logoutPlaceholder: "Logout function.",
  courseLabel: ({ number }) => `${number} course`,
  slides: "Slides",
  slidesGenerating: "Creating slides...",
  slidesReady: ({ title }) => `Presentation ready: ${title}`,
  slidesLectureOnly: "Slides are available only for lecture materials.",
  slidesSelectPrompt: "Choose a lecture material to create slides.",
  slidesEmptyTitle: "AI presentation will appear here",
  slidesEmptyText: "Press the slides button and the system will build a presentation from the lecture material.",
  slidesLoadingTitle: "Building presentation",
  slidesLoadingText: "AI is extracting key ideas and turning them into slides.",
  slidesOpen: "Open slides",
  downloadSlides: "Download",
  regenerateSlides: "Regenerate",
  updateSlides: "Update",
  buildSlides: "Prepare presentation",
  slidesSettingsTitle: "Slide settings",
  slidesCountLabel: "Slide count",
  slidesCountHint: "Total number of slides in the final presentation",
  slidesCountUnit: "slides",
  slidesTemplateLabel: "Template",
  slidesTemplateHint: "Presentation visual style",
  slidesTemplateClassic: "Academic template",
  slidesTemplateMinimal: "Corporate template",
  slidesTemplateFocus: "Minimalist template",
  slidesReadyMeta: ({ count, subject }) => `${count} slides · ${subject}`,
  slidesResetting: "Removing the presentation...",
  slidesResettingTitle: "Preparing to regenerate the presentation",
  slidesResettingText: "The old file is being removed from Google Drive so new settings can be applied.",
  slidesSettingsReady: "Slide settings are open.",
  slidesError: "An error occurred while creating slides.",
  slidesDownloadUnavailable: "The presentation download link is not ready yet.",
  slidesCountChangeUnavailable: "For an existing presentation, only the template can be updated for now. Changing slide count requires a full rebuild.",
  homeLogo: "Go to home page",
  voiceAssistantLabel: "Ayla",
  voiceHelpLabel: "Quick help",
  voiceHelpTitle: "Ayla",
  voiceHelpIntro: "Ayla helps you quickly navigate the system and open the right sections. The more specific your request is, the more accurate the response will be.\n\nFor example:",
  voiceHelpSteps: [
    "Say which section you need: material, test, or results.",
    "It is better to request only one action at a time.",
    "A clear request gives a more accurate response."
  ],
  voiceInputPlaceholder: "",
  voiceSendLabel: "Send",
  voiceInputEmpty: "Enter or dictate your request first.",
  voiceLiveCaptured: ({ text }) => `Captured: ${text}`,
  voiceAcknowledged: "Okay, I will check it now.",
};

const typeOrder = [
  { key: "lecture", label: "Р”У™СЂС–СЃ" },
  { key: "practice", label: "РџСЂР°РєС‚РёРєР°" },
  { key: "lab", label: "Р—РµСЂС‚С…Р°РЅР°" }
];

function isSupportedMaterialType(type) {
  return typeOrder.some(item => item.key === type);
}

const APP_STATE_KEY = "lektor-teacher-state-v1";
const TEST_CONFIG_KEY = "lektor-test-config-v1";
const SLIDES_CONFIG_KEY = "lektor-slides-config-v1";
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
    background: "linear-gradient(135deg, #005db0 0%, #4f95da 52%, #00498c 100%)"
  },
  {
    coverClass: "discipline-cover-3",
    background: "linear-gradient(135deg, #005db0 0%, #7bb5e6 52%, #00498c 100%)"
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
const subjectControlPanel = document.getElementById("subjectControlPanel");
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
const presentationGroupTitle = document.getElementById("presentationGroupTitle");
const testGroupTitle = document.getElementById("testGroupTitle");

const materialPreview = document.getElementById("materialPreview");
const materialFooterType = document.getElementById("materialFooterType");
const materialFooterTitle = document.getElementById("materialFooterTitle");
const slidesPreview = document.getElementById("slidesPreview");
const slidesFooterType = document.getElementById("slidesFooterType");
const slidesFooterTitle = document.getElementById("slidesFooterTitle");
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
const regenerateSlidesBtn = document.getElementById("regenerateSlidesBtn");

const testInfoRow = testPane?.querySelector(".test-info-row");
const testLoadingCard = document.getElementById("testLoadingCard");
const testLoadingTitle = document.getElementById("testLoadingTitle");
const testLoadingText = document.getElementById("testLoadingText");
const testInfoCard = document.getElementById("testInfoCard");
const testInfoState = document.getElementById("testInfoState");
const testInfoText = document.getElementById("testInfoText");
const testInfoTimer = document.getElementById("testInfoTimer");
const testInfoHint = document.getElementById("testInfoHint");
const qrImageInline = document.getElementById("qrImageInline");
const buildTestBtn = document.getElementById("buildTestBtn");
const previewTestBtn = document.getElementById("previewTestBtn");
const launchTestBtn = document.getElementById("launchTestBtn");
const testSettingsPanel = document.getElementById("testSettingsPanel");
const testQuestionCountInput = document.getElementById("testQuestionCountInput");
const testDurationInput = document.getElementById("testDurationInput");
const testQuestionCountLabel = document.getElementById("testQuestionCountLabel");
const testQuestionCountHint = document.getElementById("testQuestionCountHint");
const testQuestionCountUnit = document.getElementById("testQuestionCountUnit");
const testSettingsTitle = document.getElementById("testSettingsTitle");
const testSettingsHint = document.getElementById("testSettingsHint");
const testDurationLabel = document.getElementById("testDurationLabel");
const testDurationHint = document.getElementById("testDurationHint");
const testDurationUnit = document.getElementById("testDurationUnit");
const testQrBoard = testPane?.querySelector(".test-qr-board");
const testQrCard = testPane?.querySelector(".test-qr-card");
const testQrCaption = document.getElementById("testQrCaption");
const testQrCaptionTitle = document.getElementById("testQrCaptionTitle");
const testQrCaptionTimer = document.getElementById("testQrCaptionTimer");
const testQrCaptionText = document.getElementById("testQrCaptionText");

const resultsInfoText = document.getElementById("resultsInfoText") || { textContent: "" };
const resultsSheetFrame = document.getElementById("resultsSheetFrame");
const resultsFooterType = document.getElementById("resultsFooterType");
const resultsFooterTitle = document.getElementById("resultsFooterTitle");
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
const voiceAssistant = document.querySelector(".voice-assistant");
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
const authVoiceSlot = document.getElementById("authVoiceSlot");
const authLanguageSwitch = document.getElementById("authLanguageSwitch");
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

const TEST_SAVE_FEEDBACK_WINDOW_MS = 2200;
const SLIDE_TEMPLATE_IDS = ["ilector-academic", "ilector-minimal", "ilector-focus"];

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
let slidesConfig = {
  slideCount: 7,
  templateId: "ilector-academic",
};
let isTestGenerating = false;
let isSlidesGenerating = false;
let isSlidesResetting = false;
let isSlidesSettingsOpen = false;
let slidesErrorMessage = "";
let appStateRestoreDone = false;
let publicTestSessionToken = new URLSearchParams(window.location.search).get("session");
let publicTestAttemptToken = "";
let publicTestSession = null;
let publicTestAttempt = null;
let publicTestCountdownTimer = null;
let publicTestAnswers = [];
let teacherTestStatusTimer = null;
let visibleTeacherTestSessionId = null;
let teacherTestCardCleanupTimer = null;
let isTeacherTestCardDisintegrating = false;
let testGenerationAbortController = null;
let activeTestGenerationMaterialId = null;
let activeTestGenerationStartedAt = 0;
let activeTestGenerationPreviousSessionId = null;
let testGenerationWatchdogTimer = null;
let testGenerationNotice = "";

let generatedQuestions = [];
let currentTestSession = null;
let isEditingTest = false;
let isSavingTestChanges = false;
let testModalSavedAt = 0;
let testModalSaveFlashTimer = 0;
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
let voiceCaptureMaxTimerId = 0;
let voiceCaptureNoSpeechTimerId = 0;
let voiceRecognitionSilenceTimerId = 0;
let voiceRecognitionLastTranscript = "";
let voiceRecognitionHasSpeech = false;
let voiceRecognitionFallbackPending = false;
let assistantSpeechAudio = null;
let assistantSpeechAudioElement = null;
let assistantSpeechAbortController = null;
let assistantSpeechObjectUrl = "";
let isAssistantSpeechAudioUnlocked = false;

const VOICE_ACTIVITY_THRESHOLD = 0.018;
const VOICE_SILENCE_STOP_MS = 2200;
const VOICE_INITIAL_NO_SPEECH_STOP_MS = 6000;
const VOICE_CAPTURE_MAX_MS = 12000;
const SILENT_AUDIO_DATA_URI = "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgAAAA";
const VOICE_RECORDER_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

function t(key, params = {}) {
  const dictionary = UI_TEXT[selectedRole] || UI_TEXT.kaz;
  const fallback = UI_TEXT.kaz[key];
  const value = dictionary[key] ?? fallback ?? key;
  return typeof value === "function" ? value(params) : value;
}

function roleText(kazText, rusText, engText = rusText) {
  if (selectedRole === "kaz") return kazText;
  if (selectedRole === "eng") return engText;
  return rusText;
}

function getRoleLabel(role = selectedRole) {
  return ROLE_LABELS[role] || ROLE_LABELS.kaz;
}

function isSlidesBusy() {
  return isSlidesGenerating || isSlidesResetting;
}

function getRoleLocale() {
  return ROLE_LOCALES[selectedRole] || ROLE_LOCALES.kaz;
}

function formatCourseLabel(number) {
  return t("courseLabel", { number });
}

function getCourseVisualConfig(courseNumber) {
  const normalizedNumber = Number(courseNumber) || 1;
  const visualMap = {
    1: {
      coverClass: "course-card-cover-1",
    },
    2: {
      coverClass: "course-card-cover-2",
    },
    3: {
      coverClass: "course-card-cover-3",
    },
    4: {
      coverClass: "course-card-cover-4",
    },
  };

  return visualMap[normalizedNumber] || visualMap[1];
}

function buildCourseBookMarkup(courseNumber, { compact = false } = {}) {
  const normalizedNumber = Number(courseNumber) || 1;
  const assetNumber = [1, 2, 3, 4].includes(normalizedNumber) ? normalizedNumber : 1;
  return `
    <div class="course-book course-book-art-${assetNumber}${compact ? " is-compact" : ""}" aria-hidden="true">
      <img class="course-book-image" src="./assets/images/education_icon_${assetNumber}.png?v=20260418-01" alt="" loading="lazy" decoding="async" />
    </div>
  `;
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
  if (!driveConnection.connected) {
    openAuthModal();
    return;
  }

  showHome();
  showCourseStage();
  renderCourseCards();
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
  return getRoleLocale();
}

function renderAuthModalText() {
  if (!authModalText) return;

  const content = t("authModalText");

  if (!Array.isArray(content)) {
    authModalText.textContent = content || "";
    return;
  }

  authModalText.innerHTML = content.map((item) => {
    if (item?.lead) {
      return `<p class="auth-modal-line is-lead">${escapeHtml(item.text || "")}</p>`;
    }

    const label = item?.label ? `<strong>${escapeHtml(item.label)}</strong> ` : "";
    return `<p class="auth-modal-line">${label}${escapeHtml(item?.text || "")}</p>`;
  }).join("");
}

function renderAuthModalFooter() {
  if (!authModalNote) return;

  authModalNote.innerHTML = String(t("authModalNote") || "")
    .split("\n")
    .map(line => renderAuthModalFooterLine(line))
    .join("");
}

function renderAuthModalFooterLine(line) {
  const cleanLine = String(line || "");
  const portalLabel = "sso.satbayev.university";

  if (cleanLine.trim() === portalLabel) {
    return `<span><a href="${PORTAL_URL}" target="_blank" rel="noopener noreferrer">${escapeHtml(portalLabel)}</a></span>`;
  }

  const departmentLabel = DEPARTMENT_FOOTER_LABELS.find(label => cleanLine.includes(label));
  if (departmentLabel) {
    const departmentUrl = DEPARTMENT_URLS[selectedRole] || DEPARTMENT_URLS.kaz;
    const [before, after] = cleanLine.split(departmentLabel);
    return `<span>${escapeHtml(before)}<a href="${departmentUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(departmentLabel)}</a>${escapeHtml(after)}</span>`;
  }

  return `<span>${escapeHtml(cleanLine)}</span>`;
}

function renderAuthLanguageSwitch() {
  if (!authLanguageSwitch) return;

  authLanguageSwitch.innerHTML = SUPPORTED_ROLES.map(role => `
    <option value="${role}" ${role === selectedRole ? "selected" : ""}>
      ${escapeHtml(AUTH_LANGUAGE_LABELS[role] || getRoleLabel(role))}
    </option>
  `).join("");
  authLanguageSwitch.value = selectedRole;
}

function renderAuthModal() {
  renderAuthLanguageSwitch();
  if (authModalTitle) authModalTitle.textContent = t("authModalTitle");
  renderAuthModalText();
  renderAuthModalFooter();

  if (authGoogleBtnText) {
    authGoogleBtnText.textContent = isAuthSubmitting ? t("authGooglePending") : t("authGoogle");
  }
}

function applyRoleProfileState() {
  const hadDefaultBio = Object.values(DEFAULT_PROFILE_BIOS).includes(profileState.bio);
  const roleLabel = getRoleLabel();
  profileState.roleLabel = roleLabel;
  profileState.roleShort = roleLabel;

  if (hadDefaultBio) {
    profileState.bio = t("profileBioDefault");
  }
}

function applyStaticTranslations() {
  document.documentElement.lang = ROLE_HTML_LANG[selectedRole] || ROLE_HTML_LANG.kaz;

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
    btn.textContent = getRoleLabel(btn.dataset.roleValue);
  });

  if (courseBackBtn) courseBackBtn.textContent = t("back");
  if (backBtn) backBtn.textContent = t("back");
  if (changeCoverBtn) changeCoverBtn.textContent = isEditingSubjectTitle ? t("save") : t("edit");
  if (subjectTitleInput) subjectTitleInput.placeholder = t("disciplineTitlePlaceholder");
  if (subjectLabel) subjectLabel.textContent = t("subjectField");
  if (materialTypeLabel) materialTypeLabel.textContent = t("materialType");
  if (topicLabel) topicLabel.textContent = t("topic");
  setActionButtonLabel(openMaterialBtn, t("material"));
  setActionButtonLabel(openSlidesBtn, t("slides"));
  setActionButtonLabel(generateTestBtn, t("generateTest"));
  setActionButtonLabel(openQrBtn, t("testQr"));
  setActionButtonLabel(openResultsBtn, t("results"));
  if (presentationGroupTitle) presentationGroupTitle.textContent = roleText("Презентация", "Презентация", "Presentation");
  if (testGroupTitle) testGroupTitle.textContent = roleText("Тест", "Тест", "Test");
  if (openMaterialFullscreenBtn) openMaterialFullscreenBtn.textContent = t("fullscreen");
  if (openSlidesFullscreenBtn) openSlidesFullscreenBtn.textContent = t("fullscreen");
  if (downloadSlidesBtn) downloadSlidesBtn.textContent = t("downloadSlides");
  if (regenerateSlidesBtn) regenerateSlidesBtn.textContent = t("updateSlides");
  if (openResultsSheetBtn) openResultsSheetBtn.textContent = t("openResultsSheet");
  if (downloadResultsBtn) downloadResultsBtn.textContent = t("downloadResults");
  if (qrCodeLabel) qrCodeLabel.textContent = t("qrJoin");
  if (editProfileBtn) editProfileBtn.textContent = t("editProfile");
  if (logoutBtn) logoutBtn.textContent = t("logout");
  if (authOpenBtn) authOpenBtn.textContent = t("authLogin");
  renderAuthModal();
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
  if (saveTestBtn) saveTestBtn.textContent = getSaveTestButtonText();
  if (previewTestBtn) previewTestBtn.textContent = t("testModalView");
  if (testModalTitle) testModalTitle.textContent = isEditingTest ? t("testModalEdit") : t("testModalView");
  if (resultsSheetFrame) resultsSheetFrame.title = t("sheetFrameTitle");
  if (buildTestBtn) buildTestBtn.textContent = roleText("Тестті дайындау", "Подготовить тест", "Prepare test");
  if (testSettingsTitle) testSettingsTitle.textContent = roleText("Тест параметрлері", "Параметры теста", "Test settings");
  if (testQuestionCountLabel) testQuestionCountLabel.textContent = roleText("Сұрақ саны", "Количество вопросов", "Number of questions");
  if (testQuestionCountHint) testQuestionCountHint.textContent = roleText("Неше сұрақ жасалады", "Сколько вопросов подготовить", "How many questions to prepare");
  if (testQuestionCountUnit) testQuestionCountUnit.textContent = roleText("сұрақ", "вопр.", "questions");
  if (testDurationLabel) testDurationLabel.textContent = roleText("Жауап қабылдау уақыты", "Время приема ответов", "Answer time");
  if (testDurationHint) testDurationHint.textContent = roleText("Уақыт біткенде тест жабылады", "После него тест закроется", "The test closes when time is over");
  if (testDurationUnit) testDurationUnit.textContent = roleText("мин", "мин", "min");
  if (testQuestionCountInput) testQuestionCountInput.placeholder = "5";
  if (testDurationInput) testDurationInput.placeholder = "20";
  if (publicTestNameLabel) publicTestNameLabel.textContent = roleText("Аты-жөніңіз", "Имя и фамилия", "Full name");
  if (publicTestStartBtn) publicTestStartBtn.textContent = roleText("Тестті бастау", "Начать тест", "Start test");
  if (publicTestSubmitBtn) publicTestSubmitBtn.textContent = roleText("Тапсыру", "Отправить", "Submit");
  if (publicTestStudentNameInput) publicTestStudentNameInput.placeholder = roleText("Аты-жөніңізді енгізіңіз", "Введите имя и фамилию", "Enter your full name");
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
    "lecture": "lecture",
    "lesson": "lecture",
    "lection": "lecture",
    "РґУ™СЂС–СЃ": "lecture",

    "practice": "practice",
    "practical": "practice",
    "РїСЂР°РєС‚РёРєР°Р»С‹Т›": "practice",
    "РїСЂР°РєС‚РёРєР°": "practice",

    "lab": "lab",
    "laboratory": "lab",
    "Р·РµСЂС‚С…Р°РЅР°": "lab",
    "Р·РµСЂС‚С…Р°РЅР°Р»С‹Т›": "lab"
  };

  return map[normalized] || normalized || "lecture";
}

function toUploadCategory(type) {
  return isSupportedMaterialType(type) ? type : "lecture";
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

async function fetchAudioBlob(url, options = {}) {
  const requestOptions = { ...options };
  const method = String(requestOptions.method || "GET").toUpperCase();

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
  if (!response.ok) {
    const responseType = response.headers.get("content-type") || "";
    const payload = responseType.includes("application/json")
      ? await response.json()
      : await response.text();
    const detail =
      payload?.detail ||
      payload?.error ||
      `Request failed: ${response.status}`;
    const error = new Error(detail);
    error.payload = payload;
    error.status = response.status;
    throw error;
  }

  return {
    blob: await response.blob(),
    contentType: response.headers.get("content-type") || "audio/mpeg",
    provider: response.headers.get("X-TTS-Provider") || "",
  };
}

function getAiServiceErrorMessage(error, fallbackMessage) {
  const code = String(error?.payload?.code || "").trim().toLowerCase();
  const retryAfter = Number(error?.payload?.retry_after_seconds || 0);
  const hasRetryAfter = Number.isFinite(retryAfter) && retryAfter > 0;
  const waitSeconds = hasRetryAfter ? retryAfter : 30;
  if (code === "gemini_quota_exceeded") {
    return roleText(
      "Gemini квотасы уақытша таусылып тұр. 2-3 минуттан кейін қайта көріңіз, қайталанса API лимитін тексеру керек.",
      "Квота Gemini временно исчерпана. Попробуйте снова через 2-3 минуты; если ошибка повторится, проверьте лимиты API.",
      "Gemini quota is temporarily exhausted. Try again in 2-3 minutes; if it repeats, check the API limits.",
    );
  }

  if (code === "gemini_rate_limited") {
    return roleText(
      `Gemini сұраныс лимитіне жетті. Шамамен ${waitSeconds} секундтан кейін қайта көріңіз.`,
      `Достигнут лимит запросов Gemini. Попробуйте снова примерно через ${waitSeconds} секунд.`,
      `Gemini request limit was reached. Try again in about ${waitSeconds} seconds.`,
    );
  }

  if (code === "gemini_service_busy") {
    return roleText(
      `Gemini сервисі уақытша бос емес. Шамамен ${waitSeconds} секундтан кейін қайта көріңіз.`,
      `Сервис Gemini временно перегружен. Попробуйте снова примерно через ${waitSeconds} секунд.`,
      `Gemini is temporarily busy. Try again in about ${waitSeconds} seconds.`,
    );
  }

  if (code === "gemini_timeout") {
    return roleText(
      `Gemini жауабы кешігіп тұр. Шамамен ${waitSeconds} секундтан кейін қайта көріңіз.`,
      `Ответ Gemini не успел прийти вовремя. Попробуйте снова примерно через ${waitSeconds} секунд.`,
      `Gemini response took too long. Try again in about ${waitSeconds} seconds.`,
    );
  }

  if (code === "gemini_auth_error" || code === "gemini_config_error" || code === "gemini_model_error") {
    return roleText(
      "Gemini баптауы дұрыс емес. Backend-тағы API key мен model параметрлерін тексеру керек.",
      "Настройка Gemini некорректна. Проверьте API key и параметры модели на backend.",
      "Gemini configuration is incorrect. Check the backend API key and model settings.",
    );
  }

  return error?.message || fallbackMessage;
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
  const parsedQuestionCount = Number.parseInt(String(questionCount ?? "").trim(), 10);
  const parsedDurationMinutes = Number.parseInt(String(durationMinutes ?? "").trim(), 10);

  return {
    questionCount: Math.max(3, Math.min(Number.isFinite(parsedQuestionCount) ? parsedQuestionCount : 5, 25)),
    durationMinutes: Math.max(5, Math.min(Number.isFinite(parsedDurationMinutes) ? parsedDurationMinutes : 20, 180)),
  };
}

function clampSlidesConfig(value) {
  const source = typeof value === "object" && value !== null ? value : { slideCount: value };
  const parsedSlideCount = Number.parseInt(String(source.slideCount ?? "").trim(), 10);
  const templateId = SLIDE_TEMPLATE_IDS.includes(source.templateId) ? source.templateId : "ilector-academic";

  return {
    slideCount: Math.max(4, Math.min(Number.isFinite(parsedSlideCount) ? parsedSlideCount : 7, 12)),
    templateId,
  };
}

function getDraftSlidesConfig() {
  const input = document.getElementById("slidesCountInput");
  const selectedTemplate = document.querySelector('input[name="slidesTemplate"]:checked')?.value || slidesConfig.templateId;

  return clampSlidesConfig({
    slideCount: input?.value ?? slidesConfig.slideCount,
    templateId: selectedTemplate,
  });
}

function syncSlidesConfigInput() {
  const input = document.getElementById("slidesCountInput");
  if (input) {
    input.value = String(slidesConfig.slideCount);
  }
}

function commitSlidesConfigFromInput({ persist = true } = {}) {
  slidesConfig = getDraftSlidesConfig();
  syncSlidesConfigInput();
  if (persist) {
    saveStoredSlidesConfig();
  }
  return slidesConfig;
}

function saveStoredSlidesConfig() {
  localStorage.setItem(SLIDES_CONFIG_KEY, JSON.stringify(slidesConfig));
}

function loadStoredSlidesConfig() {
  try {
    const raw = localStorage.getItem(SLIDES_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      slidesConfig = clampSlidesConfig(parsed);
    }
  } catch (error) {
    console.error("Slides config restore error:", error);
    slidesConfig = clampSlidesConfig({ slideCount: 7, templateId: "ilector-academic" });
  }

  syncSlidesConfigInput();
}

function bindSlidesSettingsInput() {
  const slidesCountInput = document.getElementById("slidesCountInput");
  const templateInputs = Array.from(document.querySelectorAll('input[name="slidesTemplate"]'));

  templateInputs.forEach((input) => {
    input.addEventListener("change", () => {
      slidesConfig = getDraftSlidesConfig();
      saveStoredSlidesConfig();
      templateInputs.forEach((item) => {
        item.closest(".slides-template-card")?.classList.toggle("is-selected", item.checked);
      });
    });
  });

  if (!slidesCountInput) return;

  const normalizeValue = (value) => String(value ?? "").replace(/[^\d]/g, "").slice(0, 2);
  let lastCommittedValue = slidesConfig.slideCount;

  const syncValue = (value, { commitInput = false, fallbackValue = lastCommittedValue } = {}) => {
    const rawValue = String(value ?? "").trim();
    const parsedValue = Number.parseInt(rawValue, 10);
    const safeValue = Number.isFinite(parsedValue)
      ? clampSlidesConfig(parsedValue).slideCount
      : clampSlidesConfig(fallbackValue).slideCount;

    if (commitInput || !rawValue) {
      slidesCountInput.value = String(safeValue);
    }

    return safeValue;
  };

  slidesCountInput.addEventListener("input", () => {
    const normalizedValue = normalizeValue(slidesCountInput.value);
    if (slidesCountInput.value !== normalizedValue) {
      slidesCountInput.value = normalizedValue;
    }
  });

  slidesCountInput.addEventListener("focus", () => {
    window.requestAnimationFrame(() => {
      slidesCountInput.select();
    });
  });

  slidesCountInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      lastCommittedValue = syncValue(slidesCountInput.value, { commitInput: true });
      slidesConfig = clampSlidesConfig(lastCommittedValue);
      saveStoredSlidesConfig();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      lastCommittedValue = syncValue(lastCommittedValue, { commitInput: true });
      window.requestAnimationFrame(() => {
        slidesCountInput.select();
      });
      return;
    }

    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;

    event.preventDefault();
    const baseValue = syncValue(slidesCountInput.value, {
      commitInput: false,
      fallbackValue: lastCommittedValue,
    });
    const nextValue = baseValue + (event.key === "ArrowDown" ? -1 : 1);
    lastCommittedValue = syncValue(nextValue, { commitInput: true });
    slidesConfig = clampSlidesConfig(lastCommittedValue);
    saveStoredSlidesConfig();
    window.requestAnimationFrame(() => {
      slidesCountInput.select();
    });
  });

  slidesCountInput.addEventListener("change", () => {
    lastCommittedValue = syncValue(slidesCountInput.value, { commitInput: true });
    slidesConfig = clampSlidesConfig(lastCommittedValue);
    saveStoredSlidesConfig();
  });

  slidesCountInput.addEventListener("blur", () => {
    lastCommittedValue = syncValue(slidesCountInput.value, { commitInput: true });
    slidesConfig = clampSlidesConfig(lastCommittedValue);
    saveStoredSlidesConfig();
  });

  lastCommittedValue = syncValue(slidesConfig.slideCount, { commitInput: true });
}

function getClampedDurationMinutes(durationMinutes, fallback = testConfig.durationMinutes) {
  const rawValue = String(durationMinutes ?? "").trim();
  if (!rawValue) {
    return clampTestConfig(testConfig.questionCount, fallback).durationMinutes;
  }

  return clampTestConfig(testConfig.questionCount, rawValue).durationMinutes;
}

function buildDurationEditorMarkup({
  inputId,
  value,
}) {
  return `
    <div class="test-duration-editor">
      <div class="test-settings-input-shell test-modal-duration-shell">
        <input
          id="${inputId}"
          class="edit-input test-modal-summary-input"
          type="text"
          inputmode="numeric"
          enterkeyhint="done"
          pattern="[0-9]*"
          autocomplete="off"
          spellcheck="false"
          aria-label="${roleText("Тест уақыты минутпен", "Время теста в минутах", "Test duration in minutes")}"
          title="${roleText("Санды теріңіз. Shift + ↑/↓ арқылы 10 минутқа өзгертуге болады.", "Введите число. Shift + ↑/↓ меняет время на 10 минут.", "Type a number. Shift + Up/Down changes it by 10 minutes.")}"
          value="${value}"
        />
        <span class="test-settings-unit">${roleText("мин", "мин", "min")}</span>
      </div>
    </div>
  `;
}

function updateTestModalCloseTimePreview(durationMinutes = testConfig.durationMinutes) {
  const closeValue = document.getElementById("testModalCloseTimeValue");
  if (!closeValue) return;

  closeValue.textContent = getProjectedTeacherCloseClock(durationMinutes, currentTestSession);
}

function bindTestModalDurationEditor(initialDuration) {
  const modalDurationInput = document.getElementById("testModalDurationInput");

  if (!modalDurationInput) return;

  const normalizeEditorValue = (value) => String(value ?? "").replace(/[^\d]/g, "").slice(0, 3);
  let lastCommittedDuration = getClampedDurationMinutes(initialDuration, initialDuration);

  const syncEditorState = (value, { commitInput = false, fallbackDuration = lastCommittedDuration } = {}) => {
    const rawValue = String(value ?? "").trim();
    const parsedDuration = Number.parseInt(rawValue, 10);
    const safeDuration = Number.isFinite(parsedDuration)
      ? Math.max(5, Math.min(parsedDuration, 180))
      : getClampedDurationMinutes(fallbackDuration, fallbackDuration);

    if (commitInput || !rawValue) {
      modalDurationInput.value = String(safeDuration);
    }

    updateTestModalCloseTimePreview(safeDuration);
    return safeDuration;
  };

  modalDurationInput.addEventListener("input", () => {
    const normalizedValue = normalizeEditorValue(modalDurationInput.value);
    if (modalDurationInput.value !== normalizedValue) {
      modalDurationInput.value = normalizedValue;
    }

    if (!normalizedValue) {
      updateTestModalCloseTimePreview(lastCommittedDuration);
      return;
    }

    syncEditorState(normalizedValue, { commitInput: false });
  });

  modalDurationInput.addEventListener("focus", () => {
    window.requestAnimationFrame(() => {
      modalDurationInput.select();
    });
  });

  modalDurationInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      lastCommittedDuration = syncEditorState(modalDurationInput.value, { commitInput: true });
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      lastCommittedDuration = syncEditorState(lastCommittedDuration, { commitInput: true });
      window.requestAnimationFrame(() => {
        modalDurationInput.select();
      });
      return;
    }

    const isArrowStep = event.key === "ArrowUp" || event.key === "ArrowDown";
    const isPageStep = event.key === "PageUp" || event.key === "PageDown";
    if (!isArrowStep && !isPageStep) return;

    event.preventDefault();
    const baseDuration = syncEditorState(modalDurationInput.value, {
      commitInput: false,
      fallbackDuration: lastCommittedDuration,
    });
    const step = isPageStep ? 5 : event.shiftKey ? 10 : 1;
    const direction = event.key === "ArrowDown" || event.key === "PageDown" ? -1 : 1;
    lastCommittedDuration = syncEditorState(baseDuration + direction * step, { commitInput: true });
    window.requestAnimationFrame(() => {
      modalDurationInput.select();
    });
  });

  modalDurationInput.addEventListener("change", () => {
    lastCommittedDuration = syncEditorState(modalDurationInput.value, { commitInput: true });
  });

  modalDurationInput.addEventListener("blur", () => {
    lastCommittedDuration = syncEditorState(modalDurationInput.value, { commitInput: true });
  });

  lastCommittedDuration = syncEditorState(initialDuration, { commitInput: true });
}

function hasRecentTestSaveFeedback() {
  return Date.now() - testModalSavedAt < TEST_SAVE_FEEDBACK_WINDOW_MS;
}

function getSaveTestButtonText() {
  if (isSavingTestChanges) {
    return roleText("Сақталып жатыр...", "Сохраняется...", "Saving...");
  }

  return t("save");
}

function getTestRegenerationFailedMessage(error) {
  const details = getAiServiceErrorMessage(error, t("aiTestError"));
  return roleText(
    `Жаңа тест жасалмады. Ескі тест өзгеріссіз қалды. Себебі: ${details}`,
    `Новый тест не был создан. Старый тест остался без изменений. Причина: ${details}`,
    `A new test was not created. The old test was kept unchanged. Reason: ${details}`,
  );
}

function syncTestModalActionButtons() {
  if (!editTestBtn || !saveTestBtn) return;

  editTestBtn.classList.toggle("hidden", isEditingTest);
  editTestBtn.disabled = isSavingTestChanges;
  saveTestBtn.classList.toggle("hidden", !isEditingTest);
  saveTestBtn.disabled = !isEditingTest || isSavingTestChanges;
  saveTestBtn.classList.toggle("is-saving", isSavingTestChanges);
  saveTestBtn.textContent = getSaveTestButtonText();
}

function flashTestModalSaveFeedback() {
  if (!testModalSummary || !hasRecentTestSaveFeedback()) return;

  if (testModalSaveFlashTimer) {
    clearTimeout(testModalSaveFlashTimer);
  }

  testModalSummary.classList.remove("is-save-flash");
  void testModalSummary.offsetWidth;
  testModalSummary.classList.add("is-save-flash");

  testModalSaveFlashTimer = window.setTimeout(() => {
    testModalSummary?.classList.remove("is-save-flash");
  }, 950);
}

function getDraftTestConfig() {
  return clampTestConfig(testQuestionCountInput?.value, testDurationInput?.value);
}

function getCurrentQuestionCount() {
  return getDraftTestConfig().questionCount;
}

function getCurrentDurationMinutes() {
  return getDraftTestConfig().durationMinutes;
}

function applyAssistantTestConfig(assistantData = {}) {
  const nextConfig = clampTestConfig(
    assistantData.question_count ?? testConfig.questionCount,
    assistantData.duration_minutes ?? testConfig.durationMinutes,
  );
  testConfig = nextConfig;
  syncTestConfigInputs();
  saveStoredTestConfig();
  return nextConfig;
}

function syncTestConfigInputs() {
  if (testQuestionCountInput) testQuestionCountInput.value = String(testConfig.questionCount);
  if (testDurationInput) testDurationInput.value = String(testConfig.durationMinutes);
}

function commitTestConfigFromInputs(options = {}) {
  const { syncInputs = true, persist = true } = options;

  testConfig = getDraftTestConfig();

  if (syncInputs) {
    syncTestConfigInputs();
  }

  if (persist) {
    saveStoredTestConfig();
  }

  return testConfig;
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

function buildPublicTestGateUrl(accessToken) {
  if (!accessToken) return "";
  return `${API_BASE}/results/public-test/${accessToken}/open/`;
}

function setActionButtonLabel(button, label) {
  if (!button) return;

  const labelNode = button.querySelector(".action-btn-label");
  if (labelNode) {
    labelNode.textContent = label || "";
  } else {
    button.textContent = label || "";
  }

  button.setAttribute("aria-label", label || "");
}

function syncSubjectActionButtons() {
  const qrMode = Boolean(testQrBoard?.classList.contains("is-qr-mode"));
  const activeAction = activeSubjectPanel === "test"
    ? (qrMode ? "qr" : "test")
    : activeSubjectPanel;

  [
    [openMaterialBtn, "materials"],
    [openSlidesBtn, "slides"],
    [generateTestBtn, "test"],
    [openQrBtn, "qr"],
    [openResultsBtn, "results"],
  ].forEach(([button, key]) => {
    if (!button) return;
    button.classList.toggle("is-active", activeAction === key);
  });
}

function formatTeacherClock(value) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleTimeString(getRoleLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNormalizedTestSessionStatus(session = currentTestSession) {
  return String(session?.session_status || "").trim().toLowerCase();
}

function shouldShowTeacherTestCard(session = currentTestSession) {
  if (isTestGenerating || !session || !generatedQuestions.length) return false;

  const sessionStatus = getNormalizedTestSessionStatus(session);
  if (!sessionStatus) return false;
  if (sessionStatus === "expired") return isTeacherTestCardDisintegrating;
  if (sessionStatus === "live") return true;

  return Boolean(session?.id) && Number(visibleTeacherTestSessionId) === Number(session.id);
}

function clearTeacherTestCardCleanupTimer() {
  if (!teacherTestCardCleanupTimer) return;
  clearTimeout(teacherTestCardCleanupTimer);
  teacherTestCardCleanupTimer = null;
}

function stopTestGenerationWatchdog() {
  if (!testGenerationWatchdogTimer) {
    return;
  }

  clearInterval(testGenerationWatchdogTimer);
  testGenerationWatchdogTimer = null;
}

function cancelActiveTestGeneration(options = {}) {
  const { keepUiState = false } = options;

  if (testGenerationAbortController) {
    testGenerationAbortController.abort();
    testGenerationAbortController = null;
  }

  activeTestGenerationMaterialId = null;
  activeTestGenerationStartedAt = 0;
  activeTestGenerationPreviousSessionId = null;
  stopTestGenerationWatchdog();

  if (!keepUiState) {
    isTestGenerating = false;
    if (generateTestBtn) {
      generateTestBtn.disabled = false;
    }
  }
}

function startTestGenerationWatchdog(materialId) {
  stopTestGenerationWatchdog();

  if (!materialId) {
    return;
  }

  testGenerationWatchdogTimer = window.setInterval(async () => {
    if (!isTestGenerating || Number(activeTestGenerationMaterialId || 0) !== Number(materialId)) {
      stopTestGenerationWatchdog();
      return;
    }

    try {
      const sessions = await loadTestSessionsForMaterial(materialId);
      const latestSession = sessions.find((session) => {
        if (!session?.id || Number(session.id) === Number(activeTestGenerationPreviousSessionId)) {
          return false;
        }

        const createdAt = new Date(session.created_at || 0).getTime();
        return Number.isNaN(createdAt) || createdAt >= activeTestGenerationStartedAt;
      }) || null;
      const latestStatus = getNormalizedTestSessionStatus(latestSession);

      if (!latestSession || !["ready", "live"].includes(latestStatus)) {
        return;
      }

      hydrateCurrentTestSession(latestSession);
      visibleTeacherTestSessionId = latestSession.id || null;
      isTestGenerating = false;
      stopTestGenerationWatchdog();

      if (Number(getSelectedMaterial()?.id || 0) === Number(materialId)) {
        renderTestSettingsPanel();
        renderTestBlock(Boolean(testQrBoard?.classList.contains("is-qr-mode")));
      }
      updateActionButtonsState();
    } catch (error) {
      console.warn("Test generation watchdog error:", error);
    }
  }, 3000);
}

function finishTeacherTestCardRemoval() {
  clearTeacherTestCardCleanupTimer();
  isTeacherTestCardDisintegrating = false;
  visibleTeacherTestSessionId = null;
  generatedQuestions = [];

  if (testInfoCard) {
    testInfoCard.classList.remove("is-disintegrating");
  }

  renderTestBlock(false);
  updateActionButtonsState();
}

function startTeacherTestCardRemoval() {
  clearTeacherTestCardCleanupTimer();
  isTeacherTestCardDisintegrating = true;
  syncTeacherTestPanelInfo(currentTestSession);

  if (testInfoCard) {
    testInfoCard.classList.add("is-disintegrating");
  }

  teacherTestCardCleanupTimer = window.setTimeout(() => {
    finishTeacherTestCardRemoval();
  }, 900);
}

function updateTestInfoRowVisibility() {
  if (!testInfoRow) return;

  const hasReadyCard = Boolean(testInfoCard && !testInfoCard.classList.contains("hidden"));
  const hasLoadingCard = Boolean(testLoadingCard && !testLoadingCard.classList.contains("hidden"));
  testInfoRow.classList.toggle("hidden", !hasReadyCard && !hasLoadingCard);
}

function getTeacherTestInfoState(session = currentTestSession) {
  const questionCount = generatedQuestions.length || Number(session?.question_count) || testConfig.questionCount;
  const durationMinutes = Number(session?.duration_minutes) || testConfig.durationMinutes;
  const sessionStatus = getNormalizedTestSessionStatus(session);
  const remainingSeconds = getSessionRemainingSeconds(session);
  const meta = roleText(
    `Тест ${questionCount} сұрақтан`,
    `Тест из ${questionCount} вопросов`,
    `Test with ${questionCount} questions`,
  );
  const durationMeta = roleText(
    `${durationMinutes} минут уақыт`,
    `${durationMinutes} минут`,
    `${durationMinutes} minutes`,
  );
  const closeClock = formatTeacherClock(session?.public_expires_at);
  const readyTimerLabel = `${String(Math.max(0, durationMinutes)).padStart(2, "0")}:00`;

  if (sessionStatus === "live" && remainingSeconds > 0) {
    return {
      state: "live",
      label: roleText("Тест жүріп жатыр", "Тест запущен", "Test is running"),
      cardLabel: "TEST",
      meta,
      hint: roleText(
        [durationMeta, closeClock ? `${closeClock}-де жабылады` : ""].filter(Boolean).join("\n"),
        [durationMeta, closeClock ? `Закроется в ${closeClock}` : ""].filter(Boolean).join("\n"),
        [durationMeta, closeClock ? `Closes at ${closeClock}` : ""].filter(Boolean).join("\n"),
      ),
      timerLabel: formatCountdown(remainingSeconds),
      actionLabel: roleText("QR бөлімі", "QR-раздел", "QR section"),
      qrTitle: roleText("QR-ды сканерлеп, тестке өтіңіз", "Сканируйте QR и перейдите к тесту", "Scan the QR code to open the test"),
      qrTimer: roleText(
        `Аяқталуына ${formatCountdown(remainingSeconds)} қалды`,
        `До окончания ${formatCountdown(remainingSeconds)}`,
        `${formatCountdown(remainingSeconds)} left`,
      ),
      qrHint: roleText(
        "Жауаптарды жіберер алдында бәрін бір рет тексеріп алыңыз.",
        "Перед отправкой ответов быстро проверьте их еще раз.",
        "Check your answers before submitting.",
      ),
    };
  }

  if (sessionStatus === "expired") {
    return {
      state: "done",
      label: roleText("Тест жабылды", "Тест закрыт", "Test closed"),
      cardLabel: "TEST",
      meta,
      hint: roleText(
        [durationMeta, closeClock ? `${closeClock}-де жабылды` : "Тест аяқталды"].filter(Boolean).join("\n"),
        [durationMeta, closeClock ? `Закрыт в ${closeClock}` : "Тест завершен"].filter(Boolean).join("\n"),
        [durationMeta, closeClock ? `Closed at ${closeClock}` : "Test completed"].filter(Boolean).join("\n"),
      ),
      timerLabel: "00:00",
      actionLabel: "",
      qrTitle: roleText("Тест аяқталды", "Тест завершен", "Test completed"),
      qrTimer: "",
      qrHint: roleText(
        "Тест уақыты аяқталды. Енді нәтижелерді көруге болады.",
        "Время теста завершено. Теперь можно открыть результаты.",
        "The test time is over. You can now open the results.",
      ),
    };
  }

  return {
    state: "ready",
    label: roleText("Тест дайын", "Тест готов", "Test ready"),
    cardLabel: "TEST",
    meta,
    hint: roleText(
      [durationMeta, closeClock ? `${closeClock}-де жабылады` : ""].filter(Boolean).join("\n"),
      [durationMeta, closeClock ? `Закроется в ${closeClock}` : ""].filter(Boolean).join("\n"),
      [durationMeta, closeClock ? `Closes at ${closeClock}` : ""].filter(Boolean).join("\n"),
    ),
    timerLabel: readyTimerLabel,
    actionLabel: roleText("Тестті іске қосу", "Запустить тест", "Start test"),
    qrTitle: roleText("QR код тест басталғаннан кейін шығады", "QR появится после запуска теста", "The QR code appears after the test starts"),
    qrTimer: "",
    qrHint: roleText(
      "Тест басталған соң студенттер телефонмен сканерлеп, Google Form-ға өтеді.",
      "После запуска студенты сканируют код и переходят к Google Form.",
      "After launch, students scan the code and open the Google Form.",
    ),
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
  const nextBio = normalizeProfileBio(storedProfile.bio);
  const nextAvatarUrl = typeof storedProfile.avatarUrl === "string" ? storedProfile.avatarUrl : "";

  if (nextUsername) {
    profileState.username = nextUsername;
  }

  if (Object.prototype.hasOwnProperty.call(storedProfile, "bio")) {
    profileState.bio = nextBio;
  }

  profileState.avatarUrl = nextAvatarUrl;
  return true;
}

function normalizeProfileBio(value = "") {
  const bio = String(value || "").trim();
  return LEGACY_PROFILE_BIOS.has(bio) ? "" : bio;
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
    const raw = localStorage.getItem(getTeacherAppStateKey()) || localStorage.getItem(APP_STATE_KEY);
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

  const serializedPayload = JSON.stringify(payload);
  localStorage.setItem(getTeacherAppStateKey(), serializedPayload);
  localStorage.setItem(APP_STATE_KEY, serializedPayload);
}

function clearTeacherAppState(email = driveConnection.google_email || profileState.email) {
  localStorage.removeItem(getTeacherAppStateKey(email));
  localStorage.removeItem(APP_STATE_KEY);
}

function getAuthRequiredWorkspaceMessage() {
  return t("authRequiredDisciplines");
}

function shouldShowAuthGate() {
  return !publicTestSessionToken && !driveConnection.connected;
}

function syncVoiceAssistantPlacement(isAuthGateOpen) {
  if (!voiceAssistant) return;

  const target = isAuthGateOpen && authVoiceSlot ? authVoiceSlot : document.body;
  if (voiceAssistant.parentElement !== target) {
    target.appendChild(voiceAssistant);
  }
}

function applyAuthGateState() {
  const isAuthGateOpen = shouldShowAuthGate();
  document.body.classList.toggle("auth-gate-mode", isAuthGateOpen);
  syncVoiceAssistantPlacement(isAuthGateOpen);

  if (isAuthGateOpen) {
    openModal(authModal);
    return;
  }

  closeModal(authModal);
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
  clearTeacherTestCardCleanupTimer();
  isTeacherTestCardDisintegrating = false;
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
  visibleTeacherTestSessionId = null;
  generatedQuestions = [];
  slidesErrorMessage = "";
  isMaterialManagerOpen = false;
  isUploadMenuOpen = false;

  if (subjectSelect) subjectSelect.innerHTML = `<option value="">${t("subjectPlaceholder")}</option>`;
  if (topicSelect) topicSelect.innerHTML = `<option value="">${t("topicPlaceholder")}</option>`;
  setResultsStatus("");
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

  if (driveConnection.connected) {
    renderCourseCards();
  } else if (courseGrid) {
    courseGrid.innerHTML = "";
  }
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
    visibleTeacherTestSessionId = null;
    isTeacherTestCardDisintegrating = false;
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

function buildOptimisticTestSessionSnapshot(session = currentTestSession, overrides = {}) {
  if (!session) {
    return null;
  }

  const nextSession = {
    ...session,
    ...overrides,
  };

  if (nextSession.public_started_at) {
    const startedAtMs = new Date(nextSession.public_started_at).getTime();
    if (!Number.isNaN(startedAtMs)) {
      const durationMs = Number(nextSession.duration_minutes || 0) * 60 * 1000;
      const nextExpiresAt = new Date(startedAtMs + durationMs).toISOString();
      nextSession.public_expires_at = nextExpiresAt;
      nextSession.remaining_seconds = getSessionRemainingSeconds(nextSession);
      nextSession.session_status = nextSession.remaining_seconds > 0 ? "live" : "expired";
    }
  }

  return nextSession;
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
  const files = sortFilesNaturally(Array.from(fileList || []).filter(file => file && file.size >= 0));

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

  const confirmMessage = roleText(
    `"${material.title}" матеріалдар жүктелген құралдар. Жалғастыру үшін керек пе?`,
    `Материал "${material.title}" және оның байланыстырылған тесттер жойылады. Жалғастыру?`,
    `Material "${material.title}" and its linked tests will be deleted. Continue?`,
  );

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
  const sessionStatus = getNormalizedTestSessionStatus(currentTestSession);
  visibleTeacherTestSessionId = ["ready", "live"].includes(sessionStatus) ? currentTestSession?.id || null : null;
  isTeacherTestCardDisintegrating = false;

  if (sessionStatus === "expired") {
    generatedQuestions = [];
  }

  return currentTestSession;
}

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() || "")
    .join("") || "IL";
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
  return "badge-lecture";
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
  if (modal === authModal && shouldShowAuthGate()) {
    return;
  }

  if (modal) modal.classList.remove("show");
}

function saveProfile() {
  profileState.username = profileUsernameInput.value.trim() || profileState.username;
  profileState.bio = normalizeProfileBio(profileBioInput.value);
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
    lecture: roleText("Дәріс", "Лекция", "Lecture"),
    practice: roleText("Практика", "Практика", "Practice"),
    lab: roleText("Зертхана", "Лаборатория", "Lab")
  };

  return labels[type] || t("material");
}

function getDeleteActionLabel() {
  return roleText("Жою", "Удалить", "Delete");
}

function getDeletingActionLabel() {
  return roleText("Жойылып жатыр...", "Удаление...", "Deleting...");
}

function getUploadActionLabel() {
  return roleText("Жүктеу", "Загрузка", "Upload");
}

function getUploadSingleActionLabel() {
  return roleText("Файл", "Файл", "File");
}

function getUploadFolderActionLabel() {
  return roleText("Папка жүктеу", "Загрузить папку", "Upload folder");
}

function getMaterialManagerToggleLabel() {
  if (selectedRole === "kaz") {
    return isMaterialManagerOpen ? "Жүктеуді жабу" : "Материал жүктеу";
  }
  if (selectedRole === "eng") {
    return isMaterialManagerOpen ? "Hide upload" : "Upload material";
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

  subjectControlPanel?.classList.toggle("is-upload-mode", isManagerOpen);

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

  const displayName = profileState.fullName || profileState.username || profileState.email || getRoleLabel();
  const initials = getInitials(displayName);

  dropdownName.textContent = displayName;
  dropdownRole.textContent = profileState.roleShort;
  dropdownEmail.textContent = profileState.email;

  profileModalNameText.textContent = displayName;
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

    profileState.fullName = googleName;
    profileState.email = googleEmail;
    profileState.username = googleEmail ? googleEmail.split("@")[0] || DEFAULT_PROFILE_STATE.username : DEFAULT_PROFILE_STATE.username;

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

  renderAuthModal();

  if (authGoogleBtn) {
    authGoogleBtn.disabled = isAuthSubmitting;
  }

  applyAuthGateState();
}

function openAuthModal() {
  profileDropdown?.classList.remove("show");
  openModal(authModal);
}

function updateBrandRoleLabel() {
  if (!brandRoleTitle) return;
  brandRoleTitle.textContent = getRoleLabel();
}

function renderDisciplinePreviewCard() {
  if (!disciplinePreviewCard) return;

  const previewTitle = disciplineTitleInput?.value.trim() || t("disciplinePreviewUntitled");
  const roleThemeOffset = selectedRole === "rus" ? 2 : selectedRole === "eng" ? 4 : 0;
  const previewTheme = getDisciplineTheme((selectedCourseNumber || 0) + subjects.length + roleThemeOffset);

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
  loadStoredSlidesConfig();

  const savedState = readTeacherAppState();
  if (!savedState) {
    appStateRestoreDone = true;
    return;
  }

  if (savedState.selectedRole && SUPPORTED_ROLES.includes(savedState.selectedRole)) {
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

  if (savedState.activeType && isSupportedMaterialType(savedState.activeType)) {
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
  if (!driveConnection.connected) {
    openAuthModal();
    return;
  }

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
  cancelActiveTestGeneration();
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

  syncSubjectActionButtons();
  saveTeacherAppState();
}

async function loadCoursesFromApi() {
  if (!driveConnection.connected) {
    coursesData = [];
    if (courseGrid) courseGrid.innerHTML = "";
    appStateRestoreDone = true;
    return;
  }

  try {
    coursesData = await fetchJSON(`${API_BASE}/courses/`);
    renderCourseCards();
  } catch (error) {
    console.error("Courses load error:", error);
    courseGrid.innerHTML = `<div class="empty-state">${t("coursesLoadError")}</div>`;
    return;
  }

  try {
    await restoreTeacherAppState();
  } catch (error) {
    console.error("App state restore error:", error);
    appStateRestoreDone = true;
  }
}

function renderCourseCards() {
  if (!courseGrid) return;

  if (!coursesData.length) {
    courseGrid.innerHTML = `<div class="empty-state">${t("coursesNotFound")}</div>`;
    return;
  }

  courseGrid.innerHTML = coursesData.map(course => {
    const visual = getCourseVisualConfig(course.number);

    return `
      <article class="course-card" data-course-number="${course.number}">
        <div class="course-card-cover ${visual.coverClass}">
          <div class="course-card-illustration">
            ${buildCourseBookMarkup(course.number)}
          </div>
        </div>

        <div class="course-card-body">
          <div class="course-card-title">${formatCourseLabel(course.number)}</div>
        </div>
      </article>
    `;
  }).join("");

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
    slidesCount: Number(item.slides_count) || 0,
    slidesTemplateId: item.slides_template_id || "ilector-academic",
    createdAt: item.created_at || "",
    mimeType: item.mime_type || "",
    originalFilename: item.original_filename || "",
    driveFileId: item.drive_file_id || "",
  };
}

const naturalMaterialCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function getFileSortName(file) {
  return String(file?.webkitRelativePath || file?.name || "");
}

function sortFilesNaturally(files = []) {
  return [...files].sort((a, b) => naturalMaterialCollator.compare(getFileSortName(a), getFileSortName(b)));
}

function getMaterialSortName(material) {
  return String(material?.originalFilename || material?.title || "");
}

function sortMaterialsNaturally(materials = []) {
  return [...materials].sort((a, b) => {
    const typeDiff = typeOrder.findIndex(item => item.key === a.type) - typeOrder.findIndex(item => item.key === b.type);
    if (typeDiff) return typeDiff;
    return naturalMaterialCollator.compare(getMaterialSortName(a), getMaterialSortName(b));
  });
}

async function loadMaterialsForSubject(subjectId) {
  try {
    const materials = await fetchJSON(`${API_BASE}/materials/?discipline_id=${subjectId}`);
    return sortMaterialsNaturally(materials.map(mapMaterialFromApi));
  } catch (error) {
    console.error("Materials load error:", error);
    return [];
  }
}

async function openSubject(subject) {
  cancelActiveTestGeneration();
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
  cancelActiveTestGeneration();
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
  if (!isSupportedMaterialType(activeType)) return [];
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

  return selectedSubject.materials
    .filter(item => isSupportedMaterialType(item.type))
    .map(item => ({
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
    active_material_type: activeType || "",
    test_config: {
      question_count: testConfig.questionCount,
      duration_minutes: testConfig.durationMinutes,
    },
    has_generated_test: generatedQuestions.length > 0,
    has_results: Boolean(currentTestSession),
    has_results_sheet: Boolean(currentTestSession?.results_sheet_url),
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
} = {}, options = {}) {
  const {
    loadTestSession = true,
    renderSlides = true,
    renderTest = true,
    renderResults = false,
    saveState = true,
  } = options;

  await ensureAssistantSubjectContext({ courseNumber, subjectId });

  if (!selectedSubject) {
    return null;
  }

  const normalizedMaterialType = typeof materialType === "string" ? materialType.trim().toLowerCase() : "";
  if (normalizedMaterialType && isSupportedMaterialType(normalizedMaterialType)) {
    activeType = normalizedMaterialType;
  }

  const subjectMaterials = Array.isArray(selectedSubject.materials)
    ? selectedSubject.materials.filter(item => isSupportedMaterialType(item.type))
    : [];
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
  if (loadTestSession) {
    await loadLatestTestSessionForSelectedMaterial();
  }
  clearMaterialPreview();
  if (renderSlides) {
    renderSlidesPreview();
  }
  if (renderTest) {
    renderTestBlock();
  }
  if (renderResults) {
    await renderResultsBlock();
  }
  if (saveState) {
    saveTeacherAppState();
  }

  return getSelectedMaterial();
}

async function applyAssistantWorkspaceSelection(assistantData = {}, options = {}) {
  const selectionPayload = {
    courseNumber: assistantData.course_number,
    subjectId: assistantData.subject_id,
    materialId: assistantData.material_id,
    materialType: assistantData.material_type,
  };

  applyAssistantTestConfig(assistantData);
  return syncAssistantMaterialSelection(selectionPayload, options);
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
    subjectCourseIllustration.className = "course-card-illustration subject-course-illustration";
    subjectCourseIllustration.innerHTML = buildCourseBookMarkup(courseNumber, { compact: true });
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
  if (!isSupportedMaterialType(activeType)) {
    activeType = "lecture";
  }

  materialTypeSelect.innerHTML = existingTypes.map(type => `
    <option value="${type.key}" ${type.key === activeType ? "selected" : ""}>${getTypeLabel(type.key)}</option>
  `).join("");

  if (!existingTypes.length) {
    materialTypeSelect.innerHTML = `<option value="lecture">Р”У™СЂС–СЃ</option>`;
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
  updateMaterialFooter(null);
  materialPreview.innerHTML = `
    <div class="empty-state">${t("materialsEmpty")}</div>
  `;
}

function updateMaterialFooter(item = getSelectedMaterial()) {
  if (materialFooterType) {
    materialFooterType.textContent = item?.typeLabel || "";
    materialFooterType.className = "content-footer-type";
    if (item?.type) {
      materialFooterType.classList.add(getBadgeClass(item.type));
    }
  }

  if (materialFooterTitle) {
    materialFooterTitle.textContent = item?.title || "";
  }

  if (openMaterialFullscreenBtn) {
    openMaterialFullscreenBtn.disabled = !item;
    openMaterialFullscreenBtn.classList.toggle("hidden", !item);
  }
}

function renderMaterialPreview() {
  if (!selectedSubject) {
    updateMaterialFooter(null);
    materialPreview.innerHTML = `<div class="empty-state">${escapeHtml(isDisciplineAccessLocked ? getAuthRequiredWorkspaceMessage() : t("subjectSelectFirst"))}</div>`;
    return;
  }

  const item = getSelectedMaterial();

  if (!item) {
    updateMaterialFooter(null);
    materialPreview.innerHTML = `<div class="empty-state">${t("materialSelectPrompt")}</div>`;
    return;
  }

  updateMaterialFooter(item);

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
  cancelActiveTestGeneration({ keepUiState: true });
  clearTeacherTestCardCleanupTimer();
  generatedQuestions = [];
  currentTestSession = null;
  visibleTeacherTestSessionId = null;
  isTeacherTestCardDisintegrating = false;
  isEditingTest = false;
  isTestGenerating = false;
  testGenerationNotice = "";
  updateActionButtonsState();
}

function setSlidesStatus(message = "", state = "neutral") {
  if (!slidesStatusText) return;
  slidesStatusText.textContent = message || "";
  slidesStatusText.classList.toggle("is-error", state === "error");
  slidesStatusText.classList.toggle("hidden", !message);
}

function setResultsStatus(message = "") {
  if (!resultsInfoText) return;
  resultsInfoText.textContent = message || "";
  resultsInfoText.classList.toggle("hidden", !message);
}

function updateSlidesFooter(material = getSelectedMaterial(), hasSlides = false) {
  if (slidesFooterType) {
    slidesFooterType.textContent = hasSlides ? roleText("Слайд", "Слайд", "Slide") : "";
    slidesFooterType.className = "content-footer-type";
    if (hasSlides) {
      slidesFooterType.classList.add("badge-practice");
    }
  }

  if (slidesFooterTitle) {
    slidesFooterTitle.textContent = hasSlides ? (material?.title || "") : "";
  }
}

function updateResultsFooter(material = getSelectedMaterial(), session = currentTestSession) {
  if (resultsFooterType) {
    resultsFooterType.textContent = t("results");
    resultsFooterType.className = "content-footer-type badge-practice";
  }

  if (resultsFooterTitle) {
    resultsFooterTitle.textContent = session?.title || material?.title || "";
  }
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

function buildSlidesSettingsCard() {
  const material = getSelectedMaterial();
  const hasSlides = Boolean(material?.slidesEmbedUrl || material?.slidesUrl);
  const actionLabel = hasSlides ? t("updateSlides") : t("buildSlides");
  const templateOptions = [
    { id: "ilector-academic", label: t("slidesTemplateClassic"), tone: "academic", previewTitle: "Presentation" },
    { id: "ilector-minimal", label: t("slidesTemplateMinimal"), tone: "minimal", previewTitle: "Presentation" },
    { id: "ilector-focus", label: t("slidesTemplateFocus"), tone: "focus", previewTitle: "Presentation" },
  ];
  const templateCards = templateOptions.map((template) => {
    const isSelected = slidesConfig.templateId === template.id;
    const isMinimalistCover = template.id === "ilector-focus";
    const previewMarkup = isMinimalistCover
      ? `
        <span class="slides-template-preview slides-template-cover-preview" aria-hidden="true">
          <span class="slides-template-cover-line"></span>
          <strong>Presentation</strong>
          <small>Presentation</small>
          <em>iLector</em>
        </span>
      `
      : `
        <span class="slides-template-preview" aria-hidden="true">
          <span class="slides-template-preview-top">
            <span></span>
          </span>
          <span class="slides-template-preview-body">
            <strong>${escapeHtml(template.previewTitle || "")}</strong>
            <i></i>
            <i></i>
            <i></i>
          </span>
          <span class="slides-template-preview-footer">iLector</span>
        </span>
      `;

    return `
      <label class="slides-template-card slides-template-${template.tone} ${isSelected ? "is-selected" : ""}">
        <input
          type="radio"
          name="slidesTemplate"
          value="${escapeHtml(template.id)}"
          ${isSelected ? "checked" : ""}
        />
        ${previewMarkup}
        <span class="slides-template-name">${escapeHtml(template.label)}</span>
      </label>
    `;
  }).join("");

  return `
    <div class="slides-preview-shell">
      <div class="test-settings-panel slides-settings-panel">
        <div class="test-settings-shell">
          <div class="test-settings-head">
            <span class="test-settings-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 5.5h14"></path>
                <path d="M5 11.5h14"></path>
                <path d="M5 17.5h14"></path>
                <path d="M8 4v3"></path>
                <path d="M12 10v3"></path>
                <path d="M16 16v3"></path>
              </svg>
            </span>

            <div class="test-settings-copy">
              <p class="test-settings-title">${escapeHtml(t("slidesSettingsTitle"))}</p>
            </div>
          </div>

          <div class="test-settings-body">
            <div class="test-settings-grid slides-settings-grid">
              <label class="test-settings-field" for="slidesCountInput">
                <span class="test-settings-field-label">${escapeHtml(t("slidesCountLabel"))}</span>
                <span class="test-settings-field-note">${escapeHtml(t("slidesCountHint"))}</span>
                <div class="test-settings-input-shell">
                  <input
                    id="slidesCountInput"
                    type="text"
                    inputmode="numeric"
                    enterkeyhint="done"
                    pattern="[0-9]*"
                    autocomplete="off"
                    spellcheck="false"
                    value="${slidesConfig.slideCount}"
                  />
                  <span class="test-settings-unit">${escapeHtml(t("slidesCountUnit"))}</span>
                </div>
              </label>

              <div class="test-settings-cta slides-settings-cta">
                <button class="small-btn primary" id="buildSlidesBtn" type="button">${escapeHtml(actionLabel)}</button>
              </div>
            </div>

            <div class="slides-template-section">
              <div class="slides-template-copy">
                <span class="test-settings-field-label">${escapeHtml(t("slidesTemplateLabel"))}</span>
                <span class="test-settings-field-note">${escapeHtml(t("slidesTemplateHint"))}</span>
              </div>

              <div class="slides-template-list">
                ${templateCards}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function syncSlidesActionButtons(material, hasSlides) {
  updateSlidesFooter(material, hasSlides);

  if (openSlidesFullscreenBtn) {
    openSlidesFullscreenBtn.disabled = !hasSlides || isSlidesBusy();
    openSlidesFullscreenBtn.classList.toggle("hidden", !hasSlides);
  }

  if (downloadSlidesBtn) {
    downloadSlidesBtn.disabled = !material?.slidesDownloadUrl || isSlidesBusy();
    downloadSlidesBtn.classList.toggle("hidden", !hasSlides);
  }

  if (regenerateSlidesBtn) {
    regenerateSlidesBtn.disabled = !hasSlides || isSlidesBusy();
    regenerateSlidesBtn.classList.toggle("hidden", !hasSlides);
  }
}

function renderSlidesPreview() {
  if (!slidesPreview) return;

  if (!selectedSubject) {
    slidesErrorMessage = "";
    setSlidesStatus("");
    syncSlidesActionButtons(null, false);
    slidesPreview.innerHTML = buildSlidesEmptyCard(
      t("slidesEmptyTitle"),
      isDisciplineAccessLocked ? getAuthRequiredWorkspaceMessage() : t("subjectSelectFirst")
    );
    return;
  }

  const material = getSelectedMaterial();
  const hasSlides = Boolean(material?.slidesEmbedUrl || material?.slidesUrl);
  syncSlidesActionButtons(material, hasSlides);

  if (!material) {
    slidesErrorMessage = "";
    setSlidesStatus("");
    syncSlidesActionButtons(null, false);
    slidesPreview.innerHTML = buildSlidesEmptyCard(t("slidesEmptyTitle"), t("slidesSelectPrompt"));
    return;
  }

  if (material.type !== "lecture") {
    slidesErrorMessage = "";
    setSlidesStatus(t("slidesLectureOnly"), "error");
    syncSlidesActionButtons(material, false);
    slidesPreview.innerHTML = buildSlidesEmptyCard(t("slidesEmptyTitle"), t("slidesLectureOnly"));
    return;
  }

  if (isSlidesGenerating || isSlidesResetting) {
    setSlidesStatus(isSlidesResetting ? t("slidesResetting") : t("slidesGenerating"));
    slidesPreview.innerHTML = `
      <div class="slides-preview-shell">
        <div class="slides-preview-card is-loading">
          <div class="slides-preview-copy">
            <div class="slides-loader"></div>
            <h3>${isSlidesResetting ? t("slidesResettingTitle") : t("slidesLoadingTitle")}</h3>
            <p>${isSlidesResetting ? t("slidesResettingText") : t("slidesLoadingText")}</p>
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (!hasSlides || isSlidesSettingsOpen) {
    setSlidesStatus(slidesErrorMessage || "", slidesErrorMessage ? "error" : "neutral");
    slidesPreview.innerHTML = buildSlidesSettingsCard();
    bindSlidesSettingsInput();

    const buildSlidesBtn = document.getElementById("buildSlidesBtn");
    if (buildSlidesBtn) {
      buildSlidesBtn.disabled = isSlidesBusy();
      buildSlidesBtn.addEventListener("click", () => {
        generateSlidesForSelectedMaterial({ force: hasSlides });
      });
    }
    return;
  }

  slidesErrorMessage = "";
  setSlidesStatus("");
  slidesPreview.innerHTML = `
    <div class="slides-preview-shell">
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
  const hasMaterial = Boolean(material);
  const hasGeneratedTest = shouldShowTeacherTestCard(currentTestSession);
  const hasSessionLink = !!currentTestSession?.access_token || !!currentTestSession?.form_url;
  const hasResults = !!currentTestSession;
  const sessionStatus = getNormalizedTestSessionStatus(currentTestSession);
  const canOpenQr = sessionStatus === "live" && hasGeneratedTest && hasSessionLink && !isTestGenerating;

  openSlidesBtn.disabled = !hasMaterial || isSlidesBusy();
  setActionButtonLabel(openSlidesBtn, t("slides"));
  generateTestBtn.disabled = !hasMaterial || isTestGenerating;
  openQrBtn.disabled = !canOpenQr;
  openResultsBtn.disabled = !hasResults;
  syncSubjectActionButtons();
  renderTestSettingsPanel();
}

function buildInlineQrUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(value || "iLector")}`;
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
  const safeUrl = normalizeGoogleSheetUrl(url);
  if (!safeUrl) return "";

  const matched = safeUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!matched?.[1]) return "";

  return `https://docs.google.com/spreadsheets/d/${matched[1]}/export?format=${encodeURIComponent(format)}`;
}

function normalizeGoogleSheetUrl(url) {
  const rawUrl = String(url || "").trim();
  const matched = rawUrl.match(/https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!matched?.[1]) return "";
  return `https://docs.google.com/spreadsheets/d/${matched[1]}/edit`;
}

function buildResultsSummaryDoc(title, responses = [], options = {}) {
  const labels = {
    highestStudent: roleText("Ең жоғары нәтиже", "Лучший результат", "Highest result"),
    lowestStudent: roleText("Ең төмен нәтиже", "Самый низкий результат", "Lowest result"),
    latestStudent: roleText("Соңғы тапсырған", "Последняя сдача", "Latest submission"),
    percent: roleText("Пайыз", "Процент", "Percent"),
    noData: roleText("Нәтиже табылмады", "Результаты не найдены", "No results found"),
  };

  const normalizedResponses = Array.isArray(responses) ? responses : [];
  const scoringReady = options.scoringReady !== false;
  const formatSubmittedAt = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : date.toLocaleString(getRoleLocale());
  };
  const bestResponse = scoringReady && normalizedResponses.length
    ? normalizedResponses.reduce((best, item) => {
        const currentPercent = Number(item.percentage) || 0;
        const bestPercent = Number(best.percentage) || 0;
        const currentScore = Number(item.score) || 0;
        const bestScore = Number(best.score) || 0;
        return currentPercent > bestPercent || (currentPercent === bestPercent && currentScore > bestScore) ? item : best;
      }, normalizedResponses[0])
    : null;
  const latestResponse = normalizedResponses.length
    ? normalizedResponses.reduce((latest, item) => {
        const currentTime = new Date(item.submitted_at || 0).getTime() || 0;
        const latestTime = new Date(latest.submitted_at || 0).getTime() || 0;
        return currentTime > latestTime ? item : latest;
      }, normalizedResponses[0])
    : null;
  const lowestResponse = scoringReady && normalizedResponses.length
    ? normalizedResponses.reduce((lowest, item) => {
        const currentPercent = Number(item.percentage) || 0;
        const lowestPercent = Number(lowest.percentage) || 0;
        const currentScore = Number(item.score) || 0;
        const lowestScore = Number(lowest.score) || 0;
        return currentPercent < lowestPercent || (currentPercent === lowestPercent && currentScore < lowestScore) ? item : lowest;
      }, normalizedResponses[0])
    : null;
  const bestName = bestResponse?.student_name || t("nameMissing");
  const bestDetail = bestResponse
    ? `${bestResponse.score_label || "-"} · ${Number(bestResponse.percentage) || 0}%`
    : t("resultsScoreUnavailable");
  const lowestName = lowestResponse?.student_name || t("nameMissing");
  const lowestDetail = lowestResponse
    ? `${lowestResponse.score_label || "-"} · ${Number(lowestResponse.percentage) || 0}%`
    : t("resultsScoreUnavailable");
  const latestName = latestResponse?.student_name || t("nameMissing");
  const latestDetail = latestResponse ? formatSubmittedAt(latestResponse.submitted_at) : "-";

  const summaryNote = !scoringReady
    ? `
      <div class="summary-note">
        <div class="summary-note-title">${escapeHtml(t("resultsScoringMissing"))}</div>
        <div class="summary-note-text">${escapeHtml(t("resultsRegenerateHint"))}</div>
      </div>
    `
    : "";

  const rowsHtml = normalizedResponses.map((response, index) => {
    const submittedAt = formatSubmittedAt(response.submitted_at);
    const scoreLabel = scoringReady ? escapeHtml(response.score_label || "-") : escapeHtml(t("resultsScoreUnavailable"));
    const percentLabel = scoringReady ? `${Number(response.percentage) || 0}%` : "-";

    return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(response.student_name || t("nameMissing"))}</td>
        <td>
          <span class="score-pill">${scoreLabel}</span>
        </td>
        <td>${percentLabel}</td>
        <td>${escapeHtml(submittedAt)}</td>
      </tr>
    `;
  }).join("");

  return `
    <html>
      <head>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 22px;
            background: #f8fafc;
            color: #0f172a;
            font-family: Arial, sans-serif;
          }
          .results-doc { display: grid; gap: 14px; }
          .results-title {
            margin: 0;
            font-size: 28px;
            line-height: 1.15;
            font-weight: 800;
          }
          .summary-note {
            padding: 16px 18px;
            border-radius: 14px;
            background: #fff7ed;
            border: 1px solid #fdba74;
            color: #9a3412;
            line-height: 1.55;
          }
          .summary-note-title { font-weight: 800; margin-bottom: 6px; }
          .summary-note-text { font-size: 14px; }
          .summary-row {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 12px;
          }
          .summary-item {
            min-width: 0;
            padding: 16px;
            border-radius: 10px;
            background: #ffffff;
            border: 1px solid #dbe3f0;
          }
          .summary-label {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 7px;
          }
          .summary-name {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.15;
          }
          .summary-detail {
            margin-top: 7px;
            font-size: 13px;
            color: #64748b;
            font-weight: 800;
          }
          .summary-detail.best { color: #1d4ed8; }
          .table-wrap {
            width: 100%;
            overflow: hidden;
            border: 1px solid #dbe3f0;
            border-radius: 16px;
            background: #ffffff;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }
          th {
            padding: 12px 14px;
            text-align: left;
            color: #1e3a8a;
            font-size: 12px;
            background: #eaf1ff;
          }
          td {
            padding: 12px 14px;
            border-bottom: 1px solid #e2e8f0;
            color: #0f172a;
            font-size: 13px;
            font-weight: 700;
            overflow-wrap: anywhere;
          }
          td:first-child { width: 44px; color: #475569; }
          .score-pill {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 72px;
            min-height: 30px;
            padding: 0 12px;
            border-radius: 999px;
            background: #dbeafe;
            color: #1d4ed8;
            font-weight: 800;
          }
          .empty-cell {
            padding: 24px 12px;
            text-align: center;
            color: #64748b;
            font-weight: 700;
          }
          @media (max-width: 640px) {
            html, body { min-height: 100%; }
            body { padding: 0; background: #f8fafc; }
            .results-doc {
              min-height: 100vh;
              display: grid;
              grid-template-rows: 66px auto 1fr;
              gap: 0;
              padding: 0 10px 18px;
            }
            .results-doc > div:first-child {
              display: flex;
              align-items: center;
              padding: 0;
              border: 0;
              background: transparent;
            }
            .results-title { font-size: 22px; line-height: 1.12; }
            .summary-row {
              grid-template-columns: repeat(3, minmax(0, 1fr));
              gap: 6px;
              align-self: start;
              padding: 0 0 14px;
            }
            .summary-item {
              padding: 9px 8px;
              border-radius: 8px;
            }
            .summary-label {
              margin-bottom: 4px;
              font-size: 9.5px;
              line-height: 1.2;
            }
            .summary-name {
              font-size: 15px;
              line-height: 1.05;
            }
            .summary-detail {
              margin-top: 5px;
              font-size: 9.5px;
              line-height: 1.2;
            }
            .table-wrap {
              min-height: 0;
              align-self: stretch;
              border-radius: 9px;
              overflow-x: hidden;
              padding: 0;
              background: transparent;
            }
            .table-wrap table {
              width: 100%;
              overflow: hidden;
              border: 1px solid #dbe3f0;
              border-radius: 9px;
              background: #ffffff;
            }
            th {
              padding: 8px 6px;
              font-size: 10px;
            }
            td {
              padding: 8px 6px;
              font-size: 10.5px;
              line-height: 1.22;
            }
            th:nth-child(1), td:nth-child(1) { width: 36px; }
            th:nth-child(2), td:nth-child(2) { width: 25%; }
            th:nth-child(3), td:nth-child(3) { width: 27%; }
            th:nth-child(4), td:nth-child(4) { width: 18%; }
            th:nth-child(5), td:nth-child(5) { width: 30%; }
            .score-pill {
              min-width: 54px;
              min-height: 24px;
              padding: 0 8px;
              font-size: 10px;
            }
            .summary-note {
              padding: 9px 10px;
              border-radius: 8px;
              font-size: 10.5px;
            }
            .summary-note-text { font-size: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="results-doc">
          <div>
            <h2 class="results-title">${escapeHtml(title || t("results"))}</h2>
          </div>

          ${summaryNote}

          <div class="summary-row">
            <div class="summary-item">
              <div class="summary-label">${labels.highestStudent}</div>
              <div class="summary-name">${escapeHtml(bestName)}</div>
              <div class="summary-detail best">${escapeHtml(bestDetail)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">${labels.lowestStudent}</div>
              <div class="summary-name">${escapeHtml(lowestName)}</div>
              <div class="summary-detail">${escapeHtml(lowestDetail)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">${labels.latestStudent}</div>
              <div class="summary-name">${escapeHtml(latestName)}</div>
              <div class="summary-detail">${escapeHtml(latestDetail)}</div>
            </div>
          </div>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>${t("tableNumber")}</th>
                  <th>${t("tableName")}</th>
                  <th>${t("tableScore")}</th>
                  <th>${labels.percent}</th>
                  <th>${t("tableTime")}</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || `
                  <tr>
                    <td colspan="5" class="empty-cell">${labels.noData}</td>
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
  if (isSavingTestChanges) {
    return;
  }

  isSavingTestChanges = true;
  syncTestModalActionButtons();

  const wasQrMode = Boolean(testQrBoard?.classList.contains("is-qr-mode"));
  const previousSessionSnapshot = currentTestSession ? JSON.parse(JSON.stringify(currentTestSession)) : null;

  document.querySelectorAll(".edit-textarea").forEach(area => {
    const qIndex = Number(area.dataset.questionIndex);
    generatedQuestions[qIndex].question = area.value.trim() || generatedQuestions[qIndex].question;
  });

  document.querySelectorAll(".edit-input[data-question-index][data-option-index]").forEach(input => {
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

  const serializedQuestions = generatedQuestions.map((q) => serializeGeneratedQuestion(q));

  if (currentTestSession?.id) {
    const optimisticSession = buildOptimisticTestSessionSnapshot(currentTestSession, {
      questions_json: serializedQuestions,
      question_count: generatedQuestions.length,
      duration_minutes: testConfig.durationMinutes,
    });

    hydrateCurrentTestSession(optimisticSession);
    if (["ready", "live"].includes(getNormalizedTestSessionStatus(currentTestSession))) {
      visibleTeacherTestSessionId = currentTestSession?.id || null;
    }
  }

  renderTestSettingsPanel();
  renderTestBlock(wasQrMode);

  if (currentTestSession?.id) {
    try {
      const updated = await fetchJSON(`${API_BASE}/results/test-sessions/${currentTestSession.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions_json: serializedQuestions,
          question_count: generatedQuestions.length,
          duration_minutes: testConfig.durationMinutes,
        }),
      });

      hydrateCurrentTestSession(updated);
      if (["ready", "live"].includes(getNormalizedTestSessionStatus(currentTestSession))) {
        visibleTeacherTestSessionId = currentTestSession?.id || null;
      }
    } catch (error) {
      console.error("Test session save error:", error);
      if (previousSessionSnapshot) {
        hydrateCurrentTestSession(previousSessionSnapshot);
        visibleTeacherTestSessionId = ["ready", "live"].includes(getNormalizedTestSessionStatus(currentTestSession))
          ? currentTestSession?.id || null
          : null;
      }
      renderTestSettingsPanel();
      renderTestBlock(wasQrMode);
      setTestPanelInfo(error?.message || t("resultsSyncError"), "error");
      isSavingTestChanges = false;
      renderQuestionModal(true);
      return;
    }
  }

  renderTestSettingsPanel();
  renderTestBlock(wasQrMode);
  testModalSavedAt = Date.now();
  isSavingTestChanges = false;
  renderQuestionModal(false);
}

async function renderResultsBlock() {
  const material = getSelectedMaterial();
  let latestSession = null;

  resultsSheetFrame.src = "about:blank";
  resultsSheetFrame.srcdoc = "";
  updateResultsFooter(material, currentTestSession);

  if (!material) {
    setResultsStatus("");
    openResultsSheetBtn.disabled = !normalizeGoogleSheetUrl(currentTestSession?.results_sheet_url);
    downloadResultsBtn.disabled = !normalizeGoogleSheetUrl(currentTestSession?.results_sheet_url);
    updateActionButtonsState();
    return;
  }

  setResultsStatus(t("resultsLoading"));
  openResultsSheetBtn.disabled = true;
  downloadResultsBtn.disabled = true;
  updateActionButtonsState();

  try {
    latestSession = await getLatestSessionForSelectedMaterial();

    if (!latestSession) {
      setResultsStatus("");
      updateResultsFooter(material, null);
      openResultsSheetBtn.disabled = true;
      downloadResultsBtn.disabled = true;
      updateActionButtonsState();
      return;
    }

    const data = await fetchJSON(`${API_BASE}/results/test-sessions/${latestSession.id}/responses/`);
    const responses = data.responses || [];
    const sheetUrl = normalizeGoogleSheetUrl(data.results_sheet_url || latestSession.results_sheet_url || "");
    const scoringReady = data.scoring_ready !== false;
    currentTestSession = {
      ...latestSession,
      ...data,
      id: latestSession.id
    };
    updateResultsFooter(material, currentTestSession);

    if (!responses.length) {
      setResultsStatus("");
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

    setResultsStatus("");
    resultsSheetFrame.src = "about:blank";
    resultsSheetFrame.srcdoc = buildResultsSummaryDoc(data.title, responses, { scoringReady });

    openResultsSheetBtn.disabled = !sheetUrl;
    downloadResultsBtn.disabled = !sheetUrl;
    updateActionButtonsState();
  } catch (error) {
    console.error("RESULTS LOAD ERROR:", error);
    const fallbackSheetUrl = normalizeGoogleSheetUrl(
      latestSession?.results_sheet_url ||
      currentTestSession?.results_sheet_url ||
      ""
    );

    if (fallbackSheetUrl) {
      setResultsStatus("");
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

    setResultsStatus("");
    resultsSheetFrame.src = "about:blank";
    resultsSheetFrame.srcdoc = "";
    openResultsSheetBtn.disabled = !normalizeGoogleSheetUrl(currentTestSession?.results_sheet_url);
    downloadResultsBtn.disabled = !normalizeGoogleSheetUrl(currentTestSession?.results_sheet_url);
    updateActionButtonsState();
  }
}

async function syncResultsSheetSession() {
  const latestSession = await getLatestSessionForSelectedMaterial();
  const sessionId = latestSession?.id;
  const sheetUrl = normalizeGoogleSheetUrl(latestSession?.results_sheet_url || "");

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
    sheetUrl: normalizeGoogleSheetUrl(currentTestSession.results_sheet_url || sheetUrl)
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

    setResultsStatus("");
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
    throw new Error(roleText("Тест сессиясы табылмады.", "Тестовая сессия не найдена.", "Test session was not found."));
  }

  const payload = await fetchJSON(`${API_BASE}/results/test-sessions/${currentTestSession.id}/launch-public/`, {
    method: "POST",
  });

  hydrateCurrentTestSession({
    ...currentTestSession,
    ...payload,
  });
  visibleTeacherTestSessionId = currentTestSession?.id || null;
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
  visibleTeacherTestSessionId = null;
  saveTeacherAppState();
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
    <h3 style="font-size:24px;line-height:1.2;font-weight:800;color:#fff;">${roleText("Тест аяқталды", "Тест завершен", "Test completed")}</h3>
    <p style="font-size:15px;line-height:1.6;color:rgba(226,232,240,0.82);">
      ${roleText("Нәтижеңіз", "Ваш результат", "Your result")}: <strong>${escapeHtml(resultAttempt.score_label || "-")}</strong>
    </p>
  `;
  publicTestResultCard.classList.remove("hidden");
}

async function initPublicTestMode() {
  if (!publicTestSessionToken || !publicTestView) return false;

  document.body.classList.add("public-test-mode");
  publicTestView.classList.remove("hidden");

  try {
    await loadPublicTestSession();
  } catch (error) {
    console.error("Public test init error:", error);
    setPublicTestStatus(roleText("Тест сессиясын ашу мүмкін болмады.", "Не удалось открыть тестовую сессию.", "Could not open the test session."), "error");
  }

  return true;
}

function getProjectedTeacherCloseClock(durationMinutes, session = currentTestSession) {
  if (!session?.public_started_at) {
    return roleText("Тест басталған соң көрінеді", "Появится после запуска теста", "Shown after the test starts");
  }

  const startedAtMs = new Date(session.public_started_at).getTime();
  if (Number.isNaN(startedAtMs)) {
    return roleText("Уақыт есептелмеді", "Время не определено", "Time is not available");
  }

  const projected = new Date(startedAtMs + Number(durationMinutes || 0) * 60 * 1000);
  return formatTeacherClock(projected.toISOString()) || roleText("Уақыт есептелмеді", "Время не определено", "Time is not available");
}

function renderTestModalSummary(editMode = false) {
  if (!testModalSummary) return;

  const info = getTeacherTestInfoState(currentTestSession);
  const durationValue = Number(currentTestSession?.duration_minutes) || testConfig.durationMinutes;
  const closeClock = getProjectedTeacherCloseClock(durationValue, currentTestSession);
  const statusLabel = info.label || roleText("Тест дайын", "Тест готов", "Test ready");
  const questionCountLabel = roleText("Сұрақ саны", "Количество вопросов", "Number of questions");
  const durationLabel = roleText("Белсенді уақыт", "Активное время", "Active time");
  const closeLabel = roleText("Жабылу уақыты", "Время закрытия", "Closing time");
  const statusTitle = roleText("Тест параметрлері", "Параметры теста", "Test settings");
  const closeHint = editMode && String(currentTestSession?.session_status || "").toLowerCase() === "live"
    ? `<div class="test-modal-summary-note">${roleText("Уақытты сақтағаннан кейін жабылу мезгілі автоматты түрде жаңарады.", "После сохранения время закрытия обновится автоматически.", "After saving, the closing time updates automatically.")}</div>`
    : "";
  const saveSuccessNote = !editMode && hasRecentTestSaveFeedback()
    ? `<div class="test-modal-summary-note is-success">${roleText("Өзгерістер сақталды.", "Изменения сохранены.", "Changes saved.")}</div>`
    : "";

  testModalSummary.innerHTML = `
    <div class="test-modal-summary-title">${statusTitle}</div>
    <div class="test-modal-summary-grid">
      <div class="test-modal-summary-field">
        <span>${roleText("Күйі", "Статус", "Status")}</span>
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
            ? buildDurationEditorMarkup({
                inputId: "testModalDurationInput",
                value: durationValue,
              })
            : `<strong>${durationValue} ${roleText("мин", "мин", "min")}</strong>`
        }
      </div>
      <div class="test-modal-summary-field">
        <span>${closeLabel}</span>
        <strong id="testModalCloseTimeValue">${escapeHtml(closeClock)}</strong>
      </div>
    </div>
    ${closeHint}
    ${saveSuccessNote}
  `;

  if (editMode) {
    bindTestModalDurationEditor(durationValue);
  }
}

function renderQuestionModal(editMode = false) {
  isEditingTest = editMode;
  testModalTitle.textContent = editMode ? t("testModalEdit") : t("testModalView");
  syncTestModalActionButtons();

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
              border:1px solid ${q.answer === oIndex ? "rgba(68,150,55,0.32)" : "rgba(0,93,176,0.14)"};
              background:${q.answer === oIndex ? "rgba(232,248,226,0.96)" : "#f5f8fc"};
              color:${q.answer === oIndex ? "#2f6f28" : "#17314b"};
              display:flex;
              align-items:center;
              gap:10px;
              padding:10px 12px;
              font-size:14px;
              font-weight:600;
            ">
              <div style="
                width:26px;height:26px;border-radius:50%;
                background:${q.answer === oIndex ? "#58b947" : "rgba(0,93,176,0.10)"};
                display:flex;align-items:center;justify-content:center;
                font-size:11px;font-weight:800;flex-shrink:0;
                color:${q.answer === oIndex ? "#ffffff" : "#4d6784"};
              ">${String.fromCharCode(65 + oIndex)}</div>
              <div>${escapeHtml(option)}</div>
            </div>
          `).join("")}
        </div>
      `;
    }

    testQuestionsContainer.appendChild(card);
  });

  if (!editMode && hasRecentTestSaveFeedback()) {
    requestAnimationFrame(() => {
      flashTestModalSaveFeedback();
    });
  }
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
  if (selectedRole === "rus" || selectedRole === "eng") {
    return selectedRole;
  }

  const rawText = String(text || "").toLowerCase();
  const normalized = normalizeVoiceText(text);
  const kazakhCharMatch = /[әіңғүұқөһ]/i.test(rawText);
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

function selectLocalizedAssistantReply(language, kazakhText, russianText, englishText = russianText) {
  if (language === "rus") return russianText;
  if (language === "eng") return englishText;
  return kazakhText;
}

function getAssistantLanguageName(role = selectedRole) {
  if (role === "rus") return roleText("орыс тілі", "русский язык", "Russian");
  if (role === "eng") return roleText("ағылшын тілі", "английский язык", "English");
  return roleText("қазақ тілі", "казахский язык", "Kazakh");
}

const LOCAL_ASSISTANT_OPEN_WORDS = ["аш", "көрсет", "открой", "покажи", "перейди", "open", "show"];
const LOCAL_ASSISTANT_HELP_PHRASES = ["көмек", "анықтама", "справочник", "справочникті", "справшник", "справшникті", "команда", "командалар", "не істей аласың", "что ты умеешь", "справка", "помощь", "help", "commands"];
const LOCAL_ASSISTANT_HOME_PHRASES = ["басты бет", "главная", "главную", "үйге", "домой", "home"];
const LOCAL_ASSISTANT_BACK_PHRASES = ["артқа", "қайтар", "назад", "go back"];
const LOCAL_ASSISTANT_MATERIALS_PHRASES = ["материал", "материалдар", "материалды", "материалы", "конспект"];
const LOCAL_ASSISTANT_UPLOAD_PHRASES = ["материал жүктеу", "жүктеуді аш", "жүктеу батырмасы", "жүктеу кнопка", "загрузка материала", "открой загрузку", "кнопку загрузки", "загрузить материал", "upload material", "open upload", "upload button"];
const LOCAL_ASSISTANT_TEST_PANEL_PHRASES = ["тестті аш", "тест аш", "тест бөлімі", "открой тест", "перейди в тест", "test"];
const LOCAL_ASSISTANT_RESULTS_PHRASES = ["нәтиже", "нәтижелер", "результат", "результаты", "балл", "оценка", "results"];
const LOCAL_ASSISTANT_RESULTS_SHEET_PHRASES = ["google sheets", "гугл шит", "гугл таблиц", "sheets", "sheet", "таблица", "таблицу"];
const LOCAL_ASSISTANT_SLIDES_PHRASES = ["слайд", "слайдтар", "слайды", "презентация", "slides"];
const LOCAL_ASSISTANT_GENERATE_TEST_PHRASES = ["тест жаса", "тест дайында", "тест құрастыр", "создай тест", "сгенерируй тест", "generate test"];
const LOCAL_ASSISTANT_GENERATE_SLIDES_PHRASES = ["слайд жаса", "слайд дайында", "презентация жаса", "создай слайды", "создай презентацию", "generate slides"];
const LOCAL_ASSISTANT_OPEN_QR_PHRASES = ["qr", "qr код", "кьюар", "куар"];
const LOCAL_ASSISTANT_START_TEST_PHRASES = ["тестті баста", "тест баста", "начни тест", "запусти тест", "start test"];
const LOCAL_ASSISTANT_CLARIFY_PHRASES = ["түсінбедім", "тусинбедим", "не түсінікті", "не понял", "не понимаю", "непонятно", "i do not understand", "i don't understand", "unclear"];
const LOCAL_ASSISTANT_STOP_TOKENS = new Set([
  "аш",
  "көрсет",
  "открой",
  "покажи",
  "перейди",
  "материал",
  "материалдар",
  "материалы",
  "тест",
  "слайд",
  "слайды",
  "презентация",
  "пән",
  "дисциплина",
  "course",
  "курс",
  "курса",
]);
const LOCAL_ASSISTANT_MATERIAL_TYPE_ALIASES = [
  ["дәріс", "lecture"],
  ["лекция", "lecture"],
  ["lecture", "lecture"],
  ["lesson", "lecture"],
  ["практика", "practice"],
  ["практиканы", "practice"],
  ["practice", "practice"],
  ["practical", "practice"],
  ["зертхана", "lab"],
  ["зертхананы", "lab"],
  ["лаборатория", "lab"],
  ["lab", "lab"],
];
const LOCAL_ASSISTANT_COURSE_PATTERNS = [
  /(\d{1,2})\s*(?:курс|курсты|курсқа|курса|course)\b/u,
];
const LOCAL_ASSISTANT_QUESTION_COUNT_PATTERNS = [
  /(\d{1,2})\s*(?:сұрақ|сурак|сұрақтан|сурактан|вопрос(?:а|ов)?|question)\b/u,
  /(?:сұрақ|сурак|вопрос(?:а|ов)?|question)\s*(\d{1,2})\b/u,
];
const LOCAL_ASSISTANT_DURATION_PATTERNS = [
  /(\d{1,3})\s*(?:минут|мин|minute|min)\b/u,
  /(?:минут|мин|minute|min)\s*(\d{1,3})\b/u,
];

function containsAnyLocalAssistantPhrase(text, phrases) {
  return phrases.some(item => text.includes(item));
}

function extractLocalAssistantCourseNumber(text) {
  for (const pattern of LOCAL_ASSISTANT_COURSE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const value = Number.parseInt(match[1], 10);
      if (Number.isFinite(value)) {
        return value;
      }
    }
  }

  return null;
}

function extractLocalAssistantMaterialType(text) {
  for (const [alias, materialType] of LOCAL_ASSISTANT_MATERIAL_TYPE_ALIASES) {
    if (text.includes(alias)) {
      return materialType;
    }
  }

  return "";
}

function extractLocalAssistantQuestionCount(text) {
  for (const pattern of LOCAL_ASSISTANT_QUESTION_COUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const value = Number.parseInt(match[1], 10);
      if (Number.isFinite(value)) {
        return clampTestConfig(value, testConfig.durationMinutes).questionCount;
      }
    }
  }

  return null;
}

function extractLocalAssistantDurationMinutes(text) {
  for (const pattern of LOCAL_ASSISTANT_DURATION_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const value = Number.parseInt(match[1], 10);
      if (Number.isFinite(value)) {
        return clampTestConfig(testConfig.questionCount, value).durationMinutes;
      }
    }
  }

  return null;
}

function extractLocalAssistantTargetRole(rawText, normalizedText) {
  const raw = String(rawText || "").trim();
  const lowerRaw = raw.toLowerCase();
  const text = normalizedText || normalizeVoiceText(rawText);

  if (/[аa]ғылшын|агылшын|английск|english|lector\b/i.test(lowerRaw)) {
    return "eng";
  }

  if (/орыс|русск|russian|лектор/i.test(lowerRaw)) {
    return "rus";
  }

  if (/қазақ|казах|kazakh|оқытушы|окытушы/i.test(lowerRaw) || text.includes("қазақша") || text.includes("казакша")) {
    return "kaz";
  }

  return "";
}

function tokenizeLocalAssistantTitle(value) {
  return normalizeVoiceText(value)
    .split(" ")
    .filter(token => token.length > 2 && !LOCAL_ASSISTANT_STOP_TOKENS.has(token));
}

function scoreLocalAssistantEntityMatch(text, item) {
  const normalizedTitle = normalizeVoiceText(item?.title || "");
  if (!normalizedTitle) {
    return 0;
  }

  if (text.includes(normalizedTitle)) {
    return 1;
  }

  const titleTokens = tokenizeLocalAssistantTitle(normalizedTitle);
  if (!titleTokens.length) {
    return 0;
  }

  const matchedTokens = titleTokens.filter(token => text.includes(token)).length;
  const tokenRatio = matchedTokens / titleTokens.length;
  if (tokenRatio >= 0.66) {
    return 0.75 + (tokenRatio * 0.2);
  }

  return 0;
}

function findBestLocalAssistantEntityMatch(text, items = []) {
  let bestItem = null;
  let bestScore = 0;

  items.forEach(item => {
    const score = scoreLocalAssistantEntityMatch(text, item);
    if (score > bestScore) {
      bestItem = item;
      bestScore = score;
    }
  });

  if (bestScore < 0.75) {
    return null;
  }

  return bestItem;
}

function pickFirstLocalAssistantMaterialByType(context, materialType = "") {
  if (!materialType) {
    return null;
  }

  const availableMaterials = Array.isArray(context?.available_materials) ? context.available_materials : [];
  const selectedMaterial = context?.selected_material && context.selected_material.id ? context.selected_material : null;

  const firstMatch = availableMaterials.find(item => item.type === materialType);
  if (firstMatch) {
    return firstMatch;
  }

  if (selectedMaterial?.type === materialType) {
    return selectedMaterial;
  }

  return null;
}

function buildLocalAssistantActionReply(action, language, payload = {}) {
  const localReply = (kazakhText, russianText, englishText = russianText) =>
    selectLocalizedAssistantReply(language, kazakhText, russianText, englishText);
  const subjectTitle = String(payload.subject_title || payload.subject?.title || "").trim();
  const materialTitle = String(payload.material_title || payload.material?.title || "").trim();
  const courseNumber = Number(payload.course_number ?? payload.subject?.course_number ?? payload.material?.course_number ?? 0) || 0;
  const questionCount = Number(payload.question_count) || 0;
  const durationMinutes = Number(payload.duration_minutes) || 0;

  if (action === "open_course" && courseNumber) {
    return localReply(
      `Жарайды, ${courseNumber}-курсты ашамын.`,
      `Хорошо, открою ${courseNumber} курс.`,
      `Okay, I will open course ${courseNumber}.`,
    );
  }

  if (action === "open_subject" && subjectTitle) {
    return localReply(
      `Жарайды, ${subjectTitle} пәнін ашамын.`,
      `Хорошо, открою дисциплину ${subjectTitle}.`,
      `Okay, I will open ${subjectTitle}.`,
    );
  }

  if (action === "select_material" && materialTitle) {
    return localReply(
      `Жарайды, ${materialTitle} материалын ашамын.`,
      `Хорошо, открою материал ${materialTitle}.`,
      `Okay, I will open ${materialTitle}.`,
    );
  }

  if (action === "generate_test") {
    if (language === "rus") {
      if (questionCount && durationMinutes) {
        return `Хорошо, подготовлю тест на ${questionCount} вопросов и ${durationMinutes} минут.`;
      }
      if (questionCount) {
        return `Хорошо, подготовлю тест на ${questionCount} вопросов.`;
      }
      return "Хорошо, начну подготовку теста.";
    }

    if (language === "eng") {
      if (questionCount && durationMinutes) {
        return `Okay, I will prepare a ${questionCount}-question test for ${durationMinutes} minutes.`;
      }
      if (questionCount) {
        return `Okay, I will prepare a ${questionCount}-question test.`;
      }
      return "Okay, I will start preparing the test.";
    }

    if (questionCount && durationMinutes) {
      return `Жарайды, ${questionCount} сұрақтық, ${durationMinutes} минуттық тест дайындауды бастаймын.`;
    }
    if (questionCount) {
      return `Жарайды, ${questionCount} сұрақтық тест дайындауды бастаймын.`;
    }
    return "Жарайды, тест дайындауды бастаймын.";
  }

  const replyMap = {
    show_help: localReply("Жарайды, көмек панелін ашамын.", "Хорошо, открою панель помощи.", "Okay, I will open the help panel."),
    go_home: localReply("Жарайды, басты бетке өтемін.", "Хорошо, перейду на главную страницу.", "Okay, I will go to the home page."),
    go_back: localReply("Жарайды, алдыңғы бетке қайтарамын.", "Хорошо, верну на предыдущий экран.", "Okay, I will go back."),
    open_materials: localReply("Жарайды, материалдар бөлімін ашамын.", "Хорошо, открою раздел материалов.", "Okay, I will open the materials section."),
    open_upload: localReply("Жарайды, материал жүктеу бөлімін ашамын.", "Хорошо, открою загрузку материалов.", "Okay, I will open material upload."),
    open_test: localReply("Жарайды, тест бөлімін ашамын.", "Хорошо, открою раздел теста.", "Okay, I will open the test section."),
    open_results: localReply("Жарайды, нәтижелерді ашамын.", "Хорошо, открою результаты.", "Okay, I will open the results."),
    open_results_sheet: localReply("Жарайды, нәтижелерді Google Sheets-та ашамын.", "Хорошо, открою результаты в Google Sheets.", "Okay, I will open the results in Google Sheets."),
    open_slides: localReply("Жарайды, слайд бөлімін ашамын.", "Хорошо, открою раздел слайдов.", "Okay, I will open the slides section."),
    generate_slides: localReply("Жарайды, слайд дайындауды бастаймын.", "Хорошо, начну подготовку слайдов.", "Okay, I will start preparing the slides."),
    open_qr: localReply("Жарайды, тесттің QR кодын ашамын.", "Хорошо, открою QR-код теста.", "Okay, I will open the test QR code."),
    start_test: localReply("Жарайды, тестті іске қосамын.", "Хорошо, запущу тест.", "Okay, I will start the test."),
    switch_language: localReply(
      `Жарайды, жүйе тілін ${getAssistantLanguageName(payload.target_role || selectedRole)} режиміне ауыстырамын.`,
      `Хорошо, переключу систему на ${getAssistantLanguageName(payload.target_role || selectedRole)}.`,
      `Okay, I will switch the system to ${getAssistantLanguageName(payload.target_role || selectedRole)}.`,
    ),
    clarify: localReply(
      "Кешіріңіз, нақтылап айтыңызшы. Мысалы: «материалдарды аш», «тест жаса», «нәтижелерді көрсет» немесе «материал жүктеуді аш».",
      "Пожалуйста, уточните команду. Например: «открой материалы», «создай тест», «покажи результаты» или «открой загрузку материалов».",
      "Please clarify the command. For example: “open materials”, “create a test”, “show results”, or “open material upload”.",
    ),
  };

  return replyMap[action] || "";
}

function buildLocalAssistantResponse(action, language, payload = {}) {
  const subject = payload.subject || null;
  const material = payload.material || null;

  return {
    action,
    reply: payload.reply || buildLocalAssistantActionReply(action, language, payload),
    course_number: Number(
      payload.course_number ??
      subject?.course_number ??
      material?.course_number ??
      0
    ) || null,
    subject_id: Number(payload.subject_id ?? subject?.id ?? material?.subject_id ?? 0) || null,
    subject_title: String(payload.subject_title || subject?.title || "").trim(),
    material_id: Number(payload.material_id ?? material?.id ?? 0) || null,
    material_title: String(payload.material_title || material?.title || "").trim(),
    material_type: String(payload.material_type || material?.type || "").trim(),
    question_count: payload.question_count ?? null,
    duration_minutes: payload.duration_minutes ?? null,
    target_role: payload.target_role || "",
    local: true,
  };
}

function buildLocalAssistantSmalltalkReply(normalized, language) {
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
      "Hello! I can help with materials, tests, slides, and results.",
    );
  }

  if (isThanks && !hasSystemAction) {
    return selectLocalizedAssistantReply(
      language,
      "Әрқашан көмектесемін.",
      "Всегда рад помочь.",
      "Always happy to help.",
    );
  }

  if (isWhoAreYou) {
    return selectLocalizedAssistantReply(
      language,
      "Мен осы жүйедегі дауыстық көмекшімін. Қай бөлім керек болса, айтып жіберіңіз.",
      "Я голосовой помощник этой системы. Скажите, какой раздел вам нужен.",
      "I am the voice assistant for this system. Tell me which section you need.",
    );
  }

  if (isHowAreYou) {
    return selectLocalizedAssistantReply(
      language,
      "Жақсымын. Сізге қалай көмектесейін?",
      "Все хорошо. Чем помочь?",
      "I am doing well. How can I help?",
    );
  }

  if (asksHow && normalized.includes("тест")) {
    return selectLocalizedAssistantReply(
      language,
      "Тест бөліміне өту үшін «тестті аш» деңіз. Ал жаңа тест керек болса «тест жасап бер» деп айтыңыз.",
      "Чтобы перейти в тесты, скажите «открой тест». Если нужен новый тест, скажите «создай тест».",
      "To open tests, say “open test”. To create a new one, say “create a test”.",
    );
  }

  if (asksHow && normalized.includes("материал")) {
    return selectLocalizedAssistantReply(
      language,
      "Материалдарды ашу үшін «материалдарды аш» деп айтыңыз.",
      "Чтобы открыть материалы, скажите «открой материалы».",
      "To open materials, say “open materials”.",
    );
  }

  if (asksHow && (normalized.includes("нәтиже") || normalized.includes("результ"))) {
    return selectLocalizedAssistantReply(
      language,
      "Нәтижелерді көру үшін «нәтижелерді аш» деп айтыңыз.",
      "Чтобы посмотреть результаты, скажите «открой результаты».",
      "To view results, say “open results”.",
    );
  }

  if (asksHow && (normalized.includes("слайд") || normalized.includes("презентац"))) {
    return selectLocalizedAssistantReply(
      language,
      "Слайдтарды ашу үшін «слайдтарды аш» деңіз. Ал жаңасын жасау үшін «слайд жасап бер» деп айтыңыз.",
      "Чтобы открыть слайды, скажите «открой слайды». Чтобы создать новые, скажите «создай слайды».",
      "To open slides, say “open slides”. To create new ones, say “create slides”.",
    );
  }

  return "";
}

function looksLikeLocalAssistantHelpRequest(text) {
  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_HELP_PHRASES);
}

function looksLikeLocalAssistantClarifyRequest(text) {
  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_CLARIFY_PHRASES);
}

function looksLikeLocalAssistantUploadRequest(text) {
  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_UPLOAD_PHRASES);
}

function looksLikeLocalAssistantLanguageSwitchRequest(text, rawText) {
  if (!extractLocalAssistantTargetRole(rawText, text)) {
    return false;
  }

  return containsAnyLocalAssistantPhrase(text, [
    "тіл",
    "тілін",
    "ауыстыр",
    "режим",
    "язык",
    "переключи",
    "поменяй",
    "смени",
    "language",
    "switch",
    "change",
  ]) || /оқытушы|окытушы|лектор|lector/i.test(String(rawText || ""));
}

function looksLikeLocalAssistantHomeRequest(text) {
  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_HOME_PHRASES);
}

function looksLikeLocalAssistantBackRequest(text) {
  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_BACK_PHRASES);
}

function looksLikeLocalAssistantGenerateTestRequest(text) {
  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_GENERATE_TEST_PHRASES);
}

function looksLikeLocalAssistantGenerateSlidesRequest(text) {
  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_GENERATE_SLIDES_PHRASES);
}

function looksLikeLocalAssistantOpenQrRequest(text) {
  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_OPEN_QR_PHRASES);
}

function looksLikeLocalAssistantStartTestRequest(text, context) {
  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_START_TEST_PHRASES) || (
    text === "баста" && (context.active_panel === "test" || context.has_generated_test)
  );
}

function looksLikeLocalAssistantResultsRequest(text) {
  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_RESULTS_PHRASES);
}

function looksLikeLocalAssistantResultsSheetRequest(text) {
  return looksLikeLocalAssistantResultsRequest(text)
    && containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_RESULTS_SHEET_PHRASES);
}

function looksLikeLocalAssistantSlidesRequest(text) {
  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_SLIDES_PHRASES);
}

function looksLikeLocalAssistantMaterialsRequest(text) {
  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_MATERIALS_PHRASES)
    || (
      Boolean(extractLocalAssistantMaterialType(text))
      && containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_OPEN_WORDS)
    );
}

function looksLikeLocalAssistantOpenTestPanelRequest(text, context) {
  if (looksLikeLocalAssistantGenerateTestRequest(text) || looksLikeLocalAssistantStartTestRequest(text, context)) {
    return false;
  }

  return containsAnyLocalAssistantPhrase(text, LOCAL_ASSISTANT_TEST_PANEL_PHRASES);
}

function resolveLocalAssistantCommand(transcript) {
  const normalized = normalizeVoiceText(transcript);
  if (!normalized) {
    return null;
  }

  const language = detectAssistantReplyLanguage(transcript);
  const context = buildAssistantContext();
  const matchedSubject = findBestLocalAssistantEntityMatch(normalized, context.available_subjects || []);
  const matchedMaterial = findBestLocalAssistantEntityMatch(normalized, context.available_materials || []);
  const selectedSubjectSnapshot = context.selected_subject?.id ? context.selected_subject : null;
  const selectedMaterialSnapshot = context.selected_material?.id ? context.selected_material : null;
  const courseNumber = extractLocalAssistantCourseNumber(normalized);
  const materialType = extractLocalAssistantMaterialType(normalized);
  const questionCount = extractLocalAssistantQuestionCount(normalized);
  const durationMinutes = extractLocalAssistantDurationMinutes(normalized);
  const targetMaterialFromType = pickFirstLocalAssistantMaterialByType(context, materialType || "");
  const targetRole = extractLocalAssistantTargetRole(transcript, normalized);
  const smalltalkReply = buildLocalAssistantSmalltalkReply(normalized, language);

  if (targetRole && looksLikeLocalAssistantLanguageSwitchRequest(normalized, transcript)) {
    return buildLocalAssistantResponse("switch_language", language, {
      target_role: targetRole,
    });
  }

  if (smalltalkReply) {
    return {
      reply: smalltalkReply,
      local: true,
    };
  }

  if (looksLikeLocalAssistantClarifyRequest(normalized)) {
    return buildLocalAssistantResponse("clarify", language);
  }

  if (looksLikeLocalAssistantHelpRequest(normalized)) {
    return buildLocalAssistantResponse("show_help", language);
  }

  if (looksLikeLocalAssistantUploadRequest(normalized)) {
    return buildLocalAssistantResponse("open_upload", language, {
      subject: selectedSubjectSnapshot,
      course_number: selectedSubjectSnapshot?.course_number || courseNumber || selectedCourseNumber || null,
    });
  }

  if (looksLikeLocalAssistantHomeRequest(normalized)) {
    return buildLocalAssistantResponse("go_home", language);
  }

  if (looksLikeLocalAssistantBackRequest(normalized)) {
    return buildLocalAssistantResponse("go_back", language);
  }

  if (looksLikeLocalAssistantGenerateSlidesRequest(normalized)) {
    const targetMaterial = matchedMaterial || targetMaterialFromType || selectedMaterialSnapshot;
    if (targetMaterial) {
      return buildLocalAssistantResponse("generate_slides", language, {
        material: targetMaterial,
        subject: matchedSubject || selectedSubjectSnapshot,
        material_type: materialType || targetMaterial.type || "",
      });
    }
  }

  if (looksLikeLocalAssistantGenerateTestRequest(normalized) && !looksLikeLocalAssistantStartTestRequest(normalized, context)) {
    const targetMaterial = matchedMaterial || targetMaterialFromType || selectedMaterialSnapshot;
    if (targetMaterial) {
      return buildLocalAssistantResponse("generate_test", language, {
        material: targetMaterial,
        subject: matchedSubject || selectedSubjectSnapshot,
        material_type: materialType || targetMaterial.type || "",
        question_count: questionCount,
        duration_minutes: durationMinutes,
      });
    }
  }

  if (looksLikeLocalAssistantOpenQrRequest(normalized)) {
    const targetMaterial = matchedMaterial || targetMaterialFromType || selectedMaterialSnapshot;
    if (targetMaterial) {
      return buildLocalAssistantResponse("open_qr", language, {
        material: targetMaterial,
        subject: matchedSubject || selectedSubjectSnapshot,
        material_type: materialType || targetMaterial.type || "",
        question_count: questionCount,
        duration_minutes: durationMinutes,
      });
    }
  }

  if (looksLikeLocalAssistantStartTestRequest(normalized, context)) {
    const targetMaterial = matchedMaterial || targetMaterialFromType || selectedMaterialSnapshot;
    if (targetMaterial) {
      return buildLocalAssistantResponse("start_test", language, {
        material: targetMaterial,
        subject: matchedSubject || selectedSubjectSnapshot,
        material_type: materialType || targetMaterial.type || "",
        question_count: questionCount,
        duration_minutes: durationMinutes,
      });
    }
  }

  if (looksLikeLocalAssistantResultsRequest(normalized)) {
    const targetMaterial = matchedMaterial || targetMaterialFromType || selectedMaterialSnapshot;
    const actionName = looksLikeLocalAssistantResultsSheetRequest(normalized) ? "open_results_sheet" : "open_results";

    if (targetMaterial) {
      return buildLocalAssistantResponse(actionName, language, {
        material: targetMaterial,
        subject: matchedSubject || selectedSubjectSnapshot,
        material_type: materialType || targetMaterial.type || "",
      });
    }

    if (matchedSubject || selectedSubjectSnapshot || courseNumber) {
      return buildLocalAssistantResponse(actionName, language, {
        subject: matchedSubject || selectedSubjectSnapshot,
        course_number: courseNumber || selectedSubjectSnapshot?.course_number || null,
        material_type: materialType,
      });
    }
  }

  if (looksLikeLocalAssistantSlidesRequest(normalized)) {
    const targetMaterial = matchedMaterial || targetMaterialFromType || selectedMaterialSnapshot;
    if (targetMaterial) {
      return buildLocalAssistantResponse("open_slides", language, {
        material: targetMaterial,
        subject: matchedSubject || selectedSubjectSnapshot,
        material_type: materialType || targetMaterial.type || "",
      });
    }

    if (matchedSubject || selectedSubjectSnapshot || courseNumber) {
      return buildLocalAssistantResponse("open_slides", language, {
        subject: matchedSubject || selectedSubjectSnapshot,
        course_number: courseNumber || selectedSubjectSnapshot?.course_number || null,
        material_type: materialType,
      });
    }
  }

  if (matchedMaterial) {
    return buildLocalAssistantResponse("select_material", language, {
      material: matchedMaterial,
      subject: matchedSubject || selectedSubjectSnapshot,
      material_type: matchedMaterial.type || materialType || "",
    });
  }

  if (matchedSubject) {
    return buildLocalAssistantResponse(
      looksLikeLocalAssistantMaterialsRequest(normalized) ? "open_materials" : "open_subject",
      language,
      {
        subject: matchedSubject,
        course_number: courseNumber || matchedSubject.course_number || null,
        material_type: materialType,
      },
    );
  }

  if (courseNumber) {
    return buildLocalAssistantResponse("open_course", language, {
      course_number: courseNumber,
      material_type: materialType,
    });
  }

  if (looksLikeLocalAssistantMaterialsRequest(normalized) || (materialType && containsAnyLocalAssistantPhrase(normalized, LOCAL_ASSISTANT_OPEN_WORDS))) {
    return buildLocalAssistantResponse("open_materials", language, {
      subject: selectedSubjectSnapshot,
      material: targetMaterialFromType || selectedMaterialSnapshot,
      course_number: selectedSubjectSnapshot?.course_number || null,
      material_type: materialType || targetMaterialFromType?.type || selectedMaterialSnapshot?.type || "",
    });
  }

  if (looksLikeLocalAssistantOpenTestPanelRequest(normalized, context)) {
    return buildLocalAssistantResponse("open_test", language, {
      subject: selectedSubjectSnapshot,
      material: matchedMaterial || targetMaterialFromType || selectedMaterialSnapshot,
      course_number: selectedSubjectSnapshot?.course_number || null,
      material_type: materialType || matchedMaterial?.type || targetMaterialFromType?.type || selectedMaterialSnapshot?.type || "",
      question_count: questionCount,
      duration_minutes: durationMinutes,
    });
  }

  return null;
}

async function sendAudioToAssistant(audioBlob, filename = "voice.webm") {
  const formData = new FormData();
  formData.append("audio", audioBlob, filename);
  formData.append("language", getSpeechLanguage());

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

  if (voiceCaptureMaxTimerId) {
    clearTimeout(voiceCaptureMaxTimerId);
    voiceCaptureMaxTimerId = 0;
  }

  if (voiceCaptureNoSpeechTimerId) {
    clearTimeout(voiceCaptureNoSpeechTimerId);
    voiceCaptureNoSpeechTimerId = 0;
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
  voiceRecognitionFallbackPending = false;
}

function stopMediaStream(stream) {
  stream?.getTracks?.().forEach(track => track.stop());
}

function isTouchVoiceDevice() {
  const userAgent = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent) || navigator.maxTouchPoints > 1;
}

function shouldUseRecorderFirstForVoice() {
  return Boolean(window.MediaRecorder && canUseMicrophoneApi() && isTouchVoiceDevice());
}

function canUseMicrophoneApi() {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

function getSupportedVoiceRecorderMimeType() {
  if (!window.MediaRecorder) {
    return "";
  }

  if (typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }

  return VOICE_RECORDER_MIME_TYPES.find(type => MediaRecorder.isTypeSupported(type)) || "";
}

function getVoiceRecorderFilename(mimeType) {
  if (/mp4/i.test(mimeType)) return "voice.mp4";
  if (/ogg/i.test(mimeType)) return "voice.ogg";
  return "voice.webm";
}

function getVoiceMicrophoneErrorMessage(error) {
  const errorName = error?.name || "";
  const errorMessage = error?.message || "";

  if (errorMessage === t("micSecureContext") || errorMessage === t("micUnavailable")) {
    return errorMessage;
  }

  if (["NotAllowedError", "PermissionDeniedError", "SecurityError"].includes(errorName)) {
    return t("micDenied");
  }

  if (["NotFoundError", "DevicesNotFoundError"].includes(errorName)) {
    return t("micUnavailable");
  }

  return errorMessage || t("micDenied");
}

function shouldFallbackToRecorderAfterRecognitionError(errorName) {
  return ["network", "service-not-allowed", "language-not-supported", "audio-capture"].includes(errorName);
}

async function requestVoiceMicrophoneStream() {
  if (!canUseMicrophoneApi()) {
    throw new Error(t("micUnavailable"));
  }

  if (!window.isSecureContext) {
    throw new Error(t("micSecureContext"));
  }

  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
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
    voiceInput.value = "";
    lastManualVoiceInputValue = "";
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

  applyAssistantTestConfig(assistantData);

  if (assistantData.action === "show_help") {
    setVoicePanelOpen(true);
    setVoiceHelpOpen(true);
    return;
  }

  if (assistantData.action === "clarify") {
    setVoicePanelOpen(true);
    return;
  }

  if (assistantData.action === "switch_language") {
    const nextRole = SUPPORTED_ROLES.includes(assistantData.target_role) ? assistantData.target_role : "";
    if (nextRole && nextRole !== selectedRole) {
      selectedRole = nextRole;
      roleMenu?.classList.add("hidden");
      await refreshInterfaceLanguage({ roleChanged: true });
    }
    return;
  }

  if (assistantData.action === "open_upload") {
    if (!selectedCourseNumber && assistantData.course_number) {
      await openCourseDisciplines(Number(assistantData.course_number), assistantData.subject_id || null);
    }
    if (!selectedCourseNumber) {
      return;
    }
    switchSubjectPanel("materials");
    isMaterialManagerOpen = true;
    isUploadMenuOpen = Boolean(selectedSubject) && !isMaterialUploading && !isMaterialDeleting;
    renderMaterialManagerPanel();
    renderMaterialPreview();
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
    await applyAssistantWorkspaceSelection(assistantData, {
      loadTestSession: false,
      renderSlides: false,
      renderTest: false,
      renderResults: false,
    });
    switchSubjectPanel("materials");
    renderMaterialPreview();
    return;
  }

  if (assistantData.action === "select_material") {
    await syncAssistantMaterialSelection(selectionPayload, {
      loadTestSession: false,
      renderSlides: false,
      renderTest: false,
      renderResults: false,
    });
    switchSubjectPanel("materials");
    renderMaterialPreview();
    return;
  }

  if (assistantData.action === "open_materials") {
    await syncAssistantMaterialSelection(selectionPayload, {
      loadTestSession: false,
      renderSlides: false,
      renderTest: false,
      renderResults: false,
    });
    switchSubjectPanel("materials");
    renderMaterialPreview();
    return;
  }

  if (assistantData.action === "open_test") {
    await syncAssistantMaterialSelection(selectionPayload, {
      loadTestSession: true,
      renderSlides: false,
      renderTest: false,
      renderResults: false,
    });
    switchSubjectPanel("test");
    renderTestBlock(false);
    return;
  }

  if (assistantData.action === "open_results") {
    await syncAssistantMaterialSelection(selectionPayload, {
      loadTestSession: true,
      renderSlides: false,
      renderTest: false,
      renderResults: false,
    });
    switchSubjectPanel("results");
    await renderResultsBlock();
    return;
  }

  if (assistantData.action === "open_results_sheet") {
    await syncAssistantMaterialSelection(selectionPayload, {
      loadTestSession: true,
      renderSlides: false,
      renderTest: false,
      renderResults: false,
    });
    switchSubjectPanel("results");
    await openResultsSheetDirect();
    return;
  }

  if (assistantData.action === "open_slides") {
    await syncAssistantMaterialSelection(selectionPayload, {
      loadTestSession: false,
      renderSlides: false,
      renderTest: false,
      renderResults: false,
    });
    switchSubjectPanel("slides");
    renderSlidesPreview();
    return;
  }

  if (assistantData.action === "generate_slides") {
    await applyAssistantWorkspaceSelection(assistantData, {
      loadTestSession: false,
      renderSlides: false,
      renderTest: false,
      renderResults: false,
    });
    await generateSlidesForSelectedMaterial();
    return;
  }

  if (assistantData.action === "generate_test") {
    switchSubjectPanel("test");
    await applyAssistantWorkspaceSelection(assistantData, {
      loadTestSession: true,
      renderSlides: false,
      renderTest: false,
      renderResults: false,
    });
    await createAiQuestions({
      questionCount: assistantData.question_count,
      durationMinutes: assistantData.duration_minutes,
    });
    return;
  }

  if (assistantData.action === "open_course") {
    return;
  }

  if (assistantData.action === "open_qr") {
    await syncAssistantMaterialSelection(selectionPayload, {
      loadTestSession: true,
      renderSlides: false,
      renderTest: false,
      renderResults: false,
    });
    switchSubjectPanel("test");
    if (!generatedQuestions.length) {
      await createAiQuestions({
        questionCount: assistantData.question_count,
        durationMinutes: assistantData.duration_minutes,
      });
    }
    if (generatedQuestions.length) {
      await showQr();
    }
    return;
  }

  if (assistantData.action === "start_test") {
    await syncAssistantMaterialSelection(selectionPayload, {
      loadTestSession: true,
      renderSlides: false,
      renderTest: false,
      renderResults: false,
    });
    switchSubjectPanel("test");
    if (!generatedQuestions.length) {
      await createAiQuestions({
        questionCount: assistantData.question_count,
        durationMinutes: assistantData.duration_minutes,
      });
    }
    if (generatedQuestions.length) {
      await openTestDirect();
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
  const isVoiceListening = state === "listening";

  if (voiceCore) {
    voiceCore.classList.toggle("listening", isVoiceListening);
  }

  const normalizedText = ["Дайын", "Готово"].includes(text) ? t("voiceReady") : text;
  if (voiceStatus) {
    voiceStatus.textContent = normalizedText;
  }
}

function sanitizeSpeechText(text) {
  return String(text || "")
    .replace(/["«»]/g, "")
    .replace(/\bQR\b/gi, roleText("кью ар код", "ку эр код", "queue ar code"))
    .replace(/\s+/g, " ")
    .trim();
}

function buildAssistantSpeechReply(assistantData, fallbackText = "") {
  const fallback = sanitizeSpeechText(fallbackText);
  if (!assistantData) {
    return fallback;
  }

  if (assistantData.action && assistantData.action !== "unknown") {
    const localActionReply = buildLocalAssistantActionReply(assistantData.action, selectedRole, assistantData);
    if (localActionReply) {
      return sanitizeSpeechText(localActionReply);
    }
  }

  if (selectedRole !== "kaz") {
    return fallback;
  }

  const subjectTitle = sanitizeSpeechText(assistantData.subject_title || "");
  const materialTitle = sanitizeSpeechText(assistantData.material_title || "");
  const courseNumber = Number(assistantData.course_number) || 0;

  const speechMap = {
    show_help: "Жарайды, көмек бөлімін ашамын.",
    go_home: "Жарайды, басты бетке өтемін.",
    go_back: "Жарайды, алдыңғы бетке қайтарамын.",
    open_materials: "Жарайды, материалдар бөлімін ашамын.",
    open_test: "Жарайды, тест бөлімін ашамын.",
    open_results: "Жарайды, нәтижелерді ашамын.",
    open_results_sheet: "Жарайды, нәтижелерді Google Sheets-та ашамын.",
    open_slides: "Жарайды, слайд бөлімін ашамын.",
    open_qr: "Жарайды, QR кодын ашамын.",
    start_test: "Жарайды, тестті іске қосамын.",
    generate_test: "Жарайды, тест дайындауды бастаймын.",
    generate_slides: "Жарайды, слайд дайындауды бастаймын.",
  };

  if (assistantData.action === "open_course" && courseNumber) {
    return `Жарайды, ${courseNumber}-курсты ашамын.`;
  }

  if (assistantData.action === "open_subject" && subjectTitle) {
    return `Жарайды, ${subjectTitle} пәнін ашамын.`;
  }

  if (assistantData.action === "select_material" && materialTitle) {
    return `Жарайды, ${materialTitle} материалын ашамын.`;
  }

  return speechMap[assistantData.action] || fallback;
}

function stopAssistantSpeechPlayback() {
  if (assistantSpeechAbortController) {
    assistantSpeechAbortController.abort();
    assistantSpeechAbortController = null;
  }

  if (assistantSpeechAudio) {
    assistantSpeechAudio.pause();
    assistantSpeechAudio.src = "";
    assistantSpeechAudio = null;
  }

  if (assistantSpeechObjectUrl) {
    URL.revokeObjectURL(assistantSpeechObjectUrl);
    assistantSpeechObjectUrl = "";
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function getAssistantSpeechAudioElement() {
  if (!assistantSpeechAudioElement) {
    assistantSpeechAudioElement = new Audio();
    assistantSpeechAudioElement.preload = "auto";
    assistantSpeechAudioElement.playsInline = true;
  }

  return assistantSpeechAudioElement;
}

async function unlockAssistantSpeechAudio() {
  if (isAssistantSpeechAudioUnlocked) {
    return;
  }

  try {
    const audio = getAssistantSpeechAudioElement();
    audio.muted = true;
    audio.src = SILENT_AUDIO_DATA_URI;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    isAssistantSpeechAudioUnlocked = true;
  } catch (error) {
    console.warn("Assistant speech audio unlock skipped:", error);
  }
}

function speakAssistantReplyWithBrowser(text) {
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
      voices.find(v => /kazakh|Т›Р°Р·Р°Т›/i.test(v.name || "")) ||
      null;
  } else if (selectedRole === "eng") {
    preferredVoice =
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang?.startsWith("en")) ||
      voices[0] ||
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

async function speakAssistantReply(text) {
  const cleanText = sanitizeSpeechText(text);
  if (!cleanText) {
    return;
  }

  stopAssistantSpeechPlayback();

  const abortController = new AbortController();
  assistantSpeechAbortController = abortController;

  try {
    const audioResponse = await requestAssistantSpeechAudio(cleanText, abortController.signal);
    if (assistantSpeechAbortController !== abortController) {
      return;
    }

    assistantSpeechObjectUrl = URL.createObjectURL(audioResponse.blob);
    const audio = getAssistantSpeechAudioElement();
    audio.pause();
    audio.src = assistantSpeechObjectUrl;
    audio.muted = false;
    assistantSpeechAudio = audio;

    const cleanup = () => {
      if (assistantSpeechAudio === audio) {
        assistantSpeechAudio = null;
      }
      if (assistantSpeechAbortController === abortController) {
        assistantSpeechAbortController = null;
      }
      if (assistantSpeechObjectUrl) {
        URL.revokeObjectURL(assistantSpeechObjectUrl);
        assistantSpeechObjectUrl = "";
      }
    };

    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });

    await audio.play();
  } catch (error) {
    if (error?.name === "AbortError") {
      return;
    }

    console.warn("Assistant speech playback fallback:", error);
    if (assistantSpeechAbortController === abortController) {
      assistantSpeechAbortController = null;
    }
    if (assistantSpeechObjectUrl) {
      URL.revokeObjectURL(assistantSpeechObjectUrl);
      assistantSpeechObjectUrl = "";
    }
    assistantSpeechAudio = null;
    speakAssistantReplyWithBrowser(cleanText);
  }
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

async function startMediaRecorderCapture(existingStream = null) {
  if (!window.MediaRecorder) {
    throw new Error(t("voiceUnavailable"));
  }

  const stream = existingStream || await requestVoiceMicrophoneStream();
  const mimeType = getSupportedVoiceRecorderMimeType();
  const recorderOptions = mimeType ? { mimeType } : undefined;
  const recordingFilename = getVoiceRecorderFilename(mimeType);

  recordedChunks = [];
  mediaRecorder = recorderOptions
    ? new MediaRecorder(stream, recorderOptions)
    : new MediaRecorder(stream);
  voiceSilenceStartedAt = 0;
  voiceHasDetectedSpeech = false;

  mediaRecorder.onstart = () => {
    setVoiceState("listening", t("voiceListening"));

    voiceCaptureNoSpeechTimerId = window.setTimeout(() => {
      voiceCaptureNoSpeechTimerId = 0;
      if (mediaRecorder && mediaRecorder.state === "recording" && !voiceHasDetectedSpeech) {
        stopVoiceCapture();
      }
    }, VOICE_INITIAL_NO_SPEECH_STOP_MS);

    voiceCaptureMaxTimerId = window.setTimeout(() => {
      voiceCaptureMaxTimerId = 0;
      if (mediaRecorder && mediaRecorder.state === "recording") {
        stopVoiceCapture();
      }
    }, VOICE_CAPTURE_MAX_MS);
  };

  mediaRecorder.ondataavailable = (eventData) => {
    if (eventData.data.size > 0) {
      recordedChunks.push(eventData.data);
    }
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(recordedChunks, { type: mediaRecorder?.mimeType || mimeType || "audio/webm" });

    try {
      if (isVoiceCaptureCancelled) {
        return;
      }

      setVoiceState("idle", t("voiceTranscribing"));
      const data = await sendAudioToAssistant(audioBlob, recordingFilename);
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
      stopMediaStream(stream);
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
  stopAssistantSpeechPlayback();
  unlockAssistantSpeechAudio();

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
    let microphoneStream = null;
    try {
      microphoneStream = await requestVoiceMicrophoneStream();
      setVoiceState("listening", t("voiceListening"));
    } catch (permissionError) {
      if (!recognition) {
        throw permissionError;
      }
      console.warn("Microphone permission preflight failed, trying speech recognition:", permissionError);
    }

    if (microphoneStream && shouldUseRecorderFirstForVoice()) {
      await startMediaRecorderCapture(microphoneStream);
      microphoneStream = null;
      return;
    }

    if (recognition) {
      try {
        stopMediaStream(microphoneStream);
        microphoneStream = null;
        recognition.start();
        return;
      } catch (recognitionError) {
        console.warn("Speech recognition start failed, falling back to recorder:", recognitionError);
      }
    }

    try {
      if (!microphoneStream) {
        microphoneStream = await requestVoiceMicrophoneStream();
      }
      await startMediaRecorderCapture(microphoneStream);
      microphoneStream = null;
    } finally {
      stopMediaStream(microphoneStream);
    }
  } catch (error) {
    console.error("MIC ACCESS ERROR:", error);
    setVoiceState("idle", getVoiceMicrophoneErrorMessage(error));
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

  stopAssistantSpeechPlayback();

  const localAssistantData = resolveLocalAssistantCommand(cleanTranscript);
  if (localAssistantData) {
    try {
      const spokenReply = buildAssistantSpeechReply(localAssistantData, localAssistantData.reply || "");
      const visibleReply = localAssistantData.reply || spokenReply;

      if (visibleReply) {
        setVoiceState("idle", visibleReply);
      }

      if (spokenReply) {
        speakAssistantReply(spokenReply);
      }

      if (localAssistantData.action) {
        await handleAssistantAction(localAssistantData);
      }
    } catch (error) {
      console.error("Local assistant command error:", error);
      const detailedReply = String(error?.message || "").trim();
      const visibleReply = detailedReply || t("voiceRequestError");
      const spokenReply = detailedReply || t("voiceSorry");
      setVoiceState("idle", visibleReply);
      speakAssistantReply(spokenReply);
    }
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
    const visibleReply = data.action && data.action !== "unknown" ? spokenReply : (data.reply || spokenReply);

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

    voiceRecognitionFallbackPending = shouldFallbackToRecorderAfterRecognitionError(event.error);
    const permissionDenied = ["not-allowed", "permission-denied"].includes(event.error);
    const message = voiceRecognitionFallbackPending
      ? t("voiceListening")
      : permissionDenied
        ? t("micDenied")
        : t("errorLabel", { error: event.error });
    setVoiceState("idle", message);
  };

  recognition.onend = async () => {
    isListening = false;
    if (voiceCore) {
      voiceCore.classList.remove("listening");
    }
    const completeTranscript = String(voiceRecognitionLastTranscript || "").trim();
    const shouldSubmitTranscript = !isVoiceCaptureCancelled && completeTranscript;
    const shouldStartRecorderFallback = !isVoiceCaptureCancelled && !completeTranscript && voiceRecognitionFallbackPending;
    resetVoiceRecognitionSession();
    voiceInterimBaseText = "";

    if (shouldStartRecorderFallback) {
      try {
        await startMediaRecorderCapture();
      } catch (error) {
        console.error("MIC FALLBACK ERROR:", error);
        setVoiceState("idle", getVoiceMicrophoneErrorMessage(error));
        resetVoiceDraftSession();
        isVoiceCaptureCancelled = false;
      }
      return;
    }

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

if (authLanguageSwitch) {
  authLanguageSwitch.addEventListener("change", async () => {
    const nextRole = SUPPORTED_ROLES.includes(authLanguageSwitch.value) ? authLanguageSwitch.value : "kaz";
    if (nextRole === selectedRole) return;

    selectedRole = nextRole;
    await refreshInterfaceLanguage({ roleChanged: true });
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
    selectedRole = SUPPORTED_ROLES.includes(btn.dataset.roleValue) ? btn.dataset.roleValue : "kaz";
    roleMenu.classList.add("hidden");
    await refreshInterfaceLanguage({ roleChanged: true });
  });
});

if (courseBackBtn) {
  courseBackBtn.addEventListener("click", showCourseStage);
}

if (homeLogoBtn) {
  homeLogoBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    navigateToMainPage();
  });
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
    cancelActiveTestGeneration();
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
    cancelActiveTestGeneration();
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
  openSlidesBtn.addEventListener("click", () => {
    isMaterialManagerOpen = false;
    renderMaterialManagerPanel();
    switchSubjectPanel("slides");
    renderSlidesPreview();
  });
}

async function generateSlidesForSelectedMaterial({ force = false, slideCount = null } = {}) {
  const currentMaterial = getSelectedMaterial();

  switchSubjectPanel("slides");

  if (!currentMaterial) {
    setSlidesStatus(t("slidesSelectPrompt"), "error");
    renderSlidesPreview();
    return;
  }

  if (currentMaterial.type !== "lecture") {
    setSlidesStatus(t("slidesLectureOnly"), "error");
    renderSlidesPreview();
    return;
  }

  if (isSlidesBusy()) {
    return;
  }

  if (!force && (currentMaterial.slidesEmbedUrl || currentMaterial.slidesUrl)) {
    renderSlidesPreview();
    return;
  }

  const nextSlidesConfig = slideCount != null
    ? clampSlidesConfig({ ...slidesConfig, slideCount })
    : commitSlidesConfigFromInput({ persist: true });
  slidesConfig = nextSlidesConfig;
  saveStoredSlidesConfig();

  if (
    force &&
    (currentMaterial.slidesEmbedUrl || currentMaterial.slidesUrl) &&
    currentMaterial.slidesCount &&
    currentMaterial.slidesCount !== slidesConfig.slideCount
  ) {
    slidesErrorMessage = t("slidesCountChangeUnavailable");
    isSlidesSettingsOpen = true;
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
        slide_count: slidesConfig.slideCount,
        template_id: slidesConfig.templateId,
      })
    });

    upsertSelectedSubjectMaterial(updatedMaterial);
    isSlidesSettingsOpen = false;
    setSlidesStatus("");
    renderSlidesPreview();
    saveTeacherAppState();
  } catch (error) {
    console.error("AI SLIDES ERROR:", error);
    slidesErrorMessage = getAiServiceErrorMessage(error, t("slidesError"));
  } finally {
    isSlidesGenerating = false;
    updateActionButtonsState();
    renderSlidesPreview();
  }
}

async function resetSlidesForSelectedMaterial() {
  const currentMaterial = getSelectedMaterial();

  switchSubjectPanel("slides");

  if (!currentMaterial || !currentMaterial.slidesPresentationId || isSlidesBusy()) {
    renderSlidesPreview();
    return;
  }

  slidesErrorMessage = "";
  slidesConfig = clampSlidesConfig({
    slideCount: currentMaterial.slidesCount || slidesConfig.slideCount,
    templateId: currentMaterial.slidesTemplateId || slidesConfig.templateId,
  });
  isSlidesSettingsOpen = true;
  updateActionButtonsState();
  renderSlidesPreview();
}

function setTestPanelInfo(message = "", state = "neutral") {
  if (!testInfoText || !testInfoCard) return;

  const options = arguments[2] && typeof arguments[2] === "object" ? arguments[2] : {};
  const stateLabel = String(options.stateLabel || "").trim();
  const metaText = String(options.metaText || message || "").trim();
  const hintText = String(options.hintText || "").trim();
  const timerText = String(options.timerText || "").trim();
  const actionLabel = String(options.actionLabel || "").trim();
  const hasContent = Boolean(stateLabel || metaText || hintText || timerText);

  testInfoCard.classList.toggle("hidden", !hasContent);
  testInfoCard.dataset.state = state || "neutral";

  if (testInfoState) {
    testInfoState.textContent = stateLabel;
    testInfoState.classList.toggle("hidden", !stateLabel);
  }

  testInfoText.textContent = metaText;

  if (testInfoTimer) {
    testInfoTimer.textContent = timerText;
    testInfoTimer.classList.toggle("hidden", !timerText);
  }

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

  updateTestInfoRowVisibility();
}

function setTestLoadingState(visible = false) {
  if (!testLoadingCard) return;

  if (testLoadingTitle) {
    testLoadingTitle.textContent = roleText("ИИ тест жасау басталды", "AI-тест формируется", "AI test is being prepared");
  }

  if (testLoadingText) {
    testLoadingText.textContent = roleText(
      "Параметрлер бойынша сұрақтар дайындалып жатыр",
      "Вопросы готовятся по выбранным параметрам",
      "Questions are being prepared with the selected settings",
    );
  }

  testLoadingCard.classList.toggle("hidden", !visible);
  updateTestInfoRowVisibility();
}

function setTestQrCaption(title = "", text = "", visible = false, timerText = "") {
  if (!testQrCaption) return;

  const hasContent = Boolean(visible && (title || text || timerText));
  testQrCaption.classList.toggle("hidden", !hasContent);

  if (testQrCaptionTitle) {
    testQrCaptionTitle.textContent = title || "";
  }

  if (testQrCaptionTimer) {
    testQrCaptionTimer.textContent = timerText || "";
    testQrCaptionTimer.classList.toggle("hidden", !timerText);
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
  if (!shouldShowTeacherTestCard(session)) {
    stopTeacherTestStatusTimer();
    setTestPanelInfo("");
    setTestQrCaption("", "", false, "");
    return;
  }

  const info = getTeacherTestInfoState(session);
  setTestPanelInfo("", info.state, {
    stateLabel: info.cardLabel || info.label,
    metaText: info.meta,
    hintText: info.hint,
    timerText: info.timerLabel,
    actionLabel: info.actionLabel,
  });

  if (testQrBoard?.classList.contains("is-qr-mode")) {
    setTestQrCaption(info.qrTitle, info.qrHint, true, info.qrTimer);
  }
}

async function requestAssistantSpeechAudio(text, signal) {
  return fetchAudioBlob(`${API_BASE}/assistant/speak/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      language: selectedRole,
    }),
    signal,
  });
}

function startTeacherTestStatusTimer(session = currentTestSession) {
  stopTeacherTestStatusTimer();

  if (!session || getNormalizedTestSessionStatus(session) !== "live") {
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
      startTeacherTestCardRemoval();
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
}

async function createAiQuestions(options = {}) {
  const { questionCount = null, durationMinutes = null } = options;
  const currentMaterial = getSelectedMaterial();
  const currentMaterialId = Number(currentMaterial?.id || 0) || null;
  const previousSessionSnapshot = currentTestSession ? JSON.parse(JSON.stringify(currentTestSession)) : null;

  if (questionCount != null || durationMinutes != null) {
    testConfig = clampTestConfig(
      questionCount ?? testConfig.questionCount,
      durationMinutes ?? testConfig.durationMinutes,
    );
    syncTestConfigInputs();
    saveStoredTestConfig();
  }

  switchSubjectPanel("test");
  setTestPaneMode("settings");

  if (!currentMaterial) {
    setTestPanelInfo(t("selectMaterialFirst"), "error");
    renderTestSettingsPanel();
    return;
  }

  isTestGenerating = true;
  cancelActiveTestGeneration({ keepUiState: true });
  const abortController = new AbortController();
  let didTimeout = false;
  const timeoutId = window.setTimeout(() => {
    didTimeout = true;
    abortController.abort();
  }, TEST_GENERATION_TIMEOUT_MS);
  testGenerationAbortController = abortController;
  activeTestGenerationMaterialId = currentMaterialId;
  activeTestGenerationStartedAt = Date.now() - 5000;
  activeTestGenerationPreviousSessionId = previousSessionSnapshot?.id || null;
  startTestGenerationWatchdog(currentMaterialId);
  clearTeacherTestCardCleanupTimer();
  isTeacherTestCardDisintegrating = false;
  visibleTeacherTestSessionId = null;
  currentTestSession = null;
  generatedQuestions = [];
  testGenerationNotice = "";
  generateTestBtn.disabled = true;
  setTestPanelInfo("");
  renderTestSettingsPanel();
  renderTestBlock(false);

  try {
    commitTestConfigFromInputs({ syncInputs: true, persist: true });

    const data = await fetchJSON(`${API_BASE}/materials/${currentMaterial.id}/generate-test/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        language: selectedRole,
        question_count: testConfig.questionCount,
      }),
      signal: abortController.signal,
    });

    if (!Array.isArray(data.test) || !data.test.length) {
      throw new Error(roleText(
        "Backend тест сұрақтарын қайтара алмады.",
        "Backend не вернул вопросы теста.",
        "The backend did not return test questions.",
      ));
    }

    generatedQuestions = data.test.map((item, index) => ({
      id: index + 1,
      question: item.question,
      options: Array.isArray(item.options) ? item.options : [],
      answer: resolveQuestionAnswerIndex(item),
      answerRaw: item.answer || "",
    }));

    const invalidQuestion = generatedQuestions.find(q => !q.question || q.options.length !== 4 || q.answer < 0);
    if (invalidQuestion) {
      throw new Error(roleText(
        "AI тест құрылымы толық емес. Қайта дайындап көріңіз.",
        "Структура AI-теста неполная. Попробуйте подготовить заново.",
        "The AI test structure is incomplete. Try preparing it again.",
      ));
    }

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
      }),
      signal: abortController.signal,
    });

    if (abortController.signal.aborted) {
      return;
    }

    hydrateCurrentTestSession({
      ...sessionData,
      material: currentMaterial.id,
      questions_json: generatedQuestions.map((q) => serializeGeneratedQuestion(q)),
    });
    visibleTeacherTestSessionId = currentTestSession?.id || null;
    testGenerationNotice = "";

    if (Number(getSelectedMaterial()?.id || 0) === currentMaterialId) {
      renderTestBlock(false);
      saveTeacherAppState();
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      if (!didTimeout) {
        return;
      }
      error = new Error(roleText(
        "Тест дайындау тым ұзаққа созылды. Интернет, Gemini quota немесе Google Forms жағын тексеріп, қайта көріңіз.",
        "Подготовка теста заняла слишком много времени. Проверьте интернет, квоту Gemini или Google Forms и попробуйте снова.",
        "Test preparation took too long. Check the internet connection, Gemini quota, or Google Forms and try again.",
      ));
    }

    console.error("AI TEST ERROR:", error);
    setTestLoadingState(false);
    if (previousSessionSnapshot && Number(getSelectedMaterial()?.id || 0) === currentMaterialId) {
      hydrateCurrentTestSession(previousSessionSnapshot);
      const fallbackStatus = getNormalizedTestSessionStatus(currentTestSession);
      visibleTeacherTestSessionId = ["ready", "live"].includes(fallbackStatus) ? currentTestSession?.id || null : null;
      testGenerationNotice = getTestRegenerationFailedMessage(error);
      renderTestBlock(false);
    } else if (Number(getSelectedMaterial()?.id || 0) === currentMaterialId) {
      testGenerationNotice = getAiServiceErrorMessage(error, t("aiTestError"));
      setTestPanelInfo(testGenerationNotice, "error");
    }
  } finally {
    window.clearTimeout(timeoutId);
    const isCurrentGeneration = testGenerationAbortController === abortController;

    if (isCurrentGeneration) {
      testGenerationAbortController = null;
      activeTestGenerationMaterialId = null;
      activeTestGenerationStartedAt = 0;
      activeTestGenerationPreviousSessionId = null;
      stopTestGenerationWatchdog();

      isTestGenerating = false;
      if (generateTestBtn) {
        generateTestBtn.disabled = false;
      }
      if (Number(getSelectedMaterial()?.id || 0) === currentMaterialId) {
        renderTestSettingsPanel();
        renderTestBlock(Boolean(testQrBoard?.classList.contains("is-qr-mode")));
      }
      updateActionButtonsState();
    }
  }
}

function renderTestSettingsPanel() {
  const material = getSelectedMaterial();
  const canPrepareTest = Boolean(material);
  const hasGeneratedTest = shouldShowTeacherTestCard(currentTestSession);

  syncTestConfigInputs();

  if (buildTestBtn) {
    buildTestBtn.disabled = !canPrepareTest || isTestGenerating;
    buildTestBtn.textContent = isTestGenerating
      ? roleText("Дайындалып жатыр...", "Подготовка...", "Preparing...")
      : hasGeneratedTest
        ? roleText("Қайта дайындау", "Подготовить заново", "Prepare again")
        : roleText("Тестті дайындау", "Подготовить тест", "Prepare test");
  }

  if (previewTestBtn) {
    previewTestBtn.disabled = !canPrepareTest || !hasGeneratedTest || isTestGenerating;
    previewTestBtn.classList.toggle("hidden", !canPrepareTest || !hasGeneratedTest);
  }

  if (testQuestionCountInput) {
    testQuestionCountInput.disabled = !canPrepareTest || isTestGenerating;
  }

  if (testDurationInput) {
    testDurationInput.disabled = !canPrepareTest || isTestGenerating;
  }

  if (testSettingsTitle) {
    testSettingsTitle.textContent = !canPrepareTest
      ? roleText("Материал таңдалмады", "Материал не выбран", "No material selected")
      : roleText("Тест параметрлері", "Параметры теста", "Test settings");
  }

  if (testQuestionCountLabel) {
    testQuestionCountLabel.textContent = roleText("Сұрақ саны", "Количество вопросов", "Number of questions");
  }

  if (testQuestionCountHint) {
    testQuestionCountHint.textContent = roleText("Неше сұрақ жасалады", "Сколько вопросов подготовить", "How many questions to prepare");
  }

  if (testQuestionCountUnit) {
    testQuestionCountUnit.textContent = roleText("сұрақ", "вопр.", "questions");
  }

  if (testDurationLabel) {
    testDurationLabel.textContent = roleText("Жауап қабылдау уақыты", "Время приема ответов", "Answer time");
  }

  if (testDurationHint) {
    testDurationHint.textContent = roleText("Уақыт біткенде тест жабылады", "После него тест закроется", "The test closes when time is over");
  }

  if (testDurationUnit) {
    testDurationUnit.textContent = roleText("мин", "мин", "min");
  }

  if (testSettingsHint) {
    const hintText = testGenerationNotice || (!canPrepareTest ? t("selectMaterialFirst") : "");
    testSettingsHint.textContent = hintText;
    testSettingsHint.classList.toggle("hidden", !hintText);
  }
}

function renderTestBlock(showQrInline = false) {
  const material = getSelectedMaterial();
  const qrMode = showQrInline === true;

  renderTestSettingsPanel();
  setTestPaneMode(qrMode ? "qr" : "settings");
  setTestLoadingState(Boolean(isTestGenerating && material));

  const resetQrState = () => {
    if (qrImageInline) {
      qrImageInline.style.display = "none";
    }
    setTestQrCaption("", "", false, "");
  };

  if (!material) {
    stopTeacherTestStatusTimer();
    setTestLoadingState(false);
    setTestPanelInfo("");
    resetQrState();
    setTestPaneMode("settings");
    updateActionButtonsState();
    return;
  }

  if (material.type !== "lecture") {
    stopTeacherTestStatusTimer();
    setTestLoadingState(false);
    setTestPanelInfo(t("testLectureOnly"), "error");
    resetQrState();
    setTestPaneMode("settings");
    updateActionButtonsState();
    return;
  }

  if (isTestGenerating) {
    stopTeacherTestStatusTimer();
    setTestPanelInfo("");
    resetQrState();
    setTestPaneMode("settings");
    updateActionButtonsState();
    return;
  }

  setTestLoadingState(false);

  if (!generatedQuestions.length || !shouldShowTeacherTestCard(currentTestSession)) {
    stopTeacherTestStatusTimer();
    setTestPanelInfo("");
    resetQrState();
    setTestPaneMode("settings");
    updateActionButtonsState();
    return;
  }

  const launchUrl = getCurrentTestLaunchUrl();
  const info = getTeacherTestInfoState(currentTestSession);
  const canDisplayQr = qrMode && info.state === "live" && Boolean(launchUrl);

  syncTeacherTestPanelInfo(currentTestSession);

  if (info.state === "live") {
    startTeacherTestStatusTimer(currentTestSession);
  } else {
    stopTeacherTestStatusTimer();
  }

  if (!launchUrl) {
    resetQrState();
    updateActionButtonsState();
    return;
  }

  if (canDisplayQr && qrImageInline) {
    qrImageInline.src = buildInlineQrUrl(launchUrl);
    qrImageInline.style.display = "block";
    setTestQrCaption(info.qrTitle, info.qrHint, true, info.qrTimer);
  } else {
    resetQrState();
    setTestQrCaption(info.qrTitle, info.qrHint, qrMode, info.qrTimer);
  }

  setTestPaneMode(qrMode ? "qr" : "settings");
  updateActionButtonsState();
}

async function launchTeacherTestFromCard() {
  const material = getSelectedMaterial();
  if (!material || material.type !== "lecture" || !shouldShowTeacherTestCard(currentTestSession)) {
    renderTestBlock(false);
    return;
  }

  try {
    const info = getTeacherTestInfoState(currentTestSession);
    if (info.state === "live") {
      await showQr();
      return;
    }

    if (info.state === "ready") {
      await launchCurrentTestSession();
    }
    renderTestBlock(false);
  } catch (error) {
    console.error("TEST START ERROR:", error);
    setTestPanelInfo(error?.message || t("aiTestError"), "error");
    renderTestBlock(false);
  }
}

async function showQr() {
  const material = getSelectedMaterial();
  if (!material || material.type !== "lecture" || !shouldShowTeacherTestCard(currentTestSession)) {
    renderTestBlock(false);
    return;
  }

  try {
    const info = getTeacherTestInfoState(currentTestSession);
    if (info.state === "ready") {
      await launchCurrentTestSession();
    } else if (info.state === "done") {
      renderTestBlock(false);
      return;
    }
    renderTestBlock(true);
  } catch (error) {
    console.error("TEST QR OPEN ERROR:", error);
    setTestPanelInfo(error?.message || t("aiTestError"), "error");
    renderTestBlock(false);
  }
}

async function openTestDirect() {
  const material = getSelectedMaterial();
  if (!material || !shouldShowTeacherTestCard(currentTestSession)) {
    return;
  }

  try {
    const info = getTeacherTestInfoState(currentTestSession);
    if (info.state === "ready") {
      await launchCurrentTestSession();
    } else if (info.state === "done") {
      renderTestBlock(false);
      return;
    }

    const launchUrl = getCurrentTestLaunchUrl();
    if (!launchUrl) {
      throw new Error(roleText("Тест сілтемесі табылмады.", "Ссылка на тест не найдена.", "Test link was not found."));
    }

    window.open(launchUrl, "_blank", "noopener");
    renderTestBlock(false);
  } catch (error) {
    console.error("TEST DIRECT OPEN ERROR:", error);
    setTestPanelInfo(error?.message || t("aiTestError"), "error");
  }
}

function startPublicTestTimer() {
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
}

function renderPublicTestState() {
  if (!publicTestView) return;

  const session = publicTestSession;
  const attempt = publicTestAttempt;
  const sessionStatus = String(session?.session_status || "").toLowerCase();
  const remainingSeconds = getSessionRemainingSeconds(session);

  publicTestTitle.textContent = session?.title || roleText("Тест", "Тест", "Test");
  publicTestCourse.textContent = session?.discipline_title || roleText("Тест сессиясы", "Тестовая сессия", "Test session");
  publicTestMeta.textContent = session
    ? `${session.material_title} · ${session.question_count} ${roleText("сұрақ", "вопросов", "questions")} · ${session.duration_minutes} ${roleText("мин", "мин", "min")}`
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
        roleText(
          "Тест әлі іске қосылған жоқ. Оқытушы QR-ды ашқаннан кейін ғана бастай аласыз.",
          "Тест еще не запущен. Начать можно только после того, как преподаватель откроет QR.",
          "The test has not started yet. You can begin only after the teacher opens the QR.",
        ),
        "info",
      );
      return;
    }

    if (sessionStatus === "expired") {
      publicTestStartBtn.disabled = true;
      publicTestTimer.textContent = "00:00";
      setPublicTestStatus(
        roleText(
          "Тест жабылды. Белгіленген уақыт аяқталды.",
          "Тест закрыт. Отведенное время закончилось.",
          "The test is closed. The allotted time has ended.",
        ),
        "error",
      );
      return;
    }

    setPublicTestStatus(
      roleText(
        `Тест ашық. Жабылуына ${formatCountdown(remainingSeconds)} қалды.`,
        `Тест открыт. До закрытия осталось ${formatCountdown(remainingSeconds)}.`,
        `The test is open. ${formatCountdown(remainingSeconds)} left until closing.`,
      ),
      "info",
    );
    return;
  }

  if (attempt.status === "submitted") {
    publicTestStartCard.classList.add("hidden");
    renderPublicResultCard(attempt);
    setPublicTestStatus(
      roleText(
        "Бұл құрылғы үшін тест бұрын тапсырылған.",
        "Для этого устройства тест уже был отправлен.",
        "The test has already been submitted from this device.",
      ),
      "success",
    );
    publicTestTimer.textContent = sessionStatus === "live" ? formatCountdown(remainingSeconds) : "00:00";
    persistPublicAttemptState();
    return;
  }

  if (attempt.status === "expired" || sessionStatus === "expired") {
    publicTestStartCard.classList.add("hidden");
    publicTestResultCard.classList.remove("hidden");
    publicTestResultCard.innerHTML = `<p style="color:#fff;">${roleText("Тест уақыты аяқталды. Енді тапсыру мүмкін емес.", "Время теста истекло. Отправить ответы больше нельзя.", "Test time is over. You can no longer submit answers.")}</p>`;
    setPublicTestStatus(
      roleText(
        "Уақыт аяқталды. Бұл құрылғыдан тестке қайта кіруге болмайды.",
        "Время истекло. Повторно войти в тест с этого устройства нельзя.",
        "Time is over. This device cannot re-enter the test.",
      ),
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
    roleText(
      `Тест жүріп жатыр. Жабылуына ${formatCountdown(remainingSeconds)} қалды.`,
      `Тест запущен. До закрытия осталось ${formatCountdown(remainingSeconds)}.`,
      `The test is in progress. ${formatCountdown(remainingSeconds)} left until closing.`,
    ),
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

  const params = new URLSearchParams();
  if (publicTestAttemptToken) {
    params.set("attempt_token", publicTestAttemptToken);
  }
  params.set("device_id", getPublicTestDeviceId());

  const query = params.toString() ? `?${params.toString()}` : "";
  const sessionPayload = await fetchJSON(`${API_BASE}/results/public-test/${publicTestSessionToken}/${query}`);
  publicTestSession = sessionPayload;
  publicTestAttempt = sessionPayload.attempt || null;

  if (publicTestSession?.language && SUPPORTED_ROLES.includes(publicTestSession.language)) {
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
}

async function startPublicTest() {
  if (!publicTestSessionToken) return;

  const studentName = publicTestStudentNameInput.value.trim();
  if (!studentName) {
    setPublicTestStatus(
      roleText("Аты-жөніңізді енгізіңіз.", "Введите имя и фамилию.", "Enter your full name."),
      "error",
    );
    publicTestStudentNameInput.focus();
    return;
  }

  publicTestStartBtn.disabled = true;
  setPublicTestStatus(roleText("Тест ашылып жатыр...", "Тест открывается...", "Opening the test..."), "info");

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
      error.message || roleText("Тестті бастау мүмкін болмады.", "Не удалось начать тест.", "Could not start the test."),
      "error",
    );
  } finally {
    publicTestStartBtn.disabled = false;
  }
}

async function submitPublicTest() {
  if (!publicTestSessionToken || !publicTestAttemptToken) return;

  publicTestSubmitBtn.disabled = true;
  setPublicTestStatus(roleText("Жауаптар жіберіліп жатыр...", "Ответы отправляются...", "Submitting answers..."), "info");

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
      error.message || roleText("Тестті тапсыру мүмкін болмады.", "Не удалось отправить тест.", "Could not submit the test."),
      "error",
    );
  } finally {
    publicTestSubmitBtn.disabled = false;
  }
}
if (buildTestBtn) {
  buildTestBtn.addEventListener("click", createAiQuestions);
}

if (previewTestBtn) {
  previewTestBtn.addEventListener("click", () => {
    if (!shouldShowTeacherTestCard(currentTestSession)) return;
    renderQuestionModal(false);
    openModal(testModal);
  });
}

if (launchTestBtn) {
  launchTestBtn.addEventListener("click", () => {
    if (!shouldShowTeacherTestCard(currentTestSession)) return;
    launchTeacherTestFromCard();
  });
}

if (testQuestionCountInput) {
  const commitQuestionCount = () => {
    commitTestConfigFromInputs({ syncInputs: true, persist: true });
    renderTestSettingsPanel();
  };

  testQuestionCountInput.addEventListener("change", commitQuestionCount);
  testQuestionCountInput.addEventListener("blur", commitQuestionCount);
}

if (testDurationInput) {
  const commitDuration = () => {
    commitTestConfigFromInputs({ syncInputs: true, persist: true });
    renderTestSettingsPanel();
  };

  testDurationInput.addEventListener("change", commitDuration);
  testDurationInput.addEventListener("blur", commitDuration);
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
    if (!shouldShowTeacherTestCard(currentTestSession)) return;

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

if (regenerateSlidesBtn) {
  regenerateSlidesBtn.addEventListener("click", resetSlidesForSelectedMaterial);
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
  let lastVoiceCoreTouchAt = 0;
  const handleVoiceCoreActivate = (event) => {
    if (event.type === "touchend") {
      lastVoiceCoreTouchAt = Date.now();
    } else if (event.type === "click" && Date.now() - lastVoiceCoreTouchAt < 500) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    toggleListening(event);
  };

  voiceCore.addEventListener("click", handleVoiceCoreActivate);
  voiceCore.addEventListener("touchend", handleVoiceCoreActivate, { passive: false });
}

if (voiceSendBtn) {
  voiceSendBtn.addEventListener("click", async () => {
    await unlockAssistantSpeechAudio();
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
    const isPlainEnter = (event.key === "Enter" || event.code === "NumpadEnter")
      && !event.shiftKey
      && !event.altKey
      && !event.ctrlKey
      && !event.metaKey;

    if (!isPlainEnter || event.isComposing || event.keyCode === 229) {
      return;
    }

    event.preventDefault();
    await submitVoiceInput();
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
    if (modal === authModal && shouldShowAuthGate()) return;
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
  loadStoredSlidesConfig();
  applyStaticTranslations();
  renderProfile();
  renderAuthState();

  if (await initPublicTestMode()) {
    return;
  }

  handleDriveReturnParams();
  const status = await loadDriveStatus();

  if (!status.connected) {
    coursesData = [];
    if (courseGrid) courseGrid.innerHTML = "";
    return;
  }

  await loadCoursesFromApi();
  initSpeechRecognition();
  setVoiceState("idle", t("voiceReady"));
}

bootstrapApp();

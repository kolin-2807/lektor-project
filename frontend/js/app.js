const API_BASE = "http://127.0.0.1:8000/api";

const profileState = {
  fullName: "Каламан Ерболат Тлеуханұлы",
  roleLabel: "Лектор: ст.преподаватель",
  roleShort: "ст.преподаватель",
  username: "kalaman_erbolat",
  email: "kalaman@university.kz",
  bio: "Ақпараттық қауіпсіздік және бағдарламалау пәндері бойынша оқытушы.",
  avatarUrl: ""
};

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
    disciplineMenu: "Пән әрекеттері",
    disciplineDelete: "Жою",
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
    uploadMaterial: "Материал қосу",
    connectDrive: "Google Drive қосу",
    driveConnected: ({ email }) => `Google Drive қосылды: ${email}`,
    driveNotConnected: "Google Drive әлі қосылмаған.",
    driveNotConfigured: "Google Drive OAuth әлі бапталмаған.",
    driveConnectError: "Google Drive қосу кезінде қате шықты.",
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
    disciplineMenu: "Действия дисциплины",
    disciplineDelete: "Удалить",
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
    uploadMaterial: "Добавить материал",
    connectDrive: "Подключить Google Drive",
    driveConnected: ({ email }) => `Google Drive подключен: ${email}`,
    driveNotConnected: "Google Drive еще не подключен.",
    driveNotConfigured: "Google Drive OAuth еще не настроен.",
    driveConnectError: "Не удалось подключить Google Drive.",
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

const DISCIPLINE_THEMES = [
  {
    coverClass: "discipline-cover-1",
    background: "linear-gradient(135deg, #275fa0 0%, #3e87d5 52%, #1c3e6d 100%)"
  },
  {
    coverClass: "discipline-cover-2",
    background: "linear-gradient(135deg, #127277 0%, #27a0a1 52%, #114a54 100%)"
  },
  {
    coverClass: "discipline-cover-3",
    background: "linear-gradient(135deg, #c1792a 0%, #e5a548 52%, #8f541d 100%)"
  },
  {
    coverClass: "discipline-cover-4",
    background: "linear-gradient(135deg, #3554a6 0%, #6b7ce8 54%, #262f73 100%)"
  },
  {
    coverClass: "discipline-cover-5",
    background: "linear-gradient(135deg, #7a4d9f 0%, #b37ce3 54%, #4f2f74 100%)"
  },
  {
    coverClass: "discipline-cover-6",
    background: "linear-gradient(135deg, #965034 0%, #d0805f 54%, #6c3624 100%)"
  }
];

const homeView = document.getElementById("homeView");
const subjectView = document.getElementById("subjectView");

const courseStage = document.getElementById("courseStage");
const disciplineStage = document.getElementById("disciplineStage");
const courseGrid = document.getElementById("courseGrid");
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

const cardsGrid = document.getElementById("cardsGrid");

const backBtn = document.getElementById("backBtn");
const subjectCoverTop = document.getElementById("subjectCoverTop");
const subjectCoverCopy = document.querySelector(".subject-cover-copy");
const subjectTitle = document.getElementById("subjectTitle");
const subjectTitleInput = document.getElementById("subjectTitleInput");
const subjectCourse = document.getElementById("subjectCourse");
const toggleMaterialManagerBtn = document.getElementById("toggleMaterialManagerBtn");
const changeCoverBtn = document.getElementById("changeCoverBtn");

const materialsPane = document.getElementById("materialsPane");
const testPane = document.getElementById("testPane");
const resultsPane = document.getElementById("resultsPane");

const materialTypeSelect = document.getElementById("materialTypeSelect");
const topicSelect = document.getElementById("topicSelect");
const openMaterialBtn = document.getElementById("openMaterialBtn");
const generateTestBtn = document.getElementById("generateTestBtn");
const openQrBtn = document.getElementById("openQrBtn");
const openResultsBtn = document.getElementById("openResultsBtn");
const controlActionsRow = document.getElementById("controlActionsRow");

const materialPreview = document.getElementById("materialPreview");
const materialManagerPanel = document.getElementById("materialManagerPanel");
const materialManagerActions = document.getElementById("materialManagerActions");
const uploadMenuWrap = document.getElementById("uploadMenuWrap");
const uploadModeMenu = document.getElementById("uploadModeMenu");
const uploadMaterialBtn = document.getElementById("uploadMaterialBtn");
const uploadSingleMaterialBtn = document.getElementById("uploadSingleMaterialBtn");
const uploadFolderMaterialBtn = document.getElementById("uploadFolderMaterialBtn");
const deleteMaterialBtn = document.getElementById("deleteMaterialBtn");
const singleMaterialUploadInput = document.getElementById("singleMaterialUploadInput");
const folderMaterialUploadInput = document.getElementById("folderMaterialUploadInput");
const openMaterialFullscreenBtn = document.getElementById("openMaterialFullscreenBtn");

const testInfoText = document.getElementById("testInfoText");
const qrImageInline = document.getElementById("qrImageInline");
const openTestDirectBtn = document.getElementById("openTestDirectBtn");
const showQrBtn = document.getElementById("showQrBtn");
const buildTestBtn = document.getElementById("buildTestBtn");
const testSettingsPanel = document.getElementById("testSettingsPanel");
const testQuestionCountInput = document.getElementById("testQuestionCountInput");
const testDurationInput = document.getElementById("testDurationInput");
const testSettingsTitle = document.getElementById("testSettingsTitle");
const testSettingsHint = document.getElementById("testSettingsHint");
const testQrBoard = testPane?.querySelector(".test-qr-board");
const testQrCard = testPane?.querySelector(".test-qr-card");
const testQrActions = testPane?.querySelector(".test-qr-actions");

const resultsInfoText = document.getElementById("resultsInfoText") || { textContent: "" };
const resultsSheetFrame = document.getElementById("resultsSheetFrame");
const openResultsSheetBtn = document.getElementById("openResultsSheetBtn") || {
  disabled: true,
  addEventListener() {}
};

const openVoiceBtn = document.getElementById("openVoiceBtn");
const closeVoiceBtn = document.getElementById("closeVoiceBtn");
const voicePanel = document.getElementById("voicePanel");
const voiceCore = document.getElementById("voiceCore");
const voiceStatus = document.getElementById("voiceStatus");

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
let appStateRestoreDone = false;
let publicTestSessionToken = new URLSearchParams(window.location.search).get("session");
let publicTestAttemptToken = "";
let publicTestSession = null;
let publicTestAttempt = null;
let publicTestCountdownTimer = null;
let publicTestAnswers = [];

let generatedQuestions = [];
let currentTestSession = null;
let isEditingTest = false;
let driveConnection = {
  configured: false,
  connected: false,
  google_email: "",
  google_name: "",
};
let isMaterialUploading = false;

let mediaRecorder = null;
let recordedChunks = [];

function t(key, params = {}) {
  const dictionary = UI_TEXT[selectedRole] || UI_TEXT.kaz;
  const fallback = UI_TEXT.kaz[key];
  const value = dictionary[key] ?? fallback ?? key;
  return typeof value === "function" ? value(params) : value;
}

function formatCourseLabel(number) {
  return t("courseLabel", { number });
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
  if (materialTypeLabel) materialTypeLabel.textContent = t("materialType");
  if (topicLabel) topicLabel.textContent = t("topic");
  if (openMaterialBtn) openMaterialBtn.textContent = t("material");
  if (generateTestBtn) generateTestBtn.textContent = t("generateTest");
  if (openQrBtn) openQrBtn.textContent = t("testQr");
  if (openResultsBtn) openResultsBtn.textContent = t("results");
  if (openMaterialFullscreenBtn) openMaterialFullscreenBtn.textContent = t("fullscreen");
  if (openTestDirectBtn) openTestDirectBtn.textContent = t("openTest");
  if (showQrBtn) showQrBtn.textContent = t("showQr");
  if (qrCodeLabel) qrCodeLabel.textContent = t("qrJoin");
  if (editProfileBtn) editProfileBtn.textContent = t("editProfile");
  if (logoutBtn) logoutBtn.textContent = t("logout");
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
  if (openVoiceBtn) openVoiceBtn.setAttribute("aria-label", "AI assistant");

  if (recognition) {
    recognition.lang = getSpeechLanguage();
  }

  renderDisciplinePreviewCard();
  renderDriveStatus();
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
    const detail =
      payload?.detail ||
      payload?.title?.[0] ||
      payload?.course?.[0] ||
      payload?.language?.[0] ||
      `Request failed: ${response.status}`;
    const error = new Error(detail);
    error.payload = payload;
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

function getCurrentTestLaunchUrl(session = currentTestSession) {
  if (!session) return "";
  return session.form_url || session.public_url || buildPublicTestUrl(session.access_token);
}

function readTeacherAppState() {
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error("App state parse error:", error);
    return null;
  }
}

function saveTeacherAppState() {
  if (publicTestSessionToken) return;

  const payload = {
    selectedRole,
    selectedCourseNumber,
    selectedSubjectId: selectedSubject?.id || null,
    activeType,
    selectedMaterialId,
    activeSubjectPanel,
    isMaterialManagerOpen,
  };

  localStorage.setItem(APP_STATE_KEY, JSON.stringify(payload));
}

function clearTeacherAppState() {
  localStorage.removeItem(APP_STATE_KEY);
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
    const resolvedAnswer = item.correct_option_index ?? options.findIndex(option => option === item.correct_answer);

    return {
      id: index + 1,
      question: item.question,
      options,
      answer: Number.isInteger(resolvedAnswer) && resolvedAnswer >= 0 ? resolvedAnswer : 0,
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

  renderDriveStatus();
  return driveConnection;
}

function renderDriveStatus() {
  ensureMaterialManagerLayout();

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
  }

  return false;
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

    if (created.length) {
      activeType = normalizeMaterialType(created[created.length - 1].category);
      selectedMaterialId = created[created.length - 1].id;
    }

    populateMaterialTypeSelect();
    populateTopicSelect();
    renderMaterialPreview();
    resetTestState();
    renderTestBlock();
    renderResultsBlock();
    renderDriveStatus();
  } catch (error) {
    console.error("Material upload error:", error);
    renderDriveStatus();
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
    await fetchJSON(`${API_BASE}/materials/${material.id}/`, {
      method: "DELETE"
    });

    selectedSubject.materials = await loadMaterialsForSubject(selectedSubject.id);
    selectedMaterialId = null;
    populateMaterialTypeSelect();
    populateTopicSelect();
    clearMaterialPreview();
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
  const canShowManager = Boolean(selectedSubject);
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
  if (disciplineTitleInput) disciplineTitleInput.value = "";
  if (disciplineFormError) disciplineFormError.textContent = "";
  renderDisciplinePreviewCard();
  openModal(disciplineModal);
  disciplineTitleInput?.focus();
}

async function createDisciplineFromModal() {
  if (!disciplineTitleInput || !saveDisciplineBtn || !selectedCourseNumber) return;

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

  try {
    await fetchJSON(`${API_BASE}/disciplines/`, {
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
      showHome();
    }

    if (selectedCourseNumber) {
      await loadDisciplinesForCourse(selectedCourseNumber);
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

async function refreshInterfaceLanguage({ roleChanged = false } = {}) {
  applyStaticTranslations();
  renderProfile();
  renderCourseCards();

  if (roleChanged && !subjectView.classList.contains("hidden")) {
    selectedSubject = null;
    selectedMaterialId = null;
    generatedQuestions = [];
    currentTestSession = null;
    activeSubjectPanel = "materials";
    subjectView.classList.add("hidden");
    homeView.classList.remove("hidden");
    courseStage.classList.add("hidden");
    disciplineStage.classList.remove("hidden");
  }

  if (selectedCourseNumber) {
    await loadDisciplinesForCourse(selectedCourseNumber);
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

  if (!savedState.selectedCourseNumber) {
    appStateRestoreDone = true;
    return;
  }

  await openCourseDisciplines(Number(savedState.selectedCourseNumber));

  if (!savedState.selectedSubjectId) {
    appStateRestoreDone = true;
    return;
  }

  const restoredSubject = subjects.find(item => Number(item.id) === Number(savedState.selectedSubjectId));
  if (!restoredSubject) {
    appStateRestoreDone = true;
    return;
  }

  activeSubjectPanel = savedState.activeSubjectPanel || "materials";
  await openSubject(restoredSubject);

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

async function openCourseDisciplines(courseNumber) {
  selectedCourseNumber = courseNumber;
  courseStage.classList.add("hidden");
  disciplineStage.classList.remove("hidden");
  await loadDisciplinesForCourse(courseNumber);
  saveTeacherAppState();
}

function showCourseStage() {
  selectedCourseNumber = null;
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
  testPane.classList.add("hidden");
  resultsPane.classList.add("hidden");

  if (panelName === "materials") {
    materialsPane.classList.remove("hidden");
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
    await restoreTeacherAppState();
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
      renderDisciplineCards();
      return;
    }

    const disciplines = await fetchJSON(`${API_BASE}/disciplines/?course_id=${courseId}&language=${selectedRole}`);

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

    renderDisciplineCards();
  } catch (error) {
    console.error("Disciplines load error:", error);
    subjects = [];
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
        ${t("disciplinesNotFound")}
      </div>
    `;
  }
}

async function loadMaterialsForSubject(subjectId) {
  try {
    const materials = await fetchJSON(`${API_BASE}/materials/?discipline_id=${subjectId}`);

    return materials.map(item => ({
      id: item.id,
      type: normalizeMaterialType(item.category),
      typeLabel: getTypeLabel(normalizeMaterialType(item.category)),
      title: item.title,
      desc: item.description || t("materialDescriptionMissing"),
      fileUrl: item.cloud_url,
      formUrl: item.form_url || "",
      resultsSheetUrl: item.results_sheet_url || "",
      createdAt: item.created_at || ""
    }));
  } catch (error) {
    console.error("Materials load error:", error);
    return [];
  }
}

async function openSubject(subject) {
  selectedSubject = { ...subject };
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

  const existingType = typeOrder.find(t => selectedSubject.materials.some(m => m.type === t.key));
  activeType = existingType ? existingType.key : "lecture";

  const firstMaterial = selectedSubject.materials.find(m => m.type === activeType) || selectedSubject.materials[0] || null;
  selectedMaterialId = firstMaterial ? firstMaterial.id : null;

  await loadLatestTestSessionForSelectedMaterial();

  homeView.classList.add("hidden");
  subjectView.classList.remove("hidden");

  renderSubjectHeader();
  populateMaterialTypeSelect();
  populateTopicSelect();
  renderDriveStatus();
  clearMaterialPreview();
  renderTestBlock(false);
  renderResultsBlock();
  switchSubjectPanel(activeSubjectPanel || "materials");
  saveTeacherAppState();
}

function showHome() {
  cancelSubjectTitleEdit();
  subjectView.classList.add("hidden");
  homeView.classList.remove("hidden");
  selectedSubject = null;
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

function renderSubjectHeader() {
  if (!selectedSubject) return;

  subjectTitle.textContent = selectedSubject.title;
  if (subjectTitleInput) {
    subjectTitleInput.value = selectedSubject.title;
    subjectTitleInput.classList.toggle("hidden", !isEditingSubjectTitle);
  }
  if (subjectTitle) {
    subjectTitle.classList.toggle("hidden", isEditingSubjectTitle);
  }
  subjectCourse.textContent = selectedSubject.course;
  subjectCoverTop.style.backgroundImage = selectedSubject.coverImage
    ? `linear-gradient(180deg, rgba(7,11,18,0.20), rgba(7,11,18,0.28)), url("${selectedSubject.coverImage}")`
    : `${selectedSubject.coverBackground || selectedSubject.background || DISCIPLINE_THEMES[0].background}`;
  if (changeCoverBtn) {
    changeCoverBtn.textContent = isEditingSubjectTitle ? t("save") : t("edit");
  }
}

function populateMaterialTypeSelect() {
  if (!materialTypeSelect || !selectedSubject) return;

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

  const list = getTypeMaterials();
  ensureSelectedMaterial();

  if (!list.length) {
    topicSelect.innerHTML = `<option value="">Тақырып табылмады</option>`;
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

function clearMaterialPreview() {
  materialPreview.innerHTML = `
    <div class="empty-state">${t("materialsEmpty")}</div>
  `;
}

function renderMaterialPreview() {
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
  const kind = getPreviewKindFromUrl(item.fileUrl);

  if (item.fileUrl) {
    if (kind === "pdf" || kind === "external") {
      previewInner = `<iframe src="${item.fileUrl}" loading="lazy"></iframe>`;
    } else if (kind === "image") {
      previewInner = `<img src="${item.fileUrl}" alt="${escapeHtml(item.title)}" />`;
    } else if (kind === "video") {
      previewInner = `<video src="${item.fileUrl}" controls style="width:100%;height:100%;object-fit:contain;background:#0a1020;border-radius:18px;"></video>`;
    } else if (kind === "audio") {
      previewInner = `<div style="height:100%;display:flex;align-items:center;justify-content:center;padding:24px;"><audio src="${item.fileUrl}" controls style="width:min(560px,100%);"></audio></div>`;
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

function updateActionButtonsState() {
  const material = getSelectedMaterial();
  const isLecture = material?.type === "lecture";
  const hasGeneratedTest = generatedQuestions.length > 0;
  const hasSessionLink = !!currentTestSession?.access_token || !!currentTestSession?.form_url;
  const hasResults = !!currentTestSession;

  generateTestBtn.disabled = !isLecture || isTestGenerating;
  openQrBtn.disabled = !hasGeneratedTest || !hasSessionLink;
  openResultsBtn.disabled = !hasResults;
  renderTestSettingsPanel();
}

function buildInlineQrUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(value || "Satbayev Edu Assistant")}`;
}

function convertGoogleSheetToEmbed(url) {
  if (!url) return "";
  if (url.includes("/pubhtml")) return url;
  if (url.includes("/edit")) return url.replace("/edit", "/preview");
  return url;
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

  if (currentTestSession?.id) {
    try {
      const updated = await fetchJSON(`${API_BASE}/results/test-sessions/${currentTestSession.id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questions_json: generatedQuestions.map((q) => ({
            question: q.question,
            options: q.options,
            correct_answer: q.options[q.answer] || "",
            correct_option_index: q.answer,
          })),
          question_count: generatedQuestions.length,
        }),
      });

      hydrateCurrentTestSession(updated);
    } catch (error) {
      console.error("Test session save error:", error);
    }
  }

  renderQuestionModal(false);
}

function renderTestBlock(showQrInline = false) {
  const material = getSelectedMaterial();
  renderTestSettingsPanel();

  if (!material) {
    testInfoText.textContent = "";
    qrImageInline.style.display = "none";
    openTestDirectBtn.disabled = true;
    showQrBtn.disabled = true;
    updateActionButtonsState();
    return;
  }

  const isLecture = material.type === "lecture";

  if (!isLecture) {
    testInfoText.textContent = t("testLectureOnly");
    qrImageInline.style.display = "none";
    openTestDirectBtn.disabled = true;
    showQrBtn.disabled = true;
    updateActionButtonsState();
    return;
  }

  if (!generatedQuestions.length) {
    testInfoText.textContent = "";
    qrImageInline.style.display = "none";
    openTestDirectBtn.disabled = true;
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
    openTestDirectBtn.disabled = true;
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

  openTestDirectBtn.disabled = false;
  showQrBtn.disabled = false;

  updateActionButtonsState();
}

async function renderResultsBlock() {
  const material = getSelectedMaterial();

  resultsSheetFrame.src = "about:blank";
  resultsSheetFrame.srcdoc = "";

  if (!material) {
    resultsInfoText.textContent = t("selectMaterialFirst");
    openResultsSheetBtn.disabled = !(currentTestSession?.results_sheet_url);
    updateActionButtonsState();
    return;
  }

  resultsInfoText.textContent = t("resultsLoading");
  openResultsSheetBtn.disabled = true;
  updateActionButtonsState();

  try {
    const latestSession = await getLatestSessionForSelectedMaterial();

    if (!latestSession) {
      resultsInfoText.textContent = t("noTestSession");
      openResultsSheetBtn.disabled = true;
      updateActionButtonsState();
      return;
    }

    const sheetUrl = latestSession.results_sheet_url || "";
    const responsesResponse = await fetch(`${API_BASE}/results/test-sessions/${latestSession.id}/responses/`);

    if (!responsesResponse.ok) {
      throw new Error(`Responses request failed: ${responsesResponse.status}`);
    }

    const data = await responsesResponse.json();
    const responses = data.responses || [];

    if (!responses.length) {
      resultsInfoText.textContent = t("noStudentResponses");
      resultsSheetFrame.srcdoc = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h3>${t("resultsEmptyTitle")}</h3>
            <p>${t("resultsEmptyText")}</p>
          </body>
        </html>
      `;
      openResultsSheetBtn.disabled = !sheetUrl;
      updateActionButtonsState();
      return;
    }

    const rowsHtml = responses.map((response, index) => {
      const submittedAt = response.submitted_at
        ? new Date(response.submitted_at).toLocaleString(selectedRole === "kaz" ? "kk-KZ" : "ru-RU")
        : "-";

      return `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;">${escapeHtml(response.student_name || t("nameMissing"))}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;font-weight:700;">${escapeHtml(response.score_label || "-")}</td>
          <td style="padding:12px 14px;border-bottom:1px solid #e5e7eb;">${escapeHtml(submittedAt)}</td>
        </tr>
      `;
    }).join("");

    resultsInfoText.textContent = t("resultsFound", { count: data.response_count || responses.length });
    resultsSheetFrame.srcdoc = `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; color:#0f172a;">
          <h2 style="margin-top:0; margin-bottom:8px;">${escapeHtml(data.title)}</h2>
          <table style="width:100%; border-collapse:collapse; background:#ffffff; border-radius:14px; overflow:hidden;">
            <thead style="background:#e2e8f0; text-align:left;">
              <tr>
                <th style="padding:12px 14px;">${t("tableNumber")}</th>
                <th style="padding:12px 14px;">${t("tableName")}</th>
                <th style="padding:12px 14px;">${t("tableScore")}</th>
                <th style="padding:12px 14px;">${t("tableTime")}</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    openResultsSheetBtn.disabled = !sheetUrl;
    updateActionButtonsState();
  } catch (error) {
    console.error("RESULTS LOAD ERROR:", error);
    resultsInfoText.textContent = t("resultsLoadError");
    resultsSheetFrame.src = "about:blank";
    resultsSheetFrame.srcdoc = "";
    openResultsSheetBtn.disabled = !(currentTestSession?.results_sheet_url);
    updateActionButtonsState();
  }
}

async function openResultsSheetDirect() {
  switchSubjectPanel("results");

  const latestSession = await getLatestSessionForSelectedMaterial();
  const sessionId = latestSession?.id;
  const sheetUrl = latestSession?.results_sheet_url || "";

  if (!sheetUrl) {
    alert(t("resultsSheetUnavailable"));
    return;
  }

  if (sessionId) {
    try {
      const syncResponse = await fetch(`${API_BASE}/results/test-sessions/${sessionId}/responses/`);

      if (!syncResponse.ok) {
        throw new Error(`Results sync failed: ${syncResponse.status}`);
      }

      const syncData = await syncResponse.json();
      currentTestSession = {
        ...latestSession,
        ...syncData,
        id: sessionId
      };
    } catch (error) {
      console.error("RESULTS SHEET SYNC ERROR:", error);
      alert(t("resultsSyncError"));
      return;
    }
  }

  resultsInfoText.textContent = t("resultsOpenedHere");
  resultsSheetFrame.srcdoc = "";
  resultsSheetFrame.src = convertGoogleSheetToEmbed(sheetUrl);
  openResultsSheetBtn.disabled = false;
  updateActionButtonsState();
}

function openTestDirect() {
  if (!generatedQuestions.length) return;

  const formUrl = getCurrentTestLaunchUrl();

  if (!formUrl) {
    alert(t("formNotReady"));
    return;
  }

  window.open(formUrl, "_blank");
}

function showQr() {
  if (!generatedQuestions.length) return;

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
      options: item.options,
      answer: ["A", "B", "C", "D"].indexOf(item.answer)
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
        questions: generatedQuestions.map((q) => ({
          question: q.question,
          options: q.options,
          correct_answer: q.options[q.answer] || "",
          correct_option_index: q.answer
        }))
      })
    });

    if (!sessionResponse.ok) {
      throw new Error(`Test session create failed: ${sessionResponse.status}`);
    }

    const sessionData = await sessionResponse.json();
    hydrateCurrentTestSession({
      ...sessionData,
      material: currentMaterial.id,
      questions_json: generatedQuestions.map((q) => ({
        question: q.question,
        options: q.options,
        correct_answer: q.options[q.answer] || "",
        correct_option_index: q.answer,
      })),
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

function renderQuestionModal(editMode = false) {
  isEditingTest = editMode;
  testModalTitle.textContent = editMode ? t("testModalEdit") : t("testModalView");
  editTestBtn.classList.toggle("hidden", editMode);
  saveTestBtn.classList.toggle("hidden", !editMode);

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
        <div style="color:#fff;line-height:1.6;margin-bottom:12px;">${escapeHtml(q.question)}</div>
        <div style="display:grid;gap:8px;">
          ${q.options.map((option, oIndex) => `
            <div style="
              min-height:44px;
              border-radius:14px;
              border:1px solid rgba(255,255,255,0.08);
              background:${q.answer === oIndex ? "rgba(71,215,186,0.10)" : "#11192a"};
              color:${q.answer === oIndex ? "#c6fff3" : "#d9e2ef"};
              display:flex;
              align-items:center;
              gap:10px;
              padding:10px 12px;
              font-size:14px;
              font-weight:600;
            ">
              <div style="
                width:26px;height:26px;border-radius:50%;
                background:rgba(255,255,255,0.06);
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

async function sendAudioToAssistant(audioBlob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "voice.webm");

  const response = await fetch(`${API_BASE}/assistant/transcribe/`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Transcribe request failed: ${response.status}`);
  }

  return response.json();
}

async function sendTextToAssistant(text) {
  const response = await fetch(`${API_BASE}/assistant/command/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error(`Assistant command failed: ${response.status}`);
  }

  return response.json();
}

async function handleAssistantAction(assistantData) {
  if (!assistantData) return;

  if (assistantData.action === "open_materials") {
    switchSubjectPanel("materials");
    return;
  }

  if (assistantData.action === "open_test") {
    switchSubjectPanel("test");
    return;
  }

  if (assistantData.action === "open_results") {
    switchSubjectPanel("results");
    return;
  }

  if (assistantData.action === "generate_test") {
    switchSubjectPanel("test");
    await createAiQuestions();
    return;
  }

  if (assistantData.action === "open_course") {
    if (assistantData.course_number) {
      await openCourseDisciplines(Number(assistantData.course_number));
    }
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
    showHome();
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

function speakAssistantReply(text) {
  if (!text || !("speechSynthesis" in window)) {
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = synth.getVoices();
  const preferredVoice =
    (selectedRole === "kaz" && (
      voices.find(v => v.lang === "kk-KZ") ||
      voices.find(v => v.lang.startsWith("kk"))
    )) ||
    voices.find(v => v.lang === "ru-RU") ||
    voices.find(v => v.lang.startsWith("ru")) ||
    voices.find(v => v.lang === "en-US") ||
    voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang;
  } else {
    utterance.lang = getSpeechLanguage();
  }

  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  synth.speak(utterance);
}

async function toggleListening(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  voicePanel.classList.add("show");

  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

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
        setVoiceState("idle", t("voiceTranscribing"));
        const data = await sendAudioToAssistant(audioBlob);
        setVoiceState("idle", t("voiceUnderstood", { text: data.text }));

        if (!data.text) return;

        const normalizedText = normalizeVoiceText(data.text);
        const assistantData = await sendTextToAssistant(normalizedText);

        setVoiceState("speaking", assistantData.reply || data.text);
        speakAssistantReply(assistantData.reply || data.text);

        await handleAssistantAction(assistantData);
      } catch (error) {
        console.error("TRANSCRIBE ERROR:", error);
        setVoiceState("idle", t("voiceRequestError"));
        speakAssistantReply(t("voiceSorry"));
      }

      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
  } catch (error) {
    console.error("MIC ACCESS ERROR:", error);
    setVoiceState("idle", t("micDenied"));
  }
}

async function handleAssistantCommand(transcript) {
  try {
    setVoiceState("idle", t("voiceUnderstood", { text: transcript }));

    const response = await fetch(`${API_BASE}/assistant/command/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: transcript })
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();

    if (data.reply) {
      setVoiceState("idle", data.reply);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.lang = getSpeechLanguage();
        window.speechSynthesis.speak(utterance);
      }
    }

    await handleAssistantAction(data);
  } catch (error) {
    console.error("Assistant command error:", error);
    setVoiceState("idle", t("voiceRequestError"));
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
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    setVoiceState("listening", t("voiceListening"));
  };

  recognition.onerror = (event) => {
    isListening = false;
    setVoiceState("idle", t("errorLabel", { error: event.error }));
  };

  recognition.onend = () => {
    isListening = false;
    if (!voiceCore.classList.contains("listening")) {
      setVoiceState("idle", t("voiceReady"));
    }
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    setVoiceState("idle", t("voiceUnderstood", { text: transcript }));
    await handleAssistantCommand(transcript);
  };
}

if (profileBtn) {
  profileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle("show");
  });
}

document.getElementById("editProfileBtn").addEventListener("click", () => {
  profileDropdown.classList.remove("show");
  openModal(profileModal);
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  alert("Шығу функциясы.");
  profileDropdown.classList.remove("show");
});

if (roleTitleBtn) {
  roleTitleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    roleMenu.classList.toggle("hidden");
  });
}

const logoutBtnNode = document.getElementById("logoutBtn");
if (logoutBtnNode) {
  logoutBtnNode.addEventListener("click", (event) => {
    event.stopImmediatePropagation();
    alert(t("logoutPlaceholder"));
    profileDropdown.classList.remove("show");
  }, true);
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

function handleDriveReturnParams() {
  const params = new URLSearchParams(window.location.search);
  const driveStatus = params.get("drive");
  const email = params.get("email");
  const message = params.get("message");

  if (!driveStatus && !email && !message) {
    return;
  }

  window.history.replaceState({}, "", window.location.pathname);

  if (driveStatus === "connected" && email) {
    renderDriveStatus();
    loadDriveStatus();
    return;
  }

  if (driveStatus === "error") {
    renderDriveStatus();
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
    if (!selectedSubject) return;
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

if (materialTypeSelect) {
  materialTypeSelect.addEventListener("change", async () => {
    activeType = materialTypeSelect.value;
    selectedMaterialId = null;
    populateTopicSelect();
    renderDriveStatus();
    await loadLatestTestSessionForSelectedMaterial();
    clearMaterialPreview();
    renderTestBlock();
    renderResultsBlock();
    saveTeacherAppState();
  });
}

if (uploadMaterialBtn) {
  uploadMaterialBtn.addEventListener("click", async () => {
    if (!selectedSubject || isMaterialUploading) return;

    if (!driveConnection.connected) {
      await connectGoogleDrive();
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
    renderDriveStatus();
    await loadLatestTestSessionForSelectedMaterial();
    clearMaterialPreview();
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

function setTestPanelInfo(message = "", state = "neutral") {
  if (!testInfoText) return;
  testInfoText.textContent = message || "";
  testInfoText.classList.toggle("is-error", state === "error");
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

  if (testInfoText) {
    testInfoText.classList.toggle("hidden", qrMode || !testInfoText.textContent.trim());
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
    openTestDirectBtn.disabled = true;
    if (showQrBtn) showQrBtn.disabled = true;
    setTestPaneMode("settings");
    updateActionButtonsState();
    return;
  }

  if (material.type !== "lecture") {
    setTestPanelInfo(t("testLectureOnly"), "error");
    qrImageInline.style.display = "none";
    openTestDirectBtn.disabled = true;
    if (showQrBtn) showQrBtn.disabled = true;
    setTestPaneMode("settings");
    updateActionButtonsState();
    return;
  }

  if (!generatedQuestions.length) {
    setTestPanelInfo("");
    qrImageInline.style.display = "none";
    openTestDirectBtn.disabled = true;
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
    openTestDirectBtn.disabled = true;
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

  openTestDirectBtn.disabled = !qrMode;
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
      options: item.options,
      answer: ["A", "B", "C", "D"].indexOf(item.answer)
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
        questions: generatedQuestions.map((q) => ({
          question: q.question,
          options: q.options,
          correct_answer: q.options[q.answer] || "",
          correct_option_index: q.answer
        }))
      })
    });
    hydrateCurrentTestSession({
      ...sessionData,
      material: currentMaterial.id,
      questions_json: generatedQuestions.map((q) => ({
        question: q.question,
        options: q.options,
        correct_answer: q.options[q.answer] || "",
        correct_option_index: q.answer,
      })),
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

if (buildTestBtn) {
  buildTestBtn.addEventListener("click", createAiQuestions);
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

if (openTestDirectBtn) {
  openTestDirectBtn.addEventListener("click", openTestDirect);
}

if (showQrBtn) {
  showQrBtn.addEventListener("click", showQr);
}

if (openResultsSheetBtn) {
  openResultsSheetBtn.addEventListener("click", openResultsSheetDirect);
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
    voicePanel.classList.toggle("show");
  });
}

if (closeVoiceBtn) {
  closeVoiceBtn.addEventListener("click", () => {
    voicePanel.classList.remove("show");
  });
}

if (voiceCore) {
  voiceCore.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleListening(event);
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

[profileModal, disciplineModal, testModal, qrModal, playerDetailModal].forEach(modal => {
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

  const voiceAssistant = document.querySelector(".voice-assistant");
  if (voiceAssistant && !voiceAssistant.contains(e.target)) {
    voicePanel.classList.remove("show");
  }
});

async function bootstrapApp() {
  loadStoredTestConfig();
  applyStaticTranslations();
  renderProfile();

  if (await initPublicTestMode()) {
    return;
  }

  handleDriveReturnParams();
  loadDriveStatus();
  loadCoursesFromApi();
  initSpeechRecognition();
  setVoiceState("idle", t("voiceReady"));
}

bootstrapApp();

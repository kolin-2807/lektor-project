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

const homeView = document.getElementById("homeView");
const subjectView = document.getElementById("subjectView");

const courseStage = document.getElementById("courseStage");
const disciplineStage = document.getElementById("disciplineStage");
const courseGrid = document.getElementById("courseGrid");
const courseBackBtn = document.getElementById("courseBackBtn");

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
const subjectTitle = document.getElementById("subjectTitle");
const subjectCourse = document.getElementById("subjectCourse");
const changeCoverBtn = document.getElementById("changeCoverBtn");
const coverFileInput = document.getElementById("coverFileInput");

const materialsPane = document.getElementById("materialsPane");
const testPane = document.getElementById("testPane");
const resultsPane = document.getElementById("resultsPane");

const materialTypeSelect = document.getElementById("materialTypeSelect");
const topicSelect = document.getElementById("topicSelect");
const openMaterialBtn = document.getElementById("openMaterialBtn");
const generateTestBtn = document.getElementById("generateTestBtn");
const openQrBtn = document.getElementById("openQrBtn");
const openResultsBtn = document.getElementById("openResultsBtn");

const materialPreview = document.getElementById("materialPreview");
const openMaterialFullscreenBtn = document.getElementById("openMaterialFullscreenBtn");

const testInfoText = document.getElementById("testInfoText");
const qrImageInline = document.getElementById("qrImageInline");
const openTestDirectBtn = document.getElementById("openTestDirectBtn");
const showQrBtn = document.getElementById("showQrBtn");

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

let recognition = null;
let isListening = false;
let selectedSubject = null;
let activeType = "lecture";
let selectedMaterialId = null;
let activeSubjectPanel = "materials";

let generatedQuestions = [];
let currentTestSession = null;
let isEditingTest = false;

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

  updateBrandRoleLabel();
  updateRoleMenuActive();

  roleMenuItems.forEach(btn => {
    btn.textContent = btn.dataset.roleValue === "kaz" ? t("roleTeacher") : t("roleLecturer");
  });

  if (courseBackBtn) courseBackBtn.textContent = t("back");
  if (backBtn) backBtn.textContent = t("back");
  if (changeCoverBtn) changeCoverBtn.textContent = t("edit");
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
  if (editTestBtn) editTestBtn.textContent = t("edit");
  if (saveTestBtn) saveTestBtn.textContent = t("save");
  if (testModalTitle) testModalTitle.textContent = isEditingTest ? t("testModalEdit") : t("testModalView");
  if (resultsSheetFrame) resultsSheetFrame.title = t("sheetFrameTitle");
  if (profileBtn) profileBtn.setAttribute("aria-label", t("editProfile"));
  if (openVoiceBtn) openVoiceBtn.setAttribute("aria-label", "AI assistant");

  if (recognition) {
    recognition.lang = getSpeechLanguage();
  }
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

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
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
  currentTestSession = sessions[0] || null;
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
}

function getDisciplineLang(discipline) {
  return discipline.language || "kaz";
}

async function openCourseDisciplines(courseNumber) {
  selectedCourseNumber = courseNumber;
  courseStage.classList.add("hidden");
  disciplineStage.classList.remove("hidden");
  await loadDisciplinesForCourse(courseNumber);
}

function showCourseStage() {
  selectedCourseNumber = null;
  disciplineStage.classList.add("hidden");
  courseStage.classList.remove("hidden");
  cardsGrid.innerHTML = "";
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
}

async function loadCoursesFromApi() {
  try {
    coursesData = await fetchJSON(`${API_BASE}/courses/`);
    renderCourseCards();
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
        id: discipline.id,
        title: discipline.title,
        course: formatCourseLabel(discipline.course_number),
        courseNum: formatCourseLabel(discipline.course_number),
        courseNumber: discipline.course_number,
        groupLang: getDisciplineLang(discipline),
        tone: ["lavender", "peach", "mint", "rose"][index % 4],
        coverImage: [
          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=80",
          "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&q=80"
        ][index % 4],
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
    el.innerHTML = `
      <div class="class-cover cover-${card.tone}"></div>
      <div class="class-body">
        <div class="class-subject">${card.title}</div>
        <div class="class-course">${card.course}</div>
      </div>
    `;
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

  if (!selectedSubject.materials || !selectedSubject.materials.length) {
    selectedSubject.materials = await loadMaterialsForSubject(selectedSubject.id);
  }

  const existingType = typeOrder.find(t => selectedSubject.materials.some(m => m.type === t.key));
  activeType = existingType ? existingType.key : "lecture";

  const firstMaterial = selectedSubject.materials.find(m => m.type === activeType) || selectedSubject.materials[0] || null;
  selectedMaterialId = firstMaterial ? firstMaterial.id : null;

  resetTestState();

  homeView.classList.add("hidden");
  subjectView.classList.remove("hidden");

  renderSubjectHeader();
  populateMaterialTypeSelect();
  populateTopicSelect();
  clearMaterialPreview();
  renderTestBlock(false);
  renderResultsBlock();
  switchSubjectPanel("materials");
}

function showHome() {
  subjectView.classList.add("hidden");
  homeView.classList.remove("hidden");
  selectedSubject = null;
  activeSubjectPanel = "materials";
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
  subjectCourse.textContent = selectedSubject.course;
  subjectCoverTop.style.backgroundImage = `
    linear-gradient(180deg, rgba(7,11,18,0.20), rgba(7,11,18,0.28)),
    url("${selectedSubject.coverImage}")
  `;
}

function populateMaterialTypeSelect() {
  if (!materialTypeSelect || !selectedSubject) return;

  const existingTypes = typeOrder.filter(type =>
    selectedSubject.materials.some(m => m.type === type.key)
  );

  materialTypeSelect.innerHTML = existingTypes.map(type => `
    <option value="${type.key}" ${type.key === activeType ? "selected" : ""}>${type.label}</option>
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

  let previewInner = `<img src="${selectedSubject.coverImage}" alt="preview" />`;
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
  updateActionButtonsState();
}

function updateActionButtonsState() {
  const material = getSelectedMaterial();
  const isLecture = material?.type === "lecture";
  const hasGeneratedTest = generatedQuestions.length > 0;
  const hasSessionLink = !!currentTestSession?.form_url;
  const hasResultsSheet =
    !!currentTestSession?.results_sheet_url || !!material?.resultsSheetUrl;

  generateTestBtn.disabled = !isLecture;
  openQrBtn.disabled = !hasGeneratedTest || !hasSessionLink;
  openResultsBtn.disabled = !hasResultsSheet;
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

function saveEditedQuestions() {
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

  renderQuestionModal(false);
}

function renderTestBlock(showQrInline = false) {
  const material = getSelectedMaterial();

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

  testInfoText.textContent = t("testReady", { count: generatedQuestions.length });

  const formUrl = currentTestSession?.form_url;

  if (!formUrl) {
    qrImageInline.style.display = "none";
    openTestDirectBtn.disabled = true;
    showQrBtn.disabled = true;
    updateActionButtonsState();
    return;
  }

  if (showQrInline) {
    qrImageInline.src = buildInlineQrUrl(formUrl);
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

  const formUrl = currentTestSession?.form_url;

  if (!formUrl) {
    alert(t("formNotReady"));
    return;
  }

  window.open(formUrl, "_blank");
}

function showQr() {
  if (!generatedQuestions.length) return;

  const formUrl = currentTestSession?.form_url;

  if (!formUrl) {
    alert(t("qrNotReady"));
    return;
  }

  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(formUrl)}`;
  qrCodeLabel.textContent = t("qrJoin");
  openModal(qrModal);
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

  generateTestBtn.disabled = true;
  testInfoText.textContent = t("generatingAiTest");

  try {
    const response = await fetch(`${API_BASE}/materials/${currentMaterial.id}/generate-test/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        language: selectedRole
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
    currentTestSession = {
      ...sessionData,
      material: currentMaterial.id
    };

    renderTestBlock(false);
    switchSubjectPanel("test");
  } catch (error) {
    console.error("AI TEST ERROR:", error);
    testInfoText.textContent = t("aiTestError");
    alert(t("aiTestError"));
  } finally {
    generateTestBtn.disabled = false;
    updateActionButtonsState();
  }
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

if (backBtn) {
  backBtn.addEventListener("click", () => {
    subjectView.classList.add("hidden");
    homeView.classList.remove("hidden");
  });
}

if (changeCoverBtn) {
  changeCoverBtn.addEventListener("click", () => {
    coverFileInput.click();
  });
}

if (coverFileInput) {
  coverFileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSubject) return;

    const reader = new FileReader();
    reader.onload = () => {
      selectedSubject.coverImage = reader.result;
      renderSubjectHeader();
      renderMaterialPreview();
      renderDisciplineCards();
    };
    reader.readAsDataURL(file);
  });
}

if (materialTypeSelect) {
  materialTypeSelect.addEventListener("change", () => {
    activeType = materialTypeSelect.value;
    selectedMaterialId = null;
    populateTopicSelect();
    resetTestState();
    clearMaterialPreview();
    renderTestBlock();
    renderResultsBlock();
  });
}

if (topicSelect) {
  topicSelect.addEventListener("change", () => {
    selectedMaterialId = Number(topicSelect.value);
    resetTestState();
    clearMaterialPreview();
    renderTestBlock();
    renderResultsBlock();
  });
}

if (openMaterialBtn) {
  openMaterialBtn.addEventListener("click", () => {
    renderMaterialPreview();
    switchSubjectPanel("materials");
  });
}

if (generateTestBtn) {
  generateTestBtn.addEventListener("click", createAiQuestions);
}

if (openQrBtn) {
  openQrBtn.addEventListener("click", () => {
    if (!generatedQuestions.length) return;

    renderTestBlock(true);
    switchSubjectPanel("test");
  });
}

if (openResultsBtn) {
  openResultsBtn.addEventListener("click", async () => {
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

[profileModal, testModal, qrModal, playerDetailModal].forEach(modal => {
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

  const voiceAssistant = document.querySelector(".voice-assistant");
  if (voiceAssistant && !voiceAssistant.contains(e.target)) {
    voicePanel.classList.remove("show");
  }
});

applyStaticTranslations();
renderProfile();
loadCoursesFromApi();
initSpeechRecognition();
setVoiceState("idle", t("voiceReady"));

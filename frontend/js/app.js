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

const typeOrder = [
  { key: "lecture", label: "Дәріс" },
  { key: "practice", label: "Практикалық жұмыс" },
  { key: "lab", label: "Зертханалық жұмыс" },
  { key: "sowj", label: "СӨЖ" },
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
const typeRow = document.getElementById("typeRow");
const materialsList = document.getElementById("materialsList");
const materialPreview = document.getElementById("materialPreview");
const uploadFolderBtn = document.getElementById("uploadFolderBtn");
const folderInput = document.getElementById("folderInput");
const folderStatus = document.getElementById("folderStatus");
const folderCount = document.getElementById("folderCount");
const changeCoverBtn = document.getElementById("changeCoverBtn");
const coverFileInput = document.getElementById("coverFileInput");

const materialsPane = document.getElementById("materialsPane");
const testPane = document.getElementById("testPane");
const resultsPane = document.getElementById("resultsPane");
const tabButtons = document.querySelectorAll("[data-tab]");

const questionCountInput = document.getElementById("questionCountInput");
const testDurationInput = document.getElementById("testDurationInput");
const generateTestBtn = document.getElementById("generateTestBtn");
const openJoinBtn = document.getElementById("openJoinBtn");
const startTestBtn = document.getElementById("startTestBtn");
const testStatusPill = document.getElementById("testStatusPill");
const sessionStatusPill = document.getElementById("sessionStatusPill");
const testEmptyBox = document.getElementById("testEmptyBox");
const sessionEmptyBox = document.getElementById("sessionEmptyBox");
const testReadyBox = document.getElementById("testReadyBox");
const sessionReadyBox = document.getElementById("sessionReadyBox");
const readyQuestionsChip = document.getElementById("readyQuestionsChip");
const readyDurationChip = document.getElementById("readyDurationChip");
const readyTopicChip = document.getElementById("readyTopicChip");
const viewTestBtn = document.getElementById("viewTestBtn");
const regenerateBtn = document.getElementById("regenerateBtn");
const participantsToggleBtn = document.getElementById("participantsToggleBtn");
const participantsCountLabel = document.getElementById("participantsCountLabel");
const participantsList = document.getElementById("participantsList");
const showQrBtn = document.getElementById("showQrBtn");
const openResultsFromTestBtn = document.getElementById("openResultsFromTestBtn");

const resultsListCard = document.getElementById("resultsListCard");
const reportDetailCard = document.getElementById("reportDetailCard");
const reportsCountPill = document.getElementById("reportsCountPill");
const reportListWrap = document.getElementById("reportListWrap");
const reportDetailTitle = document.getElementById("reportDetailTitle");
const reportTitleInput = document.getElementById("reportTitleInput");
const reportDetailSub = document.getElementById("reportDetailSub");
const renameReportBtn = document.getElementById("renameReportBtn");
const reportMenuBtn = document.getElementById("reportMenuBtn");
const closeReportBtn = document.getElementById("closeReportBtn");
const reportActionsMenu = document.getElementById("reportActionsMenu");
const deleteReportBtn = document.getElementById("deleteReportBtn");
const reportDeleteBar = document.getElementById("reportDeleteBar");
const cancelDeleteReportBtn = document.getElementById("cancelDeleteReportBtn");
const confirmDeleteReportBtn = document.getElementById("confirmDeleteReportBtn");
const resultsTabButtons = document.querySelectorAll("[data-results-tab]");
const analyticsResultsPane = document.getElementById("analyticsResultsPane");
const participantsResultsPane = document.getElementById("participantsResultsPane");
const questionsResultsPane = document.getElementById("questionsResultsPane");
const analyticsCard = document.getElementById("analyticsCard");
const statsCard = document.getElementById("statsCard");
const hardestCard = document.getElementById("hardestCard");
const participantsLines = document.getElementById("participantsLines");
const questionsListWrap = document.getElementById("questionsListWrap");

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
let activeSubjectTab = "materials";

let generatedQuestions = [];
let participantsData = [];
let reportsData = [];
let selectedReportId = null;
let currentResultsInnerTab = "analytics";
let isEditingReportTitle = false;
let isEditingTest = false;

function normalizeMaterialType(type) {
  return type;
}

async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
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
  if (type === "self") return "badge-self";
  return "badge-syllabus";
}

function getTypeLabel(type) {
  const map = {
    lecture: "Дәріс",
    practice: "Практикалық жұмыс",
    lab: "Зертханалық жұмыс",
    sowj: "СӨЖ",
    syllabus: "Силлабус"
  };
  return map[type] || "Материал";
}

function openModal(modal) {
  if (modal) modal.classList.add("show");
}

function closeModal(modal) {
  if (modal) modal.classList.remove("show");
}

function renderProfile() {
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

function saveProfile() {
  profileState.username = profileUsernameInput.value.trim() || profileState.username;
  profileState.bio = profileBioInput.value.trim() || profileState.bio;
  renderProfile();
  closeModal(profileModal);
}

function updateBrandRoleLabel() {
  if (!brandRoleTitle) return;
  brandRoleTitle.textContent = selectedRole === "kaz" ? "Оқытушы" : "Лектор";
}

function updateRoleMenuActive() {
  roleMenuItems.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.roleValue === selectedRole);
  });
}

function getDisciplineLang(discipline) {
  return discipline.language || "kaz";
}

async function loadCoursesFromApi() {
  try {
    coursesData = await fetchJSON(`${API_BASE}/courses/`);
    renderCourseCards();
  } catch (error) {
    console.error("Курстарды жүктеу қатесі:", error);
    courseGrid.innerHTML = `<div class="empty-state">Курстар жүктелмеді.</div>`;
  }
}

function renderCourseCards() {
  if (!courseGrid) return;

  if (!coursesData.length) {
    courseGrid.innerHTML = `<div class="empty-state">Курстар табылмады.</div>`;
    return;
  }

  const coverImages = {
    1: "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80",
    2: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
    3: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    4: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80"
  };

  courseGrid.innerHTML = coursesData.map(course => `
    <article class="course-card" data-course-number="${course.number}">
      <div class="course-card-cover" style="background-image:url('${coverImages[course.number] || coverImages[1]}')">
        <div class="course-card-title">${course.number} курс</div>
      </div>

      <div class="course-card-body">
        <div class="course-card-code">IS-${course.number}00</div>

        <div class="course-card-meta">
          <svg class="course-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z"></path>
            <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
          </svg>

          <svg class="course-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 17L17 7"></path>
            <path d="M9 7h8v8"></path>
          </svg>
        </div>
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

async function loadDisciplinesForCourse(courseNumber) {
  try {
    const courseId = await getCourseIdByNumber(courseNumber);

    if (!courseId) {
      subjects = [];
      renderDisciplineCards();
      return;
    }

    const disciplines = await fetchJSON(`${API_BASE}/disciplines/?course_id=${courseId}`);

    subjects = disciplines
      .map((discipline, index) => ({
        id: discipline.id,
        title: discipline.title,
        course: `${discipline.course_number} курс`,
        courseNum: `${discipline.course_number} курс`,
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
    console.error("Пәндерді жүктеу қатесі:", error);
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
        Осы курс үшін пән табылмады.
      </div>
    `;
  }
}

function switchSubjectTab(tabName) {
  activeSubjectTab = tabName;

  tabButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  materialsPane.classList.toggle("active", tabName === "materials");
  testPane.classList.toggle("active", tabName === "test");
  resultsPane.classList.toggle("active", tabName === "results");

  if (tabName === "materials") renderMaterialsArea();
  if (tabName === "test") renderTestView();
  if (tabName === "results") renderResultsList();
}

async function loadMaterialsForSubject(subjectId) {
  try {
    const materials = await fetchJSON(`${API_BASE}/materials/?discipline_id=${subjectId}`);

    return materials.map(item => ({
      id: item.id,
      type: normalizeMaterialType(item.category),
      typeLabel: getTypeLabel(normalizeMaterialType(item.category)),
      title: item.title,
      desc: item.description || "Материал сипаттамасы жоқ",
      fileUrl: item.cloud_url
    }));
  } catch (error) {
    console.error("Материалдарды жүктеу қатесі:", error);
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
  await loadReportsForSubject();

  homeView.classList.add("hidden");
  subjectView.classList.remove("hidden");

  renderSubjectHeader();
  updateFolderInfo();
  switchSubjectTab("materials");
}

function showHome() {
  subjectView.classList.add("hidden");
  homeView.classList.remove("hidden");
  selectedSubject = null;
  activeSubjectTab = "materials";
  updateFolderInfo();
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

function renderSubjectHeader() {
  if (!selectedSubject) return;

  subjectTitle.textContent = selectedSubject.title;
  subjectCourse.textContent = selectedSubject.course;
  subjectCoverTop.style.backgroundImage = `
    linear-gradient(180deg, rgba(7,11,18,0.20), rgba(7,11,18,0.28)),
    url("${selectedSubject.coverImage}")
  `;
}

function inferMaterialType(parts, fileName) {
  const text = [...parts, fileName].join(" ").toLowerCase();
  if (/(силлабус|syllabus)/.test(text)) return "syllabus";
  if (/(зертхана|лаборат|lab)/.test(text)) return "lab";
  if (/(практик|practice)/.test(text)) return "practice";
  if (/(сөж|срс|self)/.test(text)) return "self";
  return "lecture";
}

function getPreviewKind(file) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (["png","jpg","jpeg","gif","webp","bmp","svg"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["mp4","webm","ogg","mov"].includes(ext)) return "video";
  if (["mp3","wav","oga","m4a"].includes(ext)) return "audio";
  if (["txt","md","csv","json","xml","html","css","js","ts"].includes(ext)) return "text";
  return "file";
}

function getFileIcon(fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "📕";
  if (["doc","docx"].includes(ext)) return "📘";
  if (["ppt","pptx"].includes(ext)) return "📙";
  if (["xls","xlsx","csv"].includes(ext)) return "📗";
  if (["png","jpg","jpeg","gif","webp","svg"].includes(ext)) return "🖼️";
  if (["mp4","webm","ogg","mov"].includes(ext)) return "🎬";
  if (["mp3","wav","m4a"].includes(ext)) return "🎵";
  return "📄";
}

function updateFolderInfo(files = []) {
  if (!folderStatus || !folderCount) return;
  if (!selectedSubject) {
    folderStatus.textContent = "Алдымен пәнді ашыңыз";
    folderCount.textContent = "0 файл";
    return;
  }
  if (!files.length) {
    const uploaded = selectedSubject.materials.filter(item => item.isUploaded).length;
    folderStatus.textContent = uploaded ? "Жүктелген материалдар дайын" : "Папка әлі жүктелмеген";
    folderCount.textContent = `${uploaded} файл`;
    return;
  }
  const rootName = files[0].webkitRelativePath.split("/")[0] || "Папка";
  folderStatus.textContent = `${rootName} папкасы жүктелді`;
  folderCount.textContent = `${files.length} файл`;
}

async function readTextFile(file) {
  try {
    return await file.text();
  } catch (e) {
    return "";
  }
}

async function handleFolderUpload(fileList) {
  if (!selectedSubject || !fileList?.length) return;

  const files = [...fileList].filter(file => file.size > 0 || file.name);
  if (!files.length) return;

  const uploadedMaterials = [];

  for (const file of files) {
    const segments = (file.webkitRelativePath || file.name).split("/").filter(Boolean);
    const fileName = file.name;
    const folderParts = segments.slice(1, -1);
    const inferredType = inferMaterialType(folderParts, fileName);
    const baseTitle = fileName.replace(/\.[^.]+$/, "");
    const previewKind = getPreviewKind(file);
    const fileUrl = URL.createObjectURL(file);
    const textContent = previewKind === "text" ? await readTextFile(file) : "";

    uploadedMaterials.push({
      id: Date.now() + uploadedMaterials.length + Math.floor(Math.random() * 1000),
      type: inferredType,
      typeLabel: getTypeLabel(inferredType),
      title: baseTitle,
      desc: folderParts.length ? folderParts.join(" / ") : "Жүктелген материал",
      fileUrl,
      fileName,
      fileSize: file.size,
      previewKind,
      textContent,
      isUploaded: true
    });
  }

  selectedSubject.materials = [...selectedSubject.materials, ...uploadedMaterials];
  const existingType = typeOrder.find(t => uploadedMaterials.some(m => m.type === t.key));
  if (existingType) activeType = existingType.key;
  selectedMaterialId = uploadedMaterials[0]?.id || selectedMaterialId;
  updateFolderInfo(files);
  renderMaterialsArea();
}

function renderTypeTabs() {
  typeRow.innerHTML = "";

  if (!selectedSubject) return;

  typeOrder.forEach(type => {
    const count = selectedSubject.materials.filter(m => m.type === type.key).length;
    if (!count) return;

    const btn = document.createElement("button");
    btn.className = "type-chip" + (activeType === type.key ? " active" : "");
    btn.type = "button";
    btn.textContent = type.label;

    btn.addEventListener("click", () => {
      activeType = type.key;
      ensureSelectedMaterial();
      renderMaterialsArea();

      if (activeSubjectTab === "test") {
        renderTestView();
      }
    });

    typeRow.appendChild(btn);
  });
}

function renderMaterialsList() {
  const list = getTypeMaterials();
  ensureSelectedMaterial();
  materialsList.innerHTML = "";

  if (!list.length) {
    materialsList.innerHTML = `<div class="empty-state">Материал табылмады.</div>`;
    return;
  }

  list.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "material-row" + (item.id === selectedMaterialId ? " active" : "");

    row.innerHTML = `
      <div class="material-index">${index + 1}</div>
      <div class="material-main">
        <strong>${item.title}</strong>
      </div>
      <div class="material-badge ${getBadgeClass(item.type)}">${item.typeLabel}</div>
    `;

    row.addEventListener("click", () => {
      selectedMaterialId = item.id;
      renderMaterialsArea();

      if (activeSubjectTab === "test") {
        renderTestView();
      }
    });

    materialsList.appendChild(row);
  });
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

function renderMaterialPreview() {
  const list = getTypeMaterials();
  const item = list.find(m => m.id === selectedMaterialId);

  if (!item) {
    materialPreview.innerHTML = `<div class="empty-state">Материалды таңдаңыз.</div>`;
    return;
  }

  let previewInner = `<img src="${selectedSubject.coverImage}" alt="preview" />`;

  if (item.fileUrl) {
    const isExternalUrl = /^https?:\/\//i.test(item.fileUrl);

    if (isExternalUrl) {
      previewInner = `<iframe src="${item.fileUrl}" loading="lazy"></iframe>`;
    } else if (item.previewKind === "pdf") {
      previewInner = `<iframe src="${item.fileUrl}" loading="lazy"></iframe>`;
    } else if (item.previewKind === "image") {
      previewInner = `<img src="${item.fileUrl}" alt="${item.title}" />`;
    } else if (item.previewKind === "video") {
      previewInner = `<video src="${item.fileUrl}" controls style="width:100%;height:100%;object-fit:contain;background:#0a1020;border-radius:18px;"></video>`;
    } else if (item.previewKind === "audio") {
      previewInner = `<div style="height:100%;display:flex;align-items:center;justify-content:center;padding:24px;"><audio src="${item.fileUrl}" controls style="width:min(560px,100%);"></audio></div>`;
    } else if (item.previewKind === "text") {
      previewInner = `<div style="height:100%;overflow:auto;padding:18px;border-radius:18px;background:#0b1322;"><pre style="margin:0;white-space:pre-wrap;color:#eef2ff;font:13px/1.65 Consolas,monospace;">${escapeHtml(item.textContent || "Мәтінді оқу мүмкін болмады.")}</pre></div>`;
    } else {
      previewInner = `
        <div style="height:100%;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;">
          <div>
            <div style="font-size:64px;margin-bottom:10px;">${getFileIcon(item.fileName || item.title)}</div>
            <div style="font-size:18px;font-weight:800;color:#fff;margin-bottom:8px;">${item.fileName || item.title}</div>
            <div style="font-size:13px;color:#a9b7cb;margin-bottom:14px;">Бұл формат браузерде тікелей preview бермеуі мүмкін.</div>
            <a href="${item.fileUrl}" download="${item.fileName || item.title}" class="action-btn primary" style="text-decoration:none;display:inline-flex;align-items:center;justify-content:center;">Файлды жүктеу</a>
          </div>
        </div>`;
    }
  }

  materialPreview.innerHTML = `
    <div class="preview-box">
      ${previewInner}
    </div>

    <div class="preview-type ${getBadgeClass(item.type)}">${item.typeLabel}</div>
    <div class="preview-title">${item.title}</div>

    <div class="preview-actions">
      <button class="action-btn" id="fullscreenPreviewBtn" type="button">Толық экран</button>
      <button class="action-btn primary" id="createAiTestBtn" type="button">AI тест құру</button>
    </div>
  `;

  document.getElementById("fullscreenPreviewBtn").addEventListener("click", openPreviewFullscreen);
  document.getElementById("createAiTestBtn").addEventListener("click", () => {
    switchSubjectTab("test");
  });
}

function renderMaterialsArea() {
  renderTypeTabs();
  renderMaterialsList();
  renderMaterialPreview();
}

function resetTestState() {
  generatedQuestions = [];
  participantsData = [];
  selectedReportId = null;
  currentResultsInnerTab = "analytics";
  isEditingReportTitle = false;
  isEditingTest = false;

  testStatusPill.textContent = "Дайын емес";
  testStatusPill.className = "pill";

  sessionStatusPill.textContent = "Белсенді емес";
  sessionStatusPill.className = "pill";

  testEmptyBox.style.display = "flex";
  sessionEmptyBox.style.display = "flex";
  testReadyBox.classList.remove("show");
  sessionReadyBox.classList.remove("show");

  openJoinBtn.disabled = true;
  startTestBtn.disabled = true;
  openResultsFromTestBtn.style.display = "none";

  participantsList.classList.remove("show");
  participantsList.innerHTML = "";
  participantsCountLabel.textContent = "0 студент";
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

async function createAiQuestions() {
  const currentMaterial =
    selectedSubject?.materials.find(m => m.id === selectedMaterialId) ||
    selectedSubject?.materials[0];

  const duration = Math.max(5, Math.min(120, Number(testDurationInput.value) || 15));
  testDurationInput.value = duration;

  if (currentMaterial?.type !== "lecture") {
    alert("AI тест тек дәріс материалы бойынша жасалады.");
    return;
  }

  testStatusPill.textContent = "AI тест жасалып жатыр...";
  testStatusPill.className = "pill";

  try {
    const response = await fetch(`${API_BASE}/materials/${currentMaterial.id}/generate-test/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    generatedQuestions = data.test.map((item, index) => ({
      id: index + 1,
      question: item.question,
      options: item.options,
      answer: ["A", "B", "C", "D"].indexOf(item.answer)
    }));

    questionCountInput.value = generatedQuestions.length;

    testStatusPill.textContent = "Тест дайын";
    testStatusPill.className = "pill ready";
    sessionStatusPill.textContent = "Белсенді емес";
    sessionStatusPill.className = "pill";

    testEmptyBox.style.display = "none";
    testReadyBox.classList.add("show");
    sessionEmptyBox.style.display = "flex";
    sessionReadyBox.classList.remove("show");

    readyQuestionsChip.textContent = `${generatedQuestions.length} сұрақ`;
    readyDurationChip.textContent = `${duration} минут`;
    readyTopicChip.textContent = currentMaterial.title;

    openJoinBtn.disabled = false;
    startTestBtn.disabled = true;
    openResultsFromTestBtn.style.display = "none";

    participantsData = [];
    participantsList.innerHTML = "";
    participantsList.classList.remove("show");
    participantsCountLabel.textContent = "0 студент";
  } catch (error) {
    console.error("AI тест жасау қатесі:", error);
    alert("AI тест жасау кезінде қате шықты.");
    testStatusPill.textContent = "Қате";
    testStatusPill.className = "pill";
  }
}

function renderTestView() {
  updateTestGenerationAvailability();

  if (!generatedQuestions.length) {
    testEmptyBox.style.display = "flex";
    testReadyBox.classList.remove("show");
  }
}

function updateTestGenerationAvailability() {
  const currentMaterial =
    selectedSubject?.materials.find(m => m.id === selectedMaterialId) ||
    selectedSubject?.materials[0];

  const canGenerate = currentMaterial && currentMaterial.type === "lecture";

  generateTestBtn.disabled = !canGenerate;

  if (!canGenerate) {
    generateTestBtn.title = "AI тест тек дәріс материалы бойынша жасалады";
  } else {
    generateTestBtn.title = "";
  }
}

function makeParticipants() {
  return [
    { name: "Айдана Н.", group: "ИС-21-1" },
    { name: "Еркебұлан С.", group: "ИС-21-1" },
    { name: "Мирас К.", group: "ИС-21-2" },
    { name: "Аружан Т.", group: "ИС-21-2" },
    { name: "Нұрдәулет М.", group: "ИС-21-3" },
    { name: "Диас А.", group: "ИС-21-3" }
  ];
}

function renderSessionParticipants() {
  participantsList.innerHTML = "";

  participantsData.forEach(person => {
    const item = document.createElement("div");
    item.className = "participant-mini";
    item.innerHTML = `
      <div class="participant-mini-avatar">${getInitials(person.name)}</div>
      <div class="participant-mini-name">${person.name}</div>
    `;
    participantsList.appendChild(item);
  });

  participantsCountLabel.textContent = `${participantsData.length} студент`;
}

function openJoinSession() {
  if (!generatedQuestions.length) return;

  participantsData = makeParticipants();

  sessionStatusPill.textContent = "Қосылу ашық";
  sessionStatusPill.className = "pill open";

  testStatusPill.textContent = "Қосылу ашық";
  testStatusPill.className = "pill open";

  sessionEmptyBox.style.display = "none";
  sessionReadyBox.classList.add("show");
  renderSessionParticipants();

  startTestBtn.disabled = false;
}

function buildGeneratedReport() {
  const currentMaterial = selectedSubject?.materials.find(m => m.id === selectedMaterialId) || selectedSubject?.materials[0];
  const questionCount = generatedQuestions.length;
  const duration = Number(testDurationInput.value) || 15;

  const results = [
    { name: "Айдана Н.", group: "ИС-21-1", score: questionCount - 1, maxScore: questionCount, percent: Math.round(((questionCount - 1) / questionCount) * 100) },
    { name: "Еркебұлан С.", group: "ИС-21-1", score: questionCount - 4, maxScore: questionCount, percent: Math.round(((questionCount - 4) / questionCount) * 100) },
    { name: "Мирас К.", group: "ИС-21-2", score: questionCount - 3, maxScore: questionCount, percent: Math.round(((questionCount - 3) / questionCount) * 100) },
    { name: "Аружан Т.", group: "ИС-21-2", score: questionCount - 6, maxScore: questionCount, percent: Math.round(((questionCount - 6) / questionCount) * 100) },
    { name: "Нұрдәулет М.", group: "ИС-21-3", score: questionCount - 5, maxScore: questionCount, percent: Math.round(((questionCount - 5) / questionCount) * 100) },
    { name: "Диас А.", group: "ИС-21-3", score: questionCount - 5, maxScore: questionCount, percent: Math.round(((questionCount - 5) / questionCount) * 100) }
  ];

  const percents = results.map(item => item.percent);

  const analytics = generatedQuestions.map((q, i) => {
    const correctPercent = Math.max(45, 84 - i * 2);
    return {
      questionId: i + 1,
      question: q.question,
      correctAnswer: q.options[q.answer],
      correctPercent,
      wrongPercent: 100 - correctPercent
    };
  });

  const hardest = analytics.reduce((min, item) =>
    item.correctPercent < min.correctPercent ? item : min
  , analytics[0]);

  return {
    id: Date.now(),
    title: `${selectedSubject.title} → ${currentMaterial.typeLabel === "Дәріс" ? "Дәріс 1" : currentMaterial.typeLabel + " 1"}`,
    discipline: selectedSubject.title,
    lessonLabel: currentMaterial.typeLabel === "Дәріс" ? "Дәріс 1" : currentMaterial.typeLabel + " 1",
    participantCount: results.length,
    averageScore: Math.round(percents.reduce((a, b) => a + b, 0) / percents.length),
    highestScore: Math.max(...percents),
    lowestScore: Math.min(...percents),
    questionCount,
    duration,
    results,
    questions: generatedQuestions.map((q, i) => ({
      id: i + 1,
      question: q.question,
      options: q.options,
      answer: q.answer
    })),
    analytics,
    hardest
  };
}

function startTestSession() {
  if (!generatedQuestions.length || !participantsData.length) return;

  sessionStatusPill.textContent = "Тест жүріп жатыр";
  sessionStatusPill.className = "pill live";

  testStatusPill.textContent = "Тест жүріп жатыр";
  testStatusPill.className = "pill live";

  setTimeout(() => {
    const report = buildGeneratedReport();
    reportsData.unshift(report);

    sessionStatusPill.textContent = "Аяқталды";
    sessionStatusPill.className = "pill done";

    testStatusPill.textContent = "Тест аяқталды";
    testStatusPill.className = "pill done";

    openResultsFromTestBtn.style.display = "inline-flex";
  }, 4000);
}

function renderQuestionModal(editMode = false) {
  isEditingTest = editMode;
  testModalTitle.textContent = editMode ? "Тестті өңдеу" : "Тестті қарау";
  editTestBtn.classList.toggle("hidden", editMode);
  saveTestBtn.classList.toggle("hidden", !editMode);

  testQuestionsContainer.innerHTML = "";

  generatedQuestions.forEach((q, qIndex) => {
    const card = document.createElement("div");
    card.className = "question-edit-card";

    if (editMode) {
      card.innerHTML = `
        <h4>${qIndex + 1}-сұрақ</h4>
        <textarea class="edit-textarea" data-question-index="${qIndex}">${q.question}</textarea>
        ${q.options.map((option, oIndex) => `
          <div class="edit-option-row">
            <div class="edit-letter">${String.fromCharCode(65 + oIndex)}</div>
            <input class="edit-input" data-question-index="${qIndex}" data-option-index="${oIndex}" value="${option.replace(/"/g, "&quot;")}" />
            <label class="correct-radio-wrap">
              <input type="radio" name="correct-${qIndex}" value="${oIndex}" ${q.answer === oIndex ? "checked" : ""} />
            </label>
          </div>
        `).join("")}
      `;
    } else {
      card.innerHTML = `
        <h4>${qIndex + 1}-сұрақ</h4>
        <div style="color:#fff;line-height:1.6;margin-bottom:12px;">${q.question}</div>
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
              <div>${option}</div>
            </div>
          `).join("")}
        </div>
      `;
    }

    testQuestionsContainer.appendChild(card);
  });
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

function showQr() {
  qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`Satbayev Edu Assistant | ${selectedSubject?.title || "Пән"}`)}`;
  qrCodeLabel.textContent = "Тестке қосылу";
  openModal(qrModal);
}

async function loadReportsForSubject() {
  if (!selectedSubject) {
    reportsData = [];
    return;
  }

  try {
    const results = await fetchJSON(`${API_BASE}/results/?discipline_id=${selectedSubject.id}`);

    reportsData = results.map(item => ({
      id: item.id,
      title: item.title,
      discipline: item.discipline_title,
      lessonLabel: "Тест нәтижесі",
      participantCount: item.participant_count,
      averageScore: item.average_score,
      highestScore: item.highest_score,
      lowestScore: 0,
      questionCount: 0,
      duration: 0,
      results: [],
      questions: [],
      analytics: [],
      hardest: {
        question: "Әзірге жоқ",
        correctPercent: 0
      }
    }));
  } catch (error) {
    console.error("Нәтижелерді жүктеу қатесі:", error);
    reportsData = [];
  }
}

function renderResultsList() {
  reportsCountPill.textContent = `${reportsData.length} репорт`;
  reportListWrap.innerHTML = "";

  resultsListCard.classList.remove("hidden");
  reportDetailCard.classList.add("hidden");
  reportDeleteBar.classList.remove("show");
  reportActionsMenu.classList.remove("show");

  reportsData.forEach(report => {
    const row = document.createElement("div");
    row.className = "report-row";
    row.innerHTML = `<div class="report-row-title">${report.title}</div>`;
    row.addEventListener("click", () => openReportDetail(report.id));
    reportListWrap.appendChild(row);
  });

  if (!reportsData.length) {
    reportListWrap.innerHTML = `<div class="empty-state">Әзірге репорттар жоқ.</div>`;
  }
}

function openReportDetail(reportId) {
  selectedReportId = reportId;
  currentResultsInnerTab = "analytics";
  isEditingReportTitle = false;
  renderReportDetail();
}

function getSelectedReport() {
  return reportsData.find(item => item.id === selectedReportId) || null;
}

function renderReportDetail() {
  const report = getSelectedReport();
  if (!report) return;

  resultsListCard.classList.add("hidden");
  reportDetailCard.classList.remove("hidden");
    reportActionsMenu.classList.remove("show");
  reportDeleteBar.classList.remove("show");

  reportDetailTitle.style.display = isEditingReportTitle ? "none" : "block";
  reportTitleInput.style.display = isEditingReportTitle ? "block" : "none";

  reportDetailTitle.textContent = report.title;
  reportTitleInput.value = report.title;
  reportDetailSub.textContent = `${report.discipline} • ${report.lessonLabel} • ${report.participantCount} студент`;

  resultsTabButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.resultsTab === currentResultsInnerTab);
  });

  analyticsResultsPane.classList.toggle("active", currentResultsInnerTab === "analytics");
  participantsResultsPane.classList.toggle("active", currentResultsInnerTab === "participants");
  questionsResultsPane.classList.toggle("active", currentResultsInnerTab === "questions");

  renderAnalytics(report);
  renderParticipants(report);
  renderQuestions(report);
}

function renderAnalytics(report) {
  analyticsCard.innerHTML = `
    <div class="ring-wrap">
      <div class="result-ring" style="--score:${report.averageScore}">
        <div class="result-ring-value">${report.averageScore}%</div>
      </div>
      <div class="ring-caption">орташа нәтиже</div>
    </div>
  `;

  statsCard.innerHTML = `
    <div class="stats-card-title">Қысқаша статистика</div>
    <div class="stats-grid">
      <div class="stats-mini"><span>Қатысушылар</span><strong>${report.participantCount}</strong></div>
      <div class="stats-mini"><span>Сұрақтар</span><strong>${report.questionCount}</strong></div>
      <div class="stats-mini"><span>Уақыт</span><strong>${report.duration} мин</strong></div>
      <div class="stats-mini"><span>Ең жоғары</span><strong>${report.highestScore}%</strong></div>
    </div>
  `;

  hardestCard.innerHTML = `
    <div class="hardest-card-title">Ең қиын сұрақ</div>
    <div class="hardest-question">${report.hardest.question}</div>
    <div class="hardest-meta">${report.lessonLabel} бойынша дұрыс жауап беру көрсеткіші ${report.hardest.correctPercent}%.</div>
  `;
}

function renderParticipants(report) {
  participantsLines.innerHTML = "";

  report.results.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "participant-line";
    row.innerHTML = `
      <div class="participant-line-name">${item.name}</div>
      <div class="participant-line-right">
        <span>${item.group}</span>
        <span>${item.score}/${item.maxScore}</span>
        <span>${item.percent}%</span>
      </div>
    `;
    row.addEventListener("click", () => openPlayerDetail(report.id, index));
    participantsLines.appendChild(row);
  });
}

function renderQuestions(report) {
  questionsListWrap.innerHTML = "";

  report.analytics.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "question-card";
    card.innerHTML = `
      <div class="question-top">
        <div>
          <div class="question-name">${index + 1}-сұрақ</div>
          <div class="question-meta">
            <span>Дұрыс ${item.correctPercent}%</span>
            <span>Қате ${item.wrongPercent}%</span>
          </div>
        </div>
      </div>

      <div style="font-size:14px;color:#edf2f9;line-height:1.65;margin-bottom:12px;">
        ${item.question}
      </div>

      <div class="progress-line">
        <span>Дұрыс</span>
        <div class="progress-track"><div class="progress-fill" style="width:${item.correctPercent}%"></div></div>
        <strong>${item.correctPercent}%</strong>
      </div>

      <div class="progress-line wrong">
        <span>Қате</span>
        <div class="progress-track"><div class="progress-fill" style="width:${item.wrongPercent}%"></div></div>
        <strong>${item.wrongPercent}%</strong>
      </div>

      <div class="correct-answer">Дұрыс жауап: ${item.correctAnswer}</div>
    `;
    questionsListWrap.appendChild(card);
  });
}

function openPlayerDetail(reportId, playerIndex) {
  const report = reportsData.find(item => item.id === reportId);
  if (!report) return;
  const player = report.results[playerIndex];
  if (!player) return;

  playerDetailTitle.textContent = player.name;
  playerDetailMeta.innerHTML = `
    <span>${player.group}</span>
    <span>${player.score}/${player.maxScore}</span>
    <span>${player.percent}%</span>
  `;

  playerAnswerList.innerHTML = report.questions.map((question, i) => {
    const correct = ((playerIndex + i + 1) % 3 !== 0);
    return `
      <div class="player-answer-card ${correct ? "correct" : "wrong"}">
        <div style="font-size:15px;font-weight:800;color:#fff;margin-bottom:8px;">${i + 1}-сұрақ</div>
        <div style="font-size:14px;line-height:1.65;color:#edf2f9;margin-bottom:8px;">${question.question}</div>
        <div style="font-size:13px;color:${correct ? "#c6fff3" : "#ffd2ef"};font-weight:700;">
          ${correct ? "Жауабы дұрыс" : "Жауабы қате"}
        </div>
      </div>
    `;
  }).join("");

  openModal(playerDetailModal);
}

function setVoiceState(state, text) {
  voiceCore.classList.remove("listening");
  if (state === "listening") {
    voiceCore.classList.add("listening");
  }
  voiceStatus.textContent = text;
}

function processVoiceCommand(text) {
  const query = text.toLowerCase();

  if (!selectedSubject) {
    const found = subjects.find(item => query.includes(item.title.toLowerCase()));
    if (found) {
      openSubject(found);
      return;
    }

    return;
  }

  if (query.includes("артқа")) {
    showHome();
    return;
  }

  if (query.includes("материал")) {
    switchSubjectTab("materials");
    return;
  }

  if (
    query.includes("тест жаса") ||
    query.includes("тест құр") ||
    query.includes("ai тест жаса") ||
    query.includes("осы материал бойынша тест жаса")
  ) {
    switchSubjectTab("test");
    createAiQuestions();
    return;
  }

  if (query.includes("тест")) {
    switchSubjectTab("test");
    return;
  }

  if (query.includes("нәтиже")) {
    switchSubjectTab("results");
    return;
  }

  if (
    query.includes("қосылуды аш") ||
    query.includes("қосылу аш") ||
    query.includes("qr көрсет") ||
    query.includes("qr аш")
  ) {
    switchSubjectTab("test");
    openJoinSession();

    if (query.includes("qr")) {
      showQr();
    }
    return;
  }

  if (
    query.includes("тестті баста") ||
    query.includes("тесті баста")
  ) {
    switchSubjectTab("test");
    startTestSession();
    return;
  }

  if (query.includes("дәріс")) activeType = "lecture";
  else if (query.includes("практикалық")) activeType = "practice";
  else if (query.includes("зертханалық")) activeType = "lab";
  else if (query.includes("сөж")) activeType = "self";
  else if (query.includes("силлабус")) activeType = "syllabus";

  const list = getTypeMaterials();
  if (list.length) selectedMaterialId = list[0].id;
  renderMaterialsArea();
}

async function toggleListening(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  console.log("MIC BUTTON CLICKED");
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
      console.log("AUDIO RECORDING STARTED");
      setVoiceState("listening", "Тыңдап тұр...");
    };

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      console.log("AUDIO RECORDING STOPPED");
      console.log("MEDIARECORDER ONSTOP FIRED");
      console.log("ABOUT TO SEND AUDIO");
      console.log("RECORDED CHUNKS:", recordedChunks.length);

      const audioBlob = new Blob(recordedChunks, { type: "audio/webm" });

      try {
        setVoiceState("idle", "Дауысты мәтінге айналдырып жатырмын...");
        const data = await sendAudioToAssistant(audioBlob);
        console.log("TRANSCRIBE RESPONSE:", data);
        setVoiceState("idle", `Түсінді: ${data.text}`);

        if (!data.text) {
          return;
        }

        const normalizedText = normalizeVoiceText(data.text);
        console.log("NORMALIZED TEXT:", normalizedText);

        const assistantData = await sendTextToAssistant(normalizedText);
        console.log("ASSISTANT RESPONSE:", assistantData);
        setVoiceState("speaking", assistantData.reply || data.text);
        speakAssistantReply(assistantData.reply || data.text);

        if (assistantData.action === "open_test") {
          switchSubjectTab("test");
        }

        if (assistantData.action === "open_materials") {
          switchSubjectTab("materials");
        }

        if (assistantData.action === "open_results") {
          switchSubjectTab("results");
        }

        if (assistantData.action === "generate_test") {
          await createAiQuestions();
        }

      } catch (error) {
        console.error("TRANSCRIBE ERROR:", error);
        setVoiceState("idle", "Дауыстық көмекшіге сұрау жіберу кезінде қате шықты.");
        speakAssistantReply("Кешіріңіз, қазір сұрауды өңдей алмадым.");
      }

      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
  } catch (error) {
    console.error("MIC ACCESS ERROR:", error);
    setVoiceState("idle", "Микрофонға рұқсат берілмеді.");
  }
}

let mediaRecorder = null;
let recordedChunks = [];


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

function normalizeVoiceText(text) {
  if (!text) return "";

  return text
    .toLowerCase()
    .trim()
    .replace(/[!?.,;:]/g, "")
    .replace(/\s+/g, " ");
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

function speakAssistantReply(text) {
  if (!text || !("speechSynthesis" in window)) {
    console.log("Speech synthesis not supported or empty text");
    return;
  }

  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = synth.getVoices();

  console.log("AVAILABLE VOICES:", voices.map(v => `${v.name} | ${v.lang}`));

  const preferredVoice =
    voices.find(v => v.lang === "ru-RU") ||
    voices.find(v => v.lang.startsWith("ru")) ||
    voices.find(v => v.lang === "en-US") ||
    voices[0];

  if (preferredVoice) {
    utterance.voice = preferredVoice;
    utterance.lang = preferredVoice.lang;
  } else {
    utterance.lang = "ru-RU";
  }

  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onstart = () => console.log("VOICE PLAYBACK STARTED");
  utterance.onend = () => console.log("VOICE PLAYBACK ENDED");
  utterance.onerror = (e) => console.error("VOICE PLAYBACK ERROR:", e);

  synth.speak(utterance);
}

async function handleAssistantCommand(transcript) {
  try {
    setVoiceState("idle", `Түсінді: ${transcript}`);

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
    console.log("ASSISTANT RESPONSE:", data);

    if (data.reply) {
      setVoiceState("idle", data.reply);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(data.reply);
        utterance.lang = "kk-KZ";
        window.speechSynthesis.speak(utterance);
      }
    }

    if (data.action === "open_materials") {
      switchSubjectTab("materials");
      return;
    }

    if (data.action === "open_test") {
      switchSubjectTab("test");
      return;
    }

    if (data.action === "open_results") {
      switchSubjectTab("results");
      return;
    }

    if (data.action === "generate_test") {
      switchSubjectTab("test");
      await createAiQuestions();
      return;
    }

    if (data.action === "open_qr") {
      switchSubjectTab("test");
      openJoinSession();
      showQr();
      return;
    }

    if (data.action === "start_test") {
      switchSubjectTab("test");
      startTestSession();
      return;
    }

    if (data.action === "go_back") {
      showHome();
      return;
    }
  } catch (error) {
    console.error("Assistant command error:", error);
    setVoiceState("idle", "Ассистент командасын өңдеу кезінде қате шықты.");
  }
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setVoiceState("idle", "Дауыстық функция қолжетімсіз");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "ru-RU";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    console.log("RECOGNITION STARTED");
    isListening = true;
    setVoiceState("listening", "Тыңдап тұр...");
  };

  recognition.onerror = (event) => {
    console.log("RECOGNITION ERROR:", event.error);
    isListening = false;
    setVoiceState("idle", `Қате: ${event.error}`);
  };

  recognition.onend = () => {
    console.log("RECOGNITION ENDED");
    isListening = false;
    if (!voiceCore.classList.contains("listening")) {
      setVoiceState("idle", "Дайын");
    }
  };

  recognition.onresult = async (event) => {
    const transcript = event.results[0][0].transcript;
    console.log("VOICE TRANSCRIPT:", transcript);
    setVoiceState("idle", `Түсінді: ${transcript}`);
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

roleMenuItems.forEach(btn => {
  btn.addEventListener("click", async () => {
    selectedRole = btn.dataset.roleValue;
    updateBrandRoleLabel();
    updateRoleMenuActive();
    roleMenu.classList.add("hidden");

    if (selectedCourseNumber) {
      await loadDisciplinesForCourse(selectedCourseNumber);
    }
  });
});

if (courseBackBtn) {
  courseBackBtn.addEventListener("click", showCourseStage);
}

tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    if (!selectedSubject) return;
    switchSubjectTab(btn.dataset.tab);
  });
});

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

if (uploadFolderBtn) {
  uploadFolderBtn.addEventListener("click", () => {
    if (!selectedSubject) {
      alert("Алдымен пәнді ашыңыз.");
      return;
    }
    folderInput.click();
  });
}

if (folderInput) {
  folderInput.addEventListener("change", async (e) => {
    await handleFolderUpload(e.target.files);
    e.target.value = "";
  });
}

if (generateTestBtn) generateTestBtn.addEventListener("click", createAiQuestions);
if (regenerateBtn) regenerateBtn.addEventListener("click", createAiQuestions);
if (openJoinBtn) openJoinBtn.addEventListener("click", openJoinSession);
if (startTestBtn) startTestBtn.addEventListener("click", startTestSession);

if (viewTestBtn) {
  viewTestBtn.addEventListener("click", () => {
    renderQuestionModal(false);
    openModal(testModal);
  });
}

if (editTestBtn) {
  editTestBtn.addEventListener("click", () => {
    renderQuestionModal(true);
  });
}

if (saveTestBtn) {
  saveTestBtn.addEventListener("click", saveEditedQuestions);
}

if (participantsToggleBtn) {
  participantsToggleBtn.addEventListener("click", () => {
    participantsList.classList.toggle("show");
  });
}

if (showQrBtn) showQrBtn.addEventListener("click", showQr);

if (openResultsFromTestBtn) {
  openResultsFromTestBtn.addEventListener("click", () => {
    switchSubjectTab("results");
  });
}

resultsTabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentResultsInnerTab = btn.dataset.resultsTab;
    renderReportDetail();
  });
});

if (renameReportBtn) {
  renameReportBtn.addEventListener("click", () => {
    const report = getSelectedReport();
    if (!report) return;

    if (!isEditingReportTitle) {
      isEditingReportTitle = true;
      renderReportDetail();
      reportTitleInput.focus();
      reportTitleInput.select();
    } else {
      const value = reportTitleInput.value.trim();
      if (value) report.title = value;
      isEditingReportTitle = false;
      renderReportDetail();
      renderResultsList();
    }
  });
}

if (reportTitleInput) {
  reportTitleInput.addEventListener("keydown", (e) => {
    const report = getSelectedReport();
    if (!report) return;

    if (e.key === "Enter") {
      e.preventDefault();
      const value = reportTitleInput.value.trim();
      if (value) report.title = value;
      isEditingReportTitle = false;
      renderReportDetail();
      renderResultsList();
    }

    if (e.key === "Escape") {
      e.preventDefault();
      isEditingReportTitle = false;
      renderReportDetail();
    }
  });
}

if (reportMenuBtn) {
  reportMenuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    reportActionsMenu.classList.toggle("show");
  });
}

if (deleteReportBtn) {
  deleteReportBtn.addEventListener("click", () => {
    reportActionsMenu.classList.remove("show");
    reportDeleteBar.classList.add("show");
  });
}

if (cancelDeleteReportBtn) {
  cancelDeleteReportBtn.addEventListener("click", () => {
    reportDeleteBar.classList.remove("show");
  });
}

if (confirmDeleteReportBtn) {
  confirmDeleteReportBtn.addEventListener("click", () => {
    const report = getSelectedReport();
    if (!report) return;
    reportsData = reportsData.filter(item => item.id !== report.id);
    selectedReportId = null;
    reportDeleteBar.classList.remove("show");
    renderResultsList();
  });
}

if (closeReportBtn) {
  closeReportBtn.addEventListener("click", () => {
    selectedReportId = null;
    renderResultsList();
  });
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

  if (reportActionsMenu && reportMenuBtn && !reportActionsMenu.contains(e.target) && e.target !== reportMenuBtn) {
    reportActionsMenu.classList.remove("show");
  }
});

renderProfile();
updateBrandRoleLabel();
updateRoleMenuActive();
loadCoursesFromApi();
initSpeechRecognition();
setVoiceState("idle", "Дайын");
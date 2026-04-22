const defaultCategories = [
  { name: "个人证件", items: ["身份证", "护照"] },
  { name: "洗漱用品", items: ["牙刷", "牙膏", "毛巾"] },
  { name: "护肤品", items: ["防晒", "面霜", "唇膏"] },
  { name: "贴身衣物", items: ["内衣", "袜子", "睡衣"] },
  { name: "衣服", items: ["T恤", "长裤", "外套"] },
  { name: "帽子包包", items: ["帽子", "斜挎包"] },
  { name: "电子产品", items: ["手机", "充电器", "充电宝", "耳机"] },
];

const STORAGE_KEY = "travel-items-list:prototype-v1";
const FIELD_LIMITS = Object.freeze({
  userName: 20,
  city: 30,
  categoryName: 20,
  itemName: 30,
});

function trimAndLimit(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validateMaxLength(input, value, maxLength, label) {
  if (value.length > maxLength) {
    if (input) {
      input.setCustomValidity(`${label}不能超过${maxLength}个字`);
      input.reportValidity();
    }
    return false;
  }

  if (input) {
    input.setCustomValidity("");
  }

  return true;
}

function validateItemLengths(input, items) {
  const hasTooLongItem = items.some((item) => item.length > FIELD_LIMITS.itemName);
  if (hasTooLongItem) {
    if (input) {
      input.setCustomValidity(`单个物品不能超过${FIELD_LIMITS.itemName}个字`);
      input.reportValidity();
    }
    return false;
  }

  if (input) {
    input.setCustomValidity("");
  }

  return true;
}

function createDefaultCategories() {
  return defaultCategories.map((category) => ({
    name: category.name,
    items: [...category.items],
  }));
}

const state = {
  currentStep: 1,
  userName: "",
  bagType: "suitcase",
  city: "",
  departureDate: "",
  categories: createDefaultCategories(),
  editing: null,
  modalMode: "item",
  activeCategoryIndex: null,
  confirmMode: null,
  confirmCategoryIndex: null,
};

const elements = {
  heroTitle: document.getElementById("hero-title"),
  heroIntro: document.getElementById("hero-intro"),
  nameForm: document.getElementById("name-form"),
  nameInput: document.getElementById("name-input"),
  tripForm: document.getElementById("trip-form"),
  cityInput: document.getElementById("city-input"),
  dateInput: document.getElementById("date-input"),
  tripSummary: document.getElementById("trip-summary"),
  stepPanels: [...document.querySelectorAll(".step-panel")],
  stepPills: [...document.querySelectorAll("[data-step-pill]")],
  toggleButtons: [...document.querySelectorAll("[data-bag-type]")],
  suitcaseFigure: document.getElementById("suitcase-figure"),
  backpackFigure: document.getElementById("backpack-figure"),
  categoryList: document.getElementById("category-list"),
  backButton: document.getElementById("back-button"),
  editNameButton: document.getElementById("edit-name-button"),
  addCategoryButton: document.getElementById("add-category-button"),
  resetTripButton: document.getElementById("reset-trip-button"),
  modalLayer: document.getElementById("modal-layer"),
  modalTitle: document.getElementById("modal-title"),
  modalHint: document.getElementById("modal-hint"),
  modalForm: document.getElementById("modal-form"),
  categoryNameField: document.getElementById("category-name-field"),
  categoryNameInput: document.getElementById("category-name-input"),
  itemInputLabel: document.getElementById("item-input-label"),
  itemInput: document.getElementById("item-input"),
  closeModalButton: document.getElementById("close-modal-button"),
  cancelButton: document.getElementById("cancel-button"),
  confirmLayer: document.getElementById("confirm-layer"),
  closeConfirmButton: document.getElementById("close-confirm-button"),
  cancelConfirmButton: document.getElementById("cancel-confirm-button"),
  confirmTitle: document.getElementById("confirm-title"),
  confirmMessage: document.getElementById("confirm-message"),
  confirmActionButton: document.getElementById("confirm-action-button"),
};

function formatDate(dateString) {
  if (!dateString) {
    return "未选择日期";
  }

  const [year, month, day] = dateString.split("-");
  return `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
}

function toInputDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getTomorrowDateString() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toInputDate(tomorrow);
}

function isValidDateInput(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) {
    return createDefaultCategories();
  }

  const normalized = categories
    .map((category) => {
      const name = trimAndLimit(category?.name, FIELD_LIMITS.categoryName);
      const items = Array.isArray(category?.items)
        ? category.items
            .map((item) => trimAndLimit(item, FIELD_LIMITS.itemName))
            .filter(Boolean)
        : [];

      if (!name) {
        return null;
      }

      return { name, items };
    })
    .filter(Boolean);

  return normalized.length ? normalized : createDefaultCategories();
}

function persistState() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 2,
        currentStep: state.currentStep,
        userName: state.userName,
        bagType: state.bagType,
        city: state.city,
        departureDate: state.departureDate,
        categories: state.categories,
      }),
    );
  } catch (error) {
    console.warn("无法保存本地数据：", error);
  }
}

function restoreState() {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (!savedState) {
      return;
    }

    const parsedState = JSON.parse(savedState);

    state.currentStep = [1, 2, 3].includes(parsedState.currentStep) ? parsedState.currentStep : 1;
    state.userName = trimAndLimit(parsedState.userName, FIELD_LIMITS.userName);
    state.bagType = parsedState.bagType === "backpack" ? "backpack" : "suitcase";
    state.city = trimAndLimit(parsedState.city, FIELD_LIMITS.city);
    state.departureDate = isValidDateInput(parsedState.departureDate) ? parsedState.departureDate : "";
    state.categories = normalizeCategories(parsedState.categories);

    if (!state.userName) {
      state.currentStep = 1;
      return;
    }

    if (state.currentStep === 3 && (!state.city.trim() || !state.departureDate)) {
      state.currentStep = 2;
    }
  } catch (error) {
    console.warn("无法恢复本地数据，已回退到默认状态：", error);
  }
}

function syncFormFields() {
  elements.nameInput.value = state.userName;
  elements.cityInput.value = state.city;
  elements.dateInput.min = toInputDate(new Date());

  if (!state.departureDate) {
    state.departureDate = getTomorrowDateString();
  }

  elements.dateInput.value = state.departureDate;
}

function resetState() {
  state.currentStep = 1;
  state.userName = "";
  state.bagType = "suitcase";
  state.city = "";
  state.departureDate = getTomorrowDateString();
  state.categories = createDefaultCategories();
  state.editing = null;
  state.modalMode = "item";
  state.activeCategoryIndex = null;
  state.confirmMode = null;
  state.confirmCategoryIndex = null;
}

function updateBranding() {
  const userName = state.userName.trim();
  const titleText = userName ? `${userName}的旅行物品调整` : "旅行物品整理";
  const introText = userName
    ? "身份证、充电器、眼罩...还有什么来着.."
    : "先告诉我怎么称呼你，再一起整理这次旅程。";

  elements.heroTitle.textContent = titleText;
  elements.heroIntro.textContent = introText;
  document.title = titleText;
}

function updateStep(step) {
  state.currentStep = step;

  elements.stepPanels.forEach((panel) => {
    panel.classList.toggle("is-active", Number(panel.dataset.step) === step);
  });

  elements.stepPills.forEach((pill) => {
    pill.classList.toggle("is-active", pill.dataset.stepPill === String(step));
  });
}

function updateSummary() {
  const city = state.city.trim() || "未填写";
  const formattedDate = formatDate(state.departureDate);
  const userPrefix = state.userName.trim() ? `${state.userName.trim()}，` : "";
  elements.tripSummary.textContent = `${userPrefix}这次去 ${city}，准备在 ${formattedDate} 出发。`;
}

function updateBagFigure() {
  const isSuitcase = state.bagType === "suitcase";

  elements.suitcaseFigure.classList.toggle("is-hidden", !isSuitcase);
  elements.backpackFigure.classList.toggle("is-hidden", isSuitcase);

  elements.toggleButtons.forEach((button) => {
    const isActive = button.dataset.bagType === state.bagType;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function isEditingCategory(categoryIndex) {
  return state.editing?.type === "category" && state.editing.categoryIndex === categoryIndex;
}

function isEditingItem(categoryIndex, itemIndex) {
  return (
    state.editing?.type === "item" &&
    state.editing.categoryIndex === categoryIndex &&
    state.editing.itemIndex === itemIndex
  );
}

function getInlineEditingConfig() {
  if (state.editing?.type === "category") {
    return {
      label: "分类名",
      maxLength: FIELD_LIMITS.categoryName,
    };
  }

  if (state.editing?.type === "item") {
    return {
      label: "物品名",
      maxLength: FIELD_LIMITS.itemName,
    };
  }

  return null;
}

function getInlineEditorInput() {
  return elements.categoryList.querySelector('[data-inline-editor-input="true"]');
}

function focusInlineEditor() {
  requestAnimationFrame(() => {
    const input = getInlineEditorInput();
    if (!input) {
      return;
    }

    input.focus();
    input.select();
  });
}

function applyInlineEditingValue(value) {
  if (!state.editing) {
    return false;
  }

  if (state.editing.type === "category") {
    const category = state.categories[state.editing.categoryIndex];
    if (!category) {
      return false;
    }

    category.name = value;
    return true;
  }

  if (state.editing.type === "item") {
    const category = state.categories[state.editing.categoryIndex];
    const itemIndex = state.editing.itemIndex;
    if (!category || typeof itemIndex !== "number" || itemIndex < 0 || itemIndex >= category.items.length) {
      return false;
    }

    category.items[itemIndex] = value;
    return true;
  }

  return false;
}

function settleInlineEditing() {
  if (!state.editing) {
    return;
  }

  const draft = state.editing.draft.trim();
  const config = getInlineEditingConfig();
  if (draft) {
    applyInlineEditingValue(config ? trimAndLimit(draft, config.maxLength) : draft);
    persistState();
  }

  state.editing = null;
  renderCategories();
}

function startEditingCategory(categoryIndex) {
  const category = state.categories[categoryIndex];
  if (!category || isEditingCategory(categoryIndex)) {
    return;
  }

  settleInlineEditing();
  state.editing = {
    type: "category",
    categoryIndex,
    itemIndex: null,
    draft: category.name,
  };
  renderCategories();
  focusInlineEditor();
}

function startEditingItem(categoryIndex, itemIndex) {
  const item = state.categories[categoryIndex]?.items[itemIndex];
  if (!item || isEditingItem(categoryIndex, itemIndex)) {
    return;
  }

  settleInlineEditing();
  state.editing = {
    type: "item",
    categoryIndex,
    itemIndex,
    draft: item,
  };
  renderCategories();
  focusInlineEditor();
}

function cancelInlineEditing() {
  if (!state.editing) {
    return;
  }

  state.editing = null;
  renderCategories();
}

function saveInlineEditing() {
  if (!state.editing) {
    return false;
  }

  const draft = state.editing.draft.trim();
  if (!draft) {
    const input = getInlineEditorInput();
    if (input) {
      input.setCustomValidity("内容不能为空");
      input.reportValidity();
      input.focus();
    }
    return false;
  }

  const input = getInlineEditorInput();
  const config = getInlineEditingConfig();
  if (config && !validateMaxLength(input, draft, config.maxLength, config.label)) {
    if (input) {
      input.focus();
    }
    return false;
  }

  const saved = applyInlineEditingValue(config ? trimAndLimit(draft, config.maxLength) : draft);
  state.editing = null;
  renderCategories();

  if (saved) {
    persistState();
  }

  return saved;
}

function deleteEditingItem() {
  if (state.editing?.type !== "item") {
    return;
  }

  const category = state.categories[state.editing.categoryIndex];
  const itemIndex = state.editing.itemIndex;
  if (!category || typeof itemIndex !== "number" || itemIndex < 0 || itemIndex >= category.items.length) {
    state.editing = null;
    renderCategories();
    return;
  }

  category.items.splice(itemIndex, 1);
  state.editing = null;
  renderCategories();
  persistState();
}

function handleInlineEditorInput(event) {
  if (!state.editing) {
    return;
  }

  state.editing.draft = event.target.value;
  event.target.setCustomValidity("");
}

function handleInlineEditorKeydown(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    saveInlineEditing();
  }

  if (event.key === "Escape") {
    event.preventDefault();
    cancelInlineEditing();
  }
}

function createInlineEditorInput(value, ariaLabel, maxLength) {
  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.maxLength = maxLength;
  input.className = "inline-editor-input";
  input.setAttribute("aria-label", ariaLabel);
  input.setAttribute("data-inline-editor-input", "true");
  input.addEventListener("input", handleInlineEditorInput);
  input.addEventListener("keydown", handleInlineEditorKeydown);
  return input;
}

function createInlineActionButton(label, className, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function createInlineEditorActions(includeDelete = false) {
  const actions = document.createElement("div");
  actions.className = "inline-editor-actions";

  const saveButton = createInlineActionButton("保存", "inline-editor-btn is-primary", saveInlineEditing);
  const cancelButton = createInlineActionButton("取消", "inline-editor-btn", cancelInlineEditing);
  actions.append(saveButton, cancelButton);

  if (includeDelete) {
    const deleteButton = createInlineActionButton("删除", "inline-editor-btn is-danger", deleteEditingItem);
    actions.append(deleteButton);
  }

  return actions;
}

function createCategoryTag(category, categoryIndex) {
  const tag = document.createElement("button");
  tag.className = "category-tag editable-token";
  tag.type = "button";
  tag.textContent = `【${category.name}】`;
  tag.setAttribute("aria-label", `修改${category.name}分类名`);
  tag.addEventListener("click", () => startEditingCategory(categoryIndex));
  return tag;
}

function createCategoryEditor(category, categoryIndex) {
  const editor = document.createElement("div");
  editor.className = "inline-editor category-editor";

  const input = createInlineEditorInput(
    state.editing?.draft ?? category.name,
    `修改${category.name}分类名`,
    FIELD_LIMITS.categoryName,
  );
  const actions = createInlineEditorActions(false);

  editor.append(input, actions);
  return editor;
}

function createItemChip(item, categoryIndex, itemIndex) {
  const chip = document.createElement("button");
  chip.className = "item-chip editable-token";
  chip.type = "button";
  chip.textContent = item;
  chip.setAttribute("aria-label", `修改${item}物品名`);
  chip.addEventListener("click", () => startEditingItem(categoryIndex, itemIndex));
  return chip;
}

function createItemEditor(item) {
  const editor = document.createElement("div");
  editor.className = "inline-editor item-editor";

  const input = createInlineEditorInput(
    state.editing?.draft ?? item,
    `修改${item}物品名`,
    FIELD_LIMITS.itemName,
  );
  const actions = createInlineEditorActions(true);

  editor.append(input, actions);
  return editor;
}

function renderCategories() {
  elements.categoryList.innerHTML = "";

  state.categories.forEach((category, categoryIndex) => {
    const row = document.createElement("div");
    row.className = "category-row";

    const tag = isEditingCategory(categoryIndex)
      ? createCategoryEditor(category, categoryIndex)
      : createCategoryTag(category, categoryIndex);

    const itemList = document.createElement("div");
    itemList.className = "item-list";
    category.items.forEach((item, itemIndex) => {
      if (isEditingItem(categoryIndex, itemIndex)) {
        itemList.appendChild(createItemEditor(item));
        return;
      }

      itemList.appendChild(createItemChip(item, categoryIndex, itemIndex));
    });

    const addButton = document.createElement("button");
    addButton.className = "add-item-btn";
    addButton.type = "button";
    addButton.textContent = "+";
    addButton.setAttribute("aria-label", `为${category.name}添加物品`);
    addButton.addEventListener("click", () => openItemModal(categoryIndex));

    const removeButton = document.createElement("button");
    removeButton.className = "remove-category-btn";
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `删除${category.name}分类`);
    removeButton.addEventListener("click", () => openDeleteCategoryConfirmDialog(categoryIndex));

    const actions = document.createElement("div");
    actions.className = "category-actions";
    actions.append(addButton, removeButton);

    itemList.append(actions);
    row.append(tag, itemList);
    elements.categoryList.appendChild(row);
  });
}

function openModal() {
  elements.modalLayer.classList.remove("is-hidden");
  elements.modalLayer.setAttribute("aria-hidden", "false");
}

function closeModal() {
  elements.modalLayer.classList.add("is-hidden");
  elements.modalLayer.setAttribute("aria-hidden", "true");
  elements.modalForm.reset();
  elements.categoryNameInput.required = false;
  elements.itemInput.required = false;
}

function openConfirmDialog() {
  elements.confirmLayer.classList.remove("is-hidden");
  elements.confirmLayer.setAttribute("aria-hidden", "false");
}

function closeConfirmDialog() {
  elements.confirmLayer.classList.add("is-hidden");
  elements.confirmLayer.setAttribute("aria-hidden", "true");
  state.confirmMode = null;
  state.confirmCategoryIndex = null;
}

function openResetConfirmDialog() {
  settleInlineEditing();
  state.confirmMode = "resetTrip";
  state.confirmCategoryIndex = null;
  elements.confirmTitle.textContent = "开启新旅程？";
  elements.confirmMessage.textContent = "当前称呼、行程和整理好的清单都会被清除，确认后会回到最初的欢迎页。";
  elements.confirmActionButton.textContent = "确认开启新旅程";
  openConfirmDialog();
}

function openDeleteCategoryConfirmDialog(categoryIndex) {
  const category = state.categories[categoryIndex];
  if (!category) {
    return;
  }

  settleInlineEditing();
  state.confirmMode = "deleteCategory";
  state.confirmCategoryIndex = categoryIndex;
  elements.confirmTitle.textContent = "删除这个分类？";
  elements.confirmMessage.textContent = `确认后会删除「${category.name}」分类，以及其中的全部物品。`;
  elements.confirmActionButton.textContent = "确认删除分类";
  openConfirmDialog();
}

function openItemModal(categoryIndex) {
  const category = state.categories[categoryIndex];
  settleInlineEditing();
  state.modalMode = "item";
  state.activeCategoryIndex = categoryIndex;

  elements.modalTitle.textContent = "添加物品";
  elements.modalHint.textContent = `把想到的内容补进「${category.name}」里，多个物品可以用中文逗号分开。`;
  elements.categoryNameField.classList.add("is-hidden");
  elements.itemInputLabel.textContent = "物品内容";
  elements.itemInput.placeholder = "例如：创可贴、防蚊液";
  elements.itemInput.required = true;

  openModal();
  elements.itemInput.focus();
}

function openCategoryModal() {
  settleInlineEditing();
  state.modalMode = "category";
  state.activeCategoryIndex = null;

  elements.modalTitle.textContent = "添加分类";
  elements.modalHint.textContent = "先给新分类起个名字，再顺手填上第一批物品。";
  elements.categoryNameField.classList.remove("is-hidden");
  elements.itemInputLabel.textContent = "该分类下的物品";
  elements.categoryNameInput.placeholder = "例如：常备药品";
  elements.itemInput.placeholder = "例如：创可贴、晕车药";
  elements.categoryNameInput.required = true;
  elements.itemInput.required = false;

  openModal();
  elements.categoryNameInput.focus();
}

function splitItems(rawValue) {
  return rawValue
    .split(/[，,、.。\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function submitModal(event) {
  event.preventDefault();

  if (state.modalMode === "item") {
    const newItems = splitItems(elements.itemInput.value);
    if (!newItems.length) {
      elements.itemInput.reportValidity();
      return;
    }

    if (!validateItemLengths(elements.itemInput, newItems)) {
      return;
    }

    state.categories[state.activeCategoryIndex].items.push(...newItems);
  }

  if (state.modalMode === "category") {
    const name = elements.categoryNameInput.value.trim();
    const items = splitItems(elements.itemInput.value);

    if (!name) {
      elements.categoryNameInput.reportValidity();
      return;
    }

    if (!validateMaxLength(elements.categoryNameInput, name, FIELD_LIMITS.categoryName, "分类名")) {
      return;
    }

    if (!validateItemLengths(elements.itemInput, items)) {
      return;
    }

    state.categories.push({
      name: trimAndLimit(name, FIELD_LIMITS.categoryName),
      items: items.length ? items : ["待补充"],
    });
  }

  renderCategories();
  persistState();
  closeModal();
}

function startNewTrip() {
  localStorage.removeItem(STORAGE_KEY);
  resetState();
  syncFormFields();
  updateBranding();
  updateSummary();
  updateStep(1);
  updateBagFigure();
  renderCategories();
  closeModal();
  closeConfirmDialog();
  elements.nameInput.focus();
}

function deleteCategory(categoryIndex) {
  state.categories.splice(categoryIndex, 1);
  renderCategories();
  persistState();
  closeConfirmDialog();
}

function handleConfirmAction() {
  if (state.confirmMode === "resetTrip") {
    startNewTrip();
    return;
  }

  if (state.confirmMode === "deleteCategory") {
    const categoryIndex = state.confirmCategoryIndex;
    if (typeof categoryIndex === "number" && state.categories[categoryIndex]) {
      deleteCategory(categoryIndex);
      return;
    }
  }

  closeConfirmDialog();
}

elements.nameForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!elements.nameForm.reportValidity()) {
    return;
  }

  const trimmedName = elements.nameInput.value.trim();
  if (!trimmedName) {
    elements.nameInput.setCustomValidity("请先填写一个称呼");
    elements.nameInput.reportValidity();
    return;
  }

  if (!validateMaxLength(elements.nameInput, trimmedName, FIELD_LIMITS.userName, "昵称")) {
    return;
  }

  elements.nameInput.setCustomValidity("");
  state.userName = trimAndLimit(trimmedName, FIELD_LIMITS.userName);
  elements.nameInput.value = state.userName;
  updateBranding();
  updateSummary();
  updateStep(2);
  persistState();
});

elements.tripForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!elements.tripForm.reportValidity()) {
    return;
  }

  const trimmedCity = elements.cityInput.value.trim();
  if (!trimmedCity) {
    elements.cityInput.setCustomValidity("请填写旅游城市");
    elements.cityInput.reportValidity();
    return;
  }

  if (!validateMaxLength(elements.cityInput, trimmedCity, FIELD_LIMITS.city, "城市")) {
    return;
  }

  elements.cityInput.setCustomValidity("");
  state.city = trimAndLimit(trimmedCity, FIELD_LIMITS.city);
  state.departureDate = elements.dateInput.value || getTomorrowDateString();
  elements.cityInput.value = state.city;
  updateSummary();
  updateStep(3);
  persistState();
});

elements.toggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.bagType = button.dataset.bagType;
    updateBagFigure();
    persistState();
  });
});

elements.nameInput.addEventListener("input", () => {
  elements.nameInput.setCustomValidity("");
});

elements.cityInput.addEventListener("input", () => {
  elements.cityInput.setCustomValidity("");
  state.city = elements.cityInput.value;
  persistState();
});

elements.categoryNameInput.addEventListener("input", () => {
  elements.categoryNameInput.setCustomValidity("");
});

elements.itemInput.addEventListener("input", () => {
  elements.itemInput.setCustomValidity("");
});

function handleDateInput() {
  state.departureDate = elements.dateInput.value || getTomorrowDateString();
  persistState();
}

elements.dateInput.addEventListener("input", handleDateInput);
elements.dateInput.addEventListener("change", handleDateInput);

elements.editNameButton.addEventListener("click", () => {
  elements.nameInput.value = state.userName;
  updateStep(1);
  persistState();
});

elements.backButton.addEventListener("click", () => {
  settleInlineEditing();
  updateStep(2);
  persistState();
});

elements.addCategoryButton.addEventListener("click", openCategoryModal);
elements.resetTripButton.addEventListener("click", openResetConfirmDialog);
elements.modalForm.addEventListener("submit", submitModal);
elements.closeModalButton.addEventListener("click", closeModal);
elements.cancelButton.addEventListener("click", closeModal);
elements.closeConfirmButton.addEventListener("click", closeConfirmDialog);
elements.cancelConfirmButton.addEventListener("click", closeConfirmDialog);
elements.confirmActionButton.addEventListener("click", handleConfirmAction);
elements.modalLayer.addEventListener("click", (event) => {
  if (event.target === elements.modalLayer) {
    closeModal();
  }
});
elements.confirmLayer.addEventListener("click", (event) => {
  if (event.target === elements.confirmLayer) {
    closeConfirmDialog();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.modalLayer.classList.contains("is-hidden")) {
    closeModal();
  }

  if (event.key === "Escape" && !elements.confirmLayer.classList.contains("is-hidden")) {
    closeConfirmDialog();
  }
});

restoreState();
syncFormFields();
updateBranding();
updateSummary();
updateStep(state.currentStep);
updateBagFigure();
renderCategories();
persistState();

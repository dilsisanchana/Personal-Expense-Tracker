const STORAGE_KEY = "personalExpenseTransactions";

const form = document.getElementById("transactionForm");
const typeEl = document.getElementById("type");
const descEl = document.getElementById("description");
const amountEl = document.getElementById("amount");
const categoryEl = document.getElementById("category");
const dateEl = document.getElementById("date");
const errorEl = document.getElementById("formError");
const clearBtn = document.getElementById("clearBtn");
const filterEl = document.getElementById("filter");
const searchEl = document.getElementById("search");
const bodyEl = document.getElementById("transactionBody");
const emptyEl = document.getElementById("emptyMessage");

let transactions = loadTransactions();

/* ---------- Storage ---------- */
function loadTransactions() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

/* ---------- Helpers ---------- */
function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function formatLKR(value) {
  return "LKR " + value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function resetForm() {
  form.reset();
  dateEl.value = todayString();
  errorEl.textContent = "";
  [descEl, amountEl, categoryEl, dateEl].forEach((el) => el.classList.remove("invalid"));
}

/* ---------- Validation ---------- */
function validate() {
  [descEl, amountEl, categoryEl, dateEl].forEach((el) => el.classList.remove("invalid"));
  const amount = parseFloat(amountEl.value);
  const problems = [];

  if (!descEl.value.trim()) { problems.push("Description is required."); descEl.classList.add("invalid"); }
  if (amountEl.value === "" || isNaN(amount)) {
    problems.push("Amount is required.");
    amountEl.classList.add("invalid");
  } else if (amount <= 0) {
    problems.push("Amount must be greater than zero.");
    amountEl.classList.add("invalid");
  }
  if (!categoryEl.value) { problems.push("Please select a category."); categoryEl.classList.add("invalid"); }
  if (!dateEl.value) { problems.push("Date is required."); dateEl.classList.add("invalid"); }

  errorEl.textContent = problems.join(" ");
  return problems.length === 0;
}

/* ---------- Rendering ---------- */
function updateSummary() {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  document.getElementById("totalIncome").textContent = formatLKR(income);
  document.getElementById("totalExpenses").textContent = formatLKR(expenses);
  document.getElementById("currentBalance").textContent = formatLKR(income - expenses);
}

function renderTable() {
  const filter = filterEl.value;
  const query = searchEl.value.trim().toLowerCase();

  const visible = transactions.filter((t) => {
    const typeOk = filter === "all" || t.type === filter;
    const searchOk =
      !query ||
      t.description.toLowerCase().includes(query) ||
      t.category.toLowerCase().includes(query);
    return typeOk && searchOk;
  });

  bodyEl.innerHTML = "";
  visible.forEach((t) => {
    const tr = document.createElement("tr");
    const sign = t.type === "income" ? "+" : "−";

    const cells = [
      { text: t.date },
      { text: t.description },
      { badge: t.type },
      { text: t.category },
      { text: `${sign} ${formatLKR(t.amount)}`, cls: "amount" },
    ];

    cells.forEach((c) => {
      const td = document.createElement("td");
      if (c.badge) {
        const span = document.createElement("span");
        span.className = `badge ${c.badge}`;
        span.textContent = c.badge;
        td.appendChild(span);
      } else {
        td.textContent = c.text;
      }
      if (c.cls) td.className = c.cls;
      tr.appendChild(td);
    });

    const actionTd = document.createElement("td");
    const delBtn = document.createElement("button");
    delBtn.className = "btn btn-delete";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => deleteTransaction(t.id));
    actionTd.appendChild(delBtn);
    tr.appendChild(actionTd);

    bodyEl.appendChild(tr);
  });

  emptyEl.style.display = visible.length ? "none" : "block";
}

function refresh() {
  updateSummary();
  renderTable();
}

/* ---------- Actions ---------- */
function addTransaction(e) {
  e.preventDefault();
  if (!validate()) return;

  transactions.push({
    id: Date.now() + Math.random().toString(16).slice(2),
    type: typeEl.value,
    description: descEl.value.trim(),
    amount: parseFloat(amountEl.value),
    category: categoryEl.value,
    date: dateEl.value,
  });

  saveTransactions();
  refresh();
  resetForm();
  alert("Transaction added successfully!");
}

function deleteTransaction(id) {
  if (!confirm("Delete this transaction?")) return;
  transactions = transactions.filter((t) => t.id !== id);
  saveTransactions();
  refresh();
}

/* ---------- Events ---------- */
form.addEventListener("submit", addTransaction);
clearBtn.addEventListener("click", resetForm);
filterEl.addEventListener("change", renderTable);
searchEl.addEventListener("input", renderTable);

/* ---------- Init ---------- */
dateEl.value = todayString();
refresh();
/* =========================================================
   Emma Ludwig Portfolio — script.js
   Features:
   1. Light/dark theme toggle (saved between visits)       — all pages
   2. Back-to-top button                                   — all pages
   3. Time-of-day greeting                                 — home page
   4. Load projects.json with fetch() and build cards      — projects page
   5. Filter projects by category                          — projects page
   6. Search projects by keyword                           — projects page
   7. Show project details in a Bootstrap modal            — projects page
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  setupThemeToggle();
  setupBackToTop();
  setFooterYear();
  showGreeting();

  // Only run the project code on the Projects page
  if (document.getElementById("projectGrid")) {
    loadProjects();
  }
});

/* ---------- 1. Light / dark theme ---------- */
function setupThemeToggle() {
  const button = document.getElementById("themeToggle");
  if (!button) return;

  // Use the saved theme if there is one
  let savedTheme = null;
  try { savedTheme = localStorage.getItem("theme"); } catch (e) { /* storage unavailable */ }
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
  updateThemeIcon(button);

  button.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
    try { localStorage.setItem("theme", theme); } catch (e) { /* storage unavailable */ }
    updateThemeIcon(button);
  });
}

function updateThemeIcon(button) {
  const isDark = document.body.classList.contains("dark-mode");
  button.innerHTML = isDark ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
  button.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
}

/* ---------- 2. Back-to-top button ---------- */
function setupBackToTop() {
  const button = document.getElementById("backToTop");
  if (!button) return;

  window.addEventListener("scroll", () => {
    button.classList.toggle("show", window.scrollY > 300);
  });

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ---------- Footer year ---------- */
function setFooterYear() {
  document.querySelectorAll(".year").forEach(span => {
    span.textContent = new Date().getFullYear();
  });
}

/* ---------- 3. Time-of-day greeting ---------- */
function showGreeting() {
  const greeting = document.getElementById("greeting");
  if (!greeting) return;

  const hour = new Date().getHours();
  let message = "Good evening";
  if (hour < 12) {
    message = "Good morning";
  } else if (hour < 17) {
    message = "Good afternoon";
  }
  greeting.textContent = `${message}, welcome!`;
}

/* ---------- 4–7. Projects ---------- */
let allProjects = [];      // every project from the JSON file
let activeCategory = "All"; // currently selected filter button
let searchTerm = "";        // current text in the search box

async function loadProjects() {
  const grid = document.getElementById("projectGrid");

  try {
    // fetch() reads the JSON file; response.json() converts it into JavaScript objects
    const response = await fetch("data/projects.json");
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    allProjects = await response.json();

    createFilterButtons();
    setupSearch();
    renderProjects();
  } catch (error) {
    console.error("Could not load projects:", error);
    grid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning">
          Projects could not be loaded. If you opened this file directly, try running the site
          through a local web server (for example, VS Code Live Server).
        </div>
      </div>`;
  }
}

// Build one filter button for "All" plus each unique category in the data
function createFilterButtons() {
  const container = document.getElementById("filterButtons");
  const categories = ["All", ...new Set(allProjects.map(project => project.category))];

  categories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-filter" + (category === activeCategory ? " active" : "");
    button.textContent = category;

    button.addEventListener("click", () => {
      activeCategory = category;
      container.querySelectorAll(".btn-filter").forEach(b => b.classList.remove("active"));
      button.classList.add("active");
      renderProjects();
    });

    container.appendChild(button);
  });
}

function setupSearch() {
  const input = document.getElementById("projectSearch");
  input.addEventListener("input", () => {
    searchTerm = input.value.trim().toLowerCase();
    renderProjects();
  });
}

// Return only the projects that match the current filter and search
function getVisibleProjects() {
  return allProjects.filter(project => {
    const matchesCategory = activeCategory === "All" || project.category === activeCategory;

    const searchableText = [
      project.title,
      project.description,
      project.category,
      project.technologies.join(" ")
    ].join(" ").toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm);

    return matchesCategory && matchesSearch;
  });
}

function renderProjects() {
  const grid = document.getElementById("projectGrid");
  const count = document.getElementById("resultCount");
  const projects = getVisibleProjects();

  grid.innerHTML = "";
  count.textContent = `Showing ${projects.length} of ${allProjects.length} projects`;

  if (projects.length === 0) {
    grid.innerHTML = `<div class="col-12"><p class="empty-state">No projects match your search.</p></div>`;
    return;
  }

  // Loop through each project and create a Bootstrap card
  projects.forEach(project => {
    const column = document.createElement("div");
    column.className = "col-md-6 col-lg-4";

    const techBadges = project.technologies
      .map(tech => `<span class="badge tech-badge">${tech}</span>`)
      .join(" ");

    column.innerHTML = `
      <div class="card project-card h-100">
        <div class="card-body d-flex flex-column">
          <span class="category-label">${project.category}</span>
          <h2 class="h5 card-title">${project.title}</h2>
          <p class="card-text">${project.description}</p>
          <div class="mb-3">${techBadges}</div>
          <button type="button" class="btn btn-outline-accent mt-auto details-btn">View details</button>
        </div>
      </div>`;

    column.querySelector(".details-btn").addEventListener("click", () => showProjectModal(project));
    grid.appendChild(column);
  });
}

// Fill the Bootstrap modal with one project's information and open it
function showProjectModal(project) {
  document.getElementById("projectModalTitle").textContent = project.title;

  const techList = project.technologies.map(tech => `<li>${tech}</li>`).join("");
  document.getElementById("projectModalBody").innerHTML = `
    <span class="category-label">${project.category}</span>
    <p class="mt-2">${project.details || project.description}</p>
    <h3 class="h6">Technologies used</h3>
    <ul class="tech-list">${techList}</ul>`;

  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("projectModal"));
  modal.show();
}

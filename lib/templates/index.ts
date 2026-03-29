export interface AppTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "productivity" | "finance" | "content" | "tools";
  tags: string[];
  prompt: string;
}

export const TEMPLATES: AppTemplate[] = [
  {
    id: "task-manager",
    title: "Task Manager",
    description: "Drag-and-drop task board with priorities, due dates, and status columns",
    icon: "✅",
    category: "productivity",
    tags: ["drag-and-drop", "kanban", "tasks"],
    prompt:
      "Build a task manager web app with: drag-and-drop task reordering across columns (Todo, In Progress, Done), task priorities (high/medium/low) shown with color badges, due dates with visual overdue indicators, a search and filter bar, and a dark mode toggle. Each task card shows title, priority badge, due date, and a delete button. Use React + Vite frontend with Express + SQLite backend. Make it polished with Tailwind CSS.",
  },
  {
    id: "expense-tracker",
    title: "Expense Tracker",
    description: "Personal finance tracker with categories, monthly budgets, and bar charts",
    icon: "💰",
    category: "finance",
    tags: ["finance", "charts", "budgeting"],
    prompt:
      "Build a personal expense tracker with: add/edit/delete expense entries (amount, date, category, description), predefined categories (Food, Transport, Housing, Entertainment, Health, Other) with color coding, a monthly summary view with a bar chart showing total spent per category, per-category monthly budget setting with progress bars showing percentage used, and a CSV export button. Use React + Vite with Express + SQLite. Clean card-based layout with sidebar navigation.",
  },
  {
    id: "habit-tracker",
    title: "Habit Tracker",
    description: "Daily habit check-off with streaks, heatmap, and completion history",
    icon: "🎯",
    category: "productivity",
    tags: ["habits", "streaks", "health"],
    prompt:
      "Build a habit tracker app with: add habits with name, emoji icon, and target frequency (daily/weekly), a daily check-off grid for the current week, streak counter per habit (current and longest streak), a GitHub-style heatmap showing completions for the past 90 days, overall completion percentage for the last 30 days, and a motivational message when all daily habits are done. Use green accent colors for completions. React + Vite + Express + SQLite.",
  },
  {
    id: "recipe-book",
    title: "Recipe Book",
    description: "Recipe collection with ingredient scaling, search, and built-in timers",
    icon: "🍳",
    category: "content",
    tags: ["recipes", "cooking", "search"],
    prompt:
      "Build a recipe book app with: recipe cards showing photo placeholder, title, cook time, servings, difficulty, and category, full recipe detail page with ingredient list and numbered step-by-step instructions, ingredient scaler (change servings count and all quantities auto-update proportionally), search and filter by category (Breakfast, Lunch, Dinner, Dessert, Snack), a built-in cooking timer that allows multiple concurrent countdowns, and full CRUD for recipes. Warm color scheme. React + Vite + Express + SQLite.",
  },
  {
    id: "url-shortener",
    title: "URL Shortener",
    description: "Link shortener with custom slugs, click analytics, and QR codes",
    icon: "🔗",
    category: "tools",
    tags: ["links", "analytics", "QR"],
    prompt:
      "Build a URL shortener app with: paste a long URL and generate a short slug (auto-generated or custom-specified), a dashboard listing all links with columns for short URL, destination URL, creation date, and click count, click tracking that increments count on each redirect visit, copy-to-clipboard button for each link, QR code generation displayed in a modal (use qrcode library), and delete link functionality. Include a public redirect route /r/:slug. React + Vite + Express + SQLite.",
  },
  {
    id: "markdown-blog",
    title: "Markdown Blog",
    description: "Personal blog with a live Markdown editor, code highlighting, and tags",
    icon: "✍️",
    category: "content",
    tags: ["blog", "markdown", "writing"],
    prompt:
      "Build a personal markdown blog with: a split-pane editor showing raw markdown on the left and live rendered preview on the right, post list view showing title, excerpt, tags, publication date, and reading time estimate, tag system with clickable tag filters, syntax highlighting for code blocks using highlight.js or Prism, draft/published toggle for posts, full-text search across post titles and content, and post CRUD. Store posts in SQLite. Typography-focused design with generous line spacing. React + Vite + Express.",
  },
  {
    id: "kanban-board",
    title: "Team Kanban",
    description: "Project board with custom columns, card assignments, and due dates",
    icon: "📋",
    category: "productivity",
    tags: ["kanban", "team", "project management"],
    prompt:
      "Build a team kanban board with: multiple customizable columns (users can add, rename, and delete columns), drag-and-drop cards between columns, card details including title, description, assignee (from a saved team member list), colored labels/tags, due date, and a comment thread, card count badge on each column header, filter cards by assignee or label, and keyboard shortcut (N) to add a new card. Professional look with subtle card shadows. React + Vite + Express + SQLite.",
  },
  {
    id: "invoice-generator",
    title: "Invoice Generator",
    description: "Professional invoice builder with PDF export and saved client profiles",
    icon: "🧾",
    category: "finance",
    tags: ["invoices", "PDF", "clients", "business"],
    prompt:
      "Build a professional invoice generator with: create invoices with your business info (name, address, email), client info (saved and reusable), line items (description, quantity, unit price, automatic subtotal), configurable tax rate with auto-calculated tax and total, a print-ready invoice preview styled like a real invoice, PDF export using jsPDF or similar, invoice list with status (Draft, Sent, Paid), invoice numbering (INV-0001 auto-increments), and client management to save/edit/delete clients. React + Vite + Express + SQLite.",
  },
];

export const TEMPLATE_CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "productivity", label: "Productivity" },
  { id: "finance", label: "Finance" },
  { id: "content", label: "Content" },
  { id: "tools", label: "Tools" },
];

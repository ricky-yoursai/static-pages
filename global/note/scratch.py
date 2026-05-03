import sys

with open(r'c:\m-code\static-pages\global\note\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. CSS
css_old = """    .toc-item.drag-over-bottom {
      border-bottom: 2px solid #0ea5e9;
      background: #f0f9ff;
    }
    /* Modal Styles */"""
css_new = """    .toc-item.drag-over-bottom {
      border-bottom: 2px solid #0ea5e9;
      background: #f0f9ff;
    }
    /* Separator & TOC layout */
    .separator {
      width: 14px;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
      user-select: none;
      font-size: 10px;
      color: #64748b;
    }
    .separator:hover {
      background: #e2e8f0;
      color: #0f172a;
    }
    .toc-item-content {
      display: flex;
      align-items: center;
      width: 100%;
    }
    .toc-caret {
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      border-radius: 4px;
      margin-right: 4px;
    }
    .toc-caret:hover {
      background: #cbd5e1;
    }
    .toc-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* Modal Styles */"""
content = content.replace(css_old, css_new)

# 2. HTML Separator
html_old = """    <div class="sidebar" id="sidebar" style="display: flex;">
      <div class="pane-header">Table of Contents</div>
      <ul id="tocList"></ul>
    </div>
    <div class="editor-pane" id="editorPane">"""
html_new = """    <div class="sidebar" id="sidebar" style="display: flex;">
      <div class="pane-header">Table of Contents</div>
      <ul id="tocList"></ul>
    </div>
    <div class="separator" id="sidebarSeparator">◀</div>
    <div class="editor-pane" id="editorPane">"""
content = content.replace(html_old, html_new)

# 3. JS Separator Definition
js_def_old = """    const sidebarEl = document.getElementById('sidebar');"""
js_def_new = """    const sidebarEl = document.getElementById('sidebar');
    const sidebarSeparator = document.getElementById('sidebarSeparator');"""
content = content.replace(js_def_old, js_def_new)

# 4. JS State definition
state_old = """    let currentSections = [];
    let pendingAppendText = "";"""
state_new = """    let currentSections = [];
    let pendingAppendText = "";
    let collapsedKeys = new Set();"""
content = content.replace(state_old, state_new)

# 5. renderTOC
render_old = """    function renderTOC() {
      tocList.innerHTML = "";
      currentSections.forEach((sec, idx) => {
        const li = document.createElement('li');
        li.className = 'toc-item';
        li.style.paddingLeft = `${(sec.level - 1) * 12 + 8}px`;
        li.textContent = sec.title;
        li.draggable = true;
        li.dataset.index = idx;
        
        li.addEventListener('dragstart', (e) => {"""

render_new = """    function renderTOC() {
      tocList.innerHTML = "";
      let hideLevelThreshold = 999; 

      currentSections.forEach((sec, idx) => {
        if (sec.level <= hideLevelThreshold) {
          hideLevelThreshold = 999;
        }

        if (hideLevelThreshold !== 999) return;

        const li = document.createElement('li');
        li.className = 'toc-item';
        li.style.paddingLeft = `${(sec.level - 1) * 12 + 8}px`;
        li.draggable = true;
        li.dataset.index = idx;

        const container = document.createElement('div');
        container.className = 'toc-item-content';

        const hasChildren = currentSections[idx + 1] && currentSections[idx + 1].level > sec.level;
        const key = `${sec.level}-${sec.title}`;
        const isCollapsed = collapsedKeys.has(key);

        const caret = document.createElement('span');
        caret.className = 'toc-caret';

        if (hasChildren) {
          caret.innerHTML = isCollapsed ? '▶' : '▼';
          if (isCollapsed) {
            hideLevelThreshold = sec.level;
          }
          caret.addEventListener('click', (e) => {
            e.stopPropagation();
            if (isCollapsed) collapsedKeys.delete(key);
            else collapsedKeys.add(key);
            renderTOC();
          });
        } else {
          caret.innerHTML = '•';
          caret.style.cursor = 'default';
          caret.style.color = '#94a3b8';
        }

        const titleSpan = document.createElement('span');
        titleSpan.className = 'toc-title';
        titleSpan.textContent = sec.title;

        container.appendChild(caret);
        container.appendChild(titleSpan);
        li.appendChild(container);
        
        li.addEventListener('dragstart', (e) => {"""
content = content.replace(render_old, render_new)

# 6. Toggle Logic
toggle_old = """    let sidebarVisible = true;
    toggleSidebarButtonEl.addEventListener('click', () => {
      sidebarVisible = !sidebarVisible;
      sidebarEl.style.display = sidebarVisible ? 'flex' : 'none';
    });"""

toggle_new = """    let sidebarVisible = true;
    function toggleSidebar() {
      sidebarVisible = !sidebarVisible;
      sidebarEl.style.display = sidebarVisible ? 'flex' : 'none';
      sidebarSeparator.innerHTML = sidebarVisible ? '◀' : '▶';
    }
    toggleSidebarButtonEl.addEventListener('click', toggleSidebar);
    sidebarSeparator.addEventListener('click', toggleSidebar);"""
content = content.replace(toggle_old, toggle_new)

with open(r'c:\m-code\static-pages\global\note\index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")

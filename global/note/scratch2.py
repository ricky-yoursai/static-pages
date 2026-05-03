import sys

with open(r'c:\m-code\static-pages\global\note\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix \\n bug in reorderTOC
old_reorder_tail = """      if (insertPos > 0 && !mdWithoutSource.slice(0, insertPos).endsWith('\\\\n')) {
        sourceContent = '\\\\n' + sourceContent;
      }
      if (insertPos < mdWithoutSource.length && !sourceContent.endsWith('\\\\n')) {
        sourceContent += '\\\\n';
      }

      const newMd = mdWithoutSource.slice(0, insertPos) + sourceContent + mdWithoutSource.slice(insertPos);
      
      editorEl.value = newMd;
      updatePreview();
    }"""

new_reorder_tail = """      if (insertPos > 0 && !mdWithoutSource.slice(0, insertPos).endsWith('\\n')) {
        sourceContent = '\\n' + sourceContent;
      }
      if (insertPos < mdWithoutSource.length && !sourceContent.endsWith('\\n')) {
        sourceContent += '\\n';
      }

      const newMd = mdWithoutSource.slice(0, insertPos) + sourceContent + mdWithoutSource.slice(insertPos);
      
      setEditorValueWithUndo(newMd);
    }"""
content = content.replace(old_reorder_tail, new_reorder_tail)

# Add setEditorValueWithUndo before updatePreview
old_update_preview = """    // ========== Editor & Preview Logic ==========
    function updatePreview() {"""

new_update_preview = """    // ========== Editor & Preview Logic ==========
    function setEditorValueWithUndo(newVal) {
      const scroll = editorEl.scrollTop;
      editorEl.focus();
      editorEl.select();
      const success = document.execCommand('insertText', false, newVal);
      if (!success) {
        editorEl.value = newVal;
      }
      editorEl.scrollTop = scroll;
      updatePreview();
    }

    function updatePreview() {"""
content = content.replace(old_update_preview, new_update_preview)

# Update Format Button
old_format = """          editorEl.value = formatted;
          updatePreview();
        } catch (err) {"""

new_format = """          setEditorValueWithUndo(formatted);
        } catch (err) {"""
content = content.replace(old_format, new_format)

# Update File Append
old_append = """      const spacer = (val.endsWith('\\n') || val === "") ? "" : "\\n\\n";
      editorEl.value = val + spacer + pendingAppendText;
      updatePreview();
      pendingAppendText = "";"""

new_append = """      const spacer = (val.endsWith('\\n') || val === "") ? "" : "\\n\\n";
      setEditorValueWithUndo(val + spacer + pendingAppendText);
      pendingAppendText = "";"""
content = content.replace(old_append, new_append)

# Add Tab key undo support
old_tab = """        this.value = this.value.substring(0, start) + "  " + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 2;
        updatePreview();"""
new_tab = """        document.execCommand('insertText', false, "  ");
        updatePreview();"""
content = content.replace(old_tab, new_tab)

with open(r'c:\m-code\static-pages\global\note\index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
